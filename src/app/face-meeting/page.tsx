import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmailAddressesScreen } from "@/components/email-addresses/EmailAddressesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getFaceMeetingRows } from "@/lib/adminDropdownReports";
export const dynamic = "force-dynamic";
export default async function Page() {
 const session = await getSessionOrDefault();
 if (!session.isLoggedIn || !session.user?.active) redirect("/login");
 let rows: Awaited<ReturnType<typeof getFaceMeetingRows>> = []; let error = "";
 try { rows = await getFaceMeetingRows(); } catch { error = "Face meeting records could not be loaded from SQL Server."; }
 return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmailAddressesScreen rows={rows} error={error} face /></AppShell>;
}
