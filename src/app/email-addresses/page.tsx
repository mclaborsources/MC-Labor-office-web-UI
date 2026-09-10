import { AppShell } from "@/components/layout/AppShell";
import { EmailAddressesScreen } from "@/components/email-addresses/EmailAddressesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function EmailAddressesPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmailAddressesScreen /></AppShell>;
}
