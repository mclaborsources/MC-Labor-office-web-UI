import { AppShell } from "@/components/layout/AppShell";
import { EmployeeSearchLoader } from "@/components/employees/EmployeeSearchLoader";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployeeFilterOptions } from "@/lib/employees";

interface PageProps { searchParams: Promise<Record<string, string | undefined>> }

export default async function EmployeesPage({ searchParams }: PageProps) {
  const [session, params, options] = await Promise.all([
    getSessionOrDefault(), searchParams,
    getEmployeeFilterOptions().catch(() => ({ trades: [], statuses: [], grades: [], cities: [], states: [] })),
  ]);
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <EmployeeSearchLoader key={JSON.stringify(params)} {...options}
      currentSearch={params.search ?? ""} currentTradeId={params.tradeId ?? ""}
      currentStatusId={params.statusId ?? ""} currentGradeId={params.gradeId ?? ""}
      currentCity={params.city ?? ""} currentState={params.state ?? ""} />
  </AppShell>;
}
