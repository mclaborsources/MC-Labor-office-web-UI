import { AppShell } from "@/components/layout/AppShell";
import { CurrentJobsScreen } from "@/components/current-jobs/CurrentJobsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getJobListingPage } from "@/lib/jobListingReports";

export default async function JobEmployeesPage() {
  const session = await getSessionOrDefault();
  let initialPage = { rows: [], total: 0, page: 1, pageSize: 100 } as Awaited<ReturnType<typeof getJobListingPage>>;
  try { initialPage = await getJobListingPage({ kind: "employees", page: 1, pageSize: 100 }); }
  catch (error) { console.error("[job-employees] Could not load report", error); }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <CurrentJobsScreen initialPage={initialPage} kind="employees" />
  </AppShell>;
}
