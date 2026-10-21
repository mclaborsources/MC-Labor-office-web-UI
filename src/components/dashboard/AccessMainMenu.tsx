import { DashboardMenuInteractive } from "@/components/dashboard/DashboardMenuInteractive";
import {
  getCompanyPolicies,
  getDashboardSettings,
} from "@/lib/dashboard";
import { type DashboardViewId } from "@/lib/dashboardViews";
import { writesEnabled } from "@/lib/db/write";
import { getDatabaseSettings } from "@/lib/config/database";
import type { WeekContext } from "@/types/tracking";

interface AccessMainMenuProps {
  week: WeekContext;
  activeView: DashboardViewId;
}

/** Server wrapper — loads SQL data for frmMenu parity. */
export async function AccessMainMenu({ week, activeView }: AccessMainMenuProps) {
  const [settings, policies] = await Promise.all([
    getDashboardSettings(),
    getCompanyPolicies(),
  ]);
  let serverLabel = "SQL Server";
  try {
    const database = getDatabaseSettings();
    if (database) serverLabel = `${database.server}\\${database.database}`;
  } catch { /* Keep the menu available while setup is incomplete. */ }

  return (
    <DashboardMenuInteractive
      week={week}
      activeView={activeView}
      settings={settings}
      policies={policies}
      canWrite={writesEnabled()}
      today={new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York" }).format(new Date())}
      serverLabel={serverLabel}
      resourceSizeMb={Math.round(process.memoryUsage().rss / 1024 / 1024)}
    />
  );
}
