import { AppShell } from "@/components/layout/AppShell";
import { AccidentReportSearchScreen } from "@/components/accident-report-search/AccidentReportSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function AccidentReportSearchPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><AccidentReportSearchScreen /></AppShell>;
}
