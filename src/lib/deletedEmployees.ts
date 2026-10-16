import { queryReadOnly } from "@/lib/db/sql";

export interface DeletedEmployeeRow {
  id: string;
  employeeId: string;
  customer: string;
  salesman: string;
  job: string;
  firstName: string;
  lastName: string;
  cell: string;
  trade: string;
  weekEnding: string;
  payrollCompany: string;
  payrollCompanyId: string;
  semus: string;
  sendLiveCheck: string;
  margin: number | null;
  schoolingPerHr: number | null;
  toolsPerHr: number | null;
  lastWeekAssigned: string;
}

export interface DeletedEmployeesResult {
  rows: DeletedEmployeeRow[];
  currentWeekEnding: string;
  comparisonWeekEnding: string;
}

export async function getDeletedEmployees(comparisonOffset: 1 | 2): Promise<DeletedEmployeesResult> {
  const dates = await queryReadOnly<{ CurrentWeekEnding: string; ComparisonWeekEnding: string }>(
    `WITH weeks AS (
       SELECT WeekEndingDate, DENSE_RANK() OVER (ORDER BY WeekEndingDate DESC) AS rn
       FROM (SELECT DISTINCT CAST(WeekEndingDate AS DATE) WeekEndingDate FROM tblTracking WITH (NOLOCK) WHERE WeekEndingDate IS NOT NULL) d
     )
     SELECT
       CONVERT(VARCHAR(10), DATEADD(DAY,7,MAX(CASE WHEN rn = 1 THEN WeekEndingDate END)), 101) CurrentWeekEnding,
       CONVERT(VARCHAR(10), MAX(CASE WHEN rn = @comparisonRank THEN WeekEndingDate END), 101) ComparisonWeekEnding
     FROM weeks`,
    [{ name: "comparisonRank", value: comparisonOffset }],
  );
  const comparison = dates[0]?.ComparisonWeekEnding ?? "";
  const current = dates[0]?.CurrentWeekEnding ?? "";
  if (!comparison || !current) return { rows: [], currentWeekEnding: current, comparisonWeekEnding: comparison };

  const rows = await queryReadOnly<DeletedEmployeeRow>(
    `WITH last_assigned AS (
       SELECT EmployeeID, MAX(WeekEndingDate) LastWeekAssigned
       FROM tblTracking WITH (NOLOCK)
       WHERE EmployeeID IS NOT NULL
       GROUP BY EmployeeID
     )
     SELECT TOP (2000)
       CAST(t.TrackingID AS NVARCHAR(20)) id,
       CAST(t.EmployeeID AS NVARCHAR(20)) employeeId,
       ISNULL(t.CustomerBusName, '') customer,
       LTRIM(RTRIM(CONCAT(s.PullDownSalesmanFName,' ',s.PullDownSalesmanLName))) salesman,
       ISNULL(t.SiteName, '') job,
       ISNULL(t.EmFirstName, '') firstName,
       ISNULL(t.EmLastName, '') lastName,
       ISNULL(t.EmMobilePhone, '') cell,
       ISNULL(tr.PullDownTrade, '') trade,
       CONVERT(VARCHAR(10), t.WeekEndingDate, 101) weekEnding,
       ISNULL(t.PayrollCoOnSiteInitials, '') payrollCompany,
       CAST(ISNULL(t.PayrollCoOnSiteID, 0) AS NVARCHAR(20)) payrollCompanyId,
       ISNULL(t.Semus, '') semus,
       ISNULL(t.SendLiveCheckColor, '') sendLiveCheck,
       t.TrackMargin margin,t.CoExpSchoolingPerHr schoolingPerHr,t.CoExpToolsPerHr toolsPerHr,
       CONVERT(VARCHAR(10), la.LastWeekAssigned, 101) lastWeekAssigned
     FROM tblTracking t WITH (NOLOCK)
     JOIN last_assigned la ON la.EmployeeID = t.EmployeeID
     LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
     LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID
     LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
     LEFT JOIN tblPullDownTrade tr WITH (NOLOCK) ON tr.PullDownTradeID=e.EmTradeID
     WHERE CAST(t.WeekEndingDate AS DATE) = CAST(@comparisonWeekEnding AS DATE)
       AND t.EmployeeID IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM tblTracking current_week WITH (NOLOCK)
         WHERE current_week.EmployeeID = t.EmployeeID
           AND CAST(current_week.WeekEndingDate AS DATE) = CAST(@currentWeekEnding AS DATE)
       )
     ORDER BY t.EmFirstName,t.EmLastName,t.TrackingID`,
    [
      { name: "comparisonWeekEnding", value: comparison },
      { name: "currentWeekEnding", value: current },
    ],
  );
  return { rows, currentWeekEnding: current, comparisonWeekEnding: comparison };
}
