function normalized(value:string) {return value.trim().toLowerCase().replace(/\s+/g," ").replace(/^cust search$/,"customer search");}
/** Profile membership follows the explicitly checked boxes. */
export function matchesCustomerProfile(selected:string,actual:string,_duplicateMode=false) {
  const target=normalized(selected),profile=normalized(actual);
  return target===profile;
}
