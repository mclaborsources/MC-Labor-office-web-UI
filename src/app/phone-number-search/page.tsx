import { AppShell } from "@/components/layout/AppShell";
import { PhoneNumberSearchScreen } from "@/components/phone-number-search/PhoneNumberSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function PhoneNumberSearchPage() {
  const session = await getSessionOrDefault();
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><PhoneNumberSearchScreen /></AppShell>;
}
