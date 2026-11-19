import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getWeeklySalesRows,type WeeklySalesRow} from "@/lib/weeklySalesReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {WeeklySalesReportScreen} from "@/components/reports/WeeklySalesReportScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);let rows:WeeklySalesRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=[];}catch{error="Weekly sales could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><WeeklySalesReportScreen options={options} criteria={criteria} rows={rows} error={error}/></AppShell>;}
