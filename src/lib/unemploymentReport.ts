import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface UnemploymentRow {id:string;firstName:string;middle:string;lastName:string;regularHours:number;regularPay:number;otHours:number;otPay:number;grossPay:number;adjustedOt:number;sick:number;vacation:number;commissions:number;perDiem:number;payrollFix:number;totalPayrollWc:number;status:string;referralAgency:string;agencyReferralRate:number|null}
export async function getUnemploymentRows(p:Record<string,string|undefined>){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<UnemploymentRow>(`WITH scope AS (
 SELECT t.* FROM ${scope.tracking} t
 WHERE t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND t.EmployeeID IS NOT NULL
 AND (@company='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@company,',') pcChoice WHERE LTRIM(RTRIM(pcChoice.value))=t.PayrollCoOnSiteInitials))
 AND (@year='' OR t.AssignYear=TRY_CONVERT(int,@year))
 AND (@states='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@states,',') s WHERE LTRIM(RTRIM(s.value))=t.SiteState))
 ), work AS (
 SELECT EmployeeID,
 SUM(CASE WHEN ExpenseTypeID IS NULL THEN ISNULL(RegularHours,0) ELSE 0 END) regularHours,
 SUM(CASE WHEN ExpenseTypeID IS NULL THEN ISNULL(RegularHours,0)*ISNULL(PayRate,0) ELSE 0 END) regularPay,
 SUM(CASE WHEN ExpenseTypeID IS NULL THEN ISNULL(OvertimeHours,0) ELSE 0 END) otHours,
 SUM(CASE WHEN ExpenseTypeID IS NULL THEN ISNULL(OvertimeHours,0)*ISNULL(OTPayRate,0) ELSE 0 END) otPay,
 SUM(CASE WHEN ExpenseTypeID IS NULL THEN ISNULL(OvertimeHours,0)*ISNULL(PayRate,0) ELSE 0 END) adjustedOt,
 SUM(CASE WHEN ExpenseTypeID IS NULL THEN ISNULL(EmGrossPayroll,ISNULL(RegularHours,0)*ISNULL(PayRate,0)+ISNULL(OvertimeHours,0)*ISNULL(OTPayRate,0)) ELSE 0 END) grossPay,
 SUM(CASE WHEN ExpenseType='Per Diem' THEN ISNULL(EmGrossPayroll,ISNULL(TotalHours,0)*ISNULL(PayRate,0)) ELSE 0 END) perDiem,
 SUM(CASE WHEN ExpenseType='Commission' THEN ISNULL(EmGrossPayroll,ISNULL(TotalHours,0)*ISNULL(PayRate,0)) ELSE 0 END) expenseCommission,
 SUM(CASE WHEN ExpenseType IN ('Correction','Refund') THEN ISNULL(EmGrossPayroll,ISNULL(TotalHours,0)*ISNULL(PayRate,0)) ELSE 0 END) expenseFix,
 SUM(CASE WHEN ExpenseTypeID IS NULL THEN ISNULL(TotalPayrollWccCode,0) ELSE 0 END) totalPayrollWc
 FROM scope GROUP BY EmployeeID
 ), adjustments AS (
 SELECT a.EmployeeID,
 SUM(CASE WHEN a.EmployeeSickHoursID IS NOT NULL THEN ISNULL(a.PayrollAdjustmentAmount,0) ELSE 0 END) sick,
 SUM(CASE WHEN a.EmployeeVacationHoursID IS NOT NULL THEN ISNULL(a.PayrollAdjustmentAmount,0) ELSE 0 END) vacation,
 SUM(CASE WHEN a.EmployeeAdjustmentID IS NOT NULL AND a.EmployeeSickHoursID IS NULL AND a.EmployeeVacationHoursID IS NULL THEN ISNULL(a.PayrollAdjustmentAmount,0) ELSE 0 END) commissions,
 SUM(CASE WHEN a.EmployeeSickHoursID IS NULL AND a.EmployeeVacationHoursID IS NULL AND a.EmployeeAdjustmentID IS NULL THEN ISNULL(a.PayrollAdjustmentAmount,0) ELSE 0 END) payrollFix
 FROM ${scope.adjustments} a
 LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
 WHERE a.WeekEndingDate>=CONVERT(date,@start,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@company='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@company,',') pcChoice WHERE LTRIM(RTRIM(pcChoice.value))=co.PullDownPayrollCoOnSiteInitials))
 AND (@year='' OR a.AssignYear=TRY_CONVERT(int,@year))
 GROUP BY a.EmployeeID
 ), ids AS (
 SELECT EmployeeID FROM work UNION SELECT EmployeeID FROM adjustments WHERE @states=''
 )
 SELECT CAST(ids.EmployeeID AS varchar(30)) id,ISNULL(e.EmFirstName,'') firstName,ISNULL(e.EmMiddle,'') middle,ISNULL(e.EmLastName,'') lastName,
 ISNULL(w.regularHours,0) regularHours,ISNULL(w.regularPay,0) regularPay,ISNULL(w.otHours,0) otHours,ISNULL(w.otPay,0) otPay,
 ISNULL(w.grossPay,0) grossPay,ISNULL(w.adjustedOt,0) adjustedOt,ISNULL(a.sick,0) sick,ISNULL(a.vacation,0) vacation,
 ISNULL(a.commissions,0)+ISNULL(w.expenseCommission,0) commissions,ISNULL(w.perDiem,0) perDiem,
 ISNULL(a.payrollFix,0)+ISNULL(w.expenseFix,0) payrollFix,ISNULL(w.totalPayrollWc,0) totalPayrollWc,
 ISNULL(latest.JobApplicationStatusDesc,'') status,ISNULL(ra.PullDownReferralAgency,'') referralAgency,COALESCE(latest.AgencyReferralRatePerHr,e.AgencyReferralRatePerHr) agencyReferralRate
 FROM ids LEFT JOIN work w ON w.EmployeeID=ids.EmployeeID
 LEFT JOIN adjustments a ON a.EmployeeID=ids.EmployeeID
 LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=ids.EmployeeID
 OUTER APPLY(SELECT TOP(1) JobApplicationStatusDesc,ReferralAgencyID,AgencyReferralRatePerHr FROM scope WHERE EmployeeID=ids.EmployeeID ORDER BY WeekEndingDate DESC,TrackingID DESC) latest
 LEFT JOIN dbo.tblPullDownReferralAgencies ra WITH (NOLOCK) ON ra.PullDownReferralAgencyID=COALESCE(latest.ReferralAgencyID,e.ReferralAgencyID)
 ORDER BY lastName,firstName`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany||""},{name:"year",value:p.assignYear||""},{name:"states",value:p.state||""}]);
}
