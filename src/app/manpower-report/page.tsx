import { AppShell } from "@/components/layout/AppShell";
import { ManpowerReportScreen } from "@/components/reports/ManpowerReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function ManpowerReportPage(){const session=await getSessionOrDefault();return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><ManpowerReportScreen/></AppShell>;}
