import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getUnemploymentRows,type UnemploymentRow} from "@/lib/unemploymentReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {UnemploymentReportScreen} from "@/components/reports/UnemploymentReportScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);let rows:UnemploymentRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.weekEnding&&!criteria.endDate){criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;}rows=[];}catch{error="Unemployment payroll data could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><UnemploymentReportScreen options={options} criteria={criteria} rows={rows} error={error}/></AppShell>;}
