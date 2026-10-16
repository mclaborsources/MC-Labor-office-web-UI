import { AppShell } from "@/components/layout/AppShell";
import { CommissionsMainScreen } from "@/components/reports/CommissionsMainScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCommissionsMainRows } from "@/lib/commissionsMain";
import { thisWeekDayDate } from "@/lib/week";

function dateString(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export default async function CommissionsPage() {
  const session = await getSessionOrDefault(); const weekEnding = dateString(thisWeekDayDate(new Date(), 7));
  let rows: Awaited<ReturnType<typeof getCommissionsMainRows>> = []; let error = "";
  try { rows = await getCommissionsMainRows(weekEnding); } catch { error = "Commission sales data could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CommissionsMainScreen initialWeekEnding={weekEnding} initialRows={rows} initialError={error}/></AppShell>;
}
