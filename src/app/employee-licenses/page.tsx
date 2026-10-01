import { AppShell } from "@/components/layout/AppShell";
import { EmployeeDocumentReportScreen } from "@/components/employee-document-report/EmployeeDocumentReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployees } from "@/lib/employees";

export default async function Page() {
  const session = await getSessionOrDefault();
  let employees: Awaited<ReturnType<typeof getEmployees>>["data"] = [];
  let error = "";
  try { employees = (await getEmployees({})).data; }
  catch { error = "Employee records could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeeDocumentReportScreen mode="licenses" employees={employees} error={error} /></AppShell>;
}
