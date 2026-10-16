import { queryReadOnly } from "@/lib/db/sql";

export interface TSheetsLinkedRow {
  id: string;
  employeeId: string;
  customer: string;
  salesman: string;
  job: string;
  jobNumber: string;
  payrollCompany: string;
  firstName: string;
  lastName: string;
  cell: string;
  weekEnding: string;
  sat: string;
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  totalHours: string;
  hoursNote: string;
  timesheetLink: string;
  timesheetColor: string;
  textSent: boolean;
}

export interface TSheetsLinkedPage {
  rows: TSheetsLinkedRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface RawRow {
  id: number | string;
  employeeId: number | string | null;
  customer: string | null;
  salesman: string | null;
  job: string | null;
  jobNumber: number | string | null;
  payrollCompany: string | null;
  firstName: string | null;
  lastName: string | null;
  cell: string | null;
  weekEnding: string | null;
  sat: number | string | null;
  sun: number | string | null;
  mon: number | string | null;
  tue: number | string | null;
  wed: number | string | null;
  thu: number | string | null;
  fri: number | string | null;
  totalHours: number | string | null;
  hoursNote: string | null;
  timesheetLink: string | null;
  timesheetColor: string | null;
  textSent: boolean | number | null;
  totalCount: number | string;
}

const PAGE_SIZE = 250;

export async function getLatestTSheetsWeekEnding(): Promise<string | null> {
  const rows = await queryReadOnly<{ weekEnding: string | null }>(
    "SELECT CONVERT(VARCHAR(10),MAX(CAST(WeekEndingDate AS DATE)),23) AS weekEnding FROM tblTracking WITH (NOLOCK) WHERE WeekEndingDate IS NOT NULL",
  );
  return rows[0]?.weekEnding ?? null;
}

export async function getTSheetsLinkedPage(options: {
  startDate: string;
  endDate: string;
  page?: number;
}): Promise<TSheetsLinkedPage> {
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;
  const rows = await queryReadOnly<RawRow>(
    `SELECT t.TrackingID AS id, t.EmployeeID AS employeeId,
       ISNULL(t.CustomerBusName,'') AS customer,
       LTRIM(RTRIM(ISNULL(sm.PullDownSalesmanFName,'')+' '+ISNULL(sm.PullDownSalesmanLName,''))) AS salesman,
       ISNULL(t.SiteName,'') AS job,
       t.ProjectID AS jobNumber,
       ISNULL(t.PayrollCoOnSiteInitials,'') AS payrollCompany,
       ISNULL(t.EmFirstName,'') AS firstName,
       ISNULL(t.EmLastName,'') AS lastName,
       ISNULL(t.EmMobilePhone,'') AS cell,
       CONVERT(VARCHAR(10),t.WeekEndingDate,23) AS weekEnding,
       ISNULL(t.SatHours,0) AS sat, ISNULL(t.SunHours,0) AS sun,
       ISNULL(t.MonHours,0) AS mon, ISNULL(t.TueHours,0) AS tue,
       ISNULL(t.WedHours,0) AS wed, ISNULL(t.ThuHours,0) AS thu,
       ISNULL(t.FriHours,0) AS fri, ISNULL(t.TotalHours,0) AS totalHours,
       ISNULL(t.HoursNote,'') AS hoursNote,
       ISNULL(t.HLinkTimesheetCV,'') AS timesheetLink,
       ISNULL(t.HLinkTimesheetColorCV,'') AS timesheetColor,
       CAST(CASE WHEN ISNULL(t.DirectionsSentText,0)<>0 THEN 1 ELSE 0 END AS bit) AS textSent,
       COUNT_BIG(1) OVER() AS totalCount
     FROM tblTracking t WITH (NOLOCK)
     LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
     LEFT JOIN tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
     WHERE t.WeekEndingDate >= CAST(@startDate AS DATE)
       AND t.WeekEndingDate < DATEADD(day,1,CAST(@endDate AS DATE))
     ORDER BY t.CustomerBusName,t.SiteName,t.EmLastName,t.EmFirstName,t.TrackingID
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
    [
      { name: "startDate", value: options.startDate },
      { name: "endDate", value: options.endDate },
      { name: "offset", value: offset },
      { name: "pageSize", value: PAGE_SIZE },
    ],
  );
  return {
    rows: rows.map((row) => ({
      id: String(row.id ?? ""),
      employeeId: String(row.employeeId ?? ""),
      customer: row.customer?.trim() ?? "",
      salesman: row.salesman?.trim() ?? "",
      job: row.job?.trim() ?? "",
      jobNumber: String(row.jobNumber ?? ""),
      payrollCompany: row.payrollCompany?.trim() ?? "",
      firstName: row.firstName?.trim() ?? "",
      lastName: row.lastName?.trim() ?? "",
      cell: row.cell?.trim() ?? "",
      weekEnding: row.weekEnding?.trim() ?? "",
      sat: String(row.sat ?? ""),
      sun: String(row.sun ?? ""),
      mon: String(row.mon ?? ""),
      tue: String(row.tue ?? ""),
      wed: String(row.wed ?? ""),
      thu: String(row.thu ?? ""),
      fri: String(row.fri ?? ""),
      totalHours: String(row.totalHours ?? ""),
      hoursNote: row.hoursNote?.trim() ?? "",
      timesheetLink: row.timesheetLink?.trim() ?? "",
      timesheetColor: row.timesheetColor?.trim() ?? "",
      textSent: row.textSent === true || row.textSent === 1,
    })),
    total: Number(rows[0]?.totalCount ?? 0),
    page,
    pageSize: PAGE_SIZE,
  };
}
