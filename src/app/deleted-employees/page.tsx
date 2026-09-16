import { AppShell } from "@/components/layout/AppShell";
import { DeletedEmployeesScreen } from "@/components/deleted-employees/DeletedEmployeesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getDeletedEmployees } from "@/lib/deletedEmployees";

interface PageProps { searchParams: Promise<Record<string, string | undefined>>; }

export default async function DeletedEmployeesPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;
  const comparisonOffset: 1 | 2 = params.compare === "2" ? 2 : 1;
  let result = { rows: [], currentWeekEnding: "", comparisonWeekEnding: "" } as Awaited<ReturnType<typeof getDeletedEmployees>>;
  let error = "";
  try { result = await getDeletedEmployees(comparisonOffset); }
  catch { error = "Deleted employee assignments could not be loaded. Check the SQL Server connection in Admin."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth legacyAccessFrame legacyAccessTabs={[{ label: "Menu", href: "/dashboard" }, { label: "Tracking", href: "/tracking" }, { label: "Deleted Employees", active: true }]}><DeletedEmployeesScreen {...result} comparisonOffset={comparisonOffset} error={error} /></AppShell>;
}
