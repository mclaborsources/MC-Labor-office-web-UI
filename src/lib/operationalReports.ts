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

export function getInvoicesByWeekRows(){return queryReadOnly<OperationalReportRow>(`SELECT TOP (2000) CAST(cw.CustomerWeekID AS NVARCHAR(20)) id,CONVERT(VARCHAR(10),cw.WeekEndingDate,101) AS [Week Ending],ISNULL(c.CustBusName,'') Customer,ISNULL(ct.PullDownCustomerType,'') AS [Customer Type],LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,''))) Sales,ISNULL(cw.InvoiceNum,'') AS [Invoice No],ISNULL(cw.InvoiceTotal,0) AS [Invoice Total],ISNULL(cw.OpenBalance,0) AS [Open Balance],CASE WHEN cw.Paid<>0 THEN 'Yes' ELSE 'No' END Paid FROM tblCustomerWeeks cw WITH (NOLOCK) JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID ORDER BY cw.WeekEndingDate DESC,c.CustBusName`)}

export function getMarginByWeekRows(){return queryReadOnly<OperationalReportRow>(`WITH payroll AS(SELECT CustomerID,WeekEndingDate,SUM(ISNULL(TotalHours,0)*ISNULL(PayRate,0)) GrossPayroll FROM tblTracking WITH (NOLOCK) GROUP BY CustomerID,WeekEndingDate) SELECT CAST(cw.CustomerWeekID AS NVARCHAR(20)) id,CONVERT(VARCHAR(10),cw.WeekEndingDate,101) AS [Week Ending],ISNULL(c.CustBusName,'') Customer,ISNULL(cw.InvoiceTotal,0) AS [Total Invoice],ISNULL(p.GrossPayroll,0) AS [Gross Payroll],ISNULL(cw.InvoiceTotal,0)-ISNULL(p.GrossPayroll,0) AS [Total Profit],CASE WHEN ISNULL(cw.InvoiceTotal,0)=0 THEN NULL ELSE (ISNULL(cw.InvoiceTotal,0)-ISNULL(p.GrossPayroll,0))*100.0/cw.InvoiceTotal END Margin,LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,''))) Salesman,ISNULL(cw.OpenBalance,0) AS [Total Owed] FROM tblCustomerWeeks cw WITH (NOLOCK) JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID LEFT JOIN payroll p ON p.CustomerID=cw.CustomerID AND p.WeekEndingDate=cw.WeekEndingDate LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID ORDER BY cw.WeekEndingDate DESC,c.CustBusName`)}

export function getOshaRows(){return queryReadOnly<OperationalReportRow>(`SELECT CAST(EmployeeID AS NVARCHAR(20)) id,MAX(ISNULL(EmFirstName,'')) AS [First Name],MAX(ISNULL(EmMiddle,'')) MI,MAX(ISNULL(EmLastName,'')) AS [Last Name],MAX(ISNULL(OSHA10StatusDesc,'')) AS [OSHA Status],MAX(ISNULL(AssignmentUserName,'')) AS [Link Sent User],CONVERT(VARCHAR(19),MAX(AssignmentTimestamp),120) AS [Link Sent Timestamp] FROM tblTracking WITH (NOLOCK) WHERE EmployeeID IS NOT NULL AND NULLIF(OSHA10StatusDesc,'') IS NOT NULL GROUP BY EmployeeID ORDER BY [First Name],[Last Name]`)}

export function getEmployeeAllowanceRows(kind:"Schooling"|"Tools"){return queryReadOnly<OperationalReportRow>(`SELECT CAST(EmployeeID AS NVARCHAR(20)) id,MAX(ISNULL(EmFirstName,'')) AS [First Name],MAX(ISNULL(EmMiddle,'')) MI,MAX(ISNULL(EmLastName,'')) AS [Last Name],SUM(ISNULL(TotalHours,0)) AS [Tracked Hours],CAST(NULL AS DECIMAL(12,2)) AS [Total ${kind}],CAST(NULL AS DECIMAL(12,2)) AS [Total Used],CAST(NULL AS DECIMAL(12,2)) Balance FROM tblTracking WITH (NOLOCK) WHERE EmployeeID IS NOT NULL GROUP BY EmployeeID ORDER BY [First Name],[Last Name]`)}

export function get401kRows(){return queryReadOnly<OperationalReportRow>(`SELECT CONCAT(CAST(t.EmployeeID AS NVARCHAR(20)),'-',MAX(ISNULL(t.PayrollCoOnSiteInitials,''))) id,MAX(ISNULL(t.PayrollCoOnSiteInitials,'')) Pay,MAX(ISNULL(t.EmFirstName,'')) AS [First Name],MAX(ISNULL(t.EmMiddle,'')) MI,MAX(ISNULL(t.EmLastName,'')) AS [Last Name],CONVERT(VARCHAR(10),MIN(t.WeekEndingDate),101) AS [Start Date],SUM(ISNULL(t.TotalHours,0)) AS [Total Hours Worked],CONVERT(VARCHAR(10),MAX(t.WeekEndingDate),101) AS [Last Week],MAX(ISNULL(e.EmEmail,'')) Email FROM tblTracking t WITH (NOLOCK) LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID WHERE t.EmployeeID IS NOT NULL GROUP BY t.EmployeeID ORDER BY [First Name],[Last Name]`)}

export function getInsuranceCertificateRows(){return queryReadOnly<OperationalReportRow>(`SELECT CAST(c.CustomerID AS NVARCHAR(20)) id,ISNULL(c.CustBusName,'') Customer,ISNULL(pc.PullDownContractWith_PayrollCoName,'') AS [Contract With],ISNULL(c.State,'') State,CONVERT(VARCHAR(10),c.GLxDate,101) AS [GL Policy End],CONVERT(VARCHAR(10),c.WCxDate,101) AS [WC Policy End] FROM tblCustomer c WITH (NOLOCK) LEFT JOIN tblPullDownContractWith_PayrollCo pc WITH (NOLOCK) ON pc.PullDownContractWith_PayrollCoID=c.CustContractWith_PayrollCoID WHERE c.GLxDate IS NOT NULL OR c.WCxDate IS NOT NULL ORDER BY c.CustBusName`)}
export function getEmployeeReviewRows(){return queryReadOnly<OperationalReportRow>(`SELECT CAST(t.EmployeeID AS NVARCHAR(20)) id,MAX(ISNULL(t.EmFirstName,'')) AS [First Name],MAX(ISNULL(t.EmMiddle,'')) MI,MAX(ISNULL(t.EmLastName,'')) AS [Last Name],COUNT(DISTINCT t.TrackingID) AS [Assignment Records],MAX(ISNULL(t.HealthInsuranceDesc,'')) AS [Health Ins Notes],CONVERT(VARCHAR(10),MIN(t.WeekEndingDate),101) AS [First Week Assigned],CONVERT(VARCHAR(10),MAX(t.WeekEndingDate),101) AS [Last Week Assigned],MAX(ISNULL(t.AssignmentUserName,'')) AS [Latest Assignment User],CONVERT(VARCHAR(19),MAX(t.AssignmentTimestamp),120) AS [Latest Assignment Date] FROM tblTracking t WITH (NOLOCK) WHERE t.EmployeeID IS NOT NULL GROUP BY t.EmployeeID ORDER BY [First Name],[Last Name]`)}
export function getJobAddressWccChangeRows(){return queryReadOnly<OperationalReportRow>(`WITH history AS (SELECT t.TrackingID,t.ProjectID,t.CustomerBusName,t.WeekEndingDate,t.SiteName,t.SiteState,t.WCC,LAG(t.SiteName) OVER(PARTITION BY t.ProjectID ORDER BY t.WeekEndingDate,t.TrackingID) OldJobName,LAG(t.SiteState) OVER(PARTITION BY t.ProjectID ORDER BY t.WeekEndingDate,t.TrackingID) OldState,LAG(t.WCC) OVER(PARTITION BY t.ProjectID ORDER BY t.WeekEndingDate,t.TrackingID) OldWCC FROM tblTracking t WITH (NOLOCK) WHERE t.ProjectID IS NOT NULL) SELECT TOP (750) CAST(h.TrackingID AS NVARCHAR(20)) id,ISNULL(h.CustomerBusName,'') Customer,CONVERT(VARCHAR(10),h.WeekEndingDate,101) AS [Change Date],ISNULL(h.OldJobName,'') AS [Old Job Name],ISNULL(h.OldState,'') AS [Old State],ISNULL(h.OldWCC,'') AS [Old WCC],ISNULL(h.SiteName,'') AS [New Job Name],ISNULL(p.SiteStreet,'') AS [New Street],ISNULL(h.SiteState,'') AS [New State],ISNULL(h.WCC,'') AS [New WCC] FROM history h LEFT JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=h.ProjectID WHERE (h.OldJobName IS NOT NULL AND ISNULL(h.OldJobName,'')<>ISNULL(h.SiteName,'')) OR (h.OldState IS NOT NULL AND ISNULL(h.OldState,'')<>ISNULL(h.SiteState,'')) OR (h.OldWCC IS NOT NULL AND ISNULL(h.OldWCC,'')<>ISNULL(h.WCC,'')) ORDER BY h.WeekEndingDate DESC,h.CustomerBusName`)}
export function getWccOnSiteRows(week:number,year:number){return queryReadOnly<OperationalReportRow>(`SELECT ISNULL(WCC,'(Not assigned)') id,ISNULL(WCC,'(Not assigned)') WCC,COUNT(DISTINCT ProjectID) AS [Number of Jobs] FROM tblTracking WITH (NOLOCK) WHERE AssignWeek=@week AND AssignYear=@year GROUP BY WCC ORDER BY WCC`,[{name:"week",value:week},{name:"year",value:year}])}
export function getDirectionsRows(week:number,year:number){return queryReadOnly<OperationalReportRow>(`SELECT TOP (1000) CAST(t.TrackingID AS NVARCHAR(20)) id,ISNULL(t.CustomerBusName,'') Customer,ISNULL(t.SiteName,'') Job,ISNULL(t.EmFirstName,'') AS [First Name],ISNULL(t.EmMiddle,'') MI,ISNULL(t.EmLastName,'') AS [Last Name],CONVERT(VARCHAR(10),t.WeekEndingDate,101) AS [Week Ending],ISNULL(t.JobApplicationStatusDesc,'') AS [Job App Status],ISNULL(t.EmMobilePhone,'') Cell,ISNULL(e.EmEmail,'') Email,ISNULL(t.AssignmentUserName,'') AS [Assigned By],CONVERT(VARCHAR(10),t.AssignmentTimestamp,101) AS [Assignment Date],CASE WHEN ISNULL(t.DirectionsSentEmail,0)<>0 THEN 'E' ELSE '' END E,CASE WHEN ISNULL(t.DirectionsSentText,0)<>0 THEN 'T' ELSE '' END T,CASE WHEN ISNULL(t.DirVerified,0)<>0 THEN 'Y' ELSE 'N' END [Directions Verified] FROM tblTracking t WITH (NOLOCK) LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID WHERE t.AssignWeek=@week AND t.AssignYear=@year ORDER BY t.AssignmentTimestamp DESC,t.CustomerBusName,t.SiteName`,[{name:"week",value:week},{name:"year",value:year}])}
export function getMultipleJobsRows(week:number,year:number){return queryReadOnly<OperationalReportRow>(`WITH multi AS (SELECT EmployeeID FROM tblTracking WITH (NOLOCK) WHERE AssignWeek=@week AND AssignYear=@year AND EmployeeID IS NOT NULL AND ProjectID IS NOT NULL GROUP BY EmployeeID HAVING COUNT(DISTINCT ProjectID)>1) SELECT CAST(t.TrackingID AS NVARCHAR(20)) id,CONVERT(VARCHAR(10),t.WeekEndingDate,101) AS [Week Ending],ISNULL(t.EmFirstName,'') First,ISNULL(t.EmLastName,'') Last,ISNULL(t.EmMiddle,'') MI,ISNULL(t.CustomerBusName,'') Customer,ISNULL(t.SiteName,'') Job FROM tblTracking t WITH (NOLOCK) JOIN multi m ON m.EmployeeID=t.EmployeeID WHERE t.AssignWeek=@week AND t.AssignYear=@year ORDER BY t.EmFirstName,t.EmLastName,t.CustomerBusName,t.SiteName`,[{name:"week",value:week},{name:"year",value:year}])}
