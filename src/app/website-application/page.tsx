import { AppShell } from "@/components/layout/AppShell";
import { WebsiteApplicationScreen } from "@/components/tracking/WebsiteApplicationScreen";
import { ExtendedApplicationScreen } from "@/components/tracking/ExtendedApplicationScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function WebsiteApplicationPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const session = await getSessionOrDefault();
  const { source } = await searchParams;
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport>{source === "hsg" || source === "datapay" ? <ExtendedApplicationScreen key={source} source={source} /> : <WebsiteApplicationScreen />}</AppShell>;
}
