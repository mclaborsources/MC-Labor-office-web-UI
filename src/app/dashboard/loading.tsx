import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLoading() {
  return <AppShell fillViewport fullWidth compactHeader><div className="ac-dashboard-reference" aria-busy="true"><div className="ac-access-menu"><div className="ac-access-menu-views">Loading main menu…</div></div></div></AppShell>;
}
