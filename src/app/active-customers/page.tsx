import { AppShell } from "@/components/layout/AppShell";
import { CustomerReportScreen } from "@/components/reports/CustomerReportScreen";
import { getReportCustomers } from "@/lib/reportCustomers";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function ActiveCustomersPage() { const session=await getSessionOrDefault(); let rows:Awaited<ReturnType<typeof getReportCustomers>>=[];let error="";try{rows=await getReportCustomers();}catch{error="Customer tracking data could not be loaded. Check the database connection and refresh.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CustomerReportScreen kind="active" rows={rows} error={error}/></AppShell>; }
