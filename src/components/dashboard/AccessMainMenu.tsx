import { DashboardMenuInteractive } from "@/components/dashboard/DashboardMenuInteractive";
import {
  getCompanyPolicies,
  getCompanyPolicyForView,
  getDashboardSettings,
} from "@/lib/dashboard";
import { type DashboardViewId } from "@/lib/dashboardViews";
import { writesEnabled } from "@/lib/db/write";
import type { WeekContext } from "@/types/tracking";

interface AccessMainMenuProps {
  week: WeekContext;
  activeView: DashboardViewId;
}

/** Server wrapper — loads SQL data for frmMenu parity. */
export async function AccessMainMenu({ week, activeView }: AccessMainMenuProps) {
  const [settings, policies, activePolicy] = await Promise.all([
    getDashboardSettings(),
    getCompanyPolicies(),
    getCompanyPolicyForView(activeView),
  ]);

  return (
    <DashboardMenuInteractive
      week={week}
      activeView={activeView}
      settings={settings}
      policies={policies}
      activePolicy={activePolicy}
      canWrite={writesEnabled()}
    />
  );
}
