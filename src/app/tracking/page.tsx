import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrackingScreen } from "@/components/tracking/TrackingScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCurrentWeekContext } from "@/lib/week";

export default async function TrackingPage() {
  const session = await getSessionOrDefault();
  const week = getCurrentWeekContext();

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <PageHeader
        title="Tracking"
        subtitle={`Week ${week.assignWeek} · ${week.assignYear} · Read-only preview`}
        icon={ClipboardList}
      />
      <TrackingScreen week={week} />
    </AppShell>
  );
}
