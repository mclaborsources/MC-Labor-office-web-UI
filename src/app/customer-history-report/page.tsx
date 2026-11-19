import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getCustomerHistoryRows,type CustomerHistoryRow} from "@/lib/customerHistoryReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {queryReadOnly} from "@/lib/db/sql";
import {CustomerHistoryReportScreen} from "@/components/reports/CustomerHistoryReportScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,customers,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),Promise.resolve([]),searchParams]);let rows:CustomerHistoryRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=[];}catch{error="Customer history could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><CustomerHistoryReportScreen options={options} customers={customers} criteria={criteria} rows={rows} error={error}/></AppShell>;}
