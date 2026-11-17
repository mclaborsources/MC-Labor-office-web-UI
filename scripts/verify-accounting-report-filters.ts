import {loadEnvConfig} from "@next/env";loadEnvConfig(process.cwd());
async function main(){
 const {closePool}=await import("../src/lib/db/sql");
 const modules=[
 ["accountingPayrollLedger","getAccountingPayrollLedger"],["unemploymentReport","getUnemploymentRows"],["trackingReport","getTrackingReportRows"],
 ["salesByCustomer","getSalesByCustomerRows"],["salesmanWeekly","getSalesmanWeeklyRows"],["customerHistoryReport","getCustomerHistoryRows"],
 ["grossPayrollByWeek","getGrossPayrollByWeekRows"],["employeesOnSiteWeekly","getEmployeesOnSiteRows"],["invoiceReport","getInvoiceReportRows"],
 ["weeklySalesReport","getWeeklySalesRows"],["newAssignmentsReport","getNewAssignmentRows"],["salesmanReport","getSalesmanReportRows"],
 ["employeeReferralReport","getEmployeeReferralRows"],["jobOrdersReport","getJobOrderReportRows"]];
 const results=[];
 try{for(const [module,fn] of modules){const m=await import("../src/lib/"+module);const p={startDate:"2026-11-07",endDate:"2026-11-13",payrollCompany:"",state:"",noEmployeeExclusions:"true"};
 try{const base=await m[fn](p);
 const year=await m[fn]({...p,assignYear:"1900"});
 if(year.length)throw new Error("Year filter ignored");
 const company=await m[fn]({...p,payrollCompany:"__NO_COMPANY__"});
 if(company.length)throw new Error("Company filter ignored");
 const jobState=await m[fn]({...p,state:"__NO_STATE__",addressMode:"job"});
 const mailState=await m[fn]({...p,state:"__NO_STATE__",addressMode:"employee"});
 if(jobState.length||mailState.length)throw new Error("State filter ignored");
 results.push({module,rows:base.length,passed:true});
 }catch(e){results.push({module,error:(e as Error).message});}
 }
 const p={startDate:"2026-11-07",endDate:"2026-11-13",payrollCompany:""};
 const {getSalesmanWeeklyRows}=await import("../src/lib/salesmanWeekly");
 const {getCustomerHistoryRows}=await import("../src/lib/customerHistoryReport");
 const {getInvoiceReportRows}=await import("../src/lib/invoiceReport");
 const {getJobOrderReportRows}=await import("../src/lib/jobOrdersReport");
 const {getWccPayrollRows,getWccCustomerRows}=await import("../src/lib/wccPayrollReport");
 const {getYearlySalesRows}=await import("../src/lib/yearlySalesReport");
 const {getTotalPayrollByJobRows}=await import("../src/lib/totalPayrollByJob");
 for(const [name,run] of [
 ["salesman selection",()=>getSalesmanWeeklyRows({...p,salesman:"-1"})],
 ["contract selection",()=>getSalesmanWeeklyRows({...p,contractWith:"__NONE__"})],
 ["customer history selection",()=>getCustomerHistoryRows({...p,customer:"-1"})],
 ["invoice customer selection",()=>getInvoiceReportRows({...p,customer:"-1"})],
 ["invoice contract selection",()=>getInvoiceReportRows({...p,contractWith:"__NONE__"})],
 ["job selection",()=>getJobOrderReportRows({...p,job:"-1"})],
 ["employee selection",()=>getJobOrderReportRows({...p,employee:"-1"})],
 ["WCC summary year",()=>getWccPayrollRows({...p,assignYear:"1900"})],
 ["WCC customer year",()=>getWccCustomerRows({...p,assignYear:"1900"})],
 ["yearly year",()=>getYearlySalesRows({...p,assignYear:"1900"})],
 ["payroll job year",()=>getTotalPayrollByJobRows(p.startDate,p.endDate,{assignYear:"1900"})]
 ] as const){try{if((await run()).length)throw new Error("Selection ignored");results.push({module:name,rows:0,passed:true});}catch(e){results.push({module:name,error:(e as Error).message});}}
 console.log(JSON.stringify(results));if(results.some(r=>!r.passed))process.exitCode=1;
 }finally{await closePool();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
