import {AppShell} from "@/components/layout/AppShell";
import {PayrollExportReportScreen} from "@/components/reports/PayrollExportReportScreen";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getNewReportSearchCompanies,getNewReportSearchRows,getNewReportSearchWeeks} from "@/lib/newReportSearch";
import type {NewReportSearchRow} from "@/lib/newReportSearch";

interface Props{searchParams:Promise<{weekEnding?:string}>}
export default async function PayrollExportReportPage({searchParams}:Props){const session=await getSessionOrDefault();let weeks:Awaited<ReturnType<typeof getNewReportSearchWeeks>>=[];let companies:string[]=[];let rows:NewReportSearchRow[]=[];let selectedWeek="";let error="";try{[weeks,companies]=await Promise.all([getNewReportSearchWeeks(),getNewReportSearchCompanies()]);const params=await searchParams;selectedWeek=weeks.some(week=>week.value===params.weekEnding)?params.weekEnding!:weeks[0]?.value??"";if(selectedWeek)rows=await getNewReportSearchRows(selectedWeek);}catch{error="Payroll export data could not be loaded from the office database.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><PayrollExportReportScreen companies={companies} rows={rows} initialWeekEnding={selectedWeek} error={error}/></AppShell>;}
