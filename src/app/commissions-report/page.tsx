import { AppShell } from "@/components/layout/AppShell";
import { CommissionsReportScreen } from "@/components/reports/CommissionsReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCommissionsReportSummary } from "@/lib/commissionsReport";
import { thisWeekDayDate } from "@/lib/week";

function dateString(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export default async function CommissionsReportPage() {
  const session = await getSessionOrDefault(); const weekEnding = dateString(thisWeekDayDate(new Date(), 7));
  let summary: Awaited<ReturnType<typeof getCommissionsReportSummary>> = { weekEnding: "", grossPayroll: 0, totalInvoices: 0, xcelHrPayroll: 0 }; let error = "";
  try { summary = await getCommissionsReportSummary(weekEnding); } catch { error = "Commissions report data could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CommissionsReportScreen initialWeekEnding={weekEnding} initialSummary={summary} initialError={error}/></AppShell>;
}
