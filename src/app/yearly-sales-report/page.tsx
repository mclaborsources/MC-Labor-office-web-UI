import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getYearlySalesRows,type YearlySalesRow} from "@/lib/yearlySalesReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {YearlySalesReportScreen} from "@/components/reports/YearlySalesReportScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);let rows:YearlySalesRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=[];}catch{error="Yearly sales could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><YearlySalesReportScreen options={options} criteria={criteria} rows={rows} error={error}/></AppShell>;}
