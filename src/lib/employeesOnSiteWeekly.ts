import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface EmployeeOnSiteRow {id:string;employeeId:string;weekEnding:string;company:string;firstName:string;middle:string;lastName:string;cell:string;firstWeek:string;hours:number;customer:string;job:string;salesman:string;status:string}
export async function getEmployeesOnSiteRows(p:Record<string,string|undefined>){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<EmployeeOnSiteRow>(`SELECT CAST(t.TrackingID AS varchar(30)) id,CAST(t.EmployeeID AS varchar(30)) employeeId,
 CONVERT(varchar(10),t.WeekEndingDate,101) weekEnding,ISNULL(t.PayrollCoOnSiteInitials,'') company,
 ISNULL(t.EmFirstName,'') firstName,ISNULL(t.EmMiddle,'') middle,ISNULL(t.EmLastName,'') lastName,ISNULL(t.EmMobilePhone,'') cell,
 CONVERT(varchar(10),h.firstWeek,101) firstWeek,ISNULL(h.hours,0) hours,ISNULL(t.CustomerBusName,'') customer,ISNULL(t.SiteName,'') job,
 LTRIM(RTRIM(CONCAT(sm.PullDownSalesmanFName,' ',sm.PullDownSalesmanLName))) salesman,ISNULL(t.JobApplicationStatusDesc,'') status
 FROM ${scope.tracking} t
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
 OUTER APPLY(SELECT MIN(h.WeekEndingDate) firstWeek,SUM(ISNULL(h.TotalHours,0)) hours FROM dbo.tblTracking h WITH (NOLOCK) WHERE h.EmployeeID=t.EmployeeID AND h.ExpenseTypeID IS NULL) h
 WHERE t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
 AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@company='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@company,',') pcChoice WHERE LTRIM(RTRIM(pcChoice.value))=t.PayrollCoOnSiteInitials) OR (@company='IPG + HDE' AND t.PayrollCoOnSiteInitials IN ('IPG','HDE')))
 AND (@year='' OR t.AssignYear=TRY_CONVERT(int,@year))
 ORDER BY t.WeekEndingDate,t.EmLastName,t.EmFirstName,t.TrackingID`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany??""},{name:"year",value:p.assignYear||""}]);
}
