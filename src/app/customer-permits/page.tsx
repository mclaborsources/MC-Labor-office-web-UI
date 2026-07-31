import { AppShell } from "@/components/layout/AppShell";
import { CustomerPermitsScreen } from "@/components/customer-permits/CustomerPermitsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function CustomerPermitsPage() {
  const session = await getSessionOrDefault();
  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <CustomerPermitsScreen />
    </AppShell>
  );
}
