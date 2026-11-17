import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getSalesmanReportRows,type SalesmanReportRow} from "@/lib/salesmanReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {AssignmentAndSalesmanReportScreen} from "@/components/reports/AssignmentAndSalesmanReportScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);let rows:SalesmanReportRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=await getSalesmanReportRows(criteria);}catch{error="Salesman report could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><AssignmentAndSalesmanReportScreen mode="salesman" options={options} criteria={criteria} rows={rows} error={error}/></AppShell>;}
