import { AppShell } from "@/components/layout/AppShell";
import { EmployeeQuickSearchScreen } from "@/components/employees/EmployeeQuickSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployees } from "@/lib/employees";

export default async function EmployeeQuickSearchPage() {
  const session = await getSessionOrDefault();
  let employees: Awaited<ReturnType<typeof getEmployees>>["data"] = [];
  let loadError: string | undefined;
  try { employees = (await getEmployees({})).data; }
  catch { loadError = "Employee data could not be loaded. Refresh to try again."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeeQuickSearchScreen employees={employees} loadError={loadError} /></AppShell>;
}
