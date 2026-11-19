import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {TotalPayrollByJobScreen} from "@/components/reports/TotalPayrollByJobScreen";
import {getTotalPayrollByJobRows,type TotalPayrollByJobRow} from "@/lib/totalPayrollByJob";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
export default async function Page({searchParams}:{searchParams:Promise<{startDate?:string;endDate?:string;weekEnding?:string;state?:string;payrollCompany?:string;assignYear?:string}>}){
 const session=await getSessionOrDefault();const params=await searchParams;
 let rows:TotalPayrollByJobRow[]=[];let error="";let start="";let end="";
 const normalize=(value?:string)=>{
  if(!value)return "";
  const match=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const iso=match?match[3]+"-"+match[1].padStart(2,"0")+"-"+match[2].padStart(2,"0"):value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return "";
  const date=new Date(iso+"T12:00:00Z");
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:"";
 };
 applyReportStartDefault(params);try{const weeks=await getNewReportSearchWeeks();end=normalize(params.endDate)||normalize(params.weekEnding)||weeks[0]?.value||"";start=normalize(params.startDate)||end;if(start&&end){if(start>end)throw new Error("Date range");rows=[];}}
 catch{error="Total payroll by job could not be loaded. Check the date range and database connection.";}
 return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><TotalPayrollByJobScreen rows={rows} initialStart={start} initialEnd={end} error={error} criteria={params}/></AppShell>;
}
