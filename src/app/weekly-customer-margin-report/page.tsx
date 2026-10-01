import { AppShell } from "@/components/layout/AppShell";
import { WeeklyCustomerMarginScreen } from "@/components/weekly-customer-margin/WeeklyCustomerMarginScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getMarginByWeekRows } from "@/lib/operationalReports";

export default async function WeeklyCustomerMarginPage() {
  const session = await getSessionOrDefault();
  let rows: Awaited<ReturnType<typeof getMarginByWeekRows>> = [];
  let error = "";
  try { rows = await getMarginByWeekRows(); }
  catch { error = "Customer margin data could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><WeeklyCustomerMarginScreen rows={rows} error={error} /></AppShell>;
}
