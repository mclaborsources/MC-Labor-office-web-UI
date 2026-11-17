import {getAccountingPayrollLedger,groupPayrollRows,type AccountingPayrollRow} from "@/lib/accountingPayrollLedger";
export type TotalPayrollByJobRow=AccountingPayrollRow;
export async function getTotalPayrollByJobRows(start:string,end:string,criteria:Record<string,string|undefined>={}){
 return groupPayrollRows(await getAccountingPayrollLedger({...criteria,startDate:start,endDate:end}),r=>[r.employeeId,r.customerId,r.job,r.company,r.wcc,r.status].join("|"));
}
