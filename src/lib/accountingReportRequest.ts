/** Carry page-resolved defaults into the first client-side report request. */
export function initialReportUrl(href:string,criteria:Record<string,string|undefined>){
  const url=new URL(href);
  for(const [key,value] of Object.entries(criteria)){
    if(value!==undefined)url.searchParams.set(key,value);
  }
  return url.pathname+url.search;
}
