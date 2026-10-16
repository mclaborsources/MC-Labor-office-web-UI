import { AppShell } from "@/components/layout/AppShell";
import { AccountsReceivableReportScreen } from "@/components/reports/AccountsReceivableReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getOpenInvoiceRows, type OpenInvoiceRow } from "@/lib/operationalReports";

export default async function AccountsReceivablePage() {
  const session=await getSessionOrDefault();
  let rows:OpenInvoiceRow[]=[];
  let error="";
  try { rows=await getOpenInvoiceRows(); }
  catch { error="The accounts receivable report could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><AccountsReceivableReportScreen rows={rows} error={error}/></AppShell>;
}
