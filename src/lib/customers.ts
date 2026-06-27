import { queryReadOnly } from "@/lib/db/sql";
import type {
  CustomerSummary,
  CustomerSearchRow,
  CustomerDetail,
  CustomerContact,
  CustomerForeman,
  CustomerJobPreview,
  CustomerBillRate,
  CustomerWeek,
  CustomerRow,
  CustomerSearchListRow,
  CustomerDetailRow,
  CustomerContactRow,
  CustomerForemanRow,
  CustomerJobRow,
  CustomerBillRateRow,
  CustomerWeekRow,
} from "@/types/customer";
import type { FilterOption, PaginatedResult } from "@/types/search";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

// ---------------------------------------------------------------------------
// Customer base/list query — Street/City/State/Zip are all confirmed columns.
// Lookup names (type, salesman) merged in app code so a wrong lookup column
// can never crash the list.
// ---------------------------------------------------------------------------

const CUSTOMER_LIST_SQL = `
SELECT TOP (300)
  c.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ISNULL(c.CustStatusID,   0)   AS CustStatusID,
  ISNULL(c.Phone,          '')  AS Phone,
  ISNULL(c.CustEmail,      '')  AS CustEmail,
  ISNULL(c.Street,         '')  AS Street,
  ISNULL(c.City,           '')  AS City,
  ISNULL(c.State,          '')  AS State,
  ISNULL(c.Zip,            '')  AS Zip
FROM  tblCustomer c WITH (NOLOCK)
WHERE
  (@searchPat IS NULL
    OR c.CustBusName LIKE @searchPat
    OR CAST(c.CustomerID AS NVARCHAR(20)) LIKE @searchPat
    OR c.Phone       LIKE @searchPat
    OR c.CustEmail   LIKE @searchPat
    OR c.Street      LIKE @searchPat
    OR c.City        LIKE @searchPat)
  AND (@salesmanId     IS NULL OR CAST(c.SalesmanID     AS NVARCHAR(20)) = @salesmanId)
  AND (@customerTypeId IS NULL OR CAST(c.CustomerTypeID AS NVARCHAR(20)) = @customerTypeId)
  AND (@statusId       IS NULL OR CAST(c.CustStatusID   AS NVARCHAR(20)) = @statusId)
  AND (@city  IS NULL OR c.City  = @city)
  AND (@state IS NULL OR c.State = @state)
  AND LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1
  AND c.CustBusName NOT IN ('-', '--', '---')
ORDER BY c.CustBusName
`;

const CUSTOMER_SEARCH_LIST_SQL = `
SELECT TOP (300)
  c.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ISNULL(c.CustStatusID,   0)   AS CustStatusID,
  ISNULL(c.Phone,          '')  AS Phone,
  ISNULL(c.CustEmail,      '')  AS CustEmail,
  ISNULL(c.Street,         '')  AS Street,
  ISNULL(c.City,           '')  AS City,
  ISNULL(c.State,          '')  AS State,
  ISNULL(c.Zip,            '')  AS Zip,
  ISNULL(c.CustomerLicenseNumber, '') AS CustomerLicenseNumber,
  CONVERT(VARCHAR(10), firstWeek.FirstWeekEnding, 101) AS FirstWeekEnding,
  CONVERT(VARCHAR(10), lastWeek.LastWeekEnding, 101) AS LastWeekEnding,
  ISNULL(cc.ContactCount, 0) AS ContactCount
FROM  tblCustomer c WITH (NOLOCK)
OUTER APPLY (
  SELECT MIN(cw.WeekEndingDate) AS FirstWeekEnding
  FROM tblCustomerWeeks cw WITH (NOLOCK)
  WHERE cw.CustomerID = c.CustomerID
) firstWeek
OUTER APPLY (
  SELECT MAX(cw.WeekEndingDate) AS LastWeekEnding
  FROM tblCustomerWeeks cw WITH (NOLOCK)
  WHERE cw.CustomerID = c.CustomerID
) lastWeek
OUTER APPLY (
  SELECT COUNT(*) AS ContactCount
  FROM tblCustomerContacts cc WITH (NOLOCK)
  WHERE cc.CustomerID = c.CustomerID
) cc
WHERE
  (@searchPat IS NULL
    OR c.CustBusName LIKE @searchPat
    OR CAST(c.CustomerID AS NVARCHAR(20)) LIKE @searchPat
    OR c.Phone       LIKE @searchPat
    OR c.CustEmail   LIKE @searchPat
    OR c.Street      LIKE @searchPat
    OR c.City        LIKE @searchPat)
  AND (@salesmanId     IS NULL OR CAST(c.SalesmanID     AS NVARCHAR(20)) = @salesmanId)
  AND (@customerTypeId IS NULL OR CAST(c.CustomerTypeID AS NVARCHAR(20)) = @customerTypeId)
  AND (@statusId       IS NULL OR CAST(c.CustStatusID   AS NVARCHAR(20)) = @statusId)
  AND (@city  IS NULL OR c.City  = @city)
  AND (@state IS NULL OR c.State = @state)
  AND LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1
  AND c.CustBusName NOT IN ('-', '--', '---')
ORDER BY c.CustBusName
`;

const CUSTOMER_DETAIL_SQL = `
SELECT TOP (1)
  c.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ISNULL(c.CustStatusID,   0)   AS CustStatusID,
  ISNULL(c.Phone,          '')  AS Phone,
  ISNULL(c.CustEmail,      '')  AS CustEmail,
  ISNULL(c.Street,         '')  AS Street,
  ISNULL(c.City,           '')  AS City,
  ISNULL(c.State,          '')  AS State,
  ISNULL(c.Zip,            '')  AS Zip,
  ISNULL(c.Address,        '')  AS Address,
  ISNULL(c.MailStreet,     '')  AS MailStreet,
  ISNULL(c.MailCity,       '')  AS MailCity,
  ISNULL(c.MailState,      '')  AS MailState,
  ISNULL(c.MailZip,        '')  AS MailZip,
  ISNULL(c.CustFaxNum,     '')  AS CustFaxNum,
  ISNULL(c.CustWebSiteHLink,     '') AS CustWebSiteHLink,
  ISNULL(c.CustCorpWebSiteHLink, '') AS CustCorpWebSiteHLink,
  ISNULL(c.CreditLimit,    0)   AS CreditLimit,
  ISNULL(c.QBCustomerID,   '')  AS QBCustomerID,
  ISNULL(c.CustomerLicenseNumber, '') AS CustomerLicenseNumber,
  ISNULL(c.CustomerNote,   '')  AS CustomerNote,
  ISNULL(c.InvoiceNote,    '')  AS InvoiceNote,
  ISNULL(c.CollectionsNote,'')  AS CollectionsNote,
  ISNULL(c.CustEntryUserName, '') AS CustEntryUserName,
  CONVERT(VARCHAR(19), c.CustEntryTimestamp, 120) AS CustEntryTimestamp
FROM  tblCustomer c WITH (NOLOCK)
WHERE c.CustomerID = @customerId
`;

// ---------------------------------------------------------------------------
// Lookup maps — each tried independently, falls back to empty on failure.
// ---------------------------------------------------------------------------

async function loadCustomerTypeMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{ PullDownCustomerTypeID: unknown; TypeName: string | null }>(
      `SELECT PullDownCustomerTypeID,
              ISNULL(PullDownCustomerType, '') AS TypeName
       FROM   tblPullDownCustomerTypes WITH (NOLOCK)
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
    const rows = await queryReadOnly<{ PullDownSalesmanID: unknown; SalesmanLabel: string | null }>(
      `SELECT PullDownSalesmanID,
              LTRIM(RTRIM(
                ISNULL(PullDownSalesmanFName, '') + ' ' + ISNULL(PullDownSalesmanLName, '')
              )) AS SalesmanLabel
       FROM   tblPullDownSalesman WITH (NOLOCK)
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

async function loadCustStatusMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{ PulldownCustStatusID: unknown; StatusName: string | null }>(
      `SELECT PulldownCustStatusID,
              ISNULL(PulldownCustStatus, '') AS StatusName
       FROM   tblPullDownCustStatus WITH (NOLOCK)
       ORDER  BY PulldownCustStatusSort, PulldownCustStatus`,
    );
    for (const r of rows) {
      if (r.PulldownCustStatusID != null) {
        map.set(String(r.PulldownCustStatusID), r.StatusName ?? "");
      }
    }
  } catch { /* fail silently */ }
  return map;
}

async function loadProjStatusMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{ PullDownProjStatusID: unknown; StatusName: string | null }>(
      `SELECT PullDownProjStatusID, ISNULL(PullDownProjStatus, '') AS StatusName
       FROM   tblPullDownProjStatus WITH (NOLOCK)`,
    );
    for (const r of rows) {
      if (r.PullDownProjStatusID != null) {
        map.set(String(r.PullDownProjStatusID), r.StatusName ?? "");
      }
    }
  } catch { /* fail silently */ }
  return map;
}

// ---------------------------------------------------------------------------
// Related records
// ---------------------------------------------------------------------------

const CUSTOMER_CONTACTS_SQL = `
SELECT
  ISNULL(CustomerContactID,         0)   AS CustomerContactID,
  ISNULL(CustomerID,                0)   AS CustomerID,
  ISNULL(CustomerContactFName,      '')  AS CustomerContactFName,
  ISNULL(CustomerContactLName,      '')  AS CustomerContactLName,
  ISNULL(CustomerContactEmail,      '')  AS CustomerContactEmail,
  ISNULL(CustomerContactCell,       '')  AS CustomerContactCell,
  ISNULL(CustomerContactOfficePhone,'')  AS CustomerContactOfficePhone,
  ISNULL(CustomerContactNotes,      '')  AS CustomerContactNotes
FROM tblCustomerContacts WITH (NOLOCK)
WHERE CustomerID = @customerId
ORDER BY CustomerContactSort, CustomerContactLName, CustomerContactFName
`;

const CUSTOMER_FOREMEN_SQL = `
SELECT
  ISNULL(CustomerForemanID,    0)   AS CustomerForemanID,
  ISNULL(CustomerID,           0)   AS CustomerID,
  ISNULL(CustomerForeman,      '')  AS CustomerForeman,
  ISNULL(CustomerForemanPhone, '')  AS CustomerForemanPhone,
  CustomerForemanDefault
FROM tblCustomerForeman WITH (NOLOCK)
WHERE CustomerID = @customerId
ORDER BY CustomerForemanDefault DESC, CustomerForeman
`;

const CUSTOMER_JOBS_SQL = `
SELECT TOP (25)
  p.ProjectID,
  ISNULL(p.SiteName,     '') AS SiteName,
  ISNULL(p.ProjStatusID, 0)  AS ProjStatusID,
  ISNULL(p.SiteStreet,   '') AS SiteStreet,
  ISNULL(p.SiteZip,      '') AS SiteZip
FROM tblProject p WITH (NOLOCK)
WHERE p.CustomerID = @customerId
ORDER BY p.ProjectID DESC
`;

const CUSTOMER_BILLRATES_SQL = `
SELECT
  ISNULL(CustomerBillRateID, 0)  AS CustomerBillRateID,
  ISNULL(BillRateGrade,      '') AS BillRateGrade,
  ISNULL(BillRate,           0)  AS BillRate,
  ISNULL(BillRateNote,       '') AS BillRateNote,
  ISNULL(BillRateActive,     0)  AS BillRateActive
FROM tblCustomerBillRates WITH (NOLOCK)
WHERE CustomerID = @customerId
ORDER BY BillRateActive DESC, BillRateSort, BillRateGrade
`;

const CUSTOMER_WEEKS_SQL = `
SELECT TOP (26)
  ISNULL(CustomerWeekID, 0) AS CustomerWeekID,
  ISNULL(AssignWeek,     0) AS AssignWeek,
  ISNULL(AssignYear,     0) AS AssignYear,
  CONVERT(VARCHAR(10), WeekEndingDate, 101) AS WeekEndingDate,
  ISNULL(InvoiceNum,     '') AS InvoiceNum,
  ISNULL(InvoiceTotal,   0)  AS InvoiceTotal,
  ISNULL(OpenBalance,    0)  AS OpenBalance,
  ISNULL(Paid,           0)  AS Paid,
  ISNULL(InvoiceSent,    0)  AS InvoiceSent,
  ISNULL(WeekLocked,     0)  AS WeekLocked
FROM tblCustomerWeeks WITH (NOLOCK)
WHERE CustomerID = @customerId
ORDER BY AssignYear DESC, AssignWeek DESC
`;

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function money(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toCustomerBase(
  row: CustomerRow,
): Omit<CustomerSummary, "customerType" | "salesman" | "status"> {
  return {
    customerId: safeStr(row.CustomerID),
    customerName: safeStr(row.CustBusName),
    phone: safeStr(row.Phone),
    email: safeStr(row.CustEmail),
    street: safeStr(row.Street),
    city: safeStr(row.City),
    state: safeStr(row.State),
    zip: safeStr(row.Zip),
  };
}

function toCustomerBillRate(row: CustomerBillRateRow): CustomerBillRate {
  return {
    billRateId: safeStr(row.CustomerBillRateID),
    grade: safeStr(row.BillRateGrade) || "—",
    billRate: money(row.BillRate),
    note: safeStr(row.BillRateNote),
    active: row.BillRateActive === true || row.BillRateActive === 1,
  };
}

function toCustomerWeek(row: CustomerWeekRow): CustomerWeek {
  return {
    weekId: safeStr(row.CustomerWeekID),
    weekEnding: safeStr(row.WeekEndingDate),
    assignWeek: safeStr(row.AssignWeek),
    assignYear: safeStr(row.AssignYear),
    invoiceNum: safeStr(row.InvoiceNum),
    invoiceTotal: money(row.InvoiceTotal),
    openBalance: money(row.OpenBalance),
    paid: row.Paid === true || row.Paid === 1,
    invoiceSent: row.InvoiceSent === true || row.InvoiceSent === 1,
    locked: row.WeekLocked === true || row.WeekLocked === 1,
  };
}

function toCustomerContact(row: CustomerContactRow): CustomerContact {
  const firstName = safeStr(row.CustomerContactFName);
  const lastName = safeStr(row.CustomerContactLName);
  return {
    contactId: safeStr(row.CustomerContactID),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || "—",
    title: "",
    email: safeStr(row.CustomerContactEmail),
    cellPhone: safeStr(row.CustomerContactCell),
    officePhone: safeStr(row.CustomerContactOfficePhone),
    notes: safeStr(row.CustomerContactNotes),
  };
}

function toCustomerForeman(row: CustomerForemanRow): CustomerForeman {
  return {
    foremanId: safeStr(row.CustomerForemanID),
    foremanName: safeStr(row.CustomerForeman) || "—",
    phone: safeStr(row.CustomerForemanPhone),
    email: "",
    notes: row.CustomerForemanDefault ? "Default" : "",
  };
}

function toCustomerSearchRow(
  row: CustomerSearchListRow,
  typeMap: Map<string, string>,
  salesmanMap: Map<string, string>,
  statusMap: Map<string, string>,
): CustomerSearchRow {
  const base = toCustomerBase(row);
  const status = statusMap.get(String(row.CustStatusID ?? "")) ?? "";
  return {
    ...base,
    customerType: typeMap.get(String(row.CustomerTypeID ?? "")) ?? "",
    salesman: salesmanMap.get(String(row.SalesmanID ?? "")) ?? "",
    status,
    noCommunication: "",
    act: status,
    lastWeekEnding: safeStr(row.LastWeekEnding),
    firstWeekEnding: safeStr(row.FirstWeekEnding),
    internetSalesReadyUser: "",
    internetSalesReadyDate: "",
    internetSalesReady: "",
    lastActionUser: "",
    lastActionDate: "",
    lastAction: "",
    futureCallUser: "",
    futureCallUserDate: "",
    futureCallUserTime: "",
    futureCall: "",
    futureCallHistory: "",
    salesHStatus: "",
    contacts: "",
    licenseNumber: safeStr(row.CustomerLicenseNumber),
    licenseIssueDate: "",
    licenseExpireDate: "",
    salesPackageSentFilter: "",
    salesPackageSentDate: "",
    salesPackageSentUser: "",
    contactCount: safeStr(row.ContactCount),
  };
}

function emptyCustomerSearchFields(): Omit<
  CustomerSearchRow,
  keyof CustomerSummary | "customerType" | "salesman" | "status"
> {
  return {
    noCommunication: "",
    act: "",
    lastWeekEnding: "",
    firstWeekEnding: "",
    internetSalesReadyUser: "",
    internetSalesReadyDate: "",
    internetSalesReady: "",
    lastActionUser: "",
    lastActionDate: "",
    lastAction: "",
    futureCallUser: "",
    futureCallUserDate: "",
    futureCallUserTime: "",
    futureCall: "",
    futureCallHistory: "",
    salesHStatus: "",
    contacts: "",
    licenseNumber: "",
    licenseIssueDate: "",
    licenseExpireDate: "",
    salesPackageSentFilter: "",
    salesPackageSentDate: "",
    salesPackageSentUser: "",
    contactCount: "",
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetCustomersParams {
  search?: string;
  salesmanId?: string;
  customerTypeId?: string;
  statusId?: string;
  city?: string;
  state?: string;
}

export async function getCustomers(
  params: GetCustomersParams = {},
): Promise<PaginatedResult<CustomerSummary>> {
  const result = await getCustomerSearchRows(params);
  return {
    data: result.data,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    hasMore: result.hasMore,
  };
}

export async function getCustomerSearchRows(
  params: GetCustomersParams = {},
): Promise<PaginatedResult<CustomerSearchRow>> {
  const searchPat = params.search ? `%${params.search}%` : null;
  const salesmanId = params.salesmanId || null;
  const customerTypeId = params.customerTypeId || null;
  const statusId = params.statusId || null;
  const city = params.city || null;
  const state = params.state || null;

  const [rows, typeMap, salesmanMap, statusMap] = await Promise.all([
    queryReadOnly<CustomerSearchListRow>(CUSTOMER_SEARCH_LIST_SQL, [
      { name: "searchPat", value: searchPat },
      { name: "salesmanId", value: salesmanId },
      { name: "customerTypeId", value: customerTypeId },
      { name: "statusId", value: statusId },
      { name: "city", value: city },
      { name: "state", value: state },
    ]).catch(() =>
      queryReadOnly<CustomerRow>(CUSTOMER_LIST_SQL, [
        { name: "searchPat", value: searchPat },
        { name: "salesmanId", value: salesmanId },
        { name: "customerTypeId", value: customerTypeId },
        { name: "statusId", value: statusId },
        { name: "city", value: city },
        { name: "state", value: state },
      ]),
    ),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadCustStatusMap(),
  ]);

  const data = rows.map((row) => {
    if ("FirstWeekEnding" in row || "ContactCount" in row || "CustomerLicenseNumber" in row) {
      return toCustomerSearchRow(row as CustomerSearchListRow, typeMap, salesmanMap, statusMap);
    }
    const base = {
      ...toCustomerBase(row),
      customerType: typeMap.get(String(row.CustomerTypeID ?? "")) ?? "",
      salesman: salesmanMap.get(String(row.SalesmanID ?? "")) ?? "",
      status: statusMap.get(String(row.CustStatusID ?? "")) ?? "",
      ...emptyCustomerSearchFields(),
    };
    return {
      ...base,
      act: base.status,
    };
  });

  return { data, total: data.length, page: 1, pageSize: 300, hasMore: false };
}

export async function getCustomerById(
  customerId: string,
): Promise<CustomerDetail | null> {
  const [
    customerRows,
    typeMap,
    salesmanMap,
    statusMap,
    projStatusMap,
    contactRows,
    foremanRows,
    jobRows,
    billRateRows,
    weekRows,
  ] = await Promise.all([
    queryReadOnly<CustomerDetailRow>(CUSTOMER_DETAIL_SQL, [{ name: "customerId", value: customerId }]),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadCustStatusMap(),
    loadProjStatusMap(),
    queryReadOnly<CustomerContactRow>(CUSTOMER_CONTACTS_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerContactRow[]),
    queryReadOnly<CustomerForemanRow>(CUSTOMER_FOREMEN_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerForemanRow[]),
    queryReadOnly<CustomerJobRow>(CUSTOMER_JOBS_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerJobRow[]),
    queryReadOnly<CustomerBillRateRow>(CUSTOMER_BILLRATES_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerBillRateRow[]),
    queryReadOnly<CustomerWeekRow>(CUSTOMER_WEEKS_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerWeekRow[]),
  ]);

  const row = customerRows[0];
  if (!row) return null;

  const jobs: CustomerJobPreview[] = jobRows.map((j) => ({
    jobId: safeStr(j.ProjectID),
    jobName: safeStr(j.SiteName),
    status: projStatusMap.get(String(j.ProjStatusID ?? "")) ?? "",
    address: [safeStr(j.SiteStreet), safeStr(j.SiteZip)].filter(Boolean).join(", "),
  }));

  return {
    ...toCustomerBase(row),
    customerType: typeMap.get(String(row.CustomerTypeID ?? "")) ?? "",
    salesman: salesmanMap.get(String(row.SalesmanID ?? "")) ?? "",
    status: statusMap.get(String(row.CustStatusID ?? "")) ?? "",
    fullAddress: safeStr(row.Address),
    mailStreet: safeStr(row.MailStreet),
    mailCity: safeStr(row.MailCity),
    mailState: safeStr(row.MailState),
    mailZip: safeStr(row.MailZip),
    fax: safeStr(row.CustFaxNum),
    website: safeStr(row.CustWebSiteHLink),
    corpWebsite: safeStr(row.CustCorpWebSiteHLink),
    creditLimit: safeStr(row.CreditLimit),
    qbCustomerId: safeStr(row.QBCustomerID),
    licenseNumber: safeStr(row.CustomerLicenseNumber),
    customerNote: safeStr(row.CustomerNote),
    invoiceNote: safeStr(row.InvoiceNote),
    collectionsNote: safeStr(row.CollectionsNote),
    entryUserName: safeStr(row.CustEntryUserName),
    entryTimestamp: safeStr(row.CustEntryTimestamp),
    contacts: contactRows.map(toCustomerContact),
    foremen: foremanRows.map(toCustomerForeman),
    jobs,
    billRates: billRateRows.map(toCustomerBillRate),
    weeks: weekRows.map(toCustomerWeek),
  };
}

export async function getCustomerFilterOptions(): Promise<{
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
}> {
  const [typeMap, salesmanMap, statusMap, cityRows, stateRows] = await Promise.all([
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    loadCustStatusMap(),
    queryReadOnly<{ City: string | null }>(
      `SELECT DISTINCT City FROM tblCustomer WITH (NOLOCK)
       WHERE LEN(LTRIM(RTRIM(ISNULL(City, '')))) > 1 ORDER BY City`,
    ).catch(() => [] as { City: string | null }[]),
    queryReadOnly<{ State: string | null }>(
      `SELECT DISTINCT State FROM tblCustomer WITH (NOLOCK)
       WHERE LEN(LTRIM(RTRIM(ISNULL(State, '')))) > 0 ORDER BY State`,
    ).catch(() => [] as { State: string | null }[]),
  ]);

  return {
    salesmen: Array.from(salesmanMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    customerTypes: Array.from(typeMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    statuses: Array.from(statusMap.entries())
      .map(([value, label]) => ({ value, label }))
      .filter((o) => o.label)
      .sort((a, b) => a.label.localeCompare(b.label)),
    cities: toUniqueOptions(cityRows.map((r) => safeStr(r.City))),
    states: toUniqueOptions(stateRows.map((r) => safeStr(r.State))),
  };
}

/**
 * Build a de-duplicated FilterOption list from raw strings. DISTINCT at the SQL
 * level can still yield duplicates once values are trimmed (e.g. "Salem" vs
 * "Salem "), which breaks React keys — so we dedupe case-insensitively here.
 */
function toUniqueOptions(values: string[]): FilterOption[] {
  const seen = new Set<string>();
  const options: FilterOption[] = [];
  for (const value of values) {
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ value, label: value });
  }
  return options;
}
