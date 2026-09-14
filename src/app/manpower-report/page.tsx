import { AppShell } from "@/components/layout/AppShell";
import { ManpowerReportScreen } from "@/components/reports/ManpowerReportScreen";
import { getManpowerContacts } from "@/lib/manpowerReport";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function ManpowerReportPage(){const session=await getSessionOrDefault();let rows:Awaited<ReturnType<typeof getManpowerContacts>>=[];let error="";try{rows=await getManpowerContacts();}catch{error="Customer contacts could not be loaded. Check the database connection and refresh.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><ManpowerReportScreen rows={rows} error={error}/></AppShell>;}
