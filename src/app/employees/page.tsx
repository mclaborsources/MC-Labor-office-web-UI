import Link from "next/link";
import { Suspense } from "react";
import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployees, getEmployeeFilterOptions } from "@/lib/employees";
import type { EmployeeSummary } from "@/types/employee";
import type { FilterOption } from "@/types/search";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function EmployeeResults({
  employees,
  error,
}: {
  employees: EmployeeSummary[];
  error?: string;
}) {
  if (error) {
    return (
      <ErrorAlert
        title="Could not load employees"
        message={error}
      />
    );
  }

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No employees found"
        message="Try adjusting your search or clearing the filters."
      />
    );
  }

  return (
    <div className="mc-panel overflow-hidden">
      <div className="overflow-x-auto mc-scroll-smooth">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Cell Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Trade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => (
              <tr
                key={emp.employeeId}
                style={i < 10 ? { animationDelay: `${i * 25}ms` } : undefined}
                className={`border-b border-slate-100/80 transition-colors duration-100 ${
                  i % 2 === 0 ? "bg-white/60" : "bg-slate-50/50"
                } hover:bg-blue-50/60 group ${i < 10 ? "mc-animate-in" : ""}`}
              >
                <td className="px-4 py-2.5 border-r border-slate-100/80 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {emp.employeeId || "—"}
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 whitespace-nowrap">
                  <Link
                    href={`/employees/${emp.employeeId}`}
                    className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {emp.fullName}
                  </Link>
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {emp.cellPhone || "—"}
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {emp.email ? (
                    <a
                      href={`mailto:${emp.email}`}
                      className="hover:text-blue-700 hover:underline"
                    >
                      {emp.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {emp.trade || "—"}
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 whitespace-nowrap">
                  {emp.status ? (
                    <Badge
                      variant={
                        emp.status.toLowerCase().includes("active")
                          ? "success"
                          : emp.status.toLowerCase().includes("inactive")
                          ? "muted"
                          : "muted"
                      }
                    >
                      {emp.status}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                  {emp.grade || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 backdrop-blur-sm">
        <span>
          Showing <span className="font-semibold text-slate-700">{employees.length}</span> result{employees.length !== 1 ? "s" : ""}
        </span>
        <span className="text-slate-400">Max 200 per page</span>
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

  let employees: EmployeeSummary[] = [];
  let loadError: string | undefined;
  let trades: FilterOption[] = [];
  let statuses: FilterOption[] = [];
  let grades: FilterOption[] = [];

  try {
    const [result, filterOpts] = await Promise.all([
      getEmployees({
        search: search || undefined,
        tradeId: tradeId || undefined,
        statusId: statusId || undefined,
        gradeId: gradeId || undefined,
      }),
      getEmployeeFilterOptions().catch(() => ({
        trades: [],
        statuses: [],
        grades: [],
      })),
    ]);
    employees = result.data;
    trades = filterOpts.trades;
    statuses = filterOpts.statuses;
    grades = filterOpts.grades;
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Database connection failed. Check SQL configuration.";
  }

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <PageHeader
        title="Employee Search"
        icon={Users}
        subtitle="Read-only · Milestone 2"
      />
      <div className="flex flex-col gap-4">
        <Suspense fallback={null}>
          <EmployeeFilters
            trades={trades}
            statuses={statuses}
            grades={grades}
            currentSearch={search}
            currentTradeId={tradeId}
            currentStatusId={statusId}
            currentGradeId={gradeId}
          />
        </Suspense>

        {loadError ? (
          <Panel>
            <ErrorAlert
              title="Could not load employees"
              message={loadError}
            />
          </Panel>
        ) : (
          <Suspense fallback={<Panel><Spinner label="Loading employees…" /></Panel>}>
            <EmployeeResults employees={employees} />
          </Suspense>
        )}
      </div>
    </AppShell>
  );
}
