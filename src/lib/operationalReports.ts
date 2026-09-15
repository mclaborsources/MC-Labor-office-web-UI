import { queryReadOnly } from "@/lib/db/sql";

export type ReportValue = string | number | null;
export type OperationalReportRow = Record<string, ReportValue>;

export function getNoticeOfContractRows() {
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (500)
    CAST(p.ProjectID AS NVARCHAR(20)) AS id,
    ISNULL(c.CustBusName,'') AS Customer,
    ISNULL(pc.PullDownContractWith_PayrollCoName,'') AS [Payroll Contract],
    ISNULL(p.SiteName,'') AS Job,
    ISNULL(p.GCOnSite,'') AS GC,
    CASE WHEN NULLIF(LTRIM(RTRIM(ISNULL(p.GCOnSite,''))),'') IS NULL THEN 0 ELSE 1 END AS [Count of GCs],
    ISNULL(p.CustomerContact,'') AS Owner,
    CASE WHEN NULLIF(LTRIM(RTRIM(ISNULL(p.CustomerContact,''))),'') IS NULL THEN 0 ELSE 1 END AS [Count of Owners],
    CONVERT(VARCHAR(10),p.StartDate,101) AS [Date Notarized],
    ISNULL(ps.PullDownProjStatus,'') AS [Status of NOC],
    ISNULL(p.ContractAmount,0) AS [Contract Amount],
    ISNULL(p.ContractTotalPayments,0) AS [Total Payments],
    ISNULL(p.ContractBalanceOwed,0) AS [Balance Owed]
  FROM tblProject p WITH (NOLOCK)
  JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblPullDownContractWith_PayrollCo pc WITH (NOLOCK) ON pc.PullDownContractWith_PayrollCoID=c.CustContractWith_PayrollCoID
  LEFT JOIN tblPullDownProjStatus ps WITH (NOLOCK) ON ps.PullDownProjStatusID=p.ProjStatusID
  WHERE ISNULL(p.ContractAmount,0)<>0 OR ISNULL(p.ContractBalanceOwed,0)<>0
  ORDER BY c.CustBusName,p.SiteName`);
}

export function getNoticeOfIdentificationRows() {
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (750)
    CONCAT(CAST(t.CustomerID AS NVARCHAR(20)),'-',CAST(t.ProjectID AS NVARCHAR(20))) AS id,
    CONVERT(VARCHAR(10),MAX(t.WeekEndingDate),101) AS [Last Week],
    MAX(ISNULL(t.CustomerBusName,'')) AS Customer,
    MAX(ISNULL(t.SiteState,'')) AS State,
    CONVERT(VARCHAR(10),MIN(t.WeekEndingDate),101) AS [Customer Since],
    MAX(ISNULL(t.PayrollCoOnSiteInitials,'')) AS Co,
    MAX(ISNULL(t.SiteName,'')) AS Job,
    MAX(ISNULL(t.SiteState,'')) AS [Job State],
    MAX(ISNULL(inv.TotalOpen,0)) AS [Job Unpaid],
    DATEDIFF(DAY,MIN(t.WeekEndingDate),GETDATE()) AS [Age of Job (days)],
    MAX(ISNULL(inv.TotalOpen,0)) AS [Total Open],
    DATEDIFF(DAY,MAX(inv.OldestInvoice),GETDATE()) AS [Oldest Invoice],
    MAX(ISNULL(t.AssignmentUserName,'')) AS [User],
    MAX(ISNULL(t.HoursNote,'')) AS Notes
  FROM tblTracking t WITH (NOLOCK)
  OUTER APPLY (SELECT SUM(ISNULL(cw.OpenBalance,0)) AS TotalOpen, MIN(CASE WHEN ISNULL(cw.OpenBalance,0)>0 THEN cw.WeekEndingDate END) AS OldestInvoice FROM tblCustomerWeeks cw WITH (NOLOCK) WHERE cw.CustomerID=t.CustomerID) inv
  WHERE t.CustomerID IS NOT NULL AND t.ProjectID IS NOT NULL
  GROUP BY t.CustomerID,t.ProjectID
  HAVING MAX(ISNULL(inv.TotalOpen,0))>0
  ORDER BY [Oldest Invoice] DESC`);
}

export function getWeeklyRateRows(week: number, year: number) {
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (750)
    CAST(TrackingID AS NVARCHAR(20)) AS id,
    ISNULL(PayrollCoOnSiteInitials,'') AS Pay,
    LTRIM(RTRIM(ISNULL(CustomerBusName,'')+CASE WHEN NULLIF(SiteName,'') IS NULL THEN '' ELSE ' ('+SiteName+')' END)) AS Customer,
    ISNULL(AssignmentUserName,'') AS [Contract Salesman],
    ISNULL(AssignmentUserName,'') AS [Salesman (Master Control)],
    CONVERT(VARCHAR(10),WeekEndingDate,101) AS [Week Ending Date],
    ISNULL(EmFirstName,'') AS [First Name], ISNULL(EmMiddle,'') AS MI, ISNULL(EmLastName,'') AS [Last Name],
    ISNULL(PayRate,0) AS [Pay Rate], ISNULL(GradeChange,'') AS Grade, ISNULL(BillRate,0) AS [Bill Rate],
    ISNULL(TrackMargin,0) AS Margin,
    ISNULL(BillRate,0)-ISNULL(PayRate,0) AS [Margin $],
    ISNULL(HealthInsuranceDesc,'') AS [Health Ins], ISNULL(CoExpParkingPerHr,0) AS [Travel/Hr],
    ISNULL(ExpenseType,'') AS [Vac/Hr]
  FROM tblTracking WITH (NOLOCK)
  WHERE AssignWeek=@week AND AssignYear=@year
  ORDER BY CustomerBusName,SiteName,EmLastName,EmFirstName`, [{name:"week",value:week},{name:"year",value:year}]);
}

export function getEmployeeBonusRows() {
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (500)
    CAST(EmployeeID AS NVARCHAR(20)) AS id,
    MAX(ISNULL(EmFirstName,'')) AS [First Name], MAX(ISNULL(EmMiddle,'')) AS MI, MAX(ISNULL(EmLastName,'')) AS [Last Name],
    CAST(1.00 AS DECIMAL(10,2)) AS [Rate / Hr], CONVERT(VARCHAR(10),MIN(WeekEndingDate),101) AS [Start Date],
    MAX(ISNULL(GradeChange,'')) AS [Trade of Bonus Exp to Employee],
    '' AS [Bonus Exp to Employee], SUM(ISNULL(TotalHours,0)) AS [Hrs Worked],
    SUM(ISNULL(TotalHours,0)) AS [Total Bonus], CAST(0 AS DECIMAL(10,2)) AS [Total Used],
    SUM(ISNULL(TotalHours,0)) AS Balance,
    LTRIM(RTRIM(MAX(ISNULL(EmFirstName,''))+' '+MAX(ISNULL(EmMiddle,''))+' '+MAX(ISNULL(EmLastName,'')))) AS EmFullName,
    'Work History' AS [Work History], CONVERT(VARCHAR(10),MIN(WeekEndingDate),101) AS [First Date Assigned],
    CONVERT(VARCHAR(10),MAX(WeekEndingDate),101) AS [Last Week Assigned], 'Unpaid' AS [Bonus Exp Status],
    MAX(ISNULL(CustomerBusName,'')) AS [Last Customer Assigned]
  FROM tblTracking WITH (NOLOCK)
  WHERE EmployeeID IS NOT NULL
  GROUP BY EmployeeID
  ORDER BY [Hrs Worked],[Last Name],[First Name]`);
}

export function getSickHoursRows(year: number) {
  return queryReadOnly<OperationalReportRow>(`SELECT
    CONCAT(CAST(EmployeeID AS NVARCHAR(20)),'-',ISNULL(PayrollCoOnSiteInitials,'')) AS id,
    MAX(ISNULL(EmFirstName,'')) AS [First Name], MAX(ISNULL(EmLastName,'')) AS [Last Name], MAX(ISNULL(EmMiddle,'')) AS MI,
    ISNULL(PayrollCoOnSiteInitials,'') AS [Payroll Co], CONVERT(VARCHAR(10),MIN(WeekEndingDate),101) AS [First Date on Job],
    CONVERT(VARCHAR(10),MAX(WeekEndingDate),101) AS [Last Week Assigned], AssignYear AS [Assign Year],
    SUM(ISNULL(TotalHours,0)) AS [Total Hours To Date],
    SUM(ISNULL(SatHours,0)+ISNULL(SunHours,0)+ISNULL(MonHours,0)+ISNULL(TueHours,0)+ISNULL(WedHours,0)+ISNULL(ThuHours,0)+ISNULL(FriHours,0)) AS [Total Reg Hours To Date],
    SUM(CASE WHEN ISNULL(SatHours,0)>0 THEN 1 ELSE 0 END+CASE WHEN ISNULL(SunHours,0)>0 THEN 1 ELSE 0 END+CASE WHEN ISNULL(MonHours,0)>0 THEN 1 ELSE 0 END+CASE WHEN ISNULL(TueHours,0)>0 THEN 1 ELSE 0 END+CASE WHEN ISNULL(WedHours,0)>0 THEN 1 ELSE 0 END+CASE WHEN ISNULL(ThuHours,0)>0 THEN 1 ELSE 0 END+CASE WHEN ISNULL(FriHours,0)>0 THEN 1 ELSE 0 END) AS [Days Worked],
    FLOOR(SUM(ISNULL(TotalHours,0))/32.0) AS [Total Sick Hours Earned],
    FLOOR(SUM(ISNULL(TotalHours,0))/32.0) AS [Balance Owed]
  FROM tblTracking WITH (NOLOCK) WHERE EmployeeID IS NOT NULL AND AssignYear=@year
  GROUP BY EmployeeID,PayrollCoOnSiteInitials,AssignYear ORDER BY [First Name],[Last Name]`,[{name:"year",value:year}]);
}

export function getAttendanceRows(week: number, year: number) {
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (750) CAST(TrackingID AS NVARCHAR(20)) AS id,
    ISNULL(CustomerBusName,'') AS Customer, ISNULL(AssignmentUserName,'') AS Salesman, ISNULL(SiteName,'') AS Job,
    ISNULL(EmFirstName,'') AS [Em First Name],ISNULL(EmLastName,'') AS [Em Last Name],ISNULL(EmMobilePhone,'') AS Cell,
    CONVERT(VARCHAR(10),WeekEndingDate,101) AS [Week Ending],ISNULL(SatStatusFlagID,'') AS [Sat S],ISNULL(SunStatusFlagID,'') AS [Sun S],
    ISNULL(MonStatusFlagID,'') AS Mon,ISNULL(TueStatusFlagID,'') AS Tue,ISNULL(WedStatusFlagID,'') AS Wed,ISNULL(ThuStatusFlagID,'') AS Thu,ISNULL(FriStatusFlagID,'') AS [Fri S],
    ISNULL(AssignmentUserName,'') AS [Assign User],CONVERT(VARCHAR(19),AssignmentTimestamp,120) AS [Assignment Timestamp]
  FROM tblTracking WITH (NOLOCK) WHERE AssignWeek=@week AND AssignYear=@year ORDER BY CustomerBusName,SiteName,EmLastName`,[{name:"week",value:week},{name:"year",value:year}]);
}

export function getPerDiemDestinations(week:number,year:number){return queryReadOnly<{customerId:string;projectId:string;customer:string;job:string}>(`SELECT DISTINCT CAST(CustomerID AS NVARCHAR(20)) customerId,CAST(ProjectID AS NVARCHAR(20)) projectId,ISNULL(CustomerBusName,'') customer,ISNULL(SiteName,'') job FROM tblTracking WITH (NOLOCK) WHERE AssignWeek=@week AND AssignYear=@year AND CustomerID IS NOT NULL AND ProjectID IS NOT NULL ORDER BY customer,job`,[{name:"week",value:week},{name:"year",value:year}]);}
