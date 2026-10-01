import { AppShell } from "@/components/layout/AppShell";
import { EmailAddressesScreen } from "@/components/email-addresses/EmailAddressesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmailAddressRows } from "@/lib/adminDropdownReports";

export default async function EmailAddressesPage() {
  const session = await getSessionOrDefault();
  let rows = [] as Awaited<ReturnType<typeof getEmailAddressRows>>;
  let error = "";
  try { rows = await getEmailAddressRows(); }
  catch { error = "Employee email records could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmailAddressesScreen rows={rows} error={error} /></AppShell>;
}
