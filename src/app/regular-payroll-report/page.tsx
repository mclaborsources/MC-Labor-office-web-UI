import { AppShell } from "@/components/layout/AppShell";
import { RegularPayrollReportScreen } from "@/components/reports/RegularPayrollReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getRegularPayrollCompanies,getRegularPayrollRows,type RegularPayrollRow } from "@/lib/regularPayrollReport";
import { thisWeekDayDate } from "@/lib/week";

export default async function RegularPayrollReportPage(){
  const session=await getSessionOrDefault();const friday=thisWeekDayDate(new Date(),7);const weekEnding=`${friday.getFullYear()}-${String(friday.getMonth()+1).padStart(2,"0")}-${String(friday.getDate()).padStart(2,"0")}`;
  let companies:Awaited<ReturnType<typeof getRegularPayrollCompanies>>=[];let rows:RegularPayrollRow[]=[];let error="";
  try{companies=await getRegularPayrollCompanies();const selected=companies.find(item=>item.name==="IPG")?.name??companies[0]?.name??"";rows=await getRegularPayrollRows(weekEnding,selected);}catch{error="Regular payroll data could not be loaded from the office database.";}
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><RegularPayrollReportScreen initialWeekEnding={weekEnding} initialRows={rows} companies={companies.map(company=>company.name)} initialError={error}/></AppShell>;
}
