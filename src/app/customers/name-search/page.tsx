import { AppShell } from "@/components/layout/AppShell";
import { CustomerNameSearchScreen } from "@/components/customers/CustomerNameSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function CustomerNameSearchPage() {
  const session = await getSessionOrDefault();
  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <CustomerNameSearchScreen />
    </AppShell>
  );
}
