import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PayrollExclusionsScreen } from "@/components/payroll-exclusions/PayrollExclusionsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getPayrollExclusionRows } from "@/lib/adminReportQueries";

export const dynamic = "force-dynamic";
export default async function Page() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.active) redirect("/login");
  let rows: Awaited<ReturnType<typeof getPayrollExclusionRows>> = [];
  let error = "";
  try { rows = await getPayrollExclusionRows(); }
  catch { error = "Payroll exclusions could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><PayrollExclusionsScreen rows={rows} error={error} /></AppShell>;
}
