import { AppShell } from "@/components/layout/AppShell";
import { MileageLogScreen } from "@/components/mileage-log/MileageLogScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getMileageSalesmen, type MileageSalesman } from "@/lib/mileageLog";

export default async function MileageLogPage() {
  const session = await getSessionOrDefault();
  let salesmen: MileageSalesman[] = [];
  try { salesmen = await getMileageSalesmen(); } catch { /* The screen provides its own database error state. */ }
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><MileageLogScreen initialSalesmen={salesmen} userName={session.user?.username ?? ""} /></AppShell>;
}
