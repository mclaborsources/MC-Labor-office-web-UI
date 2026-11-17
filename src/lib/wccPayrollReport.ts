import {getAccountingPayrollLedger,groupPayrollRows,type AccountingPayrollRow} from "@/lib/accountingPayrollLedger";
export type WccPayrollRow=AccountingPayrollRow;
export type WccCustomerRow=AccountingPayrollRow;
export function payrollDate(value?:string){
 if(!value)return "";
 const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
 const iso=m?m[3]+"-"+m[1].padStart(2,"0")+"-"+m[2].padStart(2,"0"):value;
 const d=new Date(iso+"T12:00:00Z");
 return /^\d{4}-\d{2}-\d{2}$/.test(iso)&&!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===iso?iso:"";
}

export async function getWccPayrollRows(p:Record<string,string|undefined>){return groupPayrollRows(await getAccountingPayrollLedger(p),r=>r.wcc);}
export async function getWccCustomerRows(p:Record<string,string|undefined>){return groupPayrollRows(await getAccountingPayrollLedger(p),r=>r.customerId+"|"+r.customer+"|"+r.wcc+"|"+r.salesman);}
