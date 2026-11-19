import type {CustomerHistoryRow} from "@/lib/customerHistoryReport";
export type HistoryTableRow={id:string;kind:"detail"|"week"|"customer"|"grand";values:(string|number|null)[];source?:CustomerHistoryRow};
export function customerHistoryTableRows(rows:CustomerHistoryRow[]){
 const result:HistoryTableRow[]=[];
 const customers=new Map<string,CustomerHistoryRow[]>();
 for(const row of rows){const list=customers.get(row.customerId)||[];list.push(row);customers.set(row.customerId,list);}
 for(const [customerId,customerRows] of customers){
  const weeks=new Map<string,CustomerHistoryRow[]>();
  for(const row of customerRows){const list=weeks.get(row.weekEnding)||[];list.push(row);weeks.set(row.weekEnding,list);}
  let customerHours=0,customerInvoice=0;
  for(const [week,details] of weeks){let hours=0,invoice=0;
   for(const r of details){hours+=r.totalHours;invoice+=r.invoice;result.push({id:r.id,kind:"detail",source:r,values:[r.customer,r.weekEnding,r.job,r.firstName,r.middle,r.lastName,r.sat,r.sun,r.mon,r.tue,r.wed,r.thu,r.fri,r.totalHours||"",r.payRate,r.payroll,r.invoice,"","","",""]});}
   const values:(string|number|null)[]=Array(21).fill("");values[0]=customerRows[0].customer;values[1]=week;values[2]="Week Total";values[17]=hours||"";values[18]=invoice;
   result.push({id:"week-"+customerId+"-"+week,kind:"week",values});customerHours+=hours;customerInvoice+=invoice;
  }
  const values:(string|number|null)[]=Array(21).fill("");values[0]=customerRows[0].customer;values[2]="Customer Total";values[19]=customerHours||"";values[20]=customerInvoice;
  result.push({id:"customer-"+customerId,kind:"customer",values});
 }
 const hours=rows.reduce((sum,r)=>sum+r.totalHours,0),invoice=rows.reduce((sum,r)=>sum+r.invoice,0);
 const values:(string|number|null)[]=Array(21).fill("");values[0]="Total";
 for(const i of [13,17,19])values[i]=hours;for(const i of [16,18,20])values[i]=invoice;
 return {rows:result,grand:{id:"grand-total",kind:"grand",values} as HistoryTableRow};
}
