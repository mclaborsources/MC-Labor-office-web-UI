import { AppShell } from "@/components/layout/AppShell";
import { EmployeeResearchScreen } from "@/components/employee-research/EmployeeResearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployeeResearchRows } from "@/lib/employeeResearchReport";
import type { EmployeeResearchRow } from "@/lib/employeeResearchReport";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSessionOrDefault();
  let rows: EmployeeResearchRow[] = [];
  let error = "";
  try {
    rows = await getEmployeeResearchRows();
  } catch {
    error = "Employee research data could not be loaded from SQL Server.";
  }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeeResearchScreen rows={rows} error={error} /></AppShell>;
}
