import { AppShell } from "@/components/layout/AppShell";
import { ContactReportScreen } from "@/components/reports/ContactReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getContactReportRows, type ContactReportRow } from "@/lib/contactReports";

export default async function InvoicesContactReportPage() {
  const session = await getSessionOrDefault();
  let rows: ContactReportRow[] = []; let error = "";
  try { rows = await getContactReportRows("invoices"); } catch { error = "Invoice contacts could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><ContactReportScreen kind="invoices" rows={rows} error={error} /></AppShell>;
}
