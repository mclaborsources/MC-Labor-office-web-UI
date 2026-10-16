import { AppShell } from "@/components/layout/AppShell";
import { DepositsToBeMadeScreen } from "@/components/reports/DepositsToBeMadeScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getDepositsToBeMadeData } from "@/lib/depositsToBeMade";

export default async function DepositsToBeMadePage() {
  const session = await getSessionOrDefault();
  let data: Awaited<ReturnType<typeof getDepositsToBeMadeData>> = { rows: [], types: [] };
  let error = "";
  try { data = await getDepositsToBeMadeData(); }
  catch (cause) { error = cause instanceof Error ? cause.message : "Unable to load payments awaiting deposit."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <DepositsToBeMadeScreen {...data} initialError={error} />
  </AppShell>;
}
