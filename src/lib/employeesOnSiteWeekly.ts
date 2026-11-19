import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface EmployeeOnSiteRow {id:string;employeeId:string;weekEnding:string;company:string;firstName:string;middle:string;lastName:string;cell:string;firstWeek:string;hours:number;customer:string;job:string;salesman:string;status:string;userFlag1:string;userFlag2:string;vax:string;vaxUser:string;vaxDate:string;vaxHistoryCount:number}
export async function getEmployeesOnSiteRows(p:Record<string,string|undefined>){
 p={...p,payrollCompany:p.payrollCompany==='ALL'?'':p.payrollCompany||'IPG'};
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<EmployeeOnSiteRow>(`SELECT CAST(t.TrackingID AS varchar(30)) id,CAST(t.EmployeeID AS varchar(30)) employeeId,
 CONVERT(varchar(10),t.WeekEndingDate,101) weekEnding,ISNULL(t.PayrollCoOnSiteInitials,'') company,
 ISNULL(t.EmFirstName,'') firstName,ISNULL(t.EmMiddle,'') middle,ISNULL(t.EmLastName,'') lastName,ISNULL(t.EmMobilePhone,'') cell,
 CONVERT(varchar(10),h.firstWeek,101) firstWeek,ISNULL(h.hours,0) hours,ISNULL(t.CustomerBusName,'') customer,ISNULL(t.SiteName,'') job,
 CONCAT(LEFT(sm.PullDownSalesmanFName,1),LEFT(sm.PullDownSalesmanLName,1),CASE WHEN CHARINDEX('''',sm.PullDownSalesmanLName)>0 THEN SUBSTRING(sm.PullDownSalesmanLName,CHARINDEX('''',sm.PullDownSalesmanLName)+1,1) ELSE '' END) salesman,
 ISNULL(b.EmployeeUserFlag1,'') userFlag1,ISNULL(b.EmployeeUserFlag2,'') userFlag2,ISNULL(v.PullDownCovid19VaccinationStatus,'') vax,ISNULL(b.Covid19VaccinationStatusIDUserName,'') vaxUser,CONVERT(varchar(10),b.Covid19VaccinationStatusIDTimestamp,101) vaxDate,(SELECT COUNT(*) FROM dbo.tblEmployeeCovid19VaccinationStatusNotes vn WITH (NOLOCK) WHERE vn.EmployeeID=t.EmployeeID) vaxHistoryCount,ISNULL(t.JobApplicationStatusDesc,'') status
 FROM ${scope.tracking} t
 LEFT JOIN dbo.tblEmployeeB b WITH (NOLOCK) ON b.EmployeeID=t.EmployeeID
 LEFT JOIN dbo.tblPullDownCovid19VaccinationStatus v WITH (NOLOCK) ON v.PullDownCovid19VaccinationStatusID=b.Covid19VaccinationStatusID
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
 OUTER APPLY(SELECT MIN(h.WeekEndingDate) firstWeek,SUM(ISNULL(h.TotalHours,0)) hours FROM dbo.tblTracking h WITH (NOLOCK) WHERE h.EmployeeID=t.EmployeeID AND h.ExpenseTypeID IS NULL) h
 WHERE t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
 AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@company='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@company,',') pcChoice WHERE LTRIM(RTRIM(pcChoice.value))=t.PayrollCoOnSiteInitials) OR (@company='IPG + HDE' AND t.PayrollCoOnSiteInitials IN ('IPG','HDE')))
 AND (@year='' OR t.AssignYear=TRY_CONVERT(int,@year))
 ORDER BY t.WeekEndingDate,t.EmFirstName,t.EmLastName,t.TrackingID`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany??""},{name:"year",value:p.assignYear||""}]);
}
