import Link from "next/link";
import { Suspense } from "react";
import { HardHat } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import { JobFilters } from "@/components/jobs/JobFilters";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getJobs, getJobFilterOptions } from "@/lib/jobs";
import { statusPillClass } from "@/lib/statusStyles";
import type { JobSummary } from "@/types/job";
import type { FilterOption } from "@/types/search";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function JobResultsTable({ jobs }: { jobs: JobSummary[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={HardHat}
        title="No jobs found"
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
              {[
                "Job ID", "Customer", "Job / Site Name", "City / State",
                "Status", "Salesman", "Type", "Foreman", "Start", "End",
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10 last:border-r-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => (
              <tr
                key={job.jobId}
                style={i < 10 ? { animationDelay: `${i * 25}ms` } : undefined}
                className={`border-b border-slate-100/80 transition-colors duration-100 ${
                  i % 2 === 0 ? "bg-white/60" : "bg-slate-50/50"
                } hover:bg-blue-50/60 group ${i < 10 ? "mc-animate-in" : ""}`}
              >
                <td className="px-3 py-2.5 border-r border-slate-100/80 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {job.jobId || "—"}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-100/80 whitespace-nowrap">
                  {job.customerId ? (
                    <Link
                      href={`/customers/${job.customerId}`}
                      className="text-slate-600 hover:text-blue-700 hover:underline"
                    >
                      {job.customerName || "—"}
                    </Link>
                  ) : (
                    job.customerName || "—"
                  )}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-100/80 whitespace-nowrap font-medium">
                  <Link
                    href={`/jobs/${job.jobId}`}
                    className="text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {job.jobName || "—"}
                  </Link>
                </td>
                <td className="px-3 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {[job.city, job.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-100/80 whitespace-nowrap">
                  {job.status ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusPillClass(job.status)}`}>
                      {job.status}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {job.salesman || "—"}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {job.customerType || "—"}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {job.foremanName || "—"}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-100/80 text-slate-500 whitespace-nowrap text-xs">
                  {job.startDate || "—"}
                </td>
                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap text-xs">
                  {job.endDate || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 backdrop-blur-sm">
        <span>
          Showing <span className="font-semibold text-slate-700">{jobs.length}</span> result{jobs.length !== 1 ? "s" : ""}
        </span>
        <span className="text-slate-400">Max 200 per page</span>
      </div>
    </div>
  );
}

export default async function JobsPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;

  const search         = params.search         ?? "";
  const customerId     = params.customerId     ?? "";
  const salesmanId     = params.salesmanId     ?? "";
  const customerTypeId = params.customerTypeId ?? "";
  const statusId       = params.statusId       ?? "";

  let jobs: JobSummary[] = [];
  let loadError: string | undefined;
  let customers: FilterOption[] = [];
  let salesmen: FilterOption[] = [];
  let customerTypes: FilterOption[] = [];
  let statuses: FilterOption[] = [];

  try {
    const [result, filterOpts] = await Promise.all([
      getJobs({
        search:         search         || undefined,
        customerId:     customerId     || undefined,
        salesmanId:     salesmanId     || undefined,
        customerTypeId: customerTypeId || undefined,
        statusId:       statusId       || undefined,
      }),
      getJobFilterOptions().catch(() => ({
        customers: [], salesmen: [], customerTypes: [], statuses: [],
      })),
    ]);
    jobs         = result.data;
    customers    = filterOpts.customers;
    salesmen     = filterOpts.salesmen;
    customerTypes = filterOpts.customerTypes;
    statuses     = filterOpts.statuses;
  } catch (err) {
    loadError = err instanceof Error
      ? err.message
      : "Database connection failed. Check SQL configuration.";
  }

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <PageHeader
        title="Jobs / Projects"
        icon={HardHat}
        subtitle="Read-only · Milestone 3"
      />
      <div className="flex flex-col gap-4">
        <Suspense fallback={null}>
          <JobFilters
            customers={customers}
            salesmen={salesmen}
            customerTypes={customerTypes}
            statuses={statuses}
            currentSearch={search}
            currentCustomerId={customerId}
            currentSalesmanId={salesmanId}
            currentCustomerTypeId={customerTypeId}
            currentStatusId={statusId}
          />
        </Suspense>

        {loadError ? (
          <Panel>
            <ErrorAlert title="Could not load jobs" message={loadError} />
          </Panel>
        ) : (
          <Suspense fallback={<Panel><Spinner label="Loading jobs…" /></Panel>}>
            <JobResultsTable jobs={jobs} />
          </Suspense>
        )}
      </div>
    </AppShell>
  );
}
