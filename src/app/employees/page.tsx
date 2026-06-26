import Link from "next/link";
import { Suspense } from "react";
import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessWindowTabs } from "@/components/access/AccessWindowTabs";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployees, getEmployeeFilterOptions } from "@/lib/employees";
import { statusPillClass } from "@/lib/statusStyles";
import type { EmployeeSummary } from "@/types/employee";
import type { FilterOption } from "@/types/search";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const EMP_HEADERS = [
  "ID", "First", "Last", "Cell / Phone", "Trade", "Status", "Grade", "City", "State", "Current Assignment", "",
];

function EmployeeResults({ employees, error }: { employees: EmployeeSummary[]; error?: string }) {
  if (error) {
    return <ErrorAlert title="Could not load employees" message={error} />;
  }

  return (
    <div>
      <div className="ac-grid mc-scroll-smooth" style={{ maxHeight: "70vh" }}>
        <table>
          <thead>
            <tr>
              {EMP_HEADERS.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={EMP_HEADERS.length} className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]">
                  No employees found. Try adjusting your search or clearing the filters.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.employeeId}>
                  <td className="font-mono text-[#555]">{emp.employeeId || "—"}</td>
                  <td>
                    <Link href={`/employees/${emp.employeeId}`} className="font-semibold">
                      {emp.firstName || "—"}
                    </Link>
                  </td>
                  <td>{emp.lastName || "—"}</td>
                  <td>{emp.cellPhone || "—"}</td>
                  <td>{emp.trade || "—"}</td>
                  <td>
                    {emp.status ? (
                      <span className={`rounded px-1.5 py-px text-[10px] font-medium ring-1 ${statusPillClass(emp.status)}`}>
                        {emp.status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{emp.grade || "—"}</td>
                  <td>{emp.city || "—"}</td>
                  <td>{emp.state || "—"}</td>
                  <td>{emp.currentAssignment || "—"}</td>
                  <td>
                    <Link href={`/employees/${emp.employeeId}`} className="font-semibold">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="ac-recordbar">
        <span className="font-mono">
          Record: |◄ ◄ {employees.length === 0 ? 0 : 1} of {employees.length} ► ►|
        </span>
        <span className="text-[#7a7a7a]">Unfiltered</span>
        <span className="ml-auto text-[#7a7a7a]">Max 300 per page</span>
      </div>
    </div>
  );
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

  let employees: EmployeeSummary[] = [];
  let loadError: string | undefined;
  let trades: FilterOption[] = [];
  let statuses: FilterOption[] = [];
  let grades: FilterOption[] = [];
  let cities: FilterOption[] = [];
  let states: FilterOption[] = [];

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
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="-mx-2 -mt-2 mb-1.5 sm:-mx-3">
        <AccessWindowTabs
          tabs={[
            { label: "Menu", href: "/dashboard" },
            { label: "Employee Search", active: true },
          ]}
        />
      </div>
      <PageHeader title="Employee Search" icon={Users} subtitle="Read-only" />
      <div className="flex flex-col gap-1.5">
        <Suspense fallback={null}>
          <EmployeeFilters
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
        </Suspense>

        {loadError ? (
          <ErrorAlert title="Could not load employees" message={loadError} />
        ) : (
          <Suspense fallback={<div className="ac-panel p-3"><Spinner label="Loading employees…" /></div>}>
            <EmployeeResults employees={employees} />
          </Suspense>
        )}
      </div>
    </AppShell>
  );
}
