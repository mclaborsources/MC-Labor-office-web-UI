import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getWccCustomerRows,type WccCustomerRow} from "@/lib/wccPayrollReport";
import {WccPayrollCustomerScreen} from "@/components/wcc-payroll/WccPayrollCustomerScreen";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {redirect} from "next/navigation";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const params=await searchParams;
 if(!params.state)redirect('/accounting-reports');
 const [session,options]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions()]);
 let rows:WccCustomerRow[]=[];let error="";applyReportStartDefault(params);try{rows=[];}catch{error="WCC customer data could not be loaded. Check the dates and database connection.";}
 return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><WccPayrollCustomerScreen options={options} criteria={params} rows={rows} error={error}/></AppShell>;
}
