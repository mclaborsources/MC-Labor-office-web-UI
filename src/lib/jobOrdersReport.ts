import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface JobOrderReportRow {id:string;employee:string;rate:number;customer:string;job:string;address:string;startTime:string;endDate:string;instructions:string;position:string;startDate:string;wcc:string}
export async function getJobOrderReportRows(p:Record<string,string|undefined>){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select valid dates.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<JobOrderReportRow>(`SELECT CAST(t.TrackingID AS varchar(30)) id,
 LTRIM(RTRIM(CONCAT(t.EmFirstName,' ',t.EmMiddle,' ',t.EmLastName))) employee,ISNULL(t.PayRate,0) rate,
 ISNULL(t.CustomerBusName,'') customer,ISNULL(t.SiteName,'') job,
 LTRIM(RTRIM(CONCAT(t.SiteStreet,' ',t.SiteCity,' ',t.SiteState))) address,
 ISNULL(CAST(pr.ProjStartTime AS varchar(30)),'') startTime,ISNULL(CONVERT(varchar(10),pr.EndDate,101),'') endDate,
 ISNULL(pr.ProjNote,'') instructions,ISNULL(t.GradeChange,'') position,
 ISNULL(CONVERT(varchar(10),pr.StartDate,101),'') startDate,ISNULL(t.WCCDesc,'') wcc
 FROM ${scope.tracking} t LEFT JOIN dbo.tblProject pr WITH (NOLOCK) ON pr.ProjectID=t.ProjectID
 WHERE t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
 AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@customer='' OR t.CustomerID=TRY_CONVERT(int,@customer))
 AND (@job='' OR t.ProjectID=TRY_CONVERT(int,@job))
 AND (@employee='' OR t.EmployeeID=TRY_CONVERT(int,@employee))
 ORDER BY t.CustomerBusName,t.SiteName,t.EmLastName,t.EmFirstName,t.TrackingID`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"customer",value:p.customer||""},{name:"job",value:p.job||""},{name:"employee",value:p.employee||""}]);
}
