import { AppShell } from "@/components/layout/AppShell";
import { InvoiceSearchScreen } from "@/components/invoice-search/InvoiceSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function InvoiceSearchPage() {
  const session = await getSessionOrDefault();
  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <InvoiceSearchScreen />
    </AppShell>
  );
}
