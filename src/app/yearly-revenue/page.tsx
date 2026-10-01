import { AppShell } from "@/components/layout/AppShell";
import { YearlyRevenueScreen } from "@/components/yearly-revenue/YearlyRevenueScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getYearlyRevenueRows } from "@/lib/adminDropdownReports";

export default async function YearlyRevenuePage() {
  const session = await getSessionOrDefault();
  let rows: Awaited<ReturnType<typeof getYearlyRevenueRows>> = [];
  let error = "";
  try { rows = await getYearlyRevenueRows(); }
  catch { error = "Revenue records could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><YearlyRevenueScreen rows={rows} error={error} /></AppShell>;
}
