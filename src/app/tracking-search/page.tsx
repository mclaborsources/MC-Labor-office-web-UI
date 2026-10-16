import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TrackingSearchScreen } from "@/components/tracking-search/TrackingSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getTrackingWeekOptions, getTrackingSearchRows } from "@/lib/adminReportQueries";

export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ weekEnding?: string }> }) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  if (!session.isLoggedIn || !session.user?.active) redirect("/login");
  let rows: Awaited<ReturnType<typeof getTrackingSearchRows>> = [];
  let weeks: Awaited<ReturnType<typeof getTrackingWeekOptions>> = [];
  let weekEnding = "", error = "";
  try {
    weeks = await getTrackingWeekOptions();
    const requested = params.weekEnding ?? "";
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(requested) &&
      Number.isFinite(Date.parse(requested)) && new Date(requested).toISOString().slice(0, 10) === requested;
    weekEnding = validDate ? requested : weeks[0]?.value ?? "";
    if (weekEnding) rows = await getTrackingSearchRows(weekEnding);
  } catch { error = "Tracking assignments could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><TrackingSearchScreen key={weekEnding} rows={rows} weeks={weeks} weekEnding={weekEnding} error={error} /></AppShell>;
}
