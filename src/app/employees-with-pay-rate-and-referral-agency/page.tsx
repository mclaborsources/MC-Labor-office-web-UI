import { AppShell } from "@/components/layout/AppShell";
import { EmployeePayRateReferralAgencyScreen } from "@/components/employees/EmployeePayRateReferralAgencyScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployeesWithPayRateAndReferralAgency } from "@/lib/employeePayRateReferralAgency";

export default async function EmployeesWithPayRateAndReferralAgencyPage() {
  const session = await getSessionOrDefault();
  let rows: Awaited<ReturnType<typeof getEmployeesWithPayRateAndReferralAgency>> = [];
  let loadError = "";
  try {
    rows = await getEmployeesWithPayRateAndReferralAgency();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load employee pay rates and referral agencies.";
  }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <EmployeePayRateReferralAgencyScreen rows={rows} loadError={loadError} />
  </AppShell>;
}
