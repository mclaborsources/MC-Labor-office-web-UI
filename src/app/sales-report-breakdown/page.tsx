import { AppShell } from "@/components/layout/AppShell";
import { SalesReportBreakdownScreen } from "@/components/reports/SalesReportBreakdownScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getSalesReportBreakdown } from "@/lib/salesReportBreakdown";
import { thisWeekDayDate } from "@/lib/week";

function dateString(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export default async function SalesReportBreakdownPage() {
  const session = await getSessionOrDefault();
  const friday = thisWeekDayDate(new Date(), 7); const end = dateString(friday);
  const startDate = new Date(friday); startDate.setDate(startDate.getDate()-6);
  const start = dateString(startDate);
  let rows: Awaited<ReturnType<typeof getSalesReportBreakdown>> = []; let error = "";
  try { rows = await getSalesReportBreakdown(start, end); } catch { error = "Sales report data could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><SalesReportBreakdownScreen initialStart={start} initialEnd={end} initialRows={rows} initialError={error}/></AppShell>;
}
