import { AppShell } from "@/components/layout/AppShell";
import { CustomerReportScreen } from "@/components/reports/CustomerReportScreen";
import { getReportCustomers } from "@/lib/reportCustomers";
import { getSessionOrDefault } from "@/lib/auth/session";
import { thisWeekDayDate } from "@/lib/week";
export default async function ActiveCustomersPage() {
  const session = await getSessionOrDefault();
  const weekEnding = thisWeekDayDate(new Date(), 7);
  const week = `${weekEnding.getFullYear()}-${String(weekEnding.getMonth() + 1).padStart(2, "0")}-${String(weekEnding.getDate()).padStart(2, "0")}`;
  let rows: Awaited<ReturnType<typeof getReportCustomers>> = [];
  let error = "";
  try { rows = await getReportCustomers(week); }
  catch { error = "Customer tracking data could not be loaded. Check the database connection and refresh."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CustomerReportScreen kind="active" rows={rows} error={error}/></AppShell>;
}
