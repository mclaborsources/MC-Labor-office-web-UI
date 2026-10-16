import {AppShell} from "@/components/layout/AppShell";
import {PayrollReportSearchScreen} from "@/components/reports/PayrollReportSearchScreen";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getNewReportSearchCompanies,getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {getPayrollReportSearchRows,type PayrollReportSearchRow} from "@/lib/payrollReportSearch";

interface Props{searchParams:Promise<{weekEnding?:string}>}
export default async function PayrollReportSearchPage({searchParams}:Props){const session=await getSessionOrDefault();let companies:string[]=[];let rows:PayrollReportSearchRow[]=[];let weekEnding="";let error="";try{const params=await searchParams;const [options,codes]=await Promise.all([getNewReportSearchWeeks(),getNewReportSearchCompanies()]);companies=codes;weekEnding=options.some(option=>option.value===params.weekEnding)?params.weekEnding!:options[0]?.value??"";if(weekEnding)rows=await getPayrollReportSearchRows(weekEnding);}catch{error="Payroll report search data could not be loaded from the office database.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><PayrollReportSearchScreen initialWeekEnding={weekEnding} initialRows={rows} companies={companies} initialError={error}/></AppShell>;}
