import Link from "next/link";
import { Suspense } from "react";
import { HardHat } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessWindowTabs } from "@/components/access/AccessWindowTabs";
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

const JOB_HEADERS = [
  "Job ID", "Customer", "Job / Site Name", "City / State",
  "Status", "Salesman", "Type", "Foreman", "Start", "End", "",
];

function JobResultsTable({ jobs }: { jobs: JobSummary[] }) {
  return (
    <div>
      <div className="ac-grid mc-scroll-smooth" style={{ maxHeight: "70vh" }}>
        <table>
          <thead>
            <tr>
              {JOB_HEADERS.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={JOB_HEADERS.length} className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]">
                  No jobs found. Try adjusting your search or clearing the filters.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.jobId}>
                  <td className="font-mono text-[#555]">{job.jobId || "—"}</td>
                  <td>
                    {job.customerId ? (
                      <Link href={`/customers/${job.customerId}`}>{job.customerName || "—"}</Link>
                    ) : (
                      job.customerName || "—"
                    )}
                  </td>
                  <td>
                    <Link href={`/jobs/${job.jobId}`} className="font-semibold">
                      {job.jobName || "—"}
                    </Link>
                  </td>
                  <td>{[job.city, job.state].filter(Boolean).join(", ") || "—"}</td>
                  <td>
                    {job.status ? (
                      <span className={`rounded px-1.5 py-px text-[10px] font-medium ring-1 ${statusPillClass(job.status)}`}>
                        {job.status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{job.salesman || "—"}</td>
                  <td>{job.customerType || "—"}</td>
                  <td>{job.foremanName || "—"}</td>
                  <td>{job.startDate || "—"}</td>
                  <td>{job.endDate || "—"}</td>
                  <td>
                    <Link href={`/jobs/${job.jobId}`} className="font-semibold">
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
          Record: |◄ ◄ {jobs.length === 0 ? 0 : 1} of {jobs.length} ► ►|
        </span>
        <span className="text-[#7a7a7a]">Unfiltered</span>
        <span className="ml-auto text-[#7a7a7a]">Max 200 per page</span>
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
  const city           = params.city           ?? "";
  const stateId        = params.stateId        ?? "";

  let jobs: JobSummary[] = [];
  let loadError: string | undefined;
  let customers: FilterOption[] = [];
  let salesmen: FilterOption[] = [];
  let customerTypes: FilterOption[] = [];
  let statuses: FilterOption[] = [];
  let cities: FilterOption[] = [];
  let states: FilterOption[] = [];

  try {
    const [result, filterOpts] = await Promise.all([
      getJobs({
        search:         search         || undefined,
        customerId:     customerId     || undefined,
        salesmanId:     salesmanId     || undefined,
        customerTypeId: customerTypeId || undefined,
        statusId:       statusId       || undefined,
        city:           city           || undefined,
        stateId:        stateId        || undefined,
      }),
      getJobFilterOptions().catch(() => ({
        customers: [], salesmen: [], customerTypes: [], statuses: [], cities: [], states: [],
      })),
    ]);
    jobs         = result.data;
    customers    = filterOpts.customers;
    salesmen     = filterOpts.salesmen;
    customerTypes = filterOpts.customerTypes;
    statuses     = filterOpts.statuses;
    cities       = filterOpts.cities;
    states       = filterOpts.states;
  } catch (err) {
    loadError = err instanceof Error
      ? err.message
      : "Database connection failed. Check SQL configuration.";
  }

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="-mx-2 -mt-2 mb-1.5 sm:-mx-3">
        <AccessWindowTabs
          tabs={[
            { label: "Menu", href: "/dashboard" },
            { label: "Job Search", active: true },
          ]}
        />
      </div>
      <PageHeader title="Jobs / Projects" icon={HardHat} subtitle="Read-only" />
      <div className="flex flex-col gap-1.5">
        <Suspense fallback={null}>
          <JobFilters
            customers={customers}
            salesmen={salesmen}
            customerTypes={customerTypes}
            statuses={statuses}
            cities={cities}
            states={states}
            currentSearch={search}
            currentCustomerId={customerId}
            currentSalesmanId={salesmanId}
            currentCustomerTypeId={customerTypeId}
            currentStatusId={statusId}
            currentCity={city}
            currentStateId={stateId}
          />
        </Suspense>

        {loadError ? (
          <ErrorAlert title="Could not load jobs" message={loadError} />
        ) : (
          <Suspense fallback={<div className="ac-panel p-3"><Spinner label="Loading jobs…" /></div>}>
            <JobResultsTable jobs={jobs} />
          </Suspense>
        )}
      </div>
    </AppShell>
  );
}
