import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AlertsScreen } from "@/components/alerts/AlertsScreen";
import { getSession } from "@/lib/auth/session";
import { getAlertsData } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  let data: Awaited<ReturnType<typeof getAlertsData>> = { rows: [], types: [] };
  let error = "";
  try { data = await getAlertsData(); }
  catch { error = "Alerts could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><AlertsScreen {...data} error={error}/></AppShell>;
}
