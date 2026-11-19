/** Display report dates without changing the underlying values used by filters. */
export function reportDateDisplay(value:string):string {
 return value.replace(/^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})(?=$|[ T])/,(_,month,day,year)=>`${Number(month)}/${Number(day)}/${year}`)
  .replace(/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?=$|[ T])/,(_,year,month,day)=>`${Number(month)}/${Number(day)}/${year}`);
}
