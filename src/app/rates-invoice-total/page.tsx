import { AppShell } from "@/components/layout/AppShell";
import { RatesInvoiceTotalScreen } from "@/components/reports/RatesInvoiceTotalScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getRatesInvoiceTotalRows } from "@/lib/ratesInvoiceTotal";
import { thisWeekDayDate } from "@/lib/week";

export default async function RatesInvoiceTotalPage() {
  const session = await getSessionOrDefault();
  const friday = thisWeekDayDate(new Date(), 7);
  const weekEnding = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, "0")}-${String(friday.getDate()).padStart(2, "0")}`;
  let rows = [] as Awaited<ReturnType<typeof getRatesInvoiceTotalRows>>;
  let error = "";
  try { rows = await getRatesInvoiceTotalRows(weekEnding); }
  catch { error = "Rates and invoice data could not be loaded from the office database."; }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport>
    <RatesInvoiceTotalScreen initialWeekEnding={weekEnding} initialRows={rows} initialError={error} />
  </AppShell>;
}
