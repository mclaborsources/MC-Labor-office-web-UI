import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WebsiteAccessScreen } from "@/components/reports/WebsiteAccessScreen";
import { getSession } from "@/lib/auth/session";
import { getWebsiteAccessRows } from "@/lib/websiteAccess";

export const dynamic = "force-dynamic";

export default async function WebsiteAccessPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  if (!session.user?.roles.includes("admin")) redirect("/reports");
  let rows = [] as Awaited<ReturnType<typeof getWebsiteAccessRows>>;
  let error = "";
  try { rows = await getWebsiteAccessRows(); }
  catch { error = "Website access records could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><WebsiteAccessScreen rows={rows} error={error}/></AppShell>;
}
