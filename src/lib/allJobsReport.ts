import { queryReadOnly } from "@/lib/db/sql";

export interface AllJobsReportRow {
  projectId: string;
  customer: string;
  salesman: string;
  job: string;
  street: string;
  city: string;
  state: string;
  foreman: string;
  cell: string;
  startTime: string;
  startDate: string;
  instructions: string;
  aRateNote: string;
  officeNote: string;
}

export interface AllJobsReportPage {
  rows: AllJobsReportRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface AllJobsSqlRow {
  ProjectID: number | string | null;
  Customer: string | null;
  Salesman: string | null;
  Job: string | null;
  Street: string | null;
  City: string | null;
  State: string | null;
  Foreman: string | null;
  Cell: string | null;
  StartTime: string | null;
  StartDate: string | null;
  Instructions: string | null;
  ARateNote: string | null;
  OfficeNote: string | null;
}

/** All project rows and the columns shown in Access's All Jobs datasheet. */
export async function getAllJobsReportRows(options: { page?: number; pageSize?: number; customer?: string; job?: string } = {}): Promise<AllJobsReportPage> {
  const pageSize = Math.min(250, Math.max(1, Math.trunc(options.pageSize ?? 100)));
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const offset = (page - 1) * pageSize;
  const customer = options.customer?.trim() ? `%${options.customer.trim()}%` : null;
  const job = options.job?.trim() ? `%${options.job.trim()}%` : null;
  const where = `WHERE (@customer IS NULL OR c.CustBusName LIKE @customer) AND (@job IS NULL OR p.SiteName LIKE @job)`;
  const params = [{ name: "customer", value: customer }, { name: "job", value: job }];
  const countSql = customer === null
    ? `SELECT COUNT_BIG(1) AS Total FROM tblProject p WITH (NOLOCK) WHERE (@job IS NULL OR p.SiteName LIKE @job)`
    : `SELECT COUNT_BIG(1) AS Total FROM tblProject p WITH (NOLOCK) LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID = p.CustomerID ${where}`;
  const [rows, countRows] = await Promise.all([queryReadOnly<AllJobsSqlRow>(`
    WITH RankedJobs AS (
      SELECT p.ProjectID, p.CustomerID, c.CustBusName, c.SalesmanID,
             p.SiteName, p.SiteStreet, p.SiteStateCityID, p.SiteForemanID,
             p.ProjStartTime, p.StartDate, p.ProjNote, p.ARateNote, p.ProjOfficeNote,
             ROW_NUMBER() OVER (ORDER BY c.CustBusName, p.SiteName, p.ProjectID) AS RowNumber
      FROM tblProject p WITH (NOLOCK)
      LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID = p.CustomerID
      ${where}
    ), PagedJobs AS (
      SELECT * FROM RankedJobs WHERE RowNumber BETWEEN @startRow AND @endRow
    )
    SELECT
      p.ProjectID,
      ISNULL(p.CustBusName, '') AS Customer,
      LTRIM(RTRIM(ISNULL(sm.PullDownSalesmanFName, '') + ' ' + ISNULL(sm.PullDownSalesmanLName, ''))) AS Salesman,
      ISNULL(p.SiteName, '') AS Job,
      ISNULL(p.SiteStreet, '') AS Street,
      ISNULL(sc.City, '') AS City,
      ISNULL(st.PullDownState, '') AS State,
      ISNULL(f.CustomerForeman, '') AS Foreman,
      ISNULL(f.CustomerForemanPhone, '') AS Cell,
      ISNULL(CONVERT(VARCHAR(30), p.ProjStartTime), '') AS StartTime,
      ISNULL(CONVERT(VARCHAR(10), p.StartDate, 101), '') AS StartDate,
      ISNULL(p.ProjNote, '') AS Instructions,
      ISNULL(p.ARateNote, '') AS ARateNote,
      ISNULL(p.ProjOfficeNote, '') AS OfficeNote
    FROM PagedJobs p
    LEFT JOIN tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID = p.SalesmanID
    LEFT JOIN tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID = p.SiteStateCityID
    LEFT JOIN tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID = sc.StateID
    LEFT JOIN tblCustomerForeman f WITH (NOLOCK) ON f.CustomerForemanID = p.SiteForemanID
    ORDER BY p.RowNumber
  `, [...params, { name: "startRow", value: offset + 1 }, { name: "endRow", value: offset + pageSize }]),
  queryReadOnly<{ Total: number | string }>(countSql, params)]);

  return { rows: rows.map((row) => ({
    projectId: String(row.ProjectID ?? ""),
    customer: row.Customer?.trim() ?? "",
    salesman: row.Salesman?.trim() ?? "",
    job: row.Job?.trim() ?? "",
    street: row.Street?.trim() ?? "",
    city: row.City?.trim() ?? "",
    state: row.State?.trim() ?? "",
    foreman: row.Foreman?.trim() ?? "",
    cell: row.Cell?.trim() ?? "",
    startTime: row.StartTime?.trim() ?? "",
    startDate: row.StartDate?.trim() ?? "",
    instructions: row.Instructions?.trim() ?? "",
    aRateNote: row.ARateNote?.trim() ?? "",
    officeNote: row.OfficeNote?.trim() ?? "",
  })), total: Number(countRows[0]?.Total ?? 0), page, pageSize };
}
