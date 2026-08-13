import { AppShell } from "@/components/layout/AppShell";
import { CurrentJobsScreen } from "@/components/current-jobs/CurrentJobsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getJobs } from "@/lib/jobs";

export default async function CurrentJobsPage() {
  const session = await getSessionOrDefault();
  let jobs: Awaited<ReturnType<typeof getJobs>>["data"] = [];
  try { jobs = (await getJobs({})).data; } catch { /* Render the legacy grid empty if the database is unavailable. */ }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><CurrentJobsScreen jobs={jobs} /></AppShell>;
}
