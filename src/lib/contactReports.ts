import { queryReadOnly, queryReadOnlyUncached } from "@/lib/db/sql";

export type ContactReportKind = "invoices" | "verify-hours";
export type ContactReportSort = "oldestInvoice" | "customer" | "totalOwed" | "customerSince" | "lastWeekInTracking";

export interface ContactReportRow {
  customerId: string;
  customer: string;
  contact: string;
  phone: string;
  cell: string;
  email: string;
  salesman: string;
  customerSince: string;
  lastWeekInTracking: string;
  oldestInvoice: string;
  totalOwed: number;
  filteredTotalOwed: number;
  totalRows: number;
}

interface ContactFlagColumn { COLUMN_NAME: string }
interface ContactReportOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  tracking?: "" | "yes" | "no";
  salesman?: string;
  accountFilter?: string;
  sort?: ContactReportSort;
  descending?: boolean;
}

function flagColumn(kind: ContactReportKind, columns: ContactFlagColumn[]): string | null {
  const tokens = kind === "invoices" ? ["invoice"] : ["verifyhour", "verifyhours"];
  const match = columns.find(({ COLUMN_NAME }) => {
    const normalized = COLUMN_NAME.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
    return tokens.some((token) => normalized.includes(token));
  });
  const safeColumn = match?.COLUMN_NAME.replace(/]/g, "]]" );
  return safeColumn ? `[${safeColumn}]` : null;
}

function reportFrom(flag: string | null) {
  const contactJoin = flag
    ? `LEFT JOIN tblCustomerContacts cc WITH (NOLOCK) ON cc.CustomerID = c.CustomerID AND ISNULL(cc.${flag}, 0) <> 0`
    : `LEFT JOIN tblCustomerContacts cc WITH (NOLOCK) ON cc.CustomerID = c.CustomerID`;
  return `FROM tblCustomer c WITH (NOLOCK)
    ${contactJoin}
    LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID = c.SalesmanID
    LEFT JOIN tblPullDownCreditTermLimits ct WITH (NOLOCK) ON ct.PullDownCreditTermLimitID=c.CreditTermLimitID
    LEFT JOIN customerWeeks cw ON cw.CustomerID = c.CustomerID
    LEFT JOIN trackingWeeks tw ON tw.CustomerID = c.CustomerID`;
}

export async function getContactReportSalesmen(): Promise<string[]> {
  const rows = await queryReadOnly<{ salesman: string }>(`SELECT DISTINCT LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,''))) salesman
    FROM tblCustomer c WITH (NOLOCK) JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID
    WHERE LEN(LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,''))))>0 ORDER BY salesman`);
  return rows.map((row) => row.salesman);
}

export async function getContactReportRows(kind: ContactReportKind, options: ContactReportOptions = {}) {
  const columns = await queryReadOnly<ContactFlagColumn>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblCustomerContacts'`,
  );
  const flag = flagColumn(kind, columns);
  const pageSize = Math.min(500, Math.max(50, Math.trunc(options.pageSize ?? 250)));
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const report = reportFrom(flag);
  const search = (options.search ?? "").trim().slice(0, 120);
  const searchPattern = search ? `%${search.replace(/[~%_[]/g, (character) => `~${character}`)}%` : null;
  const salesman = (options.salesman ?? "").trim().slice(0, 100);
  const where = ["LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1"];
  const params: { name: string; value: string | number | boolean | null }[] = [
    { name: "searchPattern", value: searchPattern },
    { name: "salesman", value: salesman || null },
  ];
  where.push("(@searchPattern IS NULL OR c.CustBusName LIKE @searchPattern ESCAPE '~' OR cc.CustomerContactFName LIKE @searchPattern ESCAPE '~' OR cc.CustomerContactLName LIKE @searchPattern ESCAPE '~' OR cc.CustomerContactEmail LIKE @searchPattern ESCAPE '~' OR cc.CustomerContactOfficePhone LIKE @searchPattern ESCAPE '~' OR cc.CustomerContactCell LIKE @searchPattern ESCAPE '~')");
  where.push("(@salesman IS NULL OR LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,'')))=@salesman)");
  if (options.tracking === "yes") where.push("tw.LastWeek IS NOT NULL");
  if (options.tracking === "no") where.push("tw.LastWeek IS NULL");
  const days = "DATEDIFF(DAY,cw.OldestInvoice,GETDATE())";
  const termDays = "COALESCE(TRY_CONVERT(INT,LEFT(ct.PullDownCreditTermLimit,PATINDEX('%[^0-9]%',ct.PullDownCreditTermLimit+'X')-1)),30)";
  switch (options.accountFilter) {
    case "Money Owed": where.push("ISNULL(cw.TotalOwed,0)>0"); break;
    case "01 Invoice": where.push("cw.OldestInvoice IS NOT NULL"); break;
    case "Up to Term": where.push(`cw.OldestInvoice IS NOT NULL AND ${days}<=${termDays}`); break;
    case "Over Term": where.push(`cw.OldestInvoice IS NOT NULL AND ${days}>${termDays}`); break;
    case "Up to 30": where.push(`cw.OldestInvoice IS NOT NULL AND ${days}<=30`); break;
    case "Over 30": where.push(`cw.OldestInvoice IS NOT NULL AND ${days}>30`); break;
    case "Over 60": where.push(`cw.OldestInvoice IS NOT NULL AND ${days}>60`); break;
    case "Over 90": where.push(`cw.OldestInvoice IS NOT NULL AND ${days}>90`); break;
    case "Over 120": where.push(`cw.OldestInvoice IS NOT NULL AND ${days}>120`); break;
  }

  const orderBy: Record<ContactReportSort, string> = {
    oldestInvoice: "cw.OldestInvoice", customer: "c.CustBusName", totalOwed: "ISNULL(cw.TotalOwed,0)",
    customerSince: "cw.CustomerSince", lastWeekInTracking: "tw.LastWeek",
  };
  const order = orderBy[options.sort ?? "oldestInvoice"] ?? orderBy.oldestInvoice;
  const direction = options.descending ? "DESC" : "ASC";
  const secondaryOrder = options.sort === "customer" ? "cc.CustomerContactSort,cc.CustomerContactLName" : "c.CustBusName,cc.CustomerContactSort,cc.CustomerContactLName";
  const queryStarted = Date.now();
  const rows = await queryReadOnlyUncached<ContactReportRow>(
    `WITH customerWeeks AS (
       SELECT CustomerID, MIN(WeekEndingDate) AS CustomerSince,
         MIN(CASE WHEN ISNULL(OpenBalance, 0) > 0 THEN WeekEndingDate END) AS OldestInvoice,
         SUM(CASE WHEN ISNULL(OpenBalance, 0) > 0 THEN OpenBalance ELSE 0 END) AS TotalOwed
       FROM tblCustomerWeeks WITH (NOLOCK) GROUP BY CustomerID
     ), trackingWeeks AS (
       SELECT CustomerID, MAX(WeekEndingDate) AS LastWeek
       FROM tblTracking WITH (NOLOCK) GROUP BY CustomerID
     )
     SELECT CAST(c.CustomerID AS NVARCHAR(20)) AS customerId,
       ISNULL(c.CustBusName, '') AS customer,
       LTRIM(RTRIM(ISNULL(cc.CustomerContactFName, '') + ' ' + ISNULL(cc.CustomerContactLName, ''))) AS contact,
       ISNULL(cc.CustomerContactOfficePhone, '') AS phone,
       ISNULL(cc.CustomerContactCell, '') AS cell,
       ISNULL(cc.CustomerContactEmail, '') AS email,
       LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName, '') + ' ' + ISNULL(s.PullDownSalesmanLName, ''))) AS salesman,
       CONVERT(VARCHAR(10), cw.CustomerSince, 23) AS customerSince,
       CONVERT(VARCHAR(10), tw.LastWeek, 23) AS lastWeekInTracking,
       CONVERT(VARCHAR(10), cw.OldestInvoice, 23) AS oldestInvoice,
       ISNULL(cw.TotalOwed, 0) AS totalOwed,
       SUM(ISNULL(cw.TotalOwed,0)) OVER() AS filteredTotalOwed,
       COUNT_BIG(1) OVER() AS totalRows
     ${report}
     WHERE ${where.join(" AND ")}
     ORDER BY ${order} ${direction},${secondaryOrder}
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
    [...params, { name: "offset", value: (page - 1) * pageSize }, { name: "pageSize", value: pageSize }],
  );
  return { rows: rows.map((row) => ({ ...row, totalRows: Number(row.totalRows) })), total: Number(rows[0]?.totalRows ?? 0), page, pageSize, queryMs: Date.now() - queryStarted };
}
