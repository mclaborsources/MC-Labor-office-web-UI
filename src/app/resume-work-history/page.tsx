import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmailAddressesScreen } from "@/components/email-addresses/EmailAddressesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getResumeWorkHistoryRows } from "@/lib/adminDropdownReports";
export const dynamic = "force-dynamic";
export default async function Page() {
 const session = await getSessionOrDefault();
 if (!session.isLoggedIn || !session.user?.active) redirect("/login");
 let rows: Awaited<ReturnType<typeof getResumeWorkHistoryRows>> = []; let error = "";
 try { rows = await getResumeWorkHistoryRows(); } catch { error = "Resume or work history records could not be loaded from SQL Server."; }
 return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmailAddressesScreen rows={rows} error={error} resume /></AppShell>;
}
