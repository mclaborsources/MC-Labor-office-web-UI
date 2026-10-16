import { AppShell } from "@/components/layout/AppShell";
import { AccessWindowTabs } from "@/components/access/AccessWindowTabs";
import { AllJobsReportScreen } from "@/components/reports/AllJobsReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getAllJobsReportRows, type AllJobsReportRow } from "@/lib/allJobsReport";

export default async function AllJobsPage() {
  const session = await getSessionOrDefault();
  let rows: AllJobsReportRow[] = [];
  let total = 0;
  let error = "";
  try {
    const result = await getAllJobsReportRows({ page: 1, pageSize: 100 });
    rows = result.rows;
    total = result.total;
  } catch (cause) {
    console.error("[all-jobs] Unable to load All Jobs report:", cause);
    error = "All Jobs could not be loaded from the database. Check the SQL connection and column mappings, then refresh.";
  }

  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport>
    <AccessWindowTabs tabs={[{ label: "Menu", href: "/dashboard" }, { label: "Tracking", href: "/tracking" }, { label: "Deleted Employees", href: "/deleted-employees" }, { label: "Employees", href: "/employees" }, { label: "Reports", href: "/reports" }, { label: "All Jobs", active: true }]} />
    <AllJobsReportScreen rows={rows} total={total} error={error} />
  </AppShell>;
}
