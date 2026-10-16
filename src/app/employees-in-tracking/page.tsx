import { AppShell } from "@/components/layout/AppShell";
import { EmployeesInTrackingScreen } from "@/components/employees-in-tracking/EmployeesInTrackingScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getAllEmployeesOnJobRows } from "@/lib/allEmployeesOnJob";

export default async function EmployeesInTrackingPage() {
  const session = await getSessionOrDefault();
  let rows: Awaited<ReturnType<typeof getAllEmployeesOnJobRows>> = [];
  try { rows = await getAllEmployeesOnJobRows(); } catch { /* Keep the report screen available if SQL is temporarily unavailable. */ }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeesInTrackingScreen rows={rows} /></AppShell>;
}
