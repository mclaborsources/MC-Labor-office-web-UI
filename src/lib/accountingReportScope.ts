import {queryReadOnly} from "@/lib/db/sql";
import type {QueryParam} from "@/types/db";
export async function getAccountingReportScope(p:Record<string,string|undefined>){
 const cols=await queryReadOnly<{name:string}>("SELECT name FROM sys.columns WHERE object_id=OBJECT_ID('dbo.tblEmployee')");
 const exclusion=["EmployeeExcludeFromReports","ExcludeFromReports"].find(n=>cols.some(c=>c.name===n));
 const exclude=(employee:string)=>!exclusion||p.noEmployeeExclusions==="true"?"1=1":`NOT EXISTS(SELECT 1 FROM dbo.tblEmployee ace WITH (NOLOCK) WHERE ace.EmployeeID=${employee} AND ISNULL(ace.[${exclusion}],0)<>0)`;
 const employeeState=(employeeId:string)=>`(SELECT TOP(1) COALESCE(NULLIF(LTRIM(RTRIM(ace.EmMailState)),''),acsState.PullDownState) FROM dbo.tblEmployee ace WITH (NOLOCK) LEFT JOIN dbo.tblPullDownStateCities acCity WITH (NOLOCK) ON acCity.PullDownStateCityID=ace.EmMailStateCityID LEFT JOIN dbo.tblPullDownStates acsState WITH (NOLOCK) ON acsState.PullDownStateID=acCity.StateID WHERE ace.EmployeeID=${employeeId})`;
 const state=(alias:string)=>p.addressMode==="employee"?employeeState(alias+".EmployeeID"):`${alias}.SiteState`;
 const trackingWhere=(a:string)=>`(@acYear='' OR ${a}.AssignYear=TRY_CONVERT(int,@acYear))
 AND (@acCompany='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@acCompany,',') acpc WHERE LTRIM(RTRIM(acpc.value))=${a}.PayrollCoOnSiteInitials) OR (@acCompany='IPG + HDE' AND ${a}.PayrollCoOnSiteInitials IN ('IPG','HDE')))
 AND (@acState='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@acState,',') acs WHERE LTRIM(RTRIM(acs.value))=${state(a)}))
 AND (@acCustomer='' OR ${a}.CustomerID=TRY_CONVERT(int,@acCustomer))
 AND (@acJob='' OR ${a}.ProjectID=TRY_CONVERT(int,@acJob))
 AND ${exclude(a+".EmployeeID")}`;
 const tracking=`(SELECT act.* FROM dbo.tblTracking act WITH (NOLOCK) WHERE ${trackingWhere("act")})`;
 const adjustments=`(SELECT aca.* FROM dbo.tblPayrollAdjustments aca WITH (NOLOCK)
 WHERE (@acYear='' OR aca.AssignYear=TRY_CONVERT(int,@acYear))
 AND (@acCompany='' OR EXISTS(SELECT 1 FROM dbo.tblPullDownPayrollCoOnSite acc WHERE acc.PullDownPayrollCoOnSiteID=aca.PayrollAdjustmentPayrollCoOnSiteID AND (EXISTS(SELECT 1 FROM STRING_SPLIT(@acCompany,',') acpc WHERE LTRIM(RTRIM(acpc.value))=acc.PullDownPayrollCoOnSiteInitials) OR (@acCompany='IPG + HDE' AND acc.PullDownPayrollCoOnSiteInitials IN ('IPG','HDE')))))
 AND ${exclude("aca.EmployeeID")}
 AND (@acCustomer='' OR EXISTS(SELECT 1 FROM dbo.tblTracking act WITH (NOLOCK) WHERE act.EmployeeID=aca.EmployeeID AND act.WeekEndingDate=aca.WeekEndingDate AND act.CustomerID=TRY_CONVERT(int,@acCustomer)))
 AND (@acJob='' OR EXISTS(SELECT 1 FROM dbo.tblTracking act WITH (NOLOCK) WHERE act.EmployeeID=aca.EmployeeID AND act.WeekEndingDate=aca.WeekEndingDate AND act.ProjectID=TRY_CONVERT(int,@acJob)))
 AND (@acState='' OR ${p.addressMode==="employee"?
 `EXISTS(SELECT 1 FROM STRING_SPLIT(@acState,',') acs WHERE LTRIM(RTRIM(acs.value))=${employeeState('aca.EmployeeID')})`:
 `EXISTS(SELECT 1 FROM dbo.tblTracking act WITH (NOLOCK) WHERE act.EmployeeID=aca.EmployeeID AND act.WeekEndingDate=aca.WeekEndingDate AND act.PayrollCoOnSiteID=aca.PayrollAdjustmentPayrollCoOnSiteID AND ${trackingWhere("act")})`}))`;
 const customerWeeks=`(SELECT acw.* FROM dbo.tblCustomerWeeks acw WITH (NOLOCK)
 WHERE (@acYear='' OR acw.AssignYear=TRY_CONVERT(int,@acYear))
 AND (@acCustomer='' OR acw.CustomerID=TRY_CONVERT(int,@acCustomer))
 AND ((@acState='' AND @acCompany='' ${!exclusion||p.noEmployeeExclusions==="true"?"":"AND NOT EXISTS(SELECT 1 FROM dbo.tblTracking act WITH (NOLOCK) WHERE act.CustomerID=acw.CustomerID AND act.WeekEndingDate=acw.WeekEndingDate AND NOT ("+exclude("act.EmployeeID")+"))"})
 OR EXISTS(SELECT 1 FROM dbo.tblTracking act WITH (NOLOCK) WHERE act.CustomerID=acw.CustomerID AND act.WeekEndingDate=acw.WeekEndingDate AND ${trackingWhere("act")})))`;
 const params:QueryParam[]=[{name:"acYear",value:p.assignYear||""},{name:"acCompany",value:p.payrollCompany||""},{name:"acState",value:p.state||""},{name:"acCustomer",value:p.customer||""},{name:"acJob",value:p.job||""}];
 return {tracking,adjustments,customerWeeks,params};
}
