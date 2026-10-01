import { AppShell } from "@/components/layout/AppShell";
import { EmployeeHoursReportScreen } from "@/components/employee-hours-report/EmployeeHoursReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployeeHoursRows } from "@/lib/adminDropdownReports";

interface Props { searchParams: Promise<{ year?: string }> }
export default async function Page({ searchParams }: Props) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  const year = /^20\d{2}$/.test(params.year ?? "") ? Number(params.year) : new Date().getFullYear();
  let rows: Awaited<ReturnType<typeof getEmployeeHoursRows>> = [];
  let error = "";
  try { rows = await getEmployeeHoursRows("week", year); }
  catch { error = "Employee hours could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeeHoursReportScreen mode="week" rows={rows} year={year} error={error} /></AppShell>;
}
