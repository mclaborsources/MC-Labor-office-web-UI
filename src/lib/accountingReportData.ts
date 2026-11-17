import {getAccountingPayrollLedger,groupPayrollRows} from "@/lib/accountingPayrollLedger";
import {normalizeTotalPayrollCriteria,totalPayrollDate} from "@/lib/totalPayrollCriteria";
import {getTotalPayrollByJobRows} from "@/lib/totalPayrollByJob";
import {getWccPayrollRows,getWccCustomerRows} from "@/lib/wccPayrollReport";
import {getUnemploymentRows} from "@/lib/unemploymentReport";
import {getTrackingReportRows} from "@/lib/trackingReport";
import {getSalesByCustomerRows} from "@/lib/salesByCustomer";
import {getSalesmanWeeklyRows} from "@/lib/salesmanWeekly";
import {getCustomerHistoryRows} from "@/lib/customerHistoryReport";
import {getGrossPayrollByWeekRows} from "@/lib/grossPayrollByWeek";
import {getEmployeesOnSiteRows} from "@/lib/employeesOnSiteWeekly";
import {getInvoiceReportRows} from "@/lib/invoiceReport";
import {getWeeklySalesRows} from "@/lib/weeklySalesReport";
import {getYearlySalesRows} from "@/lib/yearlySalesReport";
import {getStaffLoginRawReport,summarizeStaffLogins} from "@/lib/officeStaffLoginRaw";
import {getNewAssignmentRows} from "@/lib/newAssignmentsReport";
import {getSalesmanReportRows} from "@/lib/salesmanReport";
import {getEmployeeReferralRows} from "@/lib/employeeReferralReport";
import {getEmployeeOptionsRows} from "@/lib/employeeOptionsSearch";
import {getJobOrderReportRows} from "@/lib/jobOrdersReport";
export const accountingDataLoaders={
 "total-payroll-report-search":async(p:Record<string,string|undefined>)=>{const criteria=normalizeTotalPayrollCriteria(p);return {criteria,rows:groupPayrollRows(await getAccountingPayrollLedger(criteria),r=>r.employeeId+"|"+r.company+"|"+r.status)};},
 "total-payroll-by-job-search":async(p:Record<string,string|undefined>)=>getTotalPayrollByJobRows(totalPayrollDate(p.startDate)||totalPayrollDate(p.weekEnding),totalPayrollDate(p.endDate)||totalPayrollDate(p.weekEnding),p),
 "wcc-payroll":getWccPayrollRows,"wcc-payroll-by-customer":getWccCustomerRows,
 "ui-unemployment-report-search":getUnemploymentRows,"tracking-report":getTrackingReportRows,
 "sales-by-customer":getSalesByCustomerRows,"sales-by-customer-by-state":(p:Record<string,string|undefined>)=>getSalesByCustomerRows(p,true),
 "sales-by-salesman-weekly-breakdown":getSalesmanWeeklyRows,"customer-history-report":getCustomerHistoryRows,
 "gross-payroll-by-week":getGrossPayrollByWeekRows,"employees-on-site-per-week-report":getEmployeesOnSiteRows,
 "invoice-report":getInvoiceReportRows,"weekly-sales-report":getWeeklySalesRows,"yearly-sales-report":getYearlySalesRows,
 "office-staff-login-raw-data-search":async(p:Record<string,string|undefined>)=>{const r=await getStaffLoginRawReport(p);return {rows:r.rows,criteria:{...p,startDate:r.start,endDate:r.end}};},
 "office-staff-login-summary-search":async(p:Record<string,string|undefined>)=>{const r=await getStaffLoginRawReport(p);return {rows:summarizeStaffLogins(r.rows),criteria:{...p,startDate:r.start,endDate:r.end}};},
 "new-assignments-returned-employees":getNewAssignmentRows,"salesman-report":getSalesmanReportRows,
 "employee-referral-report":getEmployeeReferralRows,"employee-options-search":getEmployeeOptionsRows,"accounting-job-orders-report":getJobOrderReportRows
};
