import { AppShell } from "@/components/layout/AppShell";
import { TrackingSearchScreen } from "@/components/tracking-search/TrackingSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { resolveTrackingWeek } from "@/lib/trackingWeek";
import { getTrackingPreview } from "@/lib/tracking";

export default async function TrackingSearchPage() {
  const session = await getSessionOrDefault();
  const week = await resolveTrackingWeek();
  let rows: Awaited<ReturnType<typeof getTrackingPreview>>["rows"] = [];
  let error = "";
  try { rows = (await getTrackingPreview({ week: week.assignWeek, year: week.assignYear, limit: 500 })).rows; }
  catch { error = "Tracking assignments could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><TrackingSearchScreen rows={rows} weekEnding={week.weekEndingDate} error={error} /></AppShell>;
}
