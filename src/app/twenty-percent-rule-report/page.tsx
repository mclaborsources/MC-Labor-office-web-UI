import { AppShell } from "@/components/layout/AppShell";
import { TwentyPercentRuleReportScreen } from "@/components/reports/TwentyPercentRuleReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getTwentyPercentRuleRows } from "@/lib/salesReportBreakdown";
import { thisWeekDayDate } from "@/lib/week";

function dateString(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export default async function TwentyPercentRuleReportPage() {
  const session = await getSessionOrDefault();
  const friday = thisWeekDayDate(new Date(), 7); const end = dateString(friday);
  const startDate = new Date(friday); startDate.setDate(startDate.getDate()-6); const start = dateString(startDate);
  let rows: Awaited<ReturnType<typeof getTwentyPercentRuleRows>> = []; let error = "";
  try { rows = await getTwentyPercentRuleRows(start, end); } catch { error = "20% Rule Report data could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><TwentyPercentRuleReportScreen initialStart={start} initialEnd={end} initialRows={rows} initialError={error}/></AppShell>;
}
