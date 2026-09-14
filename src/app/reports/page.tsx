import { AppShell } from "@/components/layout/AppShell";
import { AccessReportsScreen } from "@/components/reports/AccessReportsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function ReportsPage() { const session=await getSessionOrDefault(); return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><AccessReportsScreen /></AppShell>; }
