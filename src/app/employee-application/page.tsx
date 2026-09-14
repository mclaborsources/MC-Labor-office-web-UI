import { AppShell } from "@/components/layout/AppShell";
import { EmployeeApplicationScreen } from "@/components/employees/EmployeeApplicationScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function EmployeeApplicationPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><EmployeeApplicationScreen /></AppShell>;
}
