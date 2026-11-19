import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import { AppShell } from "@/components/layout/AppShell";
import { AccountingReportsSearchScreen } from "@/components/reports/AccountingReportsSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function AccountingReportsPage() {
  const session = await getSessionOrDefault();
  const [options,weeks] = await Promise.all([getAccountingReportOptions(true),getNewReportSearchWeeks()]);
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><AccountingReportsSearchScreen options={options} weeks={weeks} /></AppShell>;
}
