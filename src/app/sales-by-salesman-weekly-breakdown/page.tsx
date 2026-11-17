import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getSalesmanWeeklyRows,type SalesmanWeeklyRow} from "@/lib/salesmanWeekly";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {getTrackingSalesmen} from "@/lib/tracking";
import {SalesmanWeeklyScreen} from "@/components/reports/SalesmanWeeklyScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,salesmen,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),getTrackingSalesmen().catch(()=>[]),searchParams]);let rows:SalesmanWeeklyRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=await getSalesmanWeeklyRows(criteria);}catch{error="Salesman customer breakdown could not be loaded. Check the criteria and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><SalesmanWeeklyScreen options={options} salesmen={salesmen} criteria={criteria} rows={rows} error={error}/></AppShell>;}
