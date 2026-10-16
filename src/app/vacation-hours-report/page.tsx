import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { VacationHoursReportScreen } from "@/components/vacation-hours-report/VacationHoursReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getTrackingYears, getVacationHoursRows } from "@/lib/adminReportQueries";

export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  if (!session.isLoggedIn || !session.user?.active) redirect("/login");
  let years: number[] = [];
  let rows: Awaited<ReturnType<typeof getVacationHoursRows>> = [];
  let error = "";
  let year = new Date().getFullYear();
  try {
    years = await getTrackingYears();
    year = /^\d{4}$/.test(params.year ?? "") && Number(params.year)>=1900 && Number(params.year)<9999 ? Number(params.year) : years[0] ?? year;
    rows = await getVacationHoursRows(year);
  } catch { error = "Vacation hours could not be loaded from SQL Server."; }
  if (!years.includes(year)) years = [year, ...years];
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><VacationHoursReportScreen key={year} rows={rows} year={year} years={years} error={error} /></AppShell>;
}
