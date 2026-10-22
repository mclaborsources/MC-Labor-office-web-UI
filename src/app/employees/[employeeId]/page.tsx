import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeRecordScreen } from "@/components/employees/EmployeeRecordScreen";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployeeById, getEmployeeFilterOptions, getEmployeeHealthInsuranceDropdownOptions, getEmployeeLicenseDropdownOptions, getEmployeeQuickSearchOptions, getEmployeeReferralAgencyOptions } from "@/lib/employees";

interface PageProps { params: Promise<{ employeeId: string }>; searchParams?: Promise<{ view?: string }> }

export default async function EmployeeDetailPage({ params, searchParams }: PageProps) {
  const [{ employeeId }, query, session] = await Promise.all([params, searchParams ?? Promise.resolve<{ view?: string }>({}), getSessionOrDefault()]);
  let employee: Awaited<ReturnType<typeof getEmployeeById>> = null;
  let employeeOptions: Awaited<ReturnType<typeof getEmployeeQuickSearchOptions>> = [];
  let employeeFilters: Awaited<ReturnType<typeof getEmployeeFilterOptions>> | null = null;
  let licenseDropdowns: Awaited<ReturnType<typeof getEmployeeLicenseDropdownOptions>> = {};
  let healthInsuranceDropdowns: Awaited<ReturnType<typeof getEmployeeHealthInsuranceDropdownOptions>> = { insurance: [], flags: [] };
  let referralAgencyOptions: string[] = [];
  let loadError: string | undefined;
  try {
    [employee, employeeOptions, employeeFilters, licenseDropdowns, healthInsuranceDropdowns, referralAgencyOptions] = await Promise.all([
      getEmployeeById(employeeId),
      getEmployeeQuickSearchOptions().catch(() => []),
      getEmployeeFilterOptions().catch(() => null),
      getEmployeeLicenseDropdownOptions().catch(() => ({})),
      getEmployeeHealthInsuranceDropdownOptions().catch(() => ({ insurance: [], flags: [] })),
      getEmployeeReferralAgencyOptions().catch(() => []),
    ]);
  }
  catch (error) { loadError = error instanceof Error ? error.message : "Failed to load employee."; }
  if (!loadError && !employee) notFound();

  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader>
    {loadError ? <ErrorAlert title="Could not load employee" message={loadError} /> : employee ? <EmployeeRecordScreen employee={employee} employeeOptions={employeeOptions} licenseDropdowns={licenseDropdowns} healthInsuranceDropdowns={healthInsuranceDropdowns} referralAgencyOptions={referralAgencyOptions} tradeOptions={employeeFilters?.trades.map(option => option.label) ?? []} qualificationOptions={employeeFilters?.qualifications.map(option => option.label) ?? []} stateOptions={employeeFilters?.states.map(option => option.label) ?? []} initialView={query.view === "quick-search" ? "Quick Search" : "Default"} /> : null}
  </AppShell>;
}
