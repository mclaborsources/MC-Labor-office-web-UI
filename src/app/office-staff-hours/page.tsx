import { AppShell } from "@/components/layout/AppShell";
import { OfficeStaffLoginSearchScreen } from "@/components/reports/OfficeStaffLoginSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { thisWeekDayDate } from "@/lib/week";
import { getOfficeStaffLoginRows } from "@/lib/officeStaffLogins";

function dateString(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export default async function OfficeStaffHoursPage() {
  const session = await getSessionOrDefault();
  const currentWeekEnd = dateString(thisWeekDayDate(new Date(), 7));
  const endDate = dateString(new Date(new Date(`${currentWeekEnd}T12:00:00`).getTime()-7*86400000));
  const startDate = dateString(new Date(new Date(`${endDate}T12:00:00`).getTime()-6*86400000));
  let rows: Awaited<ReturnType<typeof getOfficeStaffLoginRows>> = []; let error = "";
  try { rows = await getOfficeStaffLoginRows(startDate,endDate); } catch { error = "Office staff login records could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><OfficeStaffLoginSearchScreen initialStartDate={startDate} initialEndDate={endDate} currentWeekEnd={currentWeekEnd} initialRows={rows} initialError={error}/></AppShell>;
}
