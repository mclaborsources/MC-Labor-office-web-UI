import { AppShell } from "@/components/layout/AppShell";
import { UiReportScreen } from "@/components/ui-report/UiReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function UiReportPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><UiReportScreen /></AppShell>;
}
