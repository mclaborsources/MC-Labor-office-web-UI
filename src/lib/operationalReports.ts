import { queryReadOnly } from "@/lib/db/sql";

export type ReportValue = string | number | null;
export type OperationalReportRow = Record<string, ReportValue>;

export function getNoticeOfContractRows() {
  return queryReadOnly<OperationalReportRow>(`WITH ownerCounts AS (
      SELECT ProjectID,COUNT(*) AS OwnerCount FROM tblProjectOwners WITH (NOLOCK) GROUP BY ProjectID
    ), contractorCounts AS (
      SELECT ProjectID,COUNT(*) AS ContractorCount FROM tblProjectGeneralContractors WITH (NOLOCK) GROUP BY ProjectID
    )
    SELECT
    CAST(p.ProjectID AS NVARCHAR(20)) AS id,
    ISNULL(c.CustBusName,'') AS Customer,
    ISNULL(p.NoticeOfContractContractWith,'') AS [Payroll Contract],
    ISNULL(p.SiteName,'') AS Job,
    ISNULL(gc.PullDownGeneralContractorName,'') AS GC,
    ISNULL(gcc.ContractorCount,0) AS [Count of GCs],
    ISNULL(po.ProjectOwnerName,'') AS Owner,
    ISNULL(oc.OwnerCount,0) AS [Count of Owners],
    CONVERT(VARCHAR(10),p.DateNotarized,101) AS [Date Notarized],
    ISNULL(noc.PullDownStatusOfNOC,'') AS [Status of NOC],
    ISNULL(p.ContractAmount,0) AS [Contract Amount],
    ISNULL(p.ContractTotalPayments,0) AS [Total Payments],
    ISNULL(p.ContractBalanceOwed,0) AS [Balance Owed],
    ISNULL(mail.PullDownRegMailResponse,'') AS [Customer Reg Mail Response]
  FROM tblProject p WITH (NOLOCK)
  JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblPullDownStatusOfNOC noc WITH (NOLOCK) ON noc.PullDownStatusOfNOCID=p.StatusOfNOCID
  LEFT JOIN tblPullDownRegMailResponses mail WITH (NOLOCK) ON mail.PullDownRegMailResponseID=p.CustomerRegMailResponseID
  LEFT JOIN tblProjectOwners po WITH (NOLOCK) ON po.ProjectOwnerID=p.ProjectOwnerID
  LEFT JOIN ownerCounts oc ON oc.ProjectID=p.ProjectID
  LEFT JOIN tblProjectGeneralContractors pgc WITH (NOLOCK) ON pgc.ProjectGeneralContractorID=p.ProjectGeneralContractorID
  LEFT JOIN tblPullDownGeneralContractors gc WITH (NOLOCK) ON gc.PullDownGeneralContractorID=pgc.GeneralContractorID
  LEFT JOIN contractorCounts gcc ON gcc.ProjectID=p.ProjectID
  WHERE p.StatusOfNOCID IS NOT NULL AND p.StatusOfNOCID<>4
  ORDER BY c.CustBusName,p.SiteName`);
}

/** The older generic job-orders extract is separate from Access's NOC search record source. */
export function getJobOrdersRows() {
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
  // The Access append query uses qryTracking_ProjectID, but that saved query's
  // definition is absent from the export. Its observed result is a recent-work
  // project set, so keep the app's equivalent scoped to the same 30-day window.
  return queryReadOnly<OperationalReportRow>(`WITH trackedProjects AS (
      SELECT CustomerID,ProjectID,MAX(WeekEndingDate) AS LastWeek,
        MAX(PayrollCoOnSiteInitials) AS PayrollCompany,MAX(AssignmentUserName) AS AssignmentUserName,
        MAX(HoursNote) AS Notes
      FROM tblTracking WITH (NOLOCK)
      WHERE CustomerID IS NOT NULL AND ProjectID IS NOT NULL
      GROUP BY CustomerID,ProjectID
    ), customerSince AS (
      SELECT CustomerID,MIN(WeekEndingDate) AS CustomerSince
      FROM tblCustomerWeeks WITH (NOLOCK) GROUP BY CustomerID
    ), invoiceTotals AS (
      SELECT CustomerID,SUM(ISNULL(OpenBalance,0)) AS TotalOpen,MAX(Aging) AS OldestInvoice
      FROM tblQBOpenInvoices WITH (NOLOCK)
      WHERE CustomerID IS NOT NULL AND TotalDesc IS NOT NULL AND TotalDesc<>'TOTAL'
      GROUP BY CustomerID
    ), weekRevenue AS (
      SELECT CustomerID,SUM(ISNULL(InvoiceAmount,0)) AS Revenue
      FROM tblTracking WITH (NOLOCK)
      WHERE WeekEndingDate=DATEADD(day,-((DATEDIFF(day,'19000105',CAST(GETDATE() AS date))%7+7)%7),CAST(GETDATE() AS date))
      GROUP BY CustomerID
    ), customerTrackingThisWeek AS (
      SELECT DISTINCT CustomerID FROM tblCustomerWeeks WITH (NOLOCK)
      WHERE WeekEndingDate=DATEADD(day,-((DATEDIFF(day,'19000105',CAST(GETDATE() AS date))%7+7)%7),CAST(GETDATE() AS date))
    ), has01Invoice AS (
      SELECT DISTINCT CustomerID FROM tblQBOpenInvoices WITH (NOLOCK)
      WHERE TRY_CONVERT(INT,InvoiceNum)=1 AND CustomerID IS NOT NULL
    ), jobUnpaid AS (
      SELECT t.ProjectID,SUM(ISNULL(t.InvoiceAmount,0)) AS JobUnpaid
      FROM tblTracking t WITH (NOLOCK)
      INNER JOIN tblCustomerWeeks cw WITH (NOLOCK) ON cw.CustomerID=t.CustomerID AND cw.AssignYear=t.AssignYear AND cw.AssignWeek=t.AssignWeek
      INNER JOIN tblQBOpenInvoices q WITH (NOLOCK) ON q.CustomerID=cw.CustomerID AND q.InvoiceYear=cw.InvoiceYear AND q.InvoiceNum=cw.InvoiceNum
      WHERE q.TotalDesc IS NOT NULL AND q.TotalDesc<>'TOTAL'
      GROUP BY t.ProjectID
    )
    SELECT CAST(p.ProjectID AS NVARCHAR(20)) AS id,
      CONVERT(VARCHAR(10),tp.LastWeek,101) AS [Last Week],
      ISNULL(c.CustBusName,'') AS Customer,
      ISNULL(c.State,'') AS State,
      CONVERT(VARCHAR(10),cs.CustomerSince,101) AS [Customer Since],
      ISNULL(cps.PullDownCustPaymentStatus,'') AS [Credit History],
      ISNULL(pc.PullDownContractWith_PayrollCoInitials,'') AS Co,
      ISNULL(p.NOIFlagID,'') AS [NOI Flag],
      ISNULL(c.CustomerNOIColor,0) AS [Customer Color],
      LTRIM(RTRIM(CONCAT(ISNULL(sm.PullDownSalesmanFName,''),' ',ISNULL(sm.PullDownSalesmanLName,'')))) AS Salesman,
      ISNULL(p.SiteName,'') AS Job,
      ISNULL(siteState.PullDownState,'') AS [Job State],
      ISNULL(ls.PullDownLegalStatus,'') AS [Legal Status],
      ISNULL(ju.JobUnpaid,0) AS [Job Unpaid],
      DATEDIFF(DAY,firstWork.FirstWeek,GETDATE()) AS [Age of Job (days)],
      ISNULL(inv.TotalOpen,0) AS [Total Open],
      ISNULL(inv.OldestInvoice,0) AS [Oldest Invoice],
      ISNULL(wr.Revenue,0) AS [Last Week Revenue],
      CASE WHEN ctw.CustomerID IS NULL THEN 'No' ELSE 'Yes' END AS [In Tracking This Week],
      CASE WHEN h01.CustomerID IS NULL THEN 'No' ELSE 'Yes' END AS [Has 01 Invoice],
      CASE WHEN ISNULL(p.NOIFlagID,0)<>0 THEN 'NOI Flag History' ELSE '' END AS History,
      ISNULL(tp.AssignmentUserName,'') AS [User],
      CONVERT(VARCHAR(10),p.StatusOfNOIIDTimestamp,101) AS [Sent on Date],
      CASE WHEN NULLIF(LTRIM(RTRIM(p.NOICustomerDocHLink)),'') IS NULL THEN 'No' ELSE 'Yes' END AS [NOI Sent],
      CASE WHEN NULLIF(LTRIM(RTRIM(p.NOICustomerDocCMTrackerHLink)),'') IS NULL THEN 'No' ELSE 'Yes' END AS [NOI CMT Back],
      CASE WHEN NULLIF(LTRIM(RTRIM(p.NOCCustomerDocHLink)),'') IS NULL THEN 'No' ELSE 'Yes' END AS [NOC Sent],
      CASE WHEN NULLIF(LTRIM(RTRIM(p.NOCCustomerDocCMTrackerHLink)),'') IS NULL THEN 'No' ELSE 'Yes' END AS [NOC CMT Back],
      CASE WHEN p.NOIGCDocHLink IS NOT NULL AND p.NOIGCDocHLink<>'' THEN 'X' ELSE '' END AS [GC-NOI],
      CASE WHEN p.NOCGCDocHLink IS NOT NULL AND p.NOCGCDocHLink<>'' THEN 'X' ELSE '' END AS [GC-NOC],
      CASE WHEN p.NOIOwnerDocHLink IS NOT NULL AND p.NOIOwnerDocHLink<>'' THEN 'X' ELSE '' END AS [OW-NOI],
      CASE WHEN p.NOCOwnerDocHLink IS NOT NULL AND p.NOCOwnerDocHLink<>'' THEN 'X' ELSE '' END AS [OW-NOC],
      ISNULL(p.NOINotes,'') AS Notes
    FROM trackedProjects tp
    INNER JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=tp.ProjectID AND p.CustomerID=tp.CustomerID
    INNER JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
    LEFT JOIN tblPullDownStateCities siteCity WITH (NOLOCK) ON siteCity.PullDownStateCityID=p.SiteStateCityID
    LEFT JOIN tblPullDownStates siteState WITH (NOLOCK) ON siteState.PullDownStateID=siteCity.StateID
    LEFT JOIN tblPullDownCustPaymentStatus cps WITH (NOLOCK) ON cps.PullDownCustPaymentStatusID=c.CustPaymentStatusID
    LEFT JOIN tblPullDownLegalStatus ls WITH (NOLOCK) ON ls.PullDownLegalStatusID=c.LegalStatusID
    LEFT JOIN tblPullDownContractWith_PayrollCo pc WITH (NOLOCK) ON pc.PullDownContractWith_PayrollCoID=c.CustContractWith_PayrollCoID
    LEFT JOIN tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
    LEFT JOIN customerSince cs ON cs.CustomerID=c.CustomerID
    LEFT JOIN invoiceTotals inv ON inv.CustomerID=c.CustomerID
    LEFT JOIN weekRevenue wr ON wr.CustomerID=c.CustomerID
    LEFT JOIN customerTrackingThisWeek ctw ON ctw.CustomerID=c.CustomerID
    LEFT JOIN has01Invoice h01 ON h01.CustomerID=c.CustomerID
    LEFT JOIN jobUnpaid ju ON ju.ProjectID=p.ProjectID
    OUTER APPLY (SELECT MIN(t2.WeekEndingDate) AS FirstWeek FROM tblTracking t2 WITH (NOLOCK) WHERE t2.ProjectID=p.ProjectID) firstWork
    WHERE (c.CustPaymentStatusID<>18 OR c.CustPaymentStatusID IS NULL)
      AND ISNULL(p.StatusOfNOIID,0)<>4
      AND tp.LastWeek>=DATEADD(day,-30,CAST(GETDATE() AS date))
    ORDER BY c.CustBusName,p.SiteName`);
}

export function getWeeklyRateRows(week: number, year: number, payrollCompany = "") {
  return queryReadOnly<OperationalReportRow>(`SELECT
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
    AND (@payrollCompany='' OR ISNULL(PayrollCoOnSiteInitials,'')=@payrollCompany)
  ORDER BY CustomerBusName,SiteName,EmLastName,EmFirstName`, [
    { name: "week", value: week },
    { name: "year", value: year },
    { name: "payrollCompany", value: payrollCompany },
  ]);
}

export function getWeeklyRateRowsForDate(weekEnding: string, payrollCompany: string) {
  return queryReadOnly<OperationalReportRow>(`SELECT
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
  WHERE WeekEndingDate >= CONVERT(date,@weekEnding,23)
    AND WeekEndingDate < DATEADD(day,1,CONVERT(date,@weekEnding,23))
    AND (@payrollCompany='' OR ISNULL(PayrollCoOnSiteInitials,'')=@payrollCompany)
  ORDER BY CustomerBusName,SiteName,EmLastName,EmFirstName`, [
    { name: "weekEnding", value: weekEnding },
    { name: "payrollCompany", value: payrollCompany },
  ]);
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
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (1000)
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

export interface OpenInvoiceRow {
  id: string; customerId: string; customer: string; creditHistory: string;
  customerSince: string; contractWith: string; contractWithId: string; salesman: string; salesmanFilter: string; collectionsNote: string;
  invoiceDate: string; invoiceNumber: string; age: number; agingFilter: string; openBalance: number;
  invoiceNote: string;
}

export interface OpenInvoiceFilterOptions {
  contracts: { id: string; label: string }[];
  salesmen: string[];
  aging: string[];
}

/** Dropdown sources mirror the Access combo-box row sources. */
export async function getOpenInvoiceFilterOptions(): Promise<OpenInvoiceFilterOptions> {
  const [contracts, salesmen, aging] = await Promise.all([
    queryReadOnly<{ id: string; label: string }>(`SELECT CAST(PullDownContractWith_PayrollCoID AS NVARCHAR(20)) AS id, PullDownContractWith_PayrollCoInitials AS label
      FROM tblPullDownContractWith_PayrollCo WITH (NOLOCK) ORDER BY PullDownContractWith_PayrollCoInitials`),
    queryReadOnly<{ value: string }>(`SELECT DISTINCT Salesman AS value FROM tblQBOpenInvoices WITH (NOLOCK)
      WHERE Salesman IS NOT NULL ORDER BY Salesman`),
    queryReadOnly<{ value: string }>(`SELECT q.AgingFilter AS value FROM tblQBOpenInvoices q WITH (NOLOCK)
      INNER JOIN tblPullDownAging a WITH (NOLOCK) ON a.PullDownAging=q.AgingFilter
      WHERE q.AgingFilter IS NOT NULL GROUP BY q.AgingFilter ORDER BY MIN(a.PullDownAgingSort),q.AgingFilter`),
  ]);
  return { contracts, salesmen: salesmen.map(row => row.value), aging: aging.map(row => row.value) };
}

/** Current unpaid invoice records, with customer-level AR fields from the office database. */
export function getOpenInvoiceRows(): Promise<OpenInvoiceRow[]> {
  return queryReadOnly<OpenInvoiceRow>(`WITH customer_aging AS (
    SELECT CustomerID, MAX(AgingFilter) AS agingFilter
    FROM tblQBOpenInvoices WITH (NOLOCK)
    GROUP BY CustomerID
  )
  SELECT CAST(q.QBOpenInvoicesID AS NVARCHAR(20)) AS id,
    CAST(q.CustomerID AS NVARCHAR(20)) AS customerId,
    CASE WHEN ISNULL(q.NoQBMatch,0)=1
      THEN COALESCE(NULLIF(q.QBCustomerName,''),NULLIF(q.CustBusName,''),ISNULL(c.CustBusName,''))
      ELSE COALESCE(NULLIF(c.CustBusName,''),NULLIF(q.CustBusName,''),ISNULL(q.QBCustomerName,'')) END AS customer,
    ISNULL(ps.PullDownCustPaymentStatus,'') AS creditHistory,
    ISNULL(CONVERT(VARCHAR(10),q.CustomerSince,101),'') AS customerSince,
    ISNULL(pcw.PullDownContractWith_PayrollCoInitials,'') AS contractWith,
    CAST(ISNULL(cw.CustomerWeekContractWith_PayrollCoID,999) AS NVARCHAR(20)) AS contractWithId,
    ISNULL(q.Salesman,'') AS salesman,
    ISNULL(q.SalesmanFilter,'') AS salesmanFilter,
    COALESCE(NULLIF(q.CollectionsNote,''),NULLIF(hdr.CollectionsNote,''),ISNULL(c.CollectionsNote,'')) AS collectionsNote,
    CONVERT(VARCHAR(10),q.InvoiceDate,101) AS invoiceDate,
    ISNULL(NULLIF(q.RefNumber,''),LTRIM(RTRIM(ISNULL(CAST(q.InvoiceYear AS NVARCHAR(8))+' ','')+ISNULL(q.InvoiceNum,'')))) AS invoiceNumber,
    ISNULL(q.Aging,DATEDIFF(DAY,q.InvoiceDate,GETDATE())) AS age,
    ISNULL(ca.agingFilter,'') AS agingFilter,
    CAST(ISNULL(q.OpenBalance,0) AS DECIMAL(18,2)) AS openBalance,
    COALESCE(NULLIF(q.InvoiceNote,''),NULLIF(c.LastInvoiceNote,''),ISNULL(c.InvoiceNote,'')) AS invoiceNote
  FROM tblQBOpenInvoices q WITH (NOLOCK)
  INNER JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=q.CustomerID
  INNER JOIN customer_aging ca ON ca.CustomerID=q.CustomerID
  LEFT JOIN tblPullDownCustPaymentStatus ps WITH (NOLOCK) ON ps.PullDownCustPaymentStatusID=c.CustPaymentStatusID
  LEFT JOIN tblCustomerWeeks cw WITH (NOLOCK) ON cw.CustomerID=q.CustomerID AND cw.InvoiceYear=q.InvoiceYear AND cw.InvoiceNum=q.InvoiceNum
  LEFT JOIN tblPullDownContractWith_PayrollCo pcw WITH (NOLOCK) ON pcw.PullDownContractWith_PayrollCoID=cw.CustomerWeekContractWith_PayrollCoID
  OUTER APPLY (SELECT TOP (1) h.CollectionsNote FROM tblQBOpenInvoices h WITH (NOLOCK) WHERE h.CustomerID=q.CustomerID AND h.InvoiceDate IS NULL ORDER BY h.QBOpenInvoicesID) hdr
  WHERE q.InvoiceDate IS NOT NULL AND ISNULL(q.OpenBalance,0)>0
    AND ISNULL(c.LegalStatusID,0)<>3
  ORDER BY ISNULL(c.CustBusName,q.QBCustomerName),q.InvoiceDate,q.QBOpenInvoicesID`);
}

export interface SeamusLienSummaryRow {
  id: string; job: string; customer: string;
  customerNoiS: string; customerNoiB: string; customerNocS: string; customerNocB: string;
  gcName: string; gcAddress: string;
  gcNoiS: string; gcNoiB: string; gcNocS: string; gcNocB: string;
  ownerName: string; ownerAddress: string;
  ownerNoiS: string; ownerNoiB: string; ownerNocS: string; ownerNocB: string;
}

/** Mirrors qrySeamusLienSummaryReport_Append, UpdateMisc, and DeleteNoActivity in Access. */
export function getSeamusLienSummaryRows(): Promise<SeamusLienSummaryRow[]> {
  const address = (street: string, city: string, state: string, zip: string) => `LTRIM(RTRIM(CONCAT(
    ISNULL(NULLIF(${street},''),''),
    CASE WHEN NULLIF(${street},'') IS NOT NULL AND (NULLIF(${city},'') IS NOT NULL OR NULLIF(${state},'') IS NOT NULL OR NULLIF(${zip},'') IS NOT NULL) THEN ', ' ELSE '' END,
    ISNULL(NULLIF(${city},''),''),
    CASE WHEN NULLIF(${city},'') IS NOT NULL AND (NULLIF(${state},'') IS NOT NULL OR NULLIF(${zip},'') IS NOT NULL) THEN ', '
         WHEN NULLIF(${city},'') IS NULL AND NULLIF(${street},'') IS NOT NULL AND NULLIF(${state},'') IS NOT NULL THEN ', ' ELSE '' END,
    ISNULL(NULLIF(${state},''),''),
    CASE WHEN NULLIF(${zip},'') IS NOT NULL AND NULLIF(${state},'') IS NOT NULL THEN ' '
         WHEN NULLIF(${zip},'') IS NOT NULL AND (NULLIF(${city},'') IS NOT NULL OR NULLIF(${street},'') IS NOT NULL) THEN ', ' ELSE '' END,
    ISNULL(NULLIF(${zip},''),''))))`;
  const mark = (field: string) => `CASE WHEN p.${field} IS NULL THEN '' ELSE 'X' END`;
  const links = [
    "NOICustomerDocHLink","NOICustomerDocCMTrackerHLink","NOCCustomerDocHLink","NOCCustomerDocCMTrackerHLink",
    "NOIGCDocHLink","NOIGCDocCMTrackerHLink","NOCGCDocHLink","NOCGCDocCMTrackerHLink",
    "NOIOwnerDocHLink","NOIOwnerDocCMTrackerHLink","NOCOwnerDocHLink","NOCOwnerDocCMTrackerHLink",
  ];
  // Access joined every tracking row then used DISTINCT to collapse them back
  // to one project row. EXISTS preserves that logic without the large fan-out
  // and sort over all report columns.
  const query = `SELECT CAST(p.ProjectID AS NVARCHAR(20)) AS id,
    ISNULL(p.SiteName,'') AS job, ISNULL(c.CustBusName,'') AS customer,
    ${mark(links[0])} AS customerNoiS, ${mark(links[1])} AS customerNoiB,
    ${mark(links[2])} AS customerNocS, ${mark(links[3])} AS customerNocB,
    ISNULL(gc.PullDownGeneralContractorName,'') AS gcName,
    ${address("gc.PullDownGeneralContractorStreet","gcCity.City","gcState.PullDownState","gc.PullDownGeneralContractorZip")} AS gcAddress,
    ${mark(links[4])} AS gcNoiS, ${mark(links[5])} AS gcNoiB, ${mark(links[6])} AS gcNocS, ${mark(links[7])} AS gcNocB,
    ISNULL(po.ProjectOwnerName,'') AS ownerName,
    ${address("po.ProjectOwnerStreet","ownerCity.City","ownerState.PullDownState","po.ProjectOwnerZip")} AS ownerAddress,
    ${mark(links[8])} AS ownerNoiS, ${mark(links[9])} AS ownerNoiB, ${mark(links[10])} AS ownerNocS, ${mark(links[11])} AS ownerNocB
  FROM tblProject p WITH (NOLOCK)
  INNER JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblProjectGeneralContractors pgc WITH (NOLOCK) ON pgc.ProjectGeneralContractorID=p.ProjectGeneralContractorID
  LEFT JOIN tblPullDownGeneralContractors gc WITH (NOLOCK) ON gc.PullDownGeneralContractorID=pgc.GeneralContractorID
  LEFT JOIN tblPullDownStateCities gcCity WITH (NOLOCK) ON gcCity.PullDownStateCityID=gc.PullDownGeneralContractorStateCityID
  LEFT JOIN tblPullDownStates gcState WITH (NOLOCK) ON gcState.PullDownStateID=gcCity.StateID
  LEFT JOIN tblProjectOwners po WITH (NOLOCK) ON po.ProjectOwnerID=p.ProjectOwnerID
  LEFT JOIN tblPullDownStateCities ownerCity WITH (NOLOCK) ON ownerCity.PullDownStateCityID=po.ProjectOwnerStateCityID
  LEFT JOIN tblPullDownStates ownerState WITH (NOLOCK) ON ownerState.PullDownStateID=ownerCity.StateID
  WHERE EXISTS (SELECT 1 FROM tblTracking t WITH (NOLOCK) WHERE t.ProjectID=p.ProjectID)
    AND (${links.map(field=>`p.${field} IS NOT NULL`).join(" OR ")})
  ORDER BY job,id`;
  return queryReadOnly<SeamusLienSummaryRow>(query);
}

export function getMarginByWeekRows(startDate = "", endDate = ""){return queryReadOnly<OperationalReportRow>(`WITH recent AS (
  SELECT CustomerWeekID,CustomerID,WeekEndingDate,InvoiceTotal,OpenBalance,InvoiceNum
  FROM tblCustomerWeeks WITH (NOLOCK)
  WHERE (@startDate='' OR WeekEndingDate >= CONVERT(DATE,@startDate))
    AND (@endDate='' OR WeekEndingDate < DATEADD(DAY,1,CONVERT(DATE,@endDate)))
), customer_since AS (
  SELECT CustomerID,MIN(WeekEndingDate) AS CustomerSince
  FROM tblCustomerWeeks WITH (NOLOCK)
  GROUP BY CustomerID
), payroll AS (
  SELECT t.CustomerID,t.WeekEndingDate,SUM(ISNULL(t.TotalHours,0)*ISNULL(t.PayRate,0)) GrossPayroll
  FROM tblTracking t WITH (NOLOCK)
  INNER JOIN (SELECT DISTINCT CustomerID,WeekEndingDate FROM recent) r ON r.CustomerID=t.CustomerID AND r.WeekEndingDate=t.WeekEndingDate
  GROUP BY t.CustomerID,t.WeekEndingDate
)
SELECT CAST(cw.CustomerWeekID AS NVARCHAR(20)) id,CONVERT(VARCHAR(10),cw.WeekEndingDate,101) AS [Week Ending],ISNULL(c.CustBusName,'') Customer,ISNULL(ct.PullDownCustomerType,'') AS [Customer Type],CONVERT(VARCHAR(10),cs.CustomerSince,101) AS [Customer Since],ISNULL(cw.InvoiceTotal,0) AS [Total Invoice],ISNULL(cw.InvoiceTotal,0)-ISNULL(p.GrossPayroll,0) AS [Total Profit],CASE WHEN ISNULL(cw.InvoiceTotal,0)=0 THEN NULL ELSE (ISNULL(cw.InvoiceTotal,0)-ISNULL(p.GrossPayroll,0))*100.0/cw.InvoiceTotal END Margin,LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,''))) Salesman,ISNULL(p.GrossPayroll,0) AS [Gross Payroll],ISNULL(cw.OpenBalance,0) AS [Total Owed],CAST(NULL AS DECIMAL(12,2)) AS [Per Diem],CAST(NULL AS DECIMAL(12,2)) AS [SUB Sales],CAST(NULL AS DECIMAL(12,2)) AS [Employee Sales],CAST(NULL AS DECIMAL(12,2)) AS [Adj Total INV After 20%],CAST(NULL AS DECIMAL(12,2)) AS [Total Referral Cost Paid to Agent]
FROM recent cw JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID LEFT JOIN customer_since cs ON cs.CustomerID=cw.CustomerID LEFT JOIN payroll p ON p.CustomerID=cw.CustomerID AND p.WeekEndingDate=cw.WeekEndingDate LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID ORDER BY cw.WeekEndingDate DESC,c.CustBusName`,[{name:"startDate",value:startDate},{name:"endDate",value:endDate}])}

export function getOshaRows(){return queryReadOnly<OperationalReportRow>(`SELECT TOP (1000) CAST(EmployeeID AS NVARCHAR(20)) id,MAX(ISNULL(EmFirstName,'')) AS [First Name],MAX(ISNULL(EmMiddle,'')) MI,MAX(ISNULL(EmLastName,'')) AS [Last Name],MAX(ISNULL(OSHA10StatusDesc,'')) AS [OSHA Status],MAX(ISNULL(AssignmentUserName,'')) AS [Link Sent User],CONVERT(VARCHAR(19),MAX(AssignmentTimestamp),120) AS [Link Sent Timestamp] FROM tblTracking WITH (NOLOCK) WHERE EmployeeID IS NOT NULL AND NULLIF(OSHA10StatusDesc,'') IS NOT NULL GROUP BY EmployeeID ORDER BY [First Name],[Last Name]`)}

export function getEmployeeAllowanceRows(kind:"Schooling"|"Tools"){return queryReadOnly<OperationalReportRow>(`SELECT TOP (1000) CAST(EmployeeID AS NVARCHAR(20)) id,MAX(ISNULL(EmFirstName,'')) AS [First Name],MAX(ISNULL(EmMiddle,'')) MI,MAX(ISNULL(EmLastName,'')) AS [Last Name],SUM(ISNULL(TotalHours,0)) AS [Tracked Hours],CAST(NULL AS DECIMAL(12,2)) AS [Total ${kind}],CAST(NULL AS DECIMAL(12,2)) AS [Total Used],CAST(NULL AS DECIMAL(12,2)) Balance FROM tblTracking WITH (NOLOCK) WHERE EmployeeID IS NOT NULL GROUP BY EmployeeID ORDER BY [First Name],[Last Name]`)}

export function get401kRows(){return queryReadOnly<OperationalReportRow>(`SELECT TOP (1000) CONCAT(CAST(t.EmployeeID AS NVARCHAR(20)),'-',MAX(ISNULL(t.PayrollCoOnSiteInitials,''))) id,MAX(ISNULL(t.PayrollCoOnSiteInitials,'')) Pay,MAX(ISNULL(t.EmFirstName,'')) AS [First Name],MAX(ISNULL(t.EmMiddle,'')) MI,MAX(ISNULL(t.EmLastName,'')) AS [Last Name],CONVERT(VARCHAR(10),MIN(t.WeekEndingDate),101) AS [Start Date],SUM(ISNULL(t.TotalHours,0)) AS [Total Hours Worked],CONVERT(VARCHAR(10),MAX(t.WeekEndingDate),101) AS [Last Week],MAX(ISNULL(e.EmEmail,'')) Email FROM tblTracking t WITH (NOLOCK) LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID WHERE t.EmployeeID IS NOT NULL GROUP BY t.EmployeeID ORDER BY [First Name],[Last Name]`)}

export function getInsuranceCertificateRows(){return queryReadOnly<OperationalReportRow>(`SELECT TOP (1000) CAST(c.CustomerID AS NVARCHAR(20)) id,ISNULL(c.CustBusName,'') Customer,ISNULL(pc.PullDownContractWith_PayrollCoName,'') AS [Contract With],ISNULL(c.State,'') State,CONVERT(VARCHAR(10),c.GLxDate,101) AS [GL Policy End],CONVERT(VARCHAR(10),c.WCxDate,101) AS [WC Policy End] FROM tblCustomer c WITH (NOLOCK) LEFT JOIN tblPullDownContractWith_PayrollCo pc WITH (NOLOCK) ON pc.PullDownContractWith_PayrollCoID=c.CustContractWith_PayrollCoID WHERE c.GLxDate IS NOT NULL OR c.WCxDate IS NOT NULL ORDER BY c.CustBusName`)}
export function getEmployeeReviewRows(){return queryReadOnly<OperationalReportRow>(`SELECT TOP (1000) CAST(t.EmployeeID AS NVARCHAR(20)) id,MAX(ISNULL(t.EmFirstName,'')) AS [First Name],MAX(ISNULL(t.EmMiddle,'')) MI,MAX(ISNULL(t.EmLastName,'')) AS [Last Name],COUNT(DISTINCT t.TrackingID) AS [Assignment Records],MAX(ISNULL(t.HealthInsuranceDesc,'')) AS [Health Ins Notes],CONVERT(VARCHAR(10),MIN(t.WeekEndingDate),101) AS [First Week Assigned],CONVERT(VARCHAR(10),MAX(t.WeekEndingDate),101) AS [Last Week Assigned],MAX(ISNULL(t.AssignmentUserName,'')) AS [Latest Assignment User],CONVERT(VARCHAR(19),MAX(t.AssignmentTimestamp),120) AS [Latest Assignment Date] FROM tblTracking t WITH (NOLOCK) WHERE t.EmployeeID IS NOT NULL GROUP BY t.EmployeeID ORDER BY [First Name],[Last Name]`)}
export function getJobAddressWccChangeRows(){return queryReadOnly<OperationalReportRow>(`WITH history AS (SELECT t.TrackingID,t.ProjectID,t.CustomerBusName,t.WeekEndingDate,t.SiteName,t.SiteState,t.WCC,LAG(t.SiteName) OVER(PARTITION BY t.ProjectID ORDER BY t.WeekEndingDate,t.TrackingID) OldJobName,LAG(t.SiteState) OVER(PARTITION BY t.ProjectID ORDER BY t.WeekEndingDate,t.TrackingID) OldState,LAG(t.WCC) OVER(PARTITION BY t.ProjectID ORDER BY t.WeekEndingDate,t.TrackingID) OldWCC FROM tblTracking t WITH (NOLOCK) WHERE t.ProjectID IS NOT NULL) SELECT TOP (750) CAST(h.TrackingID AS NVARCHAR(20)) id,ISNULL(h.CustomerBusName,'') Customer,CONVERT(VARCHAR(10),h.WeekEndingDate,101) AS [Change Date],ISNULL(h.OldJobName,'') AS [Old Job Name],ISNULL(h.OldState,'') AS [Old State],ISNULL(h.OldWCC,'') AS [Old WCC],ISNULL(h.SiteName,'') AS [New Job Name],ISNULL(p.SiteStreet,'') AS [New Street],ISNULL(h.SiteState,'') AS [New State],ISNULL(h.WCC,'') AS [New WCC] FROM history h LEFT JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=h.ProjectID WHERE (h.OldJobName IS NOT NULL AND ISNULL(h.OldJobName,'')<>ISNULL(h.SiteName,'')) OR (h.OldState IS NOT NULL AND ISNULL(h.OldState,'')<>ISNULL(h.SiteState,'')) OR (h.OldWCC IS NOT NULL AND ISNULL(h.OldWCC,'')<>ISNULL(h.WCC,'')) ORDER BY h.WeekEndingDate DESC,h.CustomerBusName`)}
export function getWccOnSiteRows(week:number,year:number){return queryReadOnly<OperationalReportRow>(`SELECT ISNULL(WCC,'(Not assigned)') id,ISNULL(WCC,'(Not assigned)') WCC,COUNT(DISTINCT ProjectID) AS [Number of Jobs] FROM tblTracking WITH (NOLOCK) WHERE AssignWeek=@week AND AssignYear=@year GROUP BY WCC ORDER BY WCC`,[{name:"week",value:week},{name:"year",value:year}])}
export function getDirectionsRows(week:number,year:number){return queryReadOnly<OperationalReportRow>(`SELECT TOP (1000) CAST(t.TrackingID AS NVARCHAR(20)) id,ISNULL(t.CustomerBusName,'') Customer,ISNULL(t.SiteName,'') Job,ISNULL(t.EmFirstName,'') AS [First Name],ISNULL(t.EmMiddle,'') MI,ISNULL(t.EmLastName,'') AS [Last Name],CONVERT(VARCHAR(10),t.WeekEndingDate,101) AS [Week Ending],ISNULL(t.JobApplicationStatusDesc,'') AS [Job App Status],ISNULL(t.EmMobilePhone,'') Cell,ISNULL(e.EmEmail,'') Email,ISNULL(t.AssignmentUserName,'') AS [Assigned By],CONVERT(VARCHAR(10),t.AssignmentTimestamp,101) AS [Assignment Date],CASE WHEN ISNULL(t.DirectionsSentEmail,0)<>0 THEN 'E' ELSE '' END E,CASE WHEN ISNULL(t.DirectionsSentText,0)<>0 THEN 'T' ELSE '' END T,CASE WHEN ISNULL(t.DirVerified,0)<>0 THEN 'Y' ELSE 'N' END [Directions Verified] FROM tblTracking t WITH (NOLOCK) LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID WHERE t.AssignWeek=@week AND t.AssignYear=@year ORDER BY t.AssignmentTimestamp DESC,t.CustomerBusName,t.SiteName`,[{name:"week",value:week},{name:"year",value:year}])}
export function getMultipleJobsRows(week:number,year:number){return queryReadOnly<OperationalReportRow>(`WITH multi AS (SELECT EmployeeID FROM tblTracking WITH (NOLOCK) WHERE AssignWeek=@week AND AssignYear=@year AND EmployeeID IS NOT NULL AND ProjectID IS NOT NULL GROUP BY EmployeeID HAVING COUNT(DISTINCT ProjectID)>1) SELECT CAST(t.TrackingID AS NVARCHAR(20)) id,CONVERT(VARCHAR(10),t.WeekEndingDate,101) AS [Week Ending],ISNULL(t.EmFirstName,'') First,ISNULL(t.EmLastName,'') Last,ISNULL(t.EmMiddle,'') MI,ISNULL(t.CustomerBusName,'') Customer,ISNULL(t.SiteName,'') Job FROM tblTracking t WITH (NOLOCK) JOIN multi m ON m.EmployeeID=t.EmployeeID WHERE t.AssignWeek=@week AND t.AssignYear=@year ORDER BY t.EmFirstName,t.EmLastName,t.CustomerBusName,t.SiteName`,[{name:"week",value:week},{name:"year",value:year}])}
