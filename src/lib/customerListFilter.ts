type ListCustomer={customerId:string;customerName:string;customerType?:string;noCommunication:boolean;lastWeekEnding?:string;futureCallUserDate?:string};
const excludedTypes=/^(?:\d+\s+)?(?:dump|union|sober house|trade school|college|high school)$/i;
function dateOrder(value:string|undefined):number { const date=Date.parse(value??"");return Number.isNaN(date)?-Infinity:date; }
/** Apply after the other search filters, matching Access fraListFilter. */
export function filterCustomerList<T extends ListCustomer>(rows:T[],list:number):T[] {
  if(!Number.isInteger(list)||list<1||list>6)return rows;
  return rows.filter(row=>!row.noCommunication && !row.lastWeekEnding?.trim() && !excludedTypes.test((row.customerType??"").trim()))
    .sort((a,b)=>{const left=dateOrder(a.futureCallUserDate),right=dateOrder(b.futureCallUserDate);return (left===right?0:left<right?-1:1)||a.customerName.localeCompare(b.customerName,undefined,{sensitivity:"base"})||a.customerId.localeCompare(b.customerId,undefined,{numeric:true});})
    .slice((list-1)*250,list*250);
}
