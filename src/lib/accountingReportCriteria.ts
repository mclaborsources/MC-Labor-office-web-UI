export function reportFilterSet(_label:string){ return {dates:true,year:true,state:true,company:true,address:true,exclusions:true,customer:true,job:true,contract:true,salesman:true}; }

export function isMaRiSelection(value:string){
 const states=new Set(value.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean));
 return states.size===2&&states.has("MA")&&states.has("RI");
}
