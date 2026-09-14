import { AppShell } from "@/components/layout/AppShell";
import { LienSummaryScreen } from "@/components/reports/LienSummaryScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function LienSummaryPage(){const session=await getSessionOrDefault();return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><LienSummaryScreen generatedAt={new Date().toISOString()}/></AppShell>;}
