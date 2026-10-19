import { AppShell } from "@/components/layout/AppShell";
import { ContactReportScreen } from "@/components/reports/ContactReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getContactReportRows, getContactReportSalesmen, type ContactReportRow } from "@/lib/contactReports";

export default async function InvoicesContactReportPage() {
  const session = await getSessionOrDefault();
  let rows: ContactReportRow[] = []; let total = 0; let queryMs = 0; let salesmen: string[] = []; let error = "";
  try {
    const [result, salesmanOptions] = await Promise.all([getContactReportRows("invoices", { page: 1, pageSize: 250 }), getContactReportSalesmen()]);
    rows = result.rows; total = result.total; queryMs = result.queryMs; salesmen = salesmanOptions;
  } catch { error = "Invoice contacts could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><ContactReportScreen kind="invoices" rows={rows} total={total} pageSize={250} queryMs={queryMs} salesmen={salesmen} error={error} /></AppShell>;
}
