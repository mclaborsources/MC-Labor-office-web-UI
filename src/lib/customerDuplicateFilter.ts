import type { CustomerNameMatch } from "./customerNameSearchColumns";
export const CUSTOMER_DUPLICATE_FIELDS:Record<string,Array<keyof CustomerNameMatch>>={
  name:["customerName"],street:["street"],phone:["phone"],"contact-first-last":["ctcFirst","ctcLast"],"contact-email":["ctcEmail"],"contact-cell":["ctcCell"],
  "name-street":["customerName","street"],"name-street-city":["customerName","street","city"],"name-street-city-phone":["customerName","street","city","phone"],
  "name-city":["customerName","city"],"name-state":["customerName","state"],"street-city":["street","city"],
};
export function duplicateSpec(choice:string) {
  const alias:Record<string,string>={customerName:"name",ctcEmail:"contact-email",ctcCell:"contact-cell"};
  const base=choice.replace(/-backwards$|-last-week-ending$/,"");
  const fields=CUSTOMER_DUPLICATE_FIELDS[alias[base]??base];
  return fields?{fields,backwards:choice.endsWith("-backwards"),withLastWeek:choice.endsWith("-last-week-ending")}:null;
}
export function customerDuplicateKey(row:CustomerNameMatch,fields:Array<keyof CustomerNameMatch>):string {
  const parts=fields.map(field=>{
    // Access Replace(...,' ','') removes spaces, but does not strip tab characters.
    const value=String(row[field]??"").replace(/^ +| +$/g,"").toLowerCase();
    return ["phone","ctcCell","ctcEmail"].includes(field)?value:value.replace(/ /g,"");
  });
  return parts.every(Boolean)?JSON.stringify(parts):"";
}
export function filterCustomerDuplicates(rows:CustomerNameMatch[],choice:string):CustomerNameMatch[] {
  const spec=duplicateSpec(choice);if(!spec)return rows;
  const groups=new Map<string,{count:number;hasWeek:boolean}>();
  for(const row of rows){const key=customerDuplicateKey(row,spec.fields);if(!key)continue;const group=groups.get(key)??{count:0,hasWeek:false};group.count++;group.hasWeek ||= Boolean(row.lastWeekEnding);groups.set(key,group);}
  return rows.filter(row=>{const key=customerDuplicateKey(row,spec.fields);const group=groups.get(key);if(!group)return false;return spec.backwards?group.count===1:group.count>1&&(!spec.withLastWeek||group.hasWeek);})
    .sort((a,b)=>customerDuplicateKey(a,spec.fields).localeCompare(customerDuplicateKey(b,spec.fields))||a.customerName.localeCompare(b.customerName)||a.customerId.localeCompare(b.customerId,undefined,{numeric:true}));
}
