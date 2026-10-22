import { AppShell } from "@/components/layout/AppShell";
import { requireStaffAdmin } from "@/lib/auth/staff-admin";
import { StaffPermissionsScreen } from "@/components/office-staff/StaffPermissionsScreen";

export default async function StaffPermissionsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const [session, params] = await Promise.all([requireStaffAdmin(), searchParams]);
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth compactHeader>
    <StaffPermissionsScreen staffId={params.id ?? ""} />
  </AppShell>;
}
