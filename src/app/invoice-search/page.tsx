import { AppShell } from "@/components/layout/AppShell";
import { InvoiceSearchScreen } from "@/components/invoice-search/InvoiceSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getInvoiceSearchRows } from "@/lib/adminDropdownReports";

export default async function InvoiceSearchPage() {
  const session = await getSessionOrDefault();
  let rows = [] as Awaited<ReturnType<typeof getInvoiceSearchRows>>;
  let error = "";
  try { rows = await getInvoiceSearchRows(); }
  catch { error = "Invoice records could not be loaded from SQL Server."; }
  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <InvoiceSearchScreen rows={rows} error={error} />
    </AppShell>
  );
}
