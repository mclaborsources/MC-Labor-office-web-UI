import { queryReadOnly } from "@/lib/db/sql";

export type ContactReportKind = "invoices" | "verify-hours";

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
}

interface ContactFlagColumn { COLUMN_NAME: string }

function flagColumn(kind: ContactReportKind, columns: ContactFlagColumn[]): string | null {
  const tokens = kind === "invoices" ? ["invoice"] : ["verifyhour", "verifyhours"];
  const match = columns.find(({ COLUMN_NAME }) => {
    const normalized = COLUMN_NAME.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
    return tokens.some((token) => normalized.includes(token));
  });
  return match ? `[${match.COLUMN_NAME.replaceAll("]", "]]")}]` : null;
}

export async function getContactReportRows(kind: ContactReportKind): Promise<ContactReportRow[]> {
  const columns = await queryReadOnly<ContactFlagColumn>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblCustomerContacts'`,
  );
  const flag = flagColumn(kind, columns);
  const contactJoin = flag
    ? `LEFT JOIN tblCustomerContacts cc WITH (NOLOCK) ON cc.CustomerID = c.CustomerID AND ISNULL(cc.${flag}, 0) <> 0`
    : `LEFT JOIN tblCustomerContacts cc WITH (NOLOCK) ON cc.CustomerID = c.CustomerID`;

  return queryReadOnly<ContactReportRow>(
    `WITH customerWeeks AS (
       SELECT CustomerID, MIN(WeekEndingDate) AS CustomerSince,
         MIN(CASE WHEN ISNULL(OpenBalance, 0) > 0 THEN WeekEndingDate END) AS OldestInvoice,
         SUM(CASE WHEN ISNULL(OpenBalance, 0) > 0 THEN OpenBalance ELSE 0 END) AS TotalOwed
       FROM tblCustomerWeeks WITH (NOLOCK) GROUP BY CustomerID
     ), trackingWeeks AS (
       SELECT CustomerID, MAX(WeekEndingDate) AS LastWeek
       FROM tblTracking WITH (NOLOCK) GROUP BY CustomerID
     )
     SELECT TOP (2000)
       CAST(c.CustomerID AS NVARCHAR(20)) AS customerId,
       ISNULL(c.CustBusName, '') AS customer,
       LTRIM(RTRIM(ISNULL(cc.CustomerContactFName, '') + ' ' + ISNULL(cc.CustomerContactLName, ''))) AS contact,
       ISNULL(cc.CustomerContactOfficePhone, '') AS phone,
       ISNULL(cc.CustomerContactCell, '') AS cell,
       ISNULL(cc.CustomerContactEmail, '') AS email,
       LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName, '') + ' ' + ISNULL(s.PullDownSalesmanLName, ''))) AS salesman,
       CONVERT(VARCHAR(10), cw.CustomerSince, 23) AS customerSince,
       CONVERT(VARCHAR(10), tw.LastWeek, 23) AS lastWeekInTracking,
       CONVERT(VARCHAR(10), cw.OldestInvoice, 23) AS oldestInvoice,
       ISNULL(cw.TotalOwed, 0) AS totalOwed
     FROM tblCustomer c WITH (NOLOCK)
     ${contactJoin}
     LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID = c.SalesmanID
     LEFT JOIN customerWeeks cw ON cw.CustomerID = c.CustomerID
     LEFT JOIN trackingWeeks tw ON tw.CustomerID = c.CustomerID
     WHERE LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1
     ORDER BY c.CustBusName, cc.CustomerContactSort, cc.CustomerContactLName`,
  );
}
