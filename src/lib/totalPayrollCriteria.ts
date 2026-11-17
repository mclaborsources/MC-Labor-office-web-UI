/** Criteria shared by the Total Payroll server page and its client controls. */
export function totalPayrollDate(value?:string){
 if(!value)return "";
 const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
 const iso=m?m[3]+"-"+m[1].padStart(2,"0")+"-"+m[2].padStart(2,"0"):value.trim();
 const date=new Date(iso+"T12:00:00Z");
 return /^\d{4}-\d{2}-\d{2}$/.test(iso)&&!Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:"";
}
export function normalizeTotalPayrollCriteria(input:Record<string,string|undefined>){
 const weekEnding=totalPayrollDate(input.weekEnding);
 const startDate=totalPayrollDate(input.startDate)||weekEnding,endDate=totalPayrollDate(input.endDate)||weekEnding;
 if(!startDate||!endDate||startDate>endDate)throw new Error("Choose a valid start and end date.");
 const assignYear=(input.assignYear||"").trim();
 if(assignYear&&!/^\d{4}$/.test(assignYear))throw new Error("Choose a valid assignment year.");
 return {...input,startDate,endDate,assignYear,state:(input.state||"").split(",").map(v=>v.trim()).filter(Boolean).join(","),
 payrollCompany:(input.payrollCompany||"").trim(),addressMode:input.addressMode==="employee"?"employee":"job",
 employeeName:(input.employeeName||"").trim(),jobAppStatus:["All","No SUB","SUB"].includes(input.jobAppStatus||"")?input.jobAppStatus!:"No SUB",
 noEmployeeExclusions:input.noEmployeeExclusions==="true"?"true":"false",fresh:"true"};
}
