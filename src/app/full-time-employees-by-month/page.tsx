import { AppShell } from "@/components/layout/AppShell";
import { FullTimeEmployeesByMonthScreen } from "@/components/full-time-employees-report/FullTimeEmployeesByMonthScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function FullTimeEmployeesByMonthPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><FullTimeEmployeesByMonthScreen /></AppShell>;
}
