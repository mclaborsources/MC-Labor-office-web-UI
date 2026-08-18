import { AppShell } from "@/components/layout/AppShell";
import { VacationHoursReportScreen } from "@/components/vacation-hours-report/VacationHoursReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function VacationHoursReportPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><VacationHoursReportScreen /></AppShell>;
}
