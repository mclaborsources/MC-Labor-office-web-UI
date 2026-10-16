import { AppShell } from "@/components/layout/AppShell";
import { WeeklyCertifiedPayrollScreen } from "@/components/reports/WeeklyCertifiedPayrollScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCertifiedPayrollWeeks, getWeeklyCertifiedPayrollRows } from "@/lib/weeklyCertifiedPayroll";
import type { WeeklyCertifiedPayrollRow } from "@/lib/weeklyCertifiedPayroll";

interface PageProps { searchParams: Promise<{ weekEnding?: string }> }

export default async function WeeklyCertifiedPayrollPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  let weeks = [] as Awaited<ReturnType<typeof getCertifiedPayrollWeeks>>;
  let rows: WeeklyCertifiedPayrollRow[] = [];
  let error = "";
  try {
    weeks = await getCertifiedPayrollWeeks();
    const params = await searchParams;
    const requested = params.weekEnding;
    const weekEnding = weeks.some((week) => week.value === requested) ? requested! : (weeks[0]?.value ?? "");
    if (weekEnding) rows = await getWeeklyCertifiedPayrollRows(weekEnding);
    return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <WeeklyCertifiedPayrollScreen weeks={weeks} rows={rows} initialWeekEnding={weekEnding} />
    </AppShell>;
  } catch {
    error = "Weekly Certified Payroll data could not be loaded. Check the SQL Server connection in Admin.";
  }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <WeeklyCertifiedPayrollScreen weeks={weeks} rows={rows} initialWeekEnding={weeks[0]?.value ?? ""} error={error} />
  </AppShell>;
}
