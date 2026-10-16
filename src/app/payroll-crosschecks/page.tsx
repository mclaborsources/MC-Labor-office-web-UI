import { AppShell } from "@/components/layout/AppShell";
import { PayrollCrosschecksScreen } from "@/components/reports/PayrollCrosschecksScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getPayrollAdjustmentCompanies } from "@/lib/regularPayrollReport";
import { getPayrollCrosscheckRows } from "@/lib/payrollCrosschecks";
import { thisWeekDayDate } from "@/lib/week";

function dateString(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }

export default async function PayrollCrosschecksPage() {
  const session = await getSessionOrDefault();
  const end = thisWeekDayDate(new Date(), 7);
  const start = new Date(end); start.setDate(start.getDate() - 77);
  const initialEnd = dateString(end); const initialStart = dateString(start);
  let companies: Awaited<ReturnType<typeof getPayrollAdjustmentCompanies>> = [];
  let rows: Awaited<ReturnType<typeof getPayrollCrosscheckRows>> = [];
  let error = "";
  try {
    [companies, rows] = await Promise.all([getPayrollAdjustmentCompanies(), getPayrollCrosscheckRows(initialStart, initialEnd, "IPG")]);
  } catch { error = "Payroll crosscheck data could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport>
    <PayrollCrosschecksScreen initialStart={initialStart} initialEnd={initialEnd} initialRows={rows} companies={companies} initialError={error} />
  </AppShell>;
}
