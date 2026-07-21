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

function numericId(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

// ---------------------------------------------------------------------------
// Customer base/list query — Street/City/State/Zip are all confirmed columns.
// Lookup names (type, salesman) merged in app code so a wrong lookup column
// can never crash the list.
// ---------------------------------------------------------------------------

const CUSTOMER_SEARCH_LIST_SQL = `
WITH FilteredCustomers AS (
  SELECT
    c.CustomerID, c.CustBusName, c.CustomerTypeID, c.SalesmanID, c.CustStatusID,
    c.Phone, c.CustEmail, c.Street, c.City, c.State, c.Zip,
    c.CustomerLicenseNumber, c.CustomerLicenseIssueDate, c.CustomerLicenseExpDate,
    c.CustomerNoCommunication,
    c.InternetSalesReadyID, c.InternetSalesReadyUserName, c.InternetSalesReadyTimestamp,
    c.SalesHistoryStatusID,
    c.FutureCall, c.FutureCallUserName, c.FutureCallTimestamp,
    COUNT_BIG(*) OVER () AS TotalCount
  FROM tblCustomer c WITH (NOLOCK)
  WHERE
    (@searchPat IS NULL
      OR c.CustBusName LIKE @searchPat
      OR CAST(c.CustomerID AS NVARCHAR(20)) LIKE @searchPat
      OR c.Phone       LIKE @searchPat
      OR c.CustEmail   LIKE @searchPat
      OR c.Street      LIKE @searchPat
      OR c.City        LIKE @searchPat)
    AND (@salesmanId     IS NULL OR c.SalesmanID     = @salesmanId)
    AND (@customerTypeId IS NULL OR c.CustomerTypeID = @customerTypeId)
    AND (@statusId       IS NULL OR c.CustStatusID   = @statusId)
    AND (@city  IS NULL OR c.City  = @city)
    AND (@state IS NULL OR c.State = @state)
    AND LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1
    AND c.CustBusName NOT IN ('-', '--', '---')
)
SELECT
  c.TotalCount,
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
  CONVERT(VARCHAR(10), c.CustomerLicenseIssueDate, 101) AS CustomerLicenseIssueDate,
  CONVERT(VARCHAR(10), c.CustomerLicenseExpDate, 101) AS CustomerLicenseExpDate,
  CASE WHEN ISNULL(c.CustomerNoCommunication, 0) = 1 THEN 'X' ELSE '' END AS NoCommunication,
  ISNULL(lastAction.ActionCount, 0) AS ActionCount,
  CONVERT(VARCHAR(10), customerWeeks.FirstWeekEnding, 101) AS FirstWeekEnding,
  CONVERT(VARCHAR(10), customerWeeks.LastWeekEnding, 101) AS LastWeekEnding,
  ISNULL(c.InternetSalesReadyUserName, '') AS InternetSalesReadyUser,
  CONVERT(VARCHAR(10), c.InternetSalesReadyTimestamp, 101) AS InternetSalesReadyDate,
  ISNULL(internetReady.PullDownInternetSalesReadyDesc, '') AS InternetSalesReady,
  ISNULL(lastAction.CustomerSalesHistoryUserName, '') AS LastActionUser,
  CONVERT(VARCHAR(10), lastAction.CustomerSalesHistoryTimestamp, 101) AS LastActionDate,
  ISNULL(lastAction.ActionLabel, '') AS LastAction,
  ISNULL(c.FutureCallUserName, '') AS FutureCallUser,
  CONVERT(VARCHAR(10), c.FutureCallTimestamp, 101) AS FutureCallUserDate,
  CONVERT(VARCHAR(5), c.FutureCallTimestamp, 108) AS FutureCallUserTime,
  CONVERT(VARCHAR(10), c.FutureCall, 101) AS FutureCall,
  ISNULL(salesStatus.PullDownSalesHistoryStatusDesc, '') AS SalesHistoryStatus,
  CASE WHEN salesPackage.CustomerSalesHistoryID IS NULL THEN '' ELSE 'X' END AS SalesPackageSentFilter,
  CONVERT(VARCHAR(10), salesPackage.CustomerSalesHistoryTimestamp, 101) AS SalesPackageSentDate,
  ISNULL(salesPackage.CustomerSalesHistoryUserName, '') AS SalesPackageSentUser,
  ISNULL(cc.ContactCount, 0) AS ContactCount
FROM __CUSTOMER_SOURCE__ c
LEFT JOIN tblPullDownCustomerTypes customerType WITH (NOLOCK)
  ON c.CustomerTypeID = customerType.PullDownCustomerTypeID
LEFT JOIN tblPullDownInternetSalesReady internetReady WITH (NOLOCK)
  ON c.InternetSalesReadyID = internetReady.PullDownInternetSalesReadyID
LEFT JOIN tblPullDownSalesHistoryStatus salesStatus WITH (NOLOCK)
  ON c.SalesHistoryStatusID = salesStatus.PullDownSalesHistoryStatusID
OUTER APPLY (
  SELECT
    MIN(cw.WeekEndingDate) AS FirstWeekEnding,
    MAX(cw.WeekEndingDate) AS LastWeekEnding
  FROM tblCustomerWeeks cw WITH (NOLOCK)
  WHERE cw.CustomerID = c.CustomerID
) customerWeeks
OUTER APPLY (
  SELECT COUNT(*) AS ContactCount
  FROM tblCustomerContacts cc WITH (NOLOCK)
  WHERE cc.CustomerID = c.CustomerID
) cc
OUTER APPLY (
  SELECT TOP (1)
    sh.CustomerSalesHistoryUserName,
    sh.CustomerSalesHistoryTimestamp,
    SUM(CASE WHEN sh.CustomerSalesHistoryActionTypeID NOT IN (-60, -70) THEN 1 ELSE 0 END)
      OVER () AS ActionCount,
    COALESCE(
      CASE WHEN sh.CustomerSalesHistoryActionTypeID > 0 THEN et.EmailTemplate END,
      actionType.PullDownActionTypeDesc,
      actionType.PullDownActionType,
      ''
    ) AS ActionLabel
  FROM tblCustomerSalesHistory sh WITH (NOLOCK)
  LEFT JOIN tblEmailTemplates et WITH (NOLOCK)
    ON sh.CustomerSalesHistoryActionTypeID = et.EmailTemplateID
  LEFT JOIN tblPullDownActionTypes actionType WITH (NOLOCK)
    ON sh.CustomerSalesHistoryActionTypeID = actionType.PullDownActionTypeID
  WHERE sh.CustomerID = c.CustomerID
  ORDER BY sh.CustomerSalesHistoryTimestamp DESC, sh.CustomerSalesHistoryID DESC
) lastAction
OUTER APPLY (
  SELECT TOP (1)
    shPackage.CustomerSalesHistoryID,
    shPackage.CustomerSalesHistoryTimestamp,
    shPackage.CustomerSalesHistoryUserName
  FROM tblCustomerSalesHistory shPackage WITH (NOLOCK)
  WHERE shPackage.CustomerID = c.CustomerID
    AND shPackage.CustomerSalesHistoryActionTypeID = -3
  ORDER BY shPackage.CustomerSalesHistoryTimestamp DESC, shPackage.CustomerSalesHistoryID DESC
) salesPackage
ORDER BY __CUSTOMER_SORT__, c.CustomerID
OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
OPTION (RECOMPILE)
`;

const CUSTOMER_SEARCH_SORT_COLUMNS: Record<string, string> = {
  select: "c.CustomerID",
  name: "c.CustBusName",
  noCommunication: "c.CustomerNoCommunication",
  street: "c.Street",
  city: "c.City",
  state: "c.State",
  customerType: "customerType.PullDownCustomerType",
  lastWeekEnding: "customerWeeks.LastWeekEnding",
  firstWeekEnding: "customerWeeks.FirstWeekEnding",
  act: "ActionCount",
  internetSalesReadyUser: "InternetSalesReadyUser",
  internetSalesReadyDate: "c.InternetSalesReadyTimestamp",
  internetSalesReady: "internetReady.PullDownInternetSalesReadyDesc",
  lastActionUser: "lastAction.CustomerSalesHistoryUserName",
  lastActionDate: "lastAction.CustomerSalesHistoryTimestamp",
  lastAction: "lastAction.ActionLabel",
  futureCallUser: "FutureCallUser",
  futureCallUserDate: "c.FutureCallTimestamp",
  futureCallUserTime: "c.FutureCallTimestamp",
  futureCall: "c.FutureCall",
  futureCallHistory: "c.FutureCall",
  salesHStatus: "salesStatus.PullDownSalesHistoryStatusDesc",
  contacts: "ContactCount",
  licenseNumber: "CustomerLicenseNumber",
  licenseIssueDate: "c.CustomerLicenseIssueDate",
  licenseExpireDate: "c.CustomerLicenseExpDate",
  salesPackageSentFilter: "SalesPackageSentFilter",
  salesPackageSentDate: "salesPackage.CustomerSalesHistoryTimestamp",
  salesPackageSentUser: "salesPackage.CustomerSalesHistoryUserName",
  contactCount: "ContactCount",
};

function customerSearchSql(sortKey?: string, sortDirection?: string, includeTotal = true): string {
  const column = CUSTOMER_SEARCH_SORT_COLUMNS[sortKey ?? ""] ?? "c.CustBusName";
  const direction = sortDirection === "desc" ? "DESC" : "ASC";
  const order = `${column} ${direction}`;
  let sqlText = CUSTOMER_SEARCH_LIST_SQL
    .replace("__CUSTOMER_SORT__", order)
    .replace("__CUSTOMER_SOURCE__", column.startsWith("c.") ? "CandidateCustomers" : "FilteredCustomers");

  if (!includeTotal) {
    sqlText = sqlText.replace("COUNT_BIG(*) OVER () AS TotalCount", "CAST(0 AS BIGINT) AS TotalCount");
  }

  // Direct tblCustomer fields can be sorted and paged before the expensive
  // history/contact lookups while still sorting the complete filtered set.
  if (column.startsWith("c.")) {
    sqlText = sqlText
      .replace(
        ")\nSELECT\n",
        `),
CandidateCustomers AS (
  SELECT *
  FROM FilteredCustomers c
  ORDER BY ${order}, c.CustomerID
  OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
)
SELECT
`,
      )
      .replace(
        `ORDER BY ${order}, c.CustomerID
OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
        `ORDER BY ${order}, c.CustomerID`,
      );
  }

  return sqlText;
}

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
    noCommunication: safeStr(row.NoCommunication),
    act: safeStr(row.ActionCount),
    lastWeekEnding: safeStr(row.LastWeekEnding),
    firstWeekEnding: safeStr(row.FirstWeekEnding),
    internetSalesReadyUser: safeStr(row.InternetSalesReadyUser),
    internetSalesReadyDate: safeStr(row.InternetSalesReadyDate),
    internetSalesReady: safeStr(row.InternetSalesReady),
    lastActionUser: safeStr(row.LastActionUser),
    lastActionDate: safeStr(row.LastActionDate),
    lastAction: safeStr(row.LastAction),
    futureCallUser: safeStr(row.FutureCallUser),
    futureCallUserDate: safeStr(row.FutureCallUserDate),
    futureCallUserTime: safeStr(row.FutureCallUserTime),
    futureCall: safeStr(row.FutureCall),
    futureCallHistory: row.FutureCall ? "Future Call History" : "",
    salesHStatus: safeStr(row.SalesHistoryStatus),
    contacts: "Contacts",
    licenseNumber: safeStr(row.CustomerLicenseNumber),
    licenseIssueDate: safeStr(row.CustomerLicenseIssueDate),
    licenseExpireDate: safeStr(row.CustomerLicenseExpDate),
    salesPackageSentFilter: safeStr(row.SalesPackageSentFilter),
    salesPackageSentDate: safeStr(row.SalesPackageSentDate),
    salesPackageSentUser: safeStr(row.SalesPackageSentUser),
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
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  includeTotal?: boolean;
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
  // Bind numeric IDs as numbers so SQL Server can seek indexed integer columns
  // without converting every row to NVARCHAR first.
  const salesmanId = numericId(params.salesmanId);
  const customerTypeId = numericId(params.customerTypeId);
  const statusId = numericId(params.statusId);
  const city = params.city || null;
  const state = params.state || null;
  const pageSize = Math.max(1, Math.min(300, Math.floor(params.pageSize ?? 300)));
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const offset = (page - 1) * pageSize;

  const [rows, typeMap, salesmanMap, statusMap] = await Promise.all([
    queryReadOnly<CustomerSearchListRow>(customerSearchSql(params.sortKey, params.sortDirection, params.includeTotal), [
      { name: "searchPat", value: searchPat },
      { name: "salesmanId", value: salesmanId },
      { name: "customerTypeId", value: customerTypeId },
      { name: "statusId", value: statusId },
      { name: "city", value: city },
      { name: "state", value: state },
      { name: "offset", value: offset },
      { name: "pageSize", value: pageSize },
    ]),
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

  const includeTotal = params.includeTotal !== false;
  const total = includeTotal ? Number(rows[0]?.TotalCount ?? 0) : offset + data.length;
  return {
    data,
    total,
    page,
    pageSize,
    hasMore: includeTotal ? offset + data.length < total : false,
  };
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
