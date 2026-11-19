import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface GrossPayrollWeekRow {id:string;weekEnding:string;company:string;grossPayroll:number}
export async function getGrossPayrollByWeekRows(p:Record<string,string|undefined>){
 // Blank incoming criteria use the report's standard company group; ALL is explicit.
 p={...p,payrollCompany:p.payrollCompany==='ALL'?'':p.payrollCompany||'IPG + HDE'};
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<GrossPayrollWeekRow>(`WITH payroll AS (
 SELECT CAST(t.WeekEndingDate AS date) weekEnding,ISNULL(t.PayrollCoOnSiteInitials,'') company,
 CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END amount
 FROM ${scope.tracking} t
 WHERE t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
 AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 UNION ALL
 SELECT CAST(a.WeekEndingDate AS date),ISNULL(co.PullDownPayrollCoOnSiteInitials,''),ISNULL(sh.EmployeeSickHoursQuantity*sh.EmployeeSickHoursPayRate,0)+ISNULL(vh.EmployeeVacationHoursQuantity*vh.EmployeeVacationHoursPayRate,0)+CASE WHEN ea.EmployeeAdjustmentTypeID IN (1,10) THEN (ISNULL(ea.EmployeeAdjustmentQuantity,0)+1.5*ISNULL(ea.EmployeeAdjustmentOvertimeHours,0))*ISNULL(ea.EmployeeAdjustmentAmount,0) ELSE 0 END
 FROM ${scope.adjustments} a
 LEFT JOIN dbo.tblEmployeeAdjustments ea WITH (NOLOCK) ON ea.EmployeeAdjustmentID=a.EmployeeAdjustmentID
 LEFT JOIN dbo.tblEmployeeSickHours sh WITH (NOLOCK) ON sh.EmployeeSickHoursID=a.EmployeeSickHoursID
 LEFT JOIN dbo.tblEmployeeVacationHours vh WITH (NOLOCK) ON vh.EmployeeVacationHoursID=a.EmployeeVacationHoursID
 LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
 WHERE (a.EmployeeSickHoursID IS NOT NULL OR a.EmployeeVacationHoursID IS NOT NULL OR ea.EmployeeAdjustmentTypeID IN (1,10)) AND a.WeekEndingDate>=CONVERT(date,@start,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 )
 SELECT CONCAT(CONVERT(varchar(10),weekEnding,23),'|',company) id,CONVERT(varchar(10),weekEnding,101) weekEnding,
 company,CAST(SUM(CAST(amount AS decimal(19,4))) AS decimal(19,2)) grossPayroll FROM payroll
 WHERE @company='' OR company=@company OR (@company='IPG + HDE' AND company IN ('IPG','HDE'))
 GROUP BY weekEnding,company ORDER BY CONVERT(date,weekEnding),company`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany??""}]);
}
