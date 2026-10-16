import { queryReadOnly } from "@/lib/db/sql";
import type { OperationalReportRow } from "@/lib/operationalReports";

export interface YearlyRevenueFilters {
  search?: string; inactiveYears?: number; page?: number; sort?: string; direction?: "asc" | "desc";
}
export interface YearlyRevenueReport {
  rows: OperationalReportRow[]; years: number[]; total: number; page: number;
}
export const YEARLY_REVENUE_PAGE_SIZE = 200;

/** Permanent Access customer records plus customer-week invoices, including customers with no business. */
export async function getYearlyRevenueReport(filters: YearlyRevenueFilters = {}): Promise<YearlyRevenueReport> {
  const range = await queryReadOnly<{ first: number | null; last: number | null }>(`SELECT
    MIN(YEAR(WeekEndingDate)) AS first,MAX(YEAR(WeekEndingDate)) AS last
    FROM dbo.tblCustomerWeeks WITH (NOLOCK) WHERE WeekEndingDate IS NOT NULL`);
  const first = range[0]?.first ?? new Date().getFullYear();
  const last = range[0]?.last ?? first;
  const years = Array.from({ length: last - first + 1 }, (_, index) => first + index);
  const page = Number.isSafeInteger(filters.page) && filters.page! > 0 && filters.page! <= 100000 ? filters.page! : 1;
  const inactiveYears = Number.isInteger(filters.inactiveYears) && filters.inactiveYears! >= 2 && filters.inactiveYears! <= 10 ? filters.inactiveYears! : 0;
  const search = (filters.search ?? "").trim().slice(0, 200);
  const pattern = `%${search.replaceAll("[", "[[]").replaceAll("%", "[%]").replaceAll("_", "[_]")}%`;
  const columnMap: Record<string, string> = {
    Customer: "Customer", Street: "Street", City: "City", State: "State", "Cu Since": "SinceYear",
    "Cust Type": "CustomerType", "S Admin": "SalesAdmin", "Entry Date": "EntryDate",
    "First Week E": "FirstWeek", "Last Week E": "LastWeek",
    ...Object.fromEntries(years.map(year => [String(year), `Revenue${year}`])),
  };
  const requestedSort = filters.sort ?? "Customer";
  const sort = Object.hasOwn(columnMap, requestedSort) ? columnMap[requestedSort] : "Customer";
  const direction = filters.direction === "desc" ? "DESC" : "ASC";
  // Year identifiers are derived only from SQL Server's integer YEAR() values.
  const totals = years.map(year => `SUM(CASE WHEN YEAR(WeekEndingDate)=${year} THEN ISNULL(InvoiceTotal,0) END) AS Revenue${year}`);
  const rows = await queryReadOnly<OperationalReportRow>(`WITH revenue AS (
    SELECT CustomerID,MIN(WeekEndingDate) AS FirstWeek,MAX(WeekEndingDate) AS LastWeek,${totals.join(",")}
    FROM dbo.tblCustomerWeeks WITH (NOLOCK) WHERE WeekEndingDate IS NOT NULL GROUP BY CustomerID
  ), customers AS (
    SELECT c.CustomerID AS CustomerID,ISNULL(c.CustBusName,'') AS Customer,
      ISNULL(c.Street,'') AS Street,ISNULL(c.City,'') AS City,ISNULL(c.State,'') AS State,
      YEAR(r.FirstWeek) AS SinceYear,ISNULL(ct.PullDownCustomerType,'') AS CustomerType,
      LTRIM(RTRIM(CONCAT(s.PullDownSalesmanFName,' ',s.PullDownSalesmanLName))) AS SalesAdmin,
      c.CustEntryTimestamp AS EntryDate,r.FirstWeek,r.LastWeek,
      ${years.map(year => `r.Revenue${year}`).join(",")}
    FROM dbo.tblCustomer c WITH (NOLOCK)
    LEFT JOIN revenue r ON r.CustomerID=c.CustomerID
    LEFT JOIN dbo.tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
    LEFT JOIN dbo.tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID
    WHERE (@search='' OR c.CustBusName LIKE @pattern)
      AND (@inactiveYears=0 OR r.LastWeek IS NULL OR r.LastWeek<DATEADD(YEAR,-@inactiveYears,CAST(GETDATE() AS DATE)))
  )
  SELECT CAST(CustomerID AS NVARCHAR(20)) AS id,Customer,Street,City,State,SinceYear AS [Cu Since],
    CustomerType AS [Cust Type],SalesAdmin AS [S Admin],CONVERT(VARCHAR(10),EntryDate,101) AS [Entry Date],
    CONVERT(VARCHAR(10),FirstWeek,101) AS [First Week E],CONVERT(VARCHAR(10),LastWeek,101) AS [Last Week E],
    ${years.map(year => `Revenue${year} AS [${year}]`).join(",")},COUNT(*) OVER () AS totalRecords
  FROM customers ORDER BY ${sort} ${direction},CustomerID ASC
  OFFSET @offset ROWS FETCH NEXT ${YEARLY_REVENUE_PAGE_SIZE} ROWS ONLY`, [
    { name: "search", value: search }, { name: "pattern", value: pattern },
    { name: "inactiveYears", value: inactiveYears }, { name: "offset", value: (page - 1) * YEARLY_REVENUE_PAGE_SIZE },
  ]);
  if (!rows.length && page > 1) return getYearlyRevenueReport({ ...filters, page: 1 });
  return { rows, years, total: Number(rows[0]?.totalRecords ?? 0), page };
}
