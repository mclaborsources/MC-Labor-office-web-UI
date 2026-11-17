import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getEmployeesOnSiteRows,type EmployeeOnSiteRow} from "@/lib/employeesOnSiteWeekly";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {EmployeesOnSiteWeeklyScreen} from "@/components/reports/EmployeesOnSiteWeeklyScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);let rows:EmployeeOnSiteRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=await getEmployeesOnSiteRows(criteria);}catch{error="Employees on site could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><EmployeesOnSiteWeeklyScreen options={options} criteria={criteria} rows={rows} error={error}/></AppShell>;}
