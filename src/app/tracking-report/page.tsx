import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getTrackingReportRows,type TrackingReportRow} from "@/lib/trackingReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {TrackingReportScreen} from "@/components/tracking-report/TrackingReportScreen";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
export default async function TrackingReportPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);
 let rows:TrackingReportRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.weekEnding&&!criteria.endDate)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=[];}catch{error="Tracking data could not be loaded. Check the dates and database connection.";}
 return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><TrackingReportScreen options={options} criteria={criteria} rows={rows} error={error}/></AppShell>;
}
