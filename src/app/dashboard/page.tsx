import { AppShell } from "@/components/layout/AppShell";
import { AccessMainMenu } from "@/components/dashboard/AccessMainMenu";
import { getSessionOrDefault } from "@/lib/auth/session";
import { parseDashboardView } from "@/lib/dashboardViews";
import { resolveTrackingWeek } from "@/lib/trackingWeek";

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;
  const activeView = parseDashboardView(params.view);
  const week = await resolveTrackingWeek();

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport>
      <div className="ac-dashboard">
        <AccessMainMenu week={week} activeView={activeView} />
      </div>
    </AppShell>
  );
}
