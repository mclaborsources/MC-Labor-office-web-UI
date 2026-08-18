import { AppShell } from "@/components/layout/AppShell";
import { EmployeeHoursReportScreen } from "@/components/employee-hours-report/EmployeeHoursReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function EmployeeHoursByWeekPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeeHoursReportScreen mode="week" /></AppShell>;
}
