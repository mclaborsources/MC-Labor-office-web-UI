import { AppShell } from "@/components/layout/AppShell";
import { OpenInvoicesScreen } from "@/components/reports/OpenInvoicesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function OpenInvoicesPage(){const session=await getSessionOrDefault();return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><OpenInvoicesScreen/></AppShell>;}
