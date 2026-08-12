import { AppShell } from "@/components/layout/AppShell";
import { JobAppProblemsScreen } from "@/components/job-app-problems/JobAppProblemsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function JobAppProblemsPage() {
  const session = await getSessionOrDefault();

  return (
    <AppShell
      userDisplayName={session.user?.displayName}
      fillViewport
      fullWidth
    >
      <JobAppProblemsScreen />
    </AppShell>
  );
}
