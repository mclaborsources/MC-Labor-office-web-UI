import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly,queryReadOnlyUncached} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface AccountingPayrollRow {id:string;weekEnding?:string;projectId?:string;customerType?:string;customerAddress?:string;customerPhone?:string;salesContract?:string;jobState?:string;wccCode?:string;expenseTypeId?:string;billRate?:number;referralAgency?:string;employeeId:string;customerId:string;customer:string;job:string;firstName:string;middle:string;lastName:string;company:string;wcc:string;status:string;salesman:string;regularHours:number;regularPay:number;otHours:number;otPay:number;grossPay:number;adjustedOt:number;sick:number;vacation:number;commissions:number;perDiem:number;payrollFix:number;totalPayrollWc:number;sales:number;subSales:number;subs:number;totalRegPay:number}
export async function getAccountingPayrollLedger(p:Record<string,string|undefined>):Promise<AccountingPayrollRow[]>{
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 const read=p.fresh==="true"?queryReadOnlyUncached:queryReadOnly;
 const params=[{name:"employeeName",value:p.employeeName||""},{name:"jobAppStatus",value:p.jobAppStatus||"All"},...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany||""},{name:"year",value:p.assignYear||""},{name:"states",value:p.state||""}];
 const [tracking,adjustments]=await Promise.all([
 read<Record<string,unknown>>(`SELECT CONVERT(varchar(10),t.WeekEndingDate,101) weekEnding,t.ProjectID,t.CustStreet,t.CustCity,t.CustState,t.CustPhone,t.SiteState,t.BillRate,ct.PullDownCustomerType,contract.PullDownContractWith_PayrollCoInitials salesContract,ra.PullDownReferralAgency,t.TrackingID,t.EmployeeID,t.CustomerID,t.CustomerBusName,t.SiteName,t.EmFirstName,t.EmMiddle,t.EmLastName,t.PayrollCoOnSiteInitials,t.WCCDesc,t.WCC,t.JobApplicationStatusDesc,t.ExpenseTypeID,t.ExpenseType,t.EmGrossPayroll,t.TotalHours,t.PayRate,t.RegularHours,t.OvertimeHours,t.OTPayRate,t.TotalPayrollWccCode,t.InvoiceAmount,LTRIM(RTRIM(CONCAT(sm.PullDownSalesmanFName,' ',sm.PullDownSalesmanLName))) salesman
 FROM ${scope.tracking} t
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
 LEFT JOIN dbo.tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
 LEFT JOIN dbo.tblPullDownContractWith_PayrollCo contract WITH (NOLOCK) ON contract.PullDownContractWith_PayrollCoID=c.CustContractWith_PayrollCoID
 LEFT JOIN dbo.tblPullDownReferralAgencies ra WITH (NOLOCK) ON ra.PullDownReferralAgencyID=t.ReferralAgencyID
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
 WHERE t.EmployeeID IS NOT NULL AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))

 AND (@employeeName='' OR CHARINDEX(LOWER(@employeeName),LOWER(CONCAT_WS(' ',NULLIF(t.EmFirstName,''),NULLIF(t.EmMiddle,''),NULLIF(t.EmLastName,''))))>0)
 AND (@jobAppStatus='All' OR (@jobAppStatus='SUB' AND UPPER(LTRIM(RTRIM(ISNULL(t.JobApplicationStatusDesc,''))))='SUB') OR (@jobAppStatus='No SUB' AND UPPER(LTRIM(RTRIM(ISNULL(t.JobApplicationStatusDesc,''))))<>'SUB'))`,params),
 read<Record<string,unknown>>(`SELECT a.PayrollAdjustmentID,a.EmployeeID,a.EmployeeSickHoursID,a.EmployeeVacationHoursID,a.EmployeeAdjustmentID,a.PayrollAdjustmentAmount,e.EmFirstName,e.EmMiddle,e.EmLastName,co.PullDownPayrollCoOnSiteInitials company,latest.status
 FROM ${scope.adjustments} a
 LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=a.EmployeeID
 LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
 OUTER APPLY(SELECT TOP(1) t.JobApplicationStatusDesc status FROM dbo.tblTracking t WITH (NOLOCK)
 WHERE t.EmployeeID=a.EmployeeID AND t.PayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID AND t.WeekEndingDate<=a.WeekEndingDate
 ORDER BY t.WeekEndingDate DESC,t.TrackingID DESC) latest
 WHERE a.EmployeeID IS NOT NULL AND a.WeekEndingDate>=CONVERT(date,@start,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@employeeName='' OR CHARINDEX(LOWER(@employeeName),LOWER(CONCAT_WS(' ',NULLIF(e.EmFirstName,''),NULLIF(e.EmMiddle,''),NULLIF(e.EmLastName,''))))>0)
 AND (@jobAppStatus='All' OR (@jobAppStatus='SUB' AND UPPER(LTRIM(RTRIM(ISNULL(latest.status,''))))='SUB') OR (@jobAppStatus='No SUB' AND UPPER(LTRIM(RTRIM(ISNULL(latest.status,''))))<>'SUB'))`,params)]);
 const n=(v:unknown)=>Number(v||0),s=(v:unknown)=>String(v??"");
 const base=(r:Record<string,unknown>):AccountingPayrollRow=>({id:"",employeeId:s(r.EmployeeID),customerId:"",customer:"",job:"",firstName:s(r.EmFirstName),middle:s(r.EmMiddle),lastName:s(r.EmLastName),company:"",wcc:"",status:"",salesman:"",regularHours:0,regularPay:0,otHours:0,otPay:0,grossPay:0,adjustedOt:0,sick:0,vacation:0,commissions:0,perDiem:0,payrollFix:0,totalPayrollWc:0,sales:0,subSales:0,subs:0,totalRegPay:0});
 const rows=tracking.map(t=>{const r=base(t),work=t.ExpenseTypeID==null;const amount=t.EmGrossPayroll==null?n(t.TotalHours)*n(t.PayRate):n(t.EmGrossPayroll);
 Object.assign(r,{weekEnding:s(t.weekEnding),projectId:s(t.ProjectID),customerType:s(t.PullDownCustomerType),customerAddress:[t.CustStreet,t.CustCity,t.CustState].filter(Boolean).join(", "),customerPhone:s(t.CustPhone),salesContract:s(t.salesContract),jobState:s(t.SiteState),billRate:n(t.BillRate),wccCode:s(t.WCC),expenseTypeId:s(t.ExpenseTypeID),referralAgency:s(t.PullDownReferralAgency),id:"tracking-"+t.TrackingID,customerId:s(t.CustomerID),customer:s(t.CustomerBusName),job:s(t.SiteName),company:s(t.PayrollCoOnSiteInitials),wcc:s(t.WCCDesc||t.WCC),status:s(t.JobApplicationStatusDesc),salesman:s(t.salesman)});
 if(work){r.regularHours=n(t.RegularHours);r.regularPay=r.regularHours*n(t.PayRate);r.otHours=n(t.OvertimeHours);r.otPay=r.otHours*n(t.OTPayRate);r.grossPay=n(t.EmGrossPayroll)||r.regularPay+r.otPay;r.adjustedOt=r.otHours*n(t.PayRate);r.totalPayrollWc=n(t.TotalPayrollWccCode);}
 else if(t.ExpenseType==="Per Diem")r.perDiem=amount;else if(t.ExpenseType==="Commission")r.commissions=amount;else if(["Correction","Refund"].includes(s(t.ExpenseType)))r.payrollFix=amount;
 r.sales=n(t.InvoiceAmount);r.subs=r.status.trim().toUpperCase()==="SUB"?1:0;r.subSales=r.subs?r.sales:0;if(r.subs)r.totalPayrollWc=0;r.totalRegPay=r.grossPay+r.commissions+r.perDiem+r.payrollFix;return r;});
 for(const a of adjustments){const relevant=rows.filter(r=>r.employeeId===s(a.EmployeeID)&&r.company===s(a.company));if(p.state&&p.addressMode!=="employee"&&!relevant.length)continue;
 const r=base(a);r.id="adjustment-"+a.PayrollAdjustmentID;r.company=s(a.company);r.job="Employee-level adjustment";r.customer="Unallocated";r.wcc="Unallocated";r.status=s(a.status)||relevant[0]?.status||"";
 const amount=n(a.PayrollAdjustmentAmount);
 if(a.EmployeeSickHoursID!=null)r.sick=amount;else if(a.EmployeeVacationHoursID!=null)r.vacation=amount;else if(a.EmployeeAdjustmentID!=null)r.commissions=amount;else r.payrollFix=amount;
 r.totalRegPay=amount;rows.push(r);}
 return rows;
}
export function groupPayrollRows(rows:AccountingPayrollRow[],key:(r:AccountingPayrollRow)=>string){
 const groups=new Map<string,AccountingPayrollRow>();
 const numeric=["regularHours","regularPay","otHours","otPay","grossPay","adjustedOt","sick","vacation","commissions","perDiem","payrollFix","totalPayrollWc","sales","subSales","subs","totalRegPay"] as const;
 for(const r of rows){const k=key(r);const prev=groups.get(k);if(!prev)groups.set(k,{...r,id:k});else for(const field of numeric)prev[field]+=r[field];}
 return [...groups.values()];
}
