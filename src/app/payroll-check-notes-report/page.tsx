import { AppShell } from "@/components/layout/AppShell";
import { PayrollCheckNotesReportScreen } from "@/components/reports/PayrollCheckNotesReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getPayrollCheckNotesRows,getRegularPayrollCompanies,type PayrollCheckNotesRow } from "@/lib/regularPayrollReport";
import { thisWeekDayDate } from "@/lib/week";

export default async function PayrollCheckNotesReportPage(){
  const session=await getSessionOrDefault();const friday=thisWeekDayDate(new Date(),7);const weekEnding=`${friday.getFullYear()}-${String(friday.getMonth()+1).padStart(2,"0")}-${String(friday.getDate()).padStart(2,"0")}`;
  let companies:Awaited<ReturnType<typeof getRegularPayrollCompanies>>=[];let rows:PayrollCheckNotesRow[]=[];let error="";
  try{companies=await getRegularPayrollCompanies();const selected=companies.find(item=>item.name==="IPG")?.name??companies[0]?.name??"";rows=await getPayrollCheckNotesRows(weekEnding,selected);}catch{error="Payroll check notes could not be loaded from the office database.";}
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><PayrollCheckNotesReportScreen initialWeekEnding={weekEnding} initialRows={rows} companies={companies.map(company=>company.name)} initialError={error}/></AppShell>;
}
