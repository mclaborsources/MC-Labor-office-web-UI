import { AppShell } from "@/components/layout/AppShell";
import { FullTimeEmployeesByMonthScreen } from "@/components/full-time-employees-report/FullTimeEmployeesByMonthScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getFullTimeEmployeeMonthPayrollOptions, getFullTimeEmployeeMonthYears } from "@/lib/adminDropdownReports";

export default async function FullTimeEmployeesByMonthPage() {
  const session = await getSessionOrDefault();
  let years: number[] = [];
  let payrollOptions: { id: string; label: string }[] = [];
  let optionsError = "";
  try {
    const [yearRows, payrollRows] = await Promise.all([getFullTimeEmployeeMonthYears(), getFullTimeEmployeeMonthPayrollOptions()]);
    years = yearRows;
    payrollOptions = payrollRows.map((row) => ({ id: String(row.id), label: String(row.label ?? "") })).filter((option) => option.label);
  } catch {
    optionsError = "Report filters could not be loaded from SQL Server.";
  }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><FullTimeEmployeesByMonthScreen years={years} payrollOptions={payrollOptions} optionsError={optionsError} /></AppShell>;
}
