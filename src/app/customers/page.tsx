import { AppShell } from "@/components/layout/AppShell";
import { CachedCustomersPage } from "@/components/customers/CachedCustomersPage";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  const scope = JSON.stringify([session.user?.userId, session.officeStaffLoginId, session.loginGeneration]);
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <CachedCustomersPage scope={scope} params={params} />
  </AppShell>;
}
