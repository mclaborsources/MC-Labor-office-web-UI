import { queryReadOnly } from "@/lib/db/sql";
import { CUSTOMER_NAME_SEARCH_COLUMNS, type CustomerNameMatch } from "./customerNameSearchColumns";

/** One row per customer; the primary-contact and segmented-week rules follow Access. */
export const CUSTOMER_NAME_SEARCH_SQL = `SELECT c.CustomerID AS customerId, c.CustBusName AS customerName,
  profileType.PullDownCustomerProfileType AS profileType, c.CustEntryUserName AS entryUserName,
  CONVERT(varchar(10), c.CustEntryTimestamp, 101) AS entryDate,
  customerType.PullDownCustomerType AS customerType, c.Street AS street, c.City AS city, c.State AS state,
  ISNULL(c.CustomerNoCommunication, 0) AS noCommunication,


  c.InternetSalesReadyUserName AS internetSalesReadyUser,
  CONVERT(varchar(10), c.InternetSalesReadyTimestamp, 101) AS internetSalesReadyDate,
  ready.PullDownInternetSalesReadyDesc AS internetSalesReady,
  status.PulldownCustStatus AS custStatus, '05' AS salesAdmin,
  c.FutureCallUserName AS futureCallUser,
  CONVERT(varchar(10), c.FutureCallTimestamp, 101) AS futureCallUserDate,
  CONVERT(varchar(10), c.FutureCall, 101) AS futureCall,

  CONVERT(varchar(5), c.FutureCallTimestamp, 108) AS futureCallUserTime
FROM tblCustomer c WITH (NOLOCK)
LEFT JOIN tblPullDownCustomerTypes customerType WITH (NOLOCK) ON customerType.PullDownCustomerTypeID = c.CustomerTypeID
LEFT JOIN tblPullDownCustomerProfileTypes profileType WITH (NOLOCK) ON profileType.PullDownCustomerProfileTypeID = c.CustomerProfileTypeID
LEFT JOIN tblPullDownInternetSalesReady ready WITH (NOLOCK) ON ready.PullDownInternetSalesReadyID = c.InternetSalesReadyID
LEFT JOIN tblPullDownCustStatus status WITH (NOLOCK) ON status.PulldownCustStatusID = c.CustStatusID
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
  SELECT COALESCE(c.FlagshipCustomerID, cw.CustomerID) AS CustomerID, MAX(cw.WeekEndingDate) AS LastWeek
  FROM tblCustomerWeeks cw WITH (NOLOCK)
  JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID = cw.CustomerID
  GROUP BY COALESCE(c.FlagshipCustomerID, cw.CustomerID)
)
SELECT COALESCE(fw.CustomerID, lw.CustomerID) AS customerId,
  CONVERT(varchar(10), fw.FirstWeek, 101) AS firstWeekEnding,
  CONVERT(varchar(10), lw.LastWeek, 101) AS lastWeekEnding
FROM FirstWeeks fw FULL OUTER JOIN LastWeeks lw ON lw.CustomerID = fw.CustomerID`;

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
  cc.CustomerContactEmail AS ctcEmail, cc.CustomerContactCell AS ctcCell
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

export function toCustomerNameMatch(row: Record<string, unknown>): CustomerNameMatch {
  const result: Record<string, string | boolean> = { customerId: String(row.customerId ?? "").trim() };
  for (const column of CUSTOMER_NAME_SEARCH_COLUMNS) {
    result[column.key] = column.key === "noCommunication"
      ? row.noCommunication === true || row.noCommunication === 1
      : String(row[column.key] ?? "").trim();
  }
  return result as CustomerNameMatch;
}

export async function loadCustomerNameMatches(namePattern: string | null): Promise<CustomerNameMatch[]> {
  const [rows, weeks, actions, contacts, history] = await Promise.all([
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_SEARCH_SQL, [{ name: "namePattern", value: namePattern }]),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_WEEKS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_ACTIONS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_CONTACTS_SQL),
    queryReadOnly<Record<string, unknown>>(CUSTOMER_NAME_FUTURE_HISTORY_SQL),
  ]);
  const details = new Map<string, Record<string, unknown>>();
  for (const group of [weeks, actions, contacts, history]) {
    for (const row of group) {
      const id = String(row.customerId);
      details.set(id, { ...details.get(id), ...row });
    }
  }
  return rows.map(row => toCustomerNameMatch({ act: 0, ...row, ...details.get(String(row.customerId)) }));
}
