import { AppShell } from "@/components/layout/AppShell";
import { EmployeeSearchScreen } from "@/components/employees/EmployeeSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployees, getEmployeeFilterOptions } from "@/lib/employees";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function EmployeesPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;

  const search = params.search ?? "";
  const tradeId = params.tradeId ?? "";
  const statusId = params.statusId ?? "";
  const gradeId = params.gradeId ?? "";
  const city = params.city ?? "";
  const state = params.state ?? "";

  let employees: Awaited<ReturnType<typeof getEmployees>>["data"] = [];
  let loadError: string | undefined;
  let trades: Awaited<ReturnType<typeof getEmployeeFilterOptions>>["trades"] = [];
  let statuses: Awaited<ReturnType<typeof getEmployeeFilterOptions>>["statuses"] = [];
  let grades: Awaited<ReturnType<typeof getEmployeeFilterOptions>>["grades"] = [];
  let cities: Awaited<ReturnType<typeof getEmployeeFilterOptions>>["cities"] = [];
  let states: Awaited<ReturnType<typeof getEmployeeFilterOptions>>["states"] = [];

  try {
    const [result, filterOpts] = await Promise.all([
      getEmployees({
        search: search || undefined,
        tradeId: tradeId || undefined,
        statusId: statusId || undefined,
        gradeId: gradeId || undefined,
        city: city || undefined,
        state: state || undefined,
      }),
      getEmployeeFilterOptions().catch(() => ({
        trades: [],
        statuses: [],
        grades: [],
        cities: [],
        states: [],
      })),
    ]);
    employees = result.data;
    trades = filterOpts.trades;
    statuses = filterOpts.statuses;
    grades = filterOpts.grades;
    cities = filterOpts.cities;
    states = filterOpts.states;
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Database connection failed. Check SQL configuration.";
  }

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <EmployeeSearchScreen
        employees={employees}
        loadError={loadError}
        trades={trades}
        statuses={statuses}
        grades={grades}
        cities={cities}
        states={states}
        currentSearch={search}
        currentTradeId={tradeId}
        currentStatusId={statusId}
        currentGradeId={gradeId}
        currentCity={city}
        currentState={state}
      />
    </AppShell>
  );
}
