import { AppShell } from "@/components/layout/AppShell";
import { EmployeesInTrackingScreen } from "@/components/employees-in-tracking/EmployeesInTrackingScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployees } from "@/lib/employees";

export default async function EmployeesInTrackingPage() {
  const session = await getSessionOrDefault();
  let employees: Awaited<ReturnType<typeof getEmployees>>["data"] = [];
  try { employees = (await getEmployees({})).data; } catch { /* Keep the legacy grid usable if SQL is unavailable. */ }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeesInTrackingScreen employees={employees} /></AppShell>;
}
