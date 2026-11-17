import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface EmployeeReferralRow {id:string;referrer:string;firstName:string;middle:string;lastName:string;regularHours:number;otHours:number;rate:number;paid:number}
export async function getEmployeeReferralRows(p:Record<string,string|undefined>){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select valid dates.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<EmployeeReferralRow>(`SELECT CONCAT(t.ReferrerEmployeeID,'|',t.EmployeeID,'|',ISNULL(t.EmployeeReferralRatePerHr,0)) id,
 LTRIM(RTRIM(CONCAT(r.EmFirstName,' ',r.EmMiddle,' ',r.EmLastName))) referrer,
 MAX(ISNULL(t.EmFirstName,'')) firstName,MAX(ISNULL(t.EmMiddle,'')) middle,MAX(ISNULL(t.EmLastName,'')) lastName,
 SUM(ISNULL(t.RegularHours,0)) regularHours,SUM(ISNULL(t.OvertimeHours,0)) otHours,
 ISNULL(t.EmployeeReferralRatePerHr,0) rate,
 SUM(ISNULL(t.EmReferralRatePerHrXWorkHoursPaidToReferrerEmployeeNoTax,0)) paid
 FROM ${scope.tracking} t
 LEFT JOIN dbo.tblEmployee r WITH (NOLOCK) ON r.EmployeeID=t.ReferrerEmployeeID
 WHERE t.EmployeeID IS NOT NULL AND t.ReferrerEmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
 AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@company='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@company,',') pcChoice WHERE LTRIM(RTRIM(pcChoice.value))=t.PayrollCoOnSiteInitials))
 AND (@year='' OR t.AssignYear=TRY_CONVERT(int,@year))
 AND (@states='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@states,',') s WHERE LTRIM(RTRIM(s.value))=t.SiteState))
 GROUP BY t.ReferrerEmployeeID,t.EmployeeID,t.EmployeeReferralRatePerHr,r.EmFirstName,r.EmMiddle,r.EmLastName
 ORDER BY referrer,lastName,firstName,rate`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany||""},{name:"year",value:p.assignYear||""},{name:"states",value:p.state||""}]);
}
