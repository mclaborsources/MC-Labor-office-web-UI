import { AppShell } from "@/components/layout/AppShell";
import { HealthInsuranceScreen } from "@/components/health-insurance/HealthInsuranceScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getHealthInsuranceRows } from "@/lib/healthInsurance";
import { thisWeekDayDate } from "@/lib/week";

interface PageProps { searchParams: Promise<Record<string, string | undefined>>; }

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function HealthInsurancePage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;
  const minWeekEndingDate = /^\d{4}-\d{2}-\d{2}$/.test(params.minWeekEndingDate ?? "") ? params.minWeekEndingDate! : isoDate(thisWeekDayDate(new Date(), 7));
  let rows: Awaited<ReturnType<typeof getHealthInsuranceRows>> = [];
  let error = "";
  try { rows = await getHealthInsuranceRows(minWeekEndingDate); }
  catch { error = "Health insurance assignments could not be loaded. Check the SQL Server connection in Admin."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth legacyAccessFrame legacyAccessTabs={[{ label: "Menu", href: "/dashboard" }, { label: "Tracking", href: "/tracking" }, { label: "Health Ins", active: true }]}><HealthInsuranceScreen rows={rows} minWeekEndingDate={minWeekEndingDate} error={error} /></AppShell>;
}
