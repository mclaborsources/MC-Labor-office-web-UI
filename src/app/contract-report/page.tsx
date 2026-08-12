import { AppShell } from "@/components/layout/AppShell";
import { ContractReportScreen } from "@/components/contract-report/ContractReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function ContractReportPage() {
  const session = await getSessionOrDefault();

  return (
    <AppShell
      userDisplayName={session.user?.displayName}
      fillViewport
      fullWidth
    >
      <ContractReportScreen />
    </AppShell>
  );
}
