import { AppShell } from "@/components/layout/AppShell";
import { CustomerSearch1Screen } from "@/components/customers/CustomerSearch1Screen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomerFilterOptions } from "@/lib/customers";
import { getOfficeStaffList } from "@/lib/admin";

export default async function CustomerSearch1Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [session, params, options, officeStaff] = await Promise.all([
    getSessionOrDefault(), searchParams,
    getCustomerFilterOptions().catch(() => ({ salesmen: [], customerTypes: [], statuses: [], cities: [], states: [] })),
    getOfficeStaffList().catch(() => []),
  ]);
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <CustomerSearch1Screen cacheScope={JSON.stringify([session.user?.userId, session.officeStaffLoginId, session.loginGeneration])} key={JSON.stringify(params)} params={params} loadTimeMs={0} loadError=""
      options={options} lastActionUsers={officeStaff.filter(staff => staff.initials).map(staff => ({ value: staff.initials, label: staff.initials }))} />
  </AppShell>;
}
