import { queryReadOnly } from "@/lib/db/sql";
import type {
  JobSummary,
  JobDetail,
  JobRow,
  JobDetailRow,
  ProjectWeek,
  ProjectWeekRow,
} from "@/types/job";
import type { FilterOption, PaginatedResult } from "@/types/search";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function formatDate(v: unknown): string {
  if (!v) return "";
  const s = String(v).trim();
  // If already formatted (VARCHAR converted in SQL), return as-is
  if (s === "" || s === "0001-01-01" || s.startsWith("1900")) return "";
  // Trim time portion if present
  return s.split("T")[0] ?? s;
}

// ---------------------------------------------------------------------------
// App-level lookup maps
// Reuse the same PullDown* pattern confirmed for customer lookups.
// All wrapped in .catch() so the job list never crashes if a lookup fails.
// ---------------------------------------------------------------------------

async function loadCustomerTypeMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{
      PullDownCustomerTypeID: unknown;
      TypeName: string | null;
    }>(
      `SELECT PullDownCustomerTypeID,
              ISNULL(PullDownCustomerType, '') AS TypeName
       FROM   tblPullDownCustomerTypes
       ORDER  BY PullDownCustomerType`,
    );
    for (const r of rows) {
      if (r.PullDownCustomerTypeID != null) {
        map.set(String(r.PullDownCustomerTypeID), r.TypeName ?? "");
      }
    }
  } catch { /* fail silently */ }
  return map;
}

async function loadSalesmanMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{
      PullDownSalesmanID: unknown;
      SalesmanLabel: string | null;
    }>(
      `SELECT PullDownSalesmanID,
              LTRIM(RTRIM(
                ISNULL(PullDownSalesmanFName, '') + ' ' + ISNULL(PullDownSalesmanLName, '')
              )) AS SalesmanLabel
       FROM   tblPullDownSalesman
       ORDER  BY PullDownSalesmanLName, PullDownSalesmanFName`,
    );
    for (const r of rows) {
      if (r.PullDownSalesmanID != null) {
        map.set(String(r.PullDownSalesmanID), r.SalesmanLabel ?? "");
      }
    }
  } catch { /* fail silently */ }
  return map;
}

async function loadStatusMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{
      PullDownProjStatusID: unknown;
      StatusName: string | null;
    }>(
      `SELECT PullDownProjStatusID,
              ISNULL(PullDownProjStatus, '') AS StatusName
       FROM   tblPullDownProjStatus
       ORDER  BY PullDownProjStatus`,
    );
    for (const r of rows) {
      if (r.PullDownProjStatusID != null) {
        map.set(String(r.PullDownProjStatusID), r.StatusName ?? "");
      }
    }
  } catch { /* fail silently */ }
  return map;
}

// Site city/state are stored as a single SiteStateCityID lookup. Resolve it to
// { city, state } via tblPullDownStateCities → tblPullDownStates.
interface StateCity {
  city: string;
  state: string;
  stateId: string;
}

async function loadStateCityMap(): Promise<Map<string, StateCity>> {
  const map = new Map<string, StateCity>();
  try {
    const rows = await queryReadOnly<{
      PullDownStateCityID: unknown;
      City: string | null;
      StateID: unknown;
      PullDownState: string | null;
    }>(
      `SELECT sc.PullDownStateCityID,
              ISNULL(sc.City, '')         AS City,
              sc.StateID,
              ISNULL(st.PullDownState, '') AS PullDownState
       FROM   tblPullDownStateCities sc WITH (NOLOCK)
       LEFT   JOIN tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID = sc.StateID`,
    );
    for (const r of rows) {
      if (r.PullDownStateCityID != null) {
        map.set(String(r.PullDownStateCityID), {
          city: safeStr(r.City),
          state: safeStr(r.PullDownState),
          stateId: r.StateID != null ? String(r.StateID) : "",
        });
      }
    }
  } catch { /* fail silently */ }
  return map;
}

// Distinct cities/states actually used by projects, for the search filters.
async function loadJobLocationOptions(): Promise<{ cities: FilterOption[]; states: FilterOption[] }> {
  try {
    const [cityRows, stateRows] = await Promise.all([
      queryReadOnly<{ City: string | null }>(
        `SELECT DISTINCT sc.City
         FROM   tblProject p WITH (NOLOCK)
         JOIN   tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID = p.SiteStateCityID
         WHERE  LEN(LTRIM(RTRIM(ISNULL(sc.City, '')))) > 1
         ORDER  BY sc.City`,
      ),
      queryReadOnly<{ PullDownStateID: unknown; PullDownState: string | null }>(
        `SELECT DISTINCT st.PullDownStateID, ISNULL(st.PullDownState, '') AS PullDownState
         FROM   tblProject p WITH (NOLOCK)
         JOIN   tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID = p.SiteStateCityID
         JOIN   tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID = sc.StateID
         WHERE  LEN(LTRIM(RTRIM(ISNULL(st.PullDownState, '')))) > 0
         ORDER  BY st.PullDownState`,
      ),
    ]);
    const seen = new Set<string>();
    const cities: FilterOption[] = [];
    for (const r of cityRows) {
      const v = safeStr(r.City);
      if (!v || seen.has(v.toLowerCase())) continue;
      seen.add(v.toLowerCase());
      cities.push({ value: v, label: v });
    }
    return {
      cities,
      states: stateRows
        .filter((r) => r.PullDownStateID != null && safeStr(r.PullDownState))
        .map((r) => ({ value: String(r.PullDownStateID), label: safeStr(r.PullDownState) })),
    };
  } catch {
    return { cities: [], states: [] };
  }
}

// Only customers that actually have projects, so every customer that can
// appear in the jobs table is selectable in the filter (no alphabetical cap).
async function loadCustomerOptions(): Promise<FilterOption[]> {
  try {
    const rows = await queryReadOnly<{ CustomerID: unknown; CustBusName: string | null }>(
      `SELECT DISTINCT c.CustomerID, ISNULL(c.CustBusName, '') AS CustBusName
       FROM   tblProject  p WITH (NOLOCK)
       JOIN   tblCustomer c WITH (NOLOCK) ON c.CustomerID = p.CustomerID
       WHERE  LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1
         AND  c.CustBusName NOT IN ('-', '--')
       ORDER  BY c.CustBusName`,
    );
    return rows.map((r) => ({
      value: String(r.CustomerID ?? ""),
      label: r.CustBusName ?? "",
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// SQL queries — confirmed column names from McLabor tblProject schema
//
// tblProject confirmed columns:
//   ProjectID, CustomerID, SiteName, SiteStreet, SiteZip, SiteStateCityID,
//   SiteForemanID (FK → tblCustomerForeman.CustomerForemanID),
//   ProjStatusID, StartDate, EndDate, ProjNote,
//   CustomerPhone, CustomerEmail (denormalized on project)
//
// Note: City/State stored as SiteStateCityID lookup — no direct text columns.
//       Showing blank for City/State until StateCityID lookup is mapped.
//
// tblPullDownProjStatus confirmed: PullDownProjStatusID, PullDownProjStatus
// ---------------------------------------------------------------------------

const JOB_LIST_SQL = `
SELECT TOP (200)
  p.ProjectID,
  p.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ISNULL(p.SiteName,       '')  AS SiteName,
  NULL                          AS SiteStreet,
  NULL                          AS SiteZip,
  ISNULL(p.SiteStateCityID, 0)  AS SiteStateCityID,
  ISNULL(p.ProjStatusID,   0)   AS ProjStatusID,
  ISNULL(p.SiteForemanID,  0)   AS SiteForemanID,
  CONVERT(VARCHAR(10), p.StartDate, 101) AS StartDate,
  CONVERT(VARCHAR(10), p.EndDate,   101) AS EndDate,
  NULL                          AS ProjNote,
  ISNULL(p.CustomerPhone,  '')  AS CustomerPhone,
  ISNULL(p.CustomerEmail,  '')  AS CustomerEmail
FROM  tblProject p WITH (NOLOCK)
JOIN  tblCustomer c WITH (NOLOCK) ON c.CustomerID = p.CustomerID
WHERE
  (@searchPat IS NULL
    OR p.SiteName    LIKE @searchPat
    OR CAST(p.ProjectID  AS NVARCHAR(20)) LIKE @searchPat
    OR CAST(p.CustomerID AS NVARCHAR(20)) LIKE @searchPat
    OR c.CustBusName LIKE @searchPat
    OR p.CustomerPhone LIKE @searchPat)
  AND (@customerId     IS NULL OR CAST(p.CustomerID     AS NVARCHAR(20)) = @customerId)
  AND (@salesmanId     IS NULL OR CAST(c.SalesmanID     AS NVARCHAR(20)) = @salesmanId)
  AND (@customerTypeId IS NULL OR CAST(c.CustomerTypeID AS NVARCHAR(20)) = @customerTypeId)
  AND (@statusId       IS NULL OR CAST(p.ProjStatusID   AS NVARCHAR(20)) = @statusId)
  AND (@city  IS NULL OR p.SiteStateCityID IN (
        SELECT sc.PullDownStateCityID FROM tblPullDownStateCities sc WITH (NOLOCK) WHERE sc.City = @city))
  AND (@stateId IS NULL OR p.SiteStateCityID IN (
        SELECT sc.PullDownStateCityID FROM tblPullDownStateCities sc WITH (NOLOCK)
        WHERE CAST(sc.StateID AS NVARCHAR(20)) = @stateId))
ORDER BY p.ProjectID DESC
`;

const JOB_DETAIL_SQL = `
SELECT TOP (1)
  p.ProjectID,
  p.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ISNULL(p.SiteName,       '')  AS SiteName,
  ISNULL(p.SiteStreet,     '')  AS SiteStreet,
  ISNULL(p.SiteZip,        '')  AS SiteZip,
  ISNULL(p.SiteStateCityID, 0)  AS SiteStateCityID,
  ISNULL(p.ProjStatusID,   0)   AS ProjStatusID,
  ISNULL(p.SiteForemanID,  0)   AS SiteForemanID,
  CONVERT(VARCHAR(10), p.StartDate, 101) AS StartDate,
  CONVERT(VARCHAR(10), p.EndDate,   101) AS EndDate,
  ISNULL(p.ProjNote,       '')  AS ProjNote,
  ISNULL(p.ProjOfficeNote, '')  AS ProjOfficeNote,
  ISNULL(p.JobNote,        '')  AS JobNote,
  ISNULL(p.CustomerContact,'')  AS CustomerContact,
  ISNULL(p.CustomerNotes,  '')  AS CustomerNotes,
  ISNULL(p.ContractAmount,        0) AS ContractAmount,
  ISNULL(p.ContractTotalPayments, 0) AS ContractTotalPayments,
  ISNULL(p.ContractBalanceOwed,   0) AS ContractBalanceOwed,
  ISNULL(p.NumberOfEmployees,     0) AS NumberOfEmployees,
  ISNULL(p.GCOnSite,       '')  AS GCOnSite,
  ISNULL(p.ProjectEntryUserName, '') AS ProjectEntryUserName,
  CONVERT(VARCHAR(19), p.ProjectEntryTimestamp, 120) AS ProjectEntryTimestamp,
  ISNULL(p.CustomerPhone,  '')  AS CustomerPhone,
  ISNULL(p.CustomerEmail,  '')  AS CustomerEmail
FROM  tblProject p WITH (NOLOCK)
JOIN  tblCustomer c WITH (NOLOCK) ON c.CustomerID = p.CustomerID
WHERE p.ProjectID = @projectId
`;

// Foreman lookup via SiteForemanID → tblCustomerForeman.CustomerForemanID
const JOB_FOREMAN_SQL = `
SELECT TOP (1)
  ISNULL(CustomerForeman,      '')  AS ForemanName,
  ISNULL(CustomerForemanPhone, '')  AS ForemanPhone
FROM tblCustomerForeman WITH (NOLOCK)
WHERE CustomerForemanID = @siteForemanId
`;

const JOB_WEEKS_SQL = `
SELECT TOP (26)
  ISNULL(ProjectWeekID, 0) AS ProjectWeekID,
  ISNULL(AssignWeek,    0) AS AssignWeek,
  ISNULL(AssignYear,    0) AS AssignYear,
  CONVERT(VARCHAR(10), WeekEndingDate, 101) AS WeekEndingDate,
  ISNULL(HLinkRateReport, '') AS HLinkRateReport
FROM tblProjectWeeks WITH (NOLOCK)
WHERE ProjectID = @projectId
ORDER BY AssignYear DESC, AssignWeek DESC
`;

// Customer address card on job detail page
const JOB_CUSTOMER_SQL = `
SELECT TOP (1)
  ISNULL(c.Phone,    '') AS Phone,
  ISNULL(c.CustEmail,'') AS CustEmail,
  ISNULL(c.Street,   '') AS Street,
  ISNULL(c.City,     '') AS City,
  ISNULL(c.State,    '') AS State,
  ISNULL(c.Zip,      '') AS Zip
FROM tblCustomer c WITH (NOLOCK)
WHERE c.CustomerID = @customerId
`;

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function toJobBase(
  row: JobRow,
  typeMap: Map<string, string>,
  salesmanMap: Map<string, string>,
  statusMap: Map<string, string>,
  stateCityMap: Map<string, StateCity>,
): JobSummary {
  const loc = stateCityMap.get(String(row.SiteStateCityID ?? ""));
  return {
    jobId: safeStr(row.ProjectID),
    customerId: safeStr(row.CustomerID),
    customerName: safeStr(row.CustBusName),
    customerType: typeMap.get(String(row.CustomerTypeID ?? "")) ?? "",
    salesman: salesmanMap.get(String(row.SalesmanID ?? "")) ?? "",
    jobName: safeStr(row.SiteName),
    city: loc?.city ?? "",
    state: loc?.state ?? "",
    zip: safeStr(row.SiteZip),
    status: statusMap.get(String(row.ProjStatusID ?? "")) ?? "",
    foremanName: "",  // resolved separately in getJobById; empty on list view
    startDate: formatDate(row.StartDate),
    endDate: formatDate(row.EndDate),
  };
}

function toProjectWeek(row: ProjectWeekRow): ProjectWeek {
  return {
    weekId: safeStr(row.ProjectWeekID),
    weekEnding: safeStr(row.WeekEndingDate),
    assignWeek: safeStr(row.AssignWeek),
    assignYear: safeStr(row.AssignYear),
    rateReportLink: safeStr(row.HLinkRateReport),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetJobsParams {
  search?: string;
  customerId?: string;
  salesmanId?: string;
  customerTypeId?: string;
  statusId?: string;
  /** Exact city text (matches tblPullDownStateCities.City) */
  city?: string;
  /** State id (tblPullDownStates.PullDownStateID) */
  stateId?: string;
}

export async function getJobs(
  params: GetJobsParams = {},
): Promise<PaginatedResult<JobSummary>> {
  const searchPat = params.search ? `%${params.search}%` : null;
  const customerId = params.customerId || null;
  const salesmanId = params.salesmanId || null;
  const customerTypeId = params.customerTypeId || null;
  const statusId = params.statusId || null;
  const city = params.city || null;
  const stateId = params.stateId || null;

  const [rows, typeMap, salesmanMap, statusMap, stateCityMap] = await Promise.all([
    queryReadOnly<JobRow>(JOB_LIST_SQL, [
      { name: "searchPat",     value: searchPat },
      { name: "customerId",    value: customerId },
      { name: "salesmanId",    value: salesmanId },
      { name: "customerTypeId",value: customerTypeId },
      { name: "statusId",      value: statusId },
      { name: "city",          value: city },
      { name: "stateId",       value: stateId },
    ]),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadStatusMap(),
    loadStateCityMap(),
  ]);

  const data = rows.map((row) => toJobBase(row, typeMap, salesmanMap, statusMap, stateCityMap));
  return { data, total: data.length, page: 1, pageSize: 200, hasMore: false };
}

export async function getJobById(jobId: string): Promise<JobDetail | null> {
  const [jobRows, typeMap, salesmanMap, statusMap, stateCityMap, weekRows] = await Promise.all([
    queryReadOnly<JobDetailRow>(JOB_DETAIL_SQL, [
      { name: "projectId", value: jobId },
    ]),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadStatusMap(),
    loadStateCityMap(),
    queryReadOnly<ProjectWeekRow>(JOB_WEEKS_SQL, [{ name: "projectId", value: jobId }]).catch(
      () => [] as ProjectWeekRow[],
    ),
  ]);

  const row = jobRows[0];
  if (!row) return null;

  const customerId = safeStr(row.CustomerID);
  const siteForemanId = row.SiteForemanID ? String(row.SiteForemanID) : null;
  const base = toJobBase(row, typeMap, salesmanMap, statusMap, stateCityMap);

  // Load foreman (by SiteForemanID) + customer address card in parallel
  const [foremanRows, customerRows] = await Promise.all([
    siteForemanId
      ? queryReadOnly<{ ForemanName: string | null; ForemanPhone: string | null }>(
          JOB_FOREMAN_SQL,
          [{ name: "siteForemanId", value: siteForemanId }],
        ).catch(() => [] as { ForemanName: string | null; ForemanPhone: string | null }[])
      : Promise.resolve([] as { ForemanName: string | null; ForemanPhone: string | null }[]),
    queryReadOnly<{
      Phone: string | null;
      CustEmail: string | null;
      Street: string | null;
      City: string | null;
      State: string | null;
      Zip: string | null;
    }>(JOB_CUSTOMER_SQL, [{ name: "customerId", value: customerId }]).catch(() => []),
  ]);

  const foreman = foremanRows[0];
  const customer = customerRows[0];

  return {
    ...base,
    street: safeStr(row.SiteStreet),
    projectWeeks: weekRows.map(toProjectWeek),
    foremanName: foreman ? safeStr(foreman.ForemanName) : "",
    foremanPhone: foreman ? safeStr(foreman.ForemanPhone) : "",
    notes: safeStr(row.ProjNote),
    officeNote: safeStr(row.ProjOfficeNote),
    jobNote: safeStr(row.JobNote),
    customerContact: safeStr(row.CustomerContact),
    // Use denormalized CustomerPhone/Email from tblProject if available,
    // fall back to tblCustomer record
    customerPhone: safeStr(row.CustomerPhone) || (customer ? safeStr(customer.Phone) : ""),
    customerEmail: safeStr(row.CustomerEmail) || (customer ? safeStr(customer.CustEmail) : ""),
    customerStreet: customer ? safeStr(customer.Street) : "",
    customerCity: customer ? safeStr(customer.City) : "",
    customerState: customer ? safeStr(customer.State) : "",
    customerZip: customer ? safeStr(customer.Zip) : "",
    customerNotes: safeStr(row.CustomerNotes),
    contractAmount: safeStr(row.ContractAmount),
    contractTotalPayments: safeStr(row.ContractTotalPayments),
    contractBalanceOwed: safeStr(row.ContractBalanceOwed),
    numberOfEmployees: safeStr(row.NumberOfEmployees),
    gcOnSite: safeStr(row.GCOnSite),
    entryUserName: safeStr(row.ProjectEntryUserName),
    entryTimestamp: safeStr(row.ProjectEntryTimestamp),
    recentAssignments: [],  // Milestone 4
  };
}

export async function getJobFilterOptions(): Promise<{
  customers: FilterOption[];
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
}> {
  const [customers, typeMap, salesmanMap, statusMap, locations] = await Promise.all([
    loadCustomerOptions(),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadStatusMap(),
    loadJobLocationOptions(),
  ]);

  return {
    customers,
    salesmen: Array.from(salesmanMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    customerTypes: Array.from(typeMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    statuses: Array.from(statusMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    cities: locations.cities,
    states: locations.states,
  };
}
