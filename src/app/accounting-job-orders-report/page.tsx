import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getJobOrderReportRows,type JobOrderReportRow} from "@/lib/jobOrdersReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {JobOrdersReportPreview} from "@/components/reports/JobOrdersReportPreview";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,criteria]=await Promise.all([getSessionOrDefault(),searchParams]);let rows:JobOrderReportRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=await getJobOrderReportRows(criteria);}catch{error="Job assignment records could not be loaded. Check the criteria and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><JobOrdersReportPreview criteria={criteria} rows={rows} error={error}/></AppShell>;}
