import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface TrackingReportRow {id:string;values:(string|number)[];company:string;employeeState:string;jobState:string;expense:string;rateJob:boolean}
export async function getTrackingReportRows(p:Record<string,string|undefined>):Promise<TrackingReportRow[]>{
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 const rows=await queryReadOnly<Record<string,unknown>>(`SELECT t.*,t.TrackingID,CONVERT(varchar(10),t.WeekEndingDate,101) weekEnding,
 ISNULL(ct.PullDownCustomerType,'') customerTrade,t.CustomerBusName,t.SiteName,t.SiteCity,t.WCC,t.EmFirstName,t.EmLastName,t.EmMobilePhone,t.GradeChange,t.WCCDesc,t.WccTracking,
 t.RegularHours,t.OvertimeHours,t.PayRate,t.BillRate,t.AssignmentUserName,
 CONVERT(varchar(19),t.AssignmentTimestamp,120) assignmentTimestamp,CONVERT(varchar(10),t.AssignmentTimestamp,101) assignmentDate,CONVERT(varchar(8),t.AssignmentTimestamp,108) assignmentTime,
 t.TotalReferralCostPaidToAgent,t.TotalPayrollWccTracking,t.CalcProfitMargin,t.InvoiceAmount,t.Placeholder,t.JobBeingManned,
 t.PayrollCoOnSiteInitials,t.SiteState,t.WccTracking AS OH,t.WccCode,e.EmState,t.ExpenseType,t.RateJob,ra.PullDownReferralAgency AS agencyName,sm.PullDownSalesmanInitials AS salesmanInitials
 FROM ${scope.tracking} t LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
 LEFT JOIN dbo.tblPullDownReferralAgencies ra WITH (NOLOCK) ON ra.PullDownReferralAgencyID=t.ReferralAgencyID
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
 LEFT JOIN dbo.tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
 WHERE t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@company='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@company,',') pcChoice WHERE LTRIM(RTRIM(pcChoice.value))=t.PayrollCoOnSiteInitials))
 AND (@year='' OR t.AssignYear=TRY_CONVERT(int,@year))
 AND (@states='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@states,',') s WHERE LTRIM(RTRIM(s.value))=t.SiteState))
 ORDER BY t.WeekEndingDate,t.CustomerBusName,t.SiteName,t.EmLastName,t.TrackingID`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany||""},{name:"year",value:p.assignYear||""},{name:"states",value:p.state||""}]);
 const str=(v:unknown)=>String(v??"");
 return rows.map(r=>({id:str(r.TrackingID),company:str(r.PayrollCoOnSiteInitials),employeeState:str(r.EmState),jobState:str(r.SiteState),expense:str(r.ExpenseType),rateJob:!!r.RateJob,
 values:[r.weekEnding,r.customerTrade,r.CustomerBusName,r.SiteName,r.SiteCity,r.WCC,r.EmFirstName,r.EmLastName,r.EmMobilePhone,r.GradeChange,r.WCCDesc,r.WccTracking,r.RegularHours,r.OvertimeHours,r.PayRate,r.BillRate,r.AssignmentUserName,r.assignmentTimestamp,r.assignmentDate,r.assignmentTime,r.TotalReferralCostPaidToAgent,r.TotalPayrollWccTracking,r.CalcProfitMargin,r.InvoiceAmount,r.Placeholder?"Yes":"", "",r.JobBeingManned?"Yes":"",r.SiteState,r.OH,r.WccCode,r.salesmanInitials,"","","","","",r.SickTime,r.CoExpHealthInsPerHr,r.CoExpHolidaysPerHr,r.CoExpVacationPerHr,r.ParkingPerHr,r.SchoolingPerHr,r.ToolsPerHr,r.CoExpTravelPerHr,r.CoExpTravelPerHrXworkHoursPaidToEmployeeNoTax,r.PerDiemPerHr,r.Spare2PerHr,r.ReferrerEmployee,r.EmployeeReferralRatePerHr,r.EmReferralRatePerHrXWorkHoursPaidToReferrerEmployeeNoTax,r.AccumulatedReferralStartDate,r.AccumulatedReferralEmployeeName,r.AccumulatedReferral,r.agencyName,r.AgencyReferralRatePerHr,r.TotalPerDiemBilled,r.GrandTotalBilled,r.TotalBenPerHr,r.TotalBenAndReferralPerHr,r.TotalBenCostsPerWeek,r.TotalReferralAndBenCostPerWeek,r.EmGrossPayroll,r.TotalPayrollWccCode,r.WccTrackingProfit,r.WccCodeProfit,r.PerDiem,r.Commission,r.Mileage,r.WccCode_WccTracking,"Snapshot",...Array(11).fill(""),r.AssignWeek,r.PayrollCoOnSiteInitials,"",r.EmState,r.OTPayRate,"",r.BillRateOT,"","",r.TotalHours,"",r.SatHours,r.SunHours,r.MonHours,r.TueHours,r.WedHours,r.ThuHours,r.FriHours].map(v=>typeof v==="number"?v:str(v))}));
}
