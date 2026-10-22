import { AppShell } from "@/components/layout/AppShell";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getOfficeStaffList } from "@/lib/admin";
import { OfficeStaffScreen } from "@/components/office-staff/OfficeStaffScreen";

export default async function OfficeStaffPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const [session, params, staff] = await Promise.all([getSessionOrDefault(), searchParams, getOfficeStaffList()]);
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth compactHeader>
    <OfficeStaffScreen staff={staff} initialId={params.id} />
  </AppShell>;
}
