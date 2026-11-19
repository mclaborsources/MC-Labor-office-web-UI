import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {normalizeTotalPayrollCriteria} from "@/lib/totalPayrollCriteria";
import {AppShell} from "@/components/layout/AppShell";
import {TotalPayrollReportScreen} from "@/components/reports/TotalPayrollReportScreen";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {getAccountingPayrollLedger,groupPayrollRows,type AccountingPayrollRow} from "@/lib/accountingPayrollLedger";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);
 let rows:AccountingPayrollRow[]=[];let error="";let applied=criteria;
 applyReportStartDefault(criteria);try{if(!criteria.weekEnding&&!criteria.endDate)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;
 applied=normalizeTotalPayrollCriteria(criteria);
 rows=[];
 }catch{error="Total payroll data could not be loaded. Check the dates and database connection.";}
 return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><TotalPayrollReportScreen rows={rows} error={error} options={options} criteria={applied}/></AppShell>;
}
