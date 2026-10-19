import { AppShell } from "@/components/layout/AppShell";
import { OpenInvoicesScreen } from "@/components/reports/OpenInvoicesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getOpenInvoiceFilterOptions, getOpenInvoiceRows, type OpenInvoiceFilterOptions, type OpenInvoiceRow } from "@/lib/operationalReports";
export default async function OpenInvoicesPage(){
  const session=await getSessionOrDefault();
  let rows:OpenInvoiceRow[]=[];
  let filters:OpenInvoiceFilterOptions={contracts:[],salesmen:[],aging:[]};
  let error="";
  try { [rows,filters]=await Promise.all([getOpenInvoiceRows(),getOpenInvoiceFilterOptions()]); }
  catch { error="Open invoices could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><OpenInvoicesScreen initialRows={rows} initialFilters={filters} initialError={error}/></AppShell>;
}
