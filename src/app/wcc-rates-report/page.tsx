import { AppShell } from "@/components/layout/AppShell";
import { WccRatesReportScreen } from "@/components/wcc-rates/WccRatesReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function WccRatesReportPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><WccRatesReportScreen /></AppShell>;
}
