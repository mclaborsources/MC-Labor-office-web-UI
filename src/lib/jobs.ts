import { queryReadOnly } from "@/lib/db/sql";
import type {
  JobSummary,
  JobDetail,
  JobRow,
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

async function loadCustomerOptions(): Promise<FilterOption[]> {
  try {
    const rows = await queryReadOnly<{ CustomerID: unknown; CustBusName: string | null }>(
      `SELECT TOP 500 CustomerID, ISNULL(CustBusName, '') AS CustBusName
       FROM   tblCustomer
       WHERE  LEN(LTRIM(RTRIM(ISNULL(CustBusName, '')))) > 1
         AND  CustBusName NOT IN ('-', '--')
       ORDER  BY CustBusName`,
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
  ISNULL(p.ProjStatusID,   0)   AS ProjStatusID,
  ISNULL(p.SiteForemanID,  0)   AS SiteForemanID,
  CONVERT(VARCHAR(10), p.StartDate, 101) AS StartDate,
  CONVERT(VARCHAR(10), p.EndDate,   101) AS EndDate,
  ISNULL(p.ProjNote,       '')  AS ProjNote,
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
): JobSummary {
  return {
    jobId: safeStr(row.ProjectID),
    customerId: safeStr(row.CustomerID),
    customerName: safeStr(row.CustBusName),
    customerType: typeMap.get(String(row.CustomerTypeID ?? "")) ?? "",
    salesman: salesmanMap.get(String(row.SalesmanID ?? "")) ?? "",
    jobName: safeStr(row.SiteName),
    city: "",   // stored as SiteStateCityID lookup — no direct text column
    state: "",  // same
    zip: safeStr(row.SiteZip),
    status: statusMap.get(String(row.ProjStatusID ?? "")) ?? "",
    foremanName: "",  // resolved separately in getJobById; empty on list view
    startDate: formatDate(row.StartDate),
    endDate: formatDate(row.EndDate),
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
  city?: string;
  state?: string;
}

export async function getJobs(
  params: GetJobsParams = {},
): Promise<PaginatedResult<JobSummary>> {
  const searchPat = params.search ? `%${params.search}%` : null;
  const customerId = params.customerId || null;
  const salesmanId = params.salesmanId || null;
  const customerTypeId = params.customerTypeId || null;
  const statusId = params.statusId || null;
  const city = params.city ? `%${params.city}%` : null;
  const state = params.state ? `%${params.state}%` : null;

  const [rows, typeMap, salesmanMap, statusMap] = await Promise.all([
    queryReadOnly<JobRow>(JOB_LIST_SQL, [
      { name: "searchPat",     value: searchPat },
      { name: "customerId",    value: customerId },
      { name: "salesmanId",    value: salesmanId },
      { name: "customerTypeId",value: customerTypeId },
      { name: "statusId",      value: statusId },
      { name: "city",          value: city },
      { name: "state",         value: state },
    ]),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadStatusMap(),
  ]);

  const data = rows.map((row) => toJobBase(row, typeMap, salesmanMap, statusMap));
  return { data, total: data.length, page: 1, pageSize: 200, hasMore: false };
}

export async function getJobById(jobId: string): Promise<JobDetail | null> {
  const [jobRows, typeMap, salesmanMap, statusMap] = await Promise.all([
    queryReadOnly<JobRow>(JOB_DETAIL_SQL, [
      { name: "projectId", value: jobId },
    ]),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadStatusMap(),
  ]);

  const row = jobRows[0];
  if (!row) return null;

  const customerId = safeStr(row.CustomerID);
  const siteForemanId = row.SiteForemanID ? String(row.SiteForemanID) : null;
  const base = toJobBase(row, typeMap, salesmanMap, statusMap);

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
    foremanName: foreman ? safeStr(foreman.ForemanName) : "",
    foremanPhone: foreman ? safeStr(foreman.ForemanPhone) : "",
    notes: safeStr(row.ProjNote),
    // Use denormalized CustomerPhone/Email from tblProject if available,
    // fall back to tblCustomer record
    customerPhone: safeStr(row.CustomerPhone) || (customer ? safeStr(customer.Phone) : ""),
    customerEmail: safeStr(row.CustomerEmail) || (customer ? safeStr(customer.CustEmail) : ""),
    customerStreet: customer ? safeStr(customer.Street) : "",
    customerCity: customer ? safeStr(customer.City) : "",
    customerState: customer ? safeStr(customer.State) : "",
    customerZip: customer ? safeStr(customer.Zip) : "",
    recentAssignments: [],  // Milestone 4
  };
}

export async function getJobFilterOptions(): Promise<{
  customers: FilterOption[];
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
}> {
  const [customers, typeMap, salesmanMap, statusMap] = await Promise.all([
    loadCustomerOptions(),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadStatusMap(),
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
  };
}
