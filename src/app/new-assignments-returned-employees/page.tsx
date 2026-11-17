import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {type AssignmentReportRow} from "@/lib/newAssignmentsReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {AssignmentAndSalesmanReportScreen} from "@/components/reports/AssignmentAndSalesmanReportScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);let rows:AssignmentReportRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;}catch{error="Assignment history could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><AssignmentAndSalesmanReportScreen mode="assignments" loadOnOpen options={options} criteria={criteria} rows={rows} error={error}/></AppShell>;}
