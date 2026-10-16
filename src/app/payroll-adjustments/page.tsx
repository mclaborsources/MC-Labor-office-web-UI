import { AppShell } from "@/components/layout/AppShell";
import { PayrollAdjustmentsScreen } from "@/components/reports/PayrollAdjustmentsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getPayrollAdjustmentCompanies,getPayrollAdjustmentRows,type PayrollAdjustmentRow } from "@/lib/regularPayrollReport";
import { thisWeekDayDate } from "@/lib/week";

export default async function PayrollAdjustmentsPage(){
  const session=await getSessionOrDefault();const friday=thisWeekDayDate(new Date(),7);const weekEnding=`${friday.getFullYear()}-${String(friday.getMonth()+1).padStart(2,"0")}-${String(friday.getDate()).padStart(2,"0")}`;
  let rows:PayrollAdjustmentRow[]=[];let companies:Awaited<ReturnType<typeof getPayrollAdjustmentCompanies>>=[];let error="";
  try{companies=await getPayrollAdjustmentCompanies();rows=await getPayrollAdjustmentRows(weekEnding,"");}catch{error="Payroll adjustments could not be loaded from the office database.";}
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><PayrollAdjustmentsScreen initialWeekEnding={weekEnding} initialRows={rows} companies={companies} initialError={error}/></AppShell>;
}
