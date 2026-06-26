import { AppShell } from "@/components/layout/AppShell";
import { AccessWindowTabs } from "@/components/access/AccessWindowTabs";
import { TrackingScreen } from "@/components/tracking/TrackingScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCurrentWeekContext } from "@/lib/week";
import { getTrackingPreview } from "@/lib/tracking";
import type { TrackingPreview } from "@/types/tracking";

export default async function TrackingPage() {
  const session = await getSessionOrDefault();
  const week = getCurrentWeekContext();

  let preview: TrackingPreview = { rows: [], source: null };
  try {
    preview = await getTrackingPreview({
      week: week.assignWeek,
      year: week.assignYear,
      limit: 300,
    });
  } catch {
    // Tracking grid stays in safe preview mode if the source is unreachable.
  }

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="-mx-2 -mt-2 mb-1.5 sm:-mx-3">
        <AccessWindowTabs
          tabs={[
            { label: "Menu", href: "/dashboard" },
            { label: "Tracking", active: true },
          ]}
        />
      </div>
      <TrackingScreen week={week} preview={preview} />
    </AppShell>
  );
}
