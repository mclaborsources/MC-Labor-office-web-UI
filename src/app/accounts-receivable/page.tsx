import { AppShell } from "@/components/layout/AppShell";
import { CustomerReportScreen } from "@/components/reports/CustomerReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function AccountsReceivablePage() {const session=await getSessionOrDefault();return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CustomerReportScreen kind="ar" rows={[]} error="Accounts receivable balances, payments, and aging rules have not been mapped to SQL yet."/></AppShell>;}
