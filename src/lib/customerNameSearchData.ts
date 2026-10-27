import { queryReadOnly } from "@/lib/db/sql";
import { CUSTOMER_NAME_SEARCH_COLUMNS, type CustomerNameColumnKey, type CustomerNameMatch } from "./customerNameSearchColumns";

const OPTIONAL_CUSTOMER_COLUMN_CANDIDATES: Partial<Record<CustomerNameColumnKey, readonly string[]>> = {
  sAdm: ["SAdm", "CustomerSAdm"],
  customerDescription: ["CustomerDescription", "CustDescription"],
  importNote: ["ImportNote", "CustomerImportNote"],
  noCommunicationUser: ["CustomerNoCommunicationUserName", "NoCommunicationUserName"],
  noCommunicationDate: ["CustomerNoCommunicationTimestamp", "CustomerNoCommunicationDate", "NoCommunicationDate"],
  customerFolder: ["CustomerFolder", "CustomerFolderName"],
  contractLocation: ["ContractLocation", "CustomerContractLocation"],
  contractNote: ["ContractNote", "CustomerContractNote"],
  rts: ["RTS", "ReturnToSender"], rtsUser: ["RTSUser", "ReturnToSenderUser"], rtsDate: ["RTSDate", "ReturnToSenderDate"],
  kickback: ["Kickback", "CustomerKickback"], kickbackTimes: ["KickbackTimes"], kickbackAction: ["KickbackAction"],
  siteVisitUser: ["SiteVisitUserName", "SiteVisitUser", "CustomerSiteVisitUserName"], siteVisitDate: ["SiteVisitTimestamp", "SiteVisitDate", "CustomerSiteVisitTimestamp"],
  officeVisitUser: ["OfficeVisitUserName", "OfficeVisitUser", "CustomerOfficeVisitUserName"], officeVisitDate: ["OfficeVisitTimestamp", "OfficeVisitDate", "CustomerOfficeVisitTimestamp"],
  coldCallUser: ["ColdCallUserName", "ColdCallUser", "CustomerColdCallUserName"], coldCallDate: ["ColdCallTimestamp", "ColdCallDate", "CustomerColdCallTimestamp"],
  dormantCallUser: ["DormantCallUserName", "DormantCallUser", "CustomerDormantCallUserName"], dormantCallDate: ["DormantCallTimestamp", "DormantCallDate", "CustomerDormantCallTimestamp"],
  outlookEmailUser: ["OutlookEmailUserName", "OutlookEmailUser", "CustomerOutlookEmailUserName"], outlookEmailDate: ["OutlookEmailTimestamp", "OutlookEmailDate", "CustomerOutlookEmailTimestamp"],
  mailerDate: ["MailerDate", "MailerTimestamp", "CustomerMailerDate"], mailerUser: ["MailerUserName", "MailerUser", "CustomerMailerUserName"],
  srsFilter: ["SRSFilter"], lcu: ["LCU"], corpS: ["CorpS"], ne: ["NE"], licenseStatus: ["LicS", "LicenseStatus"],
  researchTries: ["RTries", "CustomerRTries"], researchUser: ["RUser", "CustomerRUser"], researchBefore: ["RBefore", "CustomerRBefore"], researchAfter: ["RAfter", "CustomerRAfter"],
  researchUp: ["RUp", "CustomerRUp"], researchNote: ["ResearchNote", "CustomerResearchNote"], researchDate: ["RDate", "CustomerRDate"], researchTime: ["RTime", "CustomerRTime"],
  timePerSearch: ["TimePerSearch", "CustomerTimePerSearch"], researchNoteShort: ["RNote", "CustomerRNote"], readyForSalesman: ["RdyForSalesman", "ReadyForSalesman", "CustomerReadyForSalesman"],
  hunter: ["Hunter"], srcFilter: ["SRCFilter"], hsgAlarm: ["HSGAlarm"], updatedContract: ["UpdatedContract"],
  cannotMakeAssignments: ["CannotMakeAssignments"], researchWebsite: ["RWebSite"], researchWebsiteB: ["RWebSiteB"],
  researchWebsiteChanged: ["RWebSiteChanged", "RWebSiteCheck", "RWebSiteChecked", "ResearchWebsiteChanged"],
  salesContractMlsLink: ["HLinkSalesContractMLS"], wcDateHistory: ["WCxDateHSG"], glDateHistory: ["GLxDateHSG"],
  wcLinkHistory: ["HLinkWCxDateHSG"], glLinkHistory: ["HLinkGLxDateHSG"], transferToDeleted: ["TransferToDeleted"],
  countyFilter: ["CountyFilter"], contractSalesman: ["ContractSalesman"],
  permitDate: ["PermitDate"], permitStreet: ["PermitStreet"], permitCity: ["PermitCity"], permitState: ["PermitState"],
  permitFee: ["PermitFee"], permitValue: ["PermitValue"], permitTimestamp: ["PermitTimestamp"],
  permitSearchLink: ["PermitSearchLink"], permitLink: ["PermitLink"], permitCards: ["PermitCards"], permitLetter: ["PermitLetter"],
  siteVisitStatus: ["SiteVisit"], futureVisit: ["FutureVisit"], futureVisitUser: ["FutureVisitUserName", "FutureVisitUser"],
  futureVisitDate: ["FutureVisitTimestamp", "FutureVisitDate"], jobStatus: ["JobStatus"], statusUser: ["StatusUserName", "StatusUser"],
  statusDate: ["StatusTimestamp", "StatusDate"], permitHistory: ["PermitHistory"],
  permitContactLast: ["PermitContactLName"], permitContactFirst: ["PermitContactFName"],
  permitContactCell: ["PermitContactCell"], permitContactTitle: ["PermitContactTitle"], permitContactEmail: ["PermitContactEmail"],
};

function optionalCustomerSelect(availableColumns: Set<string>): string {
  return Object.entries(OPTIONAL_CUSTOMER_COLUMN_CANDIDATES).flatMap(([key, candidates]) => {
    const field = candidates?.find(candidate => availableColumns.has(candidate.toLowerCase()));
    if (!field || !/^[A-Za-z][A-Za-z0-9_]*$/.test(field)) return [];
    const column = CUSTOMER_NAME_SEARCH_COLUMNS.find(item => item.key === key);
    const expression = column?.kind === "date"
      ? `CONVERT(varchar(19), c.[${field}], 120)`
      : `c.[${field}]`;
    return [`${expression} AS [${key}]`];
  }).join(",\n  ");
}

/** One row per customer; the primary-contact and segmented-week rules follow Access. */
export const CUSTOMER_NAME_SEARCH_SQL = `SELECT c.CustomerID AS customerId, c.CustBusName AS customerName,
  profileType.PullDownCustomerProfileType AS profileType, c.CustEntryUserName AS entryUserName,
  CONVERT(varchar(10), c.CustEntryTimestamp, 101) AS entryDate,
  customerType.PullDownCustomerType AS customerType, c.Street AS street, c.City AS city, c.State AS state,
  c.Zip AS zip, c.Phone AS phone, c.CustomerNote AS customerNote,
  c.CustomerUserFlag1 AS spare1, c.CustomerUserFlag2 AS spare2, c.CustomerUserFlag3 AS spare3,
  c.CustomerUserFlag4 AS spare4, c.CustomerUserFlag5 AS spare5, c.CustomerUserFlag6 AS spare6,
  c.CustomerUserFlag7 AS spare7, c.CustomerUserFlag8 AS spare8,
  c.CustomerID AS customerIdValue, c.CustEmail AS customerEmail, c.CustFaxNum AS fax,
  c.CustWebSiteHLink AS website, c.CustCorpWebSiteHLink AS corpWebsite,
  c.CustomerLicenseNumber AS licenseNumber,
  CONVERT(varchar(10), c.CustomerLicenseIssueDate, 101) AS licenseIssueDate,
  CONVERT(varchar(10), c.CustomerLicenseExpDate, 101) AS licenseExpireDate,
  c.InvoiceNote AS invoiceNote, c.CollectionsNote AS collectionsNote,
  c.SmallClaimsFolder AS smallClaimsFolder,
  CONVERT(varchar(10), c.ContractDate, 101) AS contractDate,
  c.HLinkSalesContract AS contractLink,
  CONVERT(varchar(10), c.WCxDate, 101) AS wcDate, CONVERT(varchar(10), c.GLxDate, 101) AS glDate,
  c.HLinkWCxDate AS wcLink, c.HLinkGLxDate AS glLink,
  /*DYNAMIC_CUSTOMER_COLUMNS*/
  CASE WHEN NULLIF(c.HLinkSalesContract, '') IS NULL THEN 'False' ELSE 'True' END AS contractOnFile,
  paymentStatus.PullDownCustPaymentStatus AS paymentStatus,
  whereFound.PullDownWhereCustomerFound AS whereFound,
  ISNULL(c.CustomerNoCommunication, 0) AS noCommunication,


  c.InternetSalesReadyUserName AS internetSalesReadyUser,
  CONVERT(varchar(10), c.InternetSalesReadyTimestamp, 101) AS internetSalesReadyDate,
  ready.PullDownInternetSalesReadyDesc AS internetSalesReady,
  status.PulldownCustStatus AS custStatus,
  salesman.PullDownSalesmanFName + ' ' + salesman.PullDownSalesmanLName AS salesAdmin,
  salesman.PullDownSalesmanFName + ' ' + salesman.PullDownSalesmanLName AS salesman,
  contractWith.PullDownContractWith_PayrollCoInitials AS contractWith,
  contractWith.PullDownContractWith_PayrollCoInitials AS contractWithPayroll,
  salesHistoryStatus.PullDownSalesHistoryStatusDesc AS salesHistoryStatus,
  c.FutureCallUserName AS futureCallUser,
  CONVERT(varchar(10), c.FutureCallTimestamp, 101) AS futureCallUserDate,
  CONVERT(varchar(10), c.FutureCall, 101) AS futureCall,

  CONVERT(varchar(5), c.FutureCallTimestamp, 108) AS futureCallUserTime
FROM tblCustomer c WITH (NOLOCK)
LEFT JOIN tblPullDownCustomerTypes customerType WITH (NOLOCK) ON customerType.PullDownCustomerTypeID = c.CustomerTypeID
LEFT JOIN tblPullDownCustomerProfileTypes profileType WITH (NOLOCK) ON profileType.PullDownCustomerProfileTypeID = c.CustomerProfileTypeID
LEFT JOIN tblPullDownCustPaymentStatus paymentStatus WITH (NOLOCK) ON paymentStatus.PullDownCustPaymentStatusID = c.CustPaymentStatusID
LEFT JOIN tblPullDownWhereCustomerFound whereFound WITH (NOLOCK) ON whereFound.PullDownWhereCustomerFoundID = c.WhereCustomerFoundID
LEFT JOIN tblPullDownInternetSalesReady ready WITH (NOLOCK) ON ready.PullDownInternetSalesReadyID = c.InternetSalesReadyID
LEFT JOIN tblPullDownCustStatus status WITH (NOLOCK) ON status.PulldownCustStatusID = c.CustStatusID
LEFT JOIN tblPullDownSalesman salesman WITH (NOLOCK) ON salesman.PullDownSalesmanID = c.SalesmanID
LEFT JOIN tblPullDownContractWith_PayrollCo contractWith WITH (NOLOCK) ON contractWith.PullDownContractWith_PayrollCoID = c.CustContractWith_PayrollCoID
LEFT JOIN tblPullDownSalesHistoryStatus salesHistoryStatus WITH (NOLOCK) ON salesHistoryStatus.PullDownSalesHistoryStatusID = c.SalesHistoryStatusID
WHERE (@namePattern IS NULL OR c.CustBusName LIKE @namePattern ESCAPE '~')
  AND LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1
  AND c.CustBusName NOT IN ('-', '--', '---')
ORDER BY c.CustBusName, c.CustomerID
OPTION (RECOMPILE)`;

export const CUSTOMER_NAME_WEEKS_SQL = `WITH FirstWeeks AS (
  SELECT COALESCE(c.FlagshipCustomerID, t.CustomerID) AS CustomerID, MIN(t.WeekEndingDate) AS FirstWeek
  FROM tblTracking t WITH (NOLOCK)
  JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID = t.CustomerID
  WHERE ISNULL(t.SatHours, 0) > 0 OR ISNULL(t.SunHours, 0) > 0 OR ISNULL(t.MonHours, 0) > 0
    OR ISNULL(t.TueHours, 0) > 0 OR ISNULL(t.WedHours, 0) > 0 OR ISNULL(t.ThuHours, 0) > 0 OR ISNULL(t.FriHours, 0) > 0
  GROUP BY COALESCE(c.FlagshipCustomerID, t.CustomerID)
), LastWeeks AS (
  SELECT COALESCE(c.FlagshipCustomerID, cw.CustomerID) AS CustomerID, MAX(cw.WeekEndingDate) AS LastWeek,
    MAX(cw.AssignWeek) AS AssignWeek, MAX(cw.AssignYear) AS AssignYear, MAX(cw.InvoiceNum) AS InvoiceNum
  FROM tblCustomerWeeks cw WITH (NOLOCK)
  JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID = cw.CustomerID
  GROUP BY COALESCE(c.FlagshipCustomerID, cw.CustomerID)
), CustomerSince AS (
  SELECT CustomerID, MIN(CustomerSince) AS CustomerSince
  FROM tblQBOpenInvoices WITH (NOLOCK)
  WHERE CustomerSince IS NOT NULL
  GROUP BY CustomerID
)
SELECT COALESCE(fw.CustomerID, lw.CustomerID) AS customerId,
  CONVERT(varchar(10), COALESCE(cs.CustomerSince, fw.FirstWeek), 101) AS customerSince,
  CONVERT(varchar(10), fw.FirstWeek, 101) AS firstWeekEnding,
  CONVERT(varchar(10), lw.LastWeek, 101) AS lastWeekEnding,
  CONVERT(varchar(10), lw.LastWeek, 101) AS weekEnding,
  lw.AssignWeek AS assignWeek, lw.AssignYear AS assignYear, lw.InvoiceNum AS lastInvoiceNumber
FROM FirstWeeks fw FULL OUTER JOIN LastWeeks lw ON lw.CustomerID = fw.CustomerID
LEFT JOIN CustomerSince cs ON cs.CustomerID = COALESCE(fw.CustomerID, lw.CustomerID)`;

export const CUSTOMER_NAME_INVOICE_SUMMARY_SQL = `SELECT q.CustomerID AS customerId,
  CONVERT(varchar(10), MAX(q.InvoiceDate), 101) AS lastInvoiceDate,
  YEAR(MAX(q.InvoiceDate)) AS lastInvoiceYear,
  CONVERT(varchar(10), MIN(q.InvoiceDate), 101) AS oldestInvoiceDate,
  SUM(CASE WHEN q.OpenBalance > 0 THEN q.OpenBalance ELSE 0 END) AS totalOwed
FROM tblQBOpenInvoices q WITH (NOLOCK)
WHERE q.InvoiceDate IS NOT NULL
GROUP BY q.CustomerID`;

export const CUSTOMER_NAME_JOB_COUNTS_SQL = `SELECT p.CustomerID AS customerId, COUNT_BIG(*) AS jobCount
FROM tblProject p WITH (NOLOCK)
GROUP BY p.CustomerID`;

export const CUSTOMER_NAME_CONTACT_COUNTS_SQL = `SELECT cc.CustomerID AS customerId, COUNT_BIG(*) AS contactCount
FROM tblCustomerContacts cc WITH (NOLOCK)
GROUP BY cc.CustomerID`;

export const CUSTOMER_NAME_SALES_PACKAGE_SQL = `WITH Packages AS (
  SELECT sh.CustomerID, sh.CustomerSalesHistoryTimestamp, sh.CustomerSalesHistoryUserName,
    ROW_NUMBER() OVER (PARTITION BY sh.CustomerID ORDER BY sh.CustomerSalesHistoryTimestamp DESC,
      sh.CustomerSalesHistoryID DESC) AS rn
  FROM tblCustomerSalesHistory sh WITH (NOLOCK)
  WHERE sh.CustomerSalesHistoryActionTypeID = -3
)
SELECT CustomerID AS customerId, CONVERT(varchar(10), CustomerSalesHistoryTimestamp, 101) AS salesPackageSent,
  'X' AS salesPackageSentFilter,
  CONVERT(varchar(10), CustomerSalesHistoryTimestamp, 101) AS salesPackageSentDate,
  CustomerSalesHistoryUserName AS salesPackageSentUser
FROM Packages WHERE rn = 1`;

export const CUSTOMER_NAME_ACTIONS_SQL = `WITH Actions AS (
  SELECT sh.CustomerID, sh.CustomerSalesHistoryUserName, sh.CustomerSalesHistoryTimestamp,
    sh.CustomerSalesHistoryActionTypeID, sh.CustomerSalesHistoryNote,
    SUM(CASE WHEN sh.CustomerSalesHistoryActionTypeID NOT IN (-60, -70) THEN 1 ELSE 0 END)
      OVER (PARTITION BY sh.CustomerID) AS ActionCount,
    ROW_NUMBER() OVER (PARTITION BY sh.CustomerID ORDER BY sh.CustomerSalesHistoryTimestamp DESC,
      sh.CustomerSalesHistoryID DESC) AS rn
  FROM tblCustomerSalesHistory sh WITH (NOLOCK)
)
SELECT a.CustomerID AS customerId, a.ActionCount AS act,
  a.CustomerSalesHistoryUserName AS lastActionUser,
  CONVERT(varchar(10), a.CustomerSalesHistoryTimestamp, 101) AS lastActionDate,
  COALESCE(CASE WHEN a.CustomerSalesHistoryActionTypeID > 0 THEN template.EmailTemplate END,
    actionType.PullDownActionTypeDesc, actionType.PullDownActionType) AS lastAction,
  a.CustomerSalesHistoryNote AS lastActionNote
FROM Actions a
LEFT JOIN tblEmailTemplates template WITH (NOLOCK) ON template.EmailTemplateID = a.CustomerSalesHistoryActionTypeID
LEFT JOIN tblPullDownActionTypes actionType WITH (NOLOCK) ON actionType.PullDownActionTypeID = a.CustomerSalesHistoryActionTypeID
WHERE a.rn = 1`;

export const CUSTOMER_NAME_CONTACTS_SQL = `WITH PrimaryContacts AS (
  SELECT cc.*, ROW_NUMBER() OVER (PARTITION BY cc.CustomerID ORDER BY cc.CustomerContactID) AS rn
  FROM tblCustomerContacts cc WITH (NOLOCK)
  WHERE cc.CustomerContactSort = 1
)
SELECT cc.CustomerID AS customerId, cc.CustomerContactFName AS ctcFirst,
  cc.CustomerContactLName AS ctcLast, title.PullDownCustomerContactTitle AS ctcTitle,
  cc.CustomerContactEmail AS ctcEmail, cc.CustomerContactCell AS ctcCell,
  cc.CustomerContactOfficePhone AS ctcOfficePhone, cc.CustomerContactOfficePhone AS contactOffPhone,
  cc.CustomerContactNotes AS ctcNotes,
  cc.CustomerContactKickback AS kickback, cc.CustomerContactKickbackTimes AS kickbackTimes,
  cc.CustomerContactTextMsgAddress AS contactTextMessageAddress,
  cc.CustomerContactCellCarrierID AS contactCellCarrier,
  cc.CustomerContactTitleID AS customerContactTitleId
FROM PrimaryContacts cc
LEFT JOIN tblPullDownCustomerContactTitles title WITH (NOLOCK) ON title.PullDownCustomerContactTitleID = cc.CustomerContactTitleID
WHERE cc.rn = 1`;

export const CUSTOMER_NAME_FUTURE_HISTORY_SQL = `WITH FutureHistory AS (
  SELECT n.CustomerID, STRING_AGG(CONVERT(nvarchar(max), CONCAT(
    CONVERT(varchar(19), n.CustomerFutureCallNoteTimestamp, 120), ' ',
    n.CustomerFutureCallNoteUserName, ': ', n.CustomerFutureCallNote)), CHAR(10))
    WITHIN GROUP (ORDER BY n.CustomerFutureCallNoteTimestamp DESC, n.CustomerFutureCallNoteID DESC) AS History
  FROM tblCustomerFutureCallNotes n WITH (NOLOCK)
  GROUP BY n.CustomerID
)
SELECT CustomerID AS customerId, History AS futureCallHistory FROM FutureHistory`;

/** Latest permit record per customer; permit fields live in their own table. */
export const CUSTOMER_NAME_PERMITS_SQL = `WITH CustomerPermits AS (
  SELECT p.CustomerID, p.CustomerPermitID, p.CustomerPermitStreet, p.CustomerPermitCity, p.CustomerPermitState,
    p.CustomerPermitDate, p.CustomerPermitFee, p.CustomerPermitValue, p.CustomerPermitTimestamp,
    p.CustomerPermitSiteVisit, p.CustomerPermitSiteVisitUserName, p.CustomerPermitSiteVisitTimestamp,
    p.CustomerPermitFutureVisit, p.CustomerPermitFutureVisitUserName, p.CustomerPermitFutureVisitTimestamp,
    COUNT_BIG(*) OVER (PARTITION BY p.CustomerID) AS PermitCount,
    ROW_NUMBER() OVER (PARTITION BY p.CustomerID ORDER BY p.CustomerPermitDate DESC,
      p.CustomerPermitTimestamp DESC, p.CustomerPermitID DESC) AS rn
  FROM tblCustomerPermits p WITH (NOLOCK)
)
SELECT CustomerID AS customerId,
  CONVERT(varchar(10), CustomerPermitDate, 101) AS permitDate,
  CustomerPermitStreet AS permitStreet, CustomerPermitCity AS permitCity, CustomerPermitState AS permitState,
  CustomerPermitFee AS permitFee, CustomerPermitValue AS permitValue,
  CONVERT(varchar(19), CustomerPermitTimestamp, 120) AS permitTimestamp,
  CONVERT(varchar(20), PermitCount) AS permitCards,
  CONVERT(varchar(10), CustomerPermitSiteVisit, 101) AS siteVisitStatus,
  CustomerPermitSiteVisitUserName AS siteVisitUser,
  CONVERT(varchar(10), CustomerPermitSiteVisitTimestamp, 101) AS siteVisitDate,
  CONVERT(varchar(10), CustomerPermitFutureVisit, 101) AS futureVisit,
  CustomerPermitFutureVisitUserName AS futureVisitUser,
  CONVERT(varchar(10), CustomerPermitFutureVisitTimestamp, 101) AS futureVisitDate
FROM CustomerPermits WHERE rn = 1`;

/** Latest customer-history event by action type for the activity presets. */
export const CUSTOMER_NAME_ACTIVITY_SUMMARY_SQL = `WITH CustomerActivities AS (
  SELECT h.CustomerID, h.CustomerSalesHistoryActionTypeID, h.CustomerSalesHistoryUserName,
    h.CustomerSalesHistoryTimestamp,
    ROW_NUMBER() OVER (PARTITION BY h.CustomerID, h.CustomerSalesHistoryActionTypeID
      ORDER BY h.CustomerSalesHistoryTimestamp DESC, h.CustomerSalesHistoryID DESC) AS rn
  FROM tblCustomerSalesHistory h WITH (NOLOCK)
  WHERE h.CustomerSalesHistoryActionTypeID IN (-7, -8, -9, -10, -41, -43)
)
SELECT CustomerID AS customerId,
  MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -7 THEN CustomerSalesHistoryUserName END) AS siteVisitUser,
  CONVERT(varchar(10), MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -7 THEN CustomerSalesHistoryTimestamp END), 101) AS siteVisitDate,
  MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -8 THEN CustomerSalesHistoryUserName END) AS officeVisitUser,
  CONVERT(varchar(10), MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -8 THEN CustomerSalesHistoryTimestamp END), 101) AS officeVisitDate,
  MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -9 THEN CustomerSalesHistoryUserName END) AS coldCallUser,
  CONVERT(varchar(10), MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -9 THEN CustomerSalesHistoryTimestamp END), 101) AS coldCallDate,
  MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -10 THEN CustomerSalesHistoryUserName END) AS outlookEmailUser,
  CONVERT(varchar(10), MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -10 THEN CustomerSalesHistoryTimestamp END), 101) AS outlookEmailDate,
  MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -41 THEN CustomerSalesHistoryUserName END) AS dormantCallUser,
  CONVERT(varchar(10), MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -41 THEN CustomerSalesHistoryTimestamp END), 101) AS dormantCallDate,
  MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -43 THEN CustomerSalesHistoryUserName END) AS mailerUser,
  CONVERT(varchar(10), MAX(CASE WHEN CustomerSalesHistoryActionTypeID = -43 THEN CustomerSalesHistoryTimestamp END), 101) AS mailerDate
FROM CustomerActivities WHERE rn = 1 GROUP BY CustomerID`;

export function toCustomerNameMatch(row: Record<string, unknown>): CustomerNameMatch {
  const result: Record<string, string | boolean> = { customerId: String(row.customerId ?? "").trim() };
  const fixedLabels: Record<string, string> = {
    contactInfoLink: "Contact Info", contactsLink: "Contacts", basicInfoLink: "01", contactsTabLink: "02",
    billRatesLink: "03", insuranceLink: "04", salesLink: "05", collectionsLink: "06",
    customerLink: "07", insuranceClaimsLink: "08", optionsLink: "09", rateMultiplierLink: "10",
    jobsLink: "11", salesHistoryLink: "12",
  };
  for (const column of CUSTOMER_NAME_SEARCH_COLUMNS) {
    result[column.key] = column.key === "noCommunication"
      ? row.noCommunication === true || row.noCommunication === 1
      : String(row[column.key] ?? fixedLabels[column.key] ?? "").trim();
  }
  return result as CustomerNameMatch;
}

export async function loadCustomerNameMatches(namePattern: string | null): Promise<CustomerNameMatch[]> {
  const schema = await queryReadOnly<{ COLUMN_NAME: string }>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tblCustomer'",
  ).catch(() => []);
  const optionalFields = optionalCustomerSelect(new Set(schema.map(row => row.COLUMN_NAME.toLowerCase())));
  const customerSql = CUSTOMER_NAME_SEARCH_SQL.replace("/*DYNAMIC_CUSTOMER_COLUMNS*/", optionalFields ? `${optionalFields},` : "");
  const [rows, weeks, invoices, jobs, contactCounts, salesPackages, actions, contacts, history, permits, activitySummary] = await Promise.all([
    queryReadOnly<Record<string, unknown>>(customerSql, [{ name: "namePattern", value: namePattern }]),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_WEEKS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_INVOICE_SUMMARY_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_JOB_COUNTS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_CONTACT_COUNTS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_SALES_PACKAGE_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_ACTIONS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_CONTACTS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_FUTURE_HISTORY_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_PERMITS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_ACTIVITY_SUMMARY_SQL),
  ]);
  const details = new Map<string, Record<string, unknown>>();
  for (const group of [weeks, invoices, jobs, contactCounts, salesPackages, actions, contacts, history, permits, activitySummary]) {
    for (const row of group) {
      const id = String(row.customerId);
      const merged = details.get(id) ?? {};
      for (const [key, value] of Object.entries(row)) if (value !== null && value !== undefined) merged[key] = value;
      details.set(id, merged);
    }
  }
  return rows.map(row => toCustomerNameMatch({ act: 0, ...row, ...details.get(String(row.customerId)) }));
}
