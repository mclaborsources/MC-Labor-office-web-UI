import { AppShell } from "@/components/layout/AppShell";
import { EmployeeQuickSearchScreen } from "@/components/employees/EmployeeQuickSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployeeQuickSearch } from "@/lib/employeeQuickSearch";
import { cachedQuickSearch, quickSearchCacheScope } from "@/lib/employeeQuickSearchCache";

export default async function EmployeeQuickSearchPage() {
  const session = await getSessionOrDefault();
  let employees: Awaited<ReturnType<typeof getEmployeeQuickSearch>>["data"] = [];
  let total = 0;
  const cacheScope = await quickSearchCacheScope(session);
  let loadError: string | undefined;
  try { const result = await cachedQuickSearch(cacheScope, { staffId: session.user?.officeStaffId }); employees = result.data; total = result.total; }
  catch { loadError = "Employee data could not be loaded. Refresh to try again."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeeQuickSearchScreen key={cacheScope} employees={employees} total={total} loadError={loadError} cacheScope={cacheScope} /></AppShell>;
}
