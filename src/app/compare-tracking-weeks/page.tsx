import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CompareTrackingWeeksScreen } from "@/components/tracking-search/CompareTrackingWeeksScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getTrackingWeekOptions, getTrackingWeekComparisonRows } from "@/lib/adminReportQueries";

export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ current?: string; previous?: string }> }) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  if (!session.isLoggedIn || !session.user?.active) redirect("/login");
  let weeks: Awaited<ReturnType<typeof getTrackingWeekOptions>> = [];
  let rows: Awaited<ReturnType<typeof getTrackingWeekComparisonRows>> = [];
  let current = "", previous = "", error = "";
  try {
    weeks = await getTrackingWeekOptions();
    current = weeks.find(week => week.value === params.current)?.value ?? weeks[0]?.value ?? "";
    previous = weeks.find(week => week.value === params.previous)?.value ?? weeks[1]?.value ?? current;
    if (current && previous) rows = await getTrackingWeekComparisonRows(current, previous);
  } catch { error = "Tracking week comparison could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><CompareTrackingWeeksScreen rows={rows} weeks={weeks} current={current} previous={previous} error={error} /></AppShell>;
}
