import { AppShell } from "@/components/layout/AppShell";
import { AccountsReceivableReportScreen } from "@/components/reports/AccountsReceivableReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getOpenInvoiceRows, type OpenInvoiceRow } from "@/lib/operationalReports";
import { CustomerReportScreen } from "@/components/reports/CustomerReportScreen";
import { getAccountsReceivableRows, getAccountsReceivableSalesmen, type AccountsReceivableRow } from "@/lib/accountsReceivable";
import type { ArSalesman } from "@/components/reports/AccountsReceivableTabs";

export default async function AccountsReceivablePage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const session=await getSessionOrDefault();
  const params = await searchParams;
  if (params.preview !== "1") {
    let customers: AccountsReceivableRow[] = [];
    let salesmen: ArSalesman[] = [];
    let customerError = "";
    try { [customers, salesmen] = await Promise.all([getAccountsReceivableRows(), getAccountsReceivableSalesmen()]); }
    catch { customerError = "Customer data could not be loaded. Check the database connection and refresh."; }
    return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CustomerReportScreen kind="ar" rows={customers} salesmen={salesmen} error={customerError}/></AppShell>;
  }
  let rows:OpenInvoiceRow[]=[];
  let error="";
  try { rows=await getOpenInvoiceRows(); }
  catch { error="The accounts receivable report could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><AccountsReceivableReportScreen rows={rows} error={error}/></AppShell>;
}
