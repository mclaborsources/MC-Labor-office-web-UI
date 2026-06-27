import Link from "next/link";
import { Suspense } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import { JobSearchViewsPanel, JobSearchUtilityRail } from "@/components/jobs/JobSearchViewsPanel";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import { JOB_SEARCH_COLUMNS, type JobSearchColumnKey } from "@/lib/jobSearchColumns";
import { statusPillClass } from "@/lib/statusStyles";
import type { JobSummary } from "@/types/job";
import type { FilterOption } from "@/types/search";

interface JobSearchScreenProps {
  jobs: JobSummary[];
  loadError?: string;
  customers: FilterOption[];
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
  currentSearch: string;
  currentCustomerId: string;
  currentSalesmanId: string;
  currentCustomerTypeId: string;
  currentStatusId: string;
  currentCity: string;
  currentStateId: string;
}

function cellValue(row: JobSummary, key: JobSearchColumnKey): string {
  const map: Partial<Record<JobSearchColumnKey, string | undefined>> = {
    status: row.status,
    jobId: row.jobId,
    customerName: row.customerName,
    jobName: row.jobName,
    city: row.city,
    state: row.state,
    zip: row.zip,
    salesman: row.salesman,
    customerType: row.customerType,
    foremanName: row.foremanName,
    startDate: row.startDate,
    endDate: row.endDate,
  };
  return map[key] ?? "";
}

function JobSearchTable({ jobs }: { jobs: JobSummary[] }) {
  return (
    <div className="ac-customer-search-grid-wrap ac-employee-search-grid-wrap ac-job-search-grid-wrap">
      <div className="ac-grid ac-grid-tracking ac-customer-search-grid ac-employee-search-grid ac-job-search-grid mc-scroll-smooth">
        <table>
          <thead>
            <tr>
              {JOB_SEARCH_COLUMNS.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={JOB_SEARCH_COLUMNS.length}
                  className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]"
                >
                  No jobs found. Try adjusting your search or clearing the filters.
                </td>
              </tr>
            ) : (
              jobs.map((row) => (
                <tr key={row.jobId}>
                  {JOB_SEARCH_COLUMNS.map((col) => {
                    if (col.key === "jobName") {
                      return (
                        <td key={col.key}>
                          <Link href={`/jobs/${row.jobId}`} className="font-semibold">
                            {row.jobName || "—"}
                          </Link>
                        </td>
                      );
                    }
                    if (col.key === "customerName") {
                      return (
                        <td key={col.key}>
                          {row.customerId ? (
                            <Link href={`/customers/${row.customerId}`}>{row.customerName || "—"}</Link>
                          ) : (
                            row.customerName || "—"
                          )}
                        </td>
                      );
                    }
                    if (col.key === "status") {
                      const status = row.status;
                      return (
                        <td key={col.key}>
                          {status ? (
                            <span
                              className={`rounded px-1.5 py-px text-[10px] font-medium ring-1 ${statusPillClass(status)}`}
                            >
                              {status}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    }
                    const value = cellValue(row, col.key);
                    const highlight = col.key === "foremanName" || col.key === "startDate" || col.key === "endDate";
                    return (
                      <td key={col.key} className={highlight ? "ac-employee-search-col-highlight" : undefined}>
                        {value || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="ac-recordbar ac-customer-search-recordbar">
        <span className="font-mono">
          Record: |◄ ◄ {jobs.length === 0 ? 0 : 1} of {jobs.length} ► ►|
        </span>
        <span className="text-[#7a7a7a]">Unfiltered</span>
        <span className="ml-auto text-[#7a7a7a]">Max 200 per page</span>
      </div>
    </div>
  );
}

const JOB_SEARCH_SIDE_ROWS = [
  { label: "Name", customer: true, job: true },
  { label: "Ph/Cell #", customer: true, job: true },
  { label: "Job Name", customer: false, job: true },
  { label: "City", customer: false, job: true },
  { label: "Status", customer: false, job: true },
] as const;

function JobSearchSidebar() {
  return (
    <aside className="ac-customer-search-sidebar ac-employee-search-sidebar ac-job-search-sidebar shrink-0">
      <div className="ac-customer-search-screen-size">
        <span className="ac-customer-search-screen-size-label">Screen Size</span>
        <AccessButton disabled className="ac-customer-search-screen-normal">
          Normal
        </AccessButton>
        <div className="ac-customer-search-screen-grid">
          {[1, 2, 3, 4].map((n) => (
            <AccessButton key={n} xs disabled className="ac-customer-search-screen-num">
              {n}
            </AccessButton>
          ))}
          {[1, 2, 3, 4].map((n) => (
            <AccessButton key={`save-${n}`} xs disabled className="ac-customer-search-screen-save">
              Save
            </AccessButton>
          ))}
        </div>
      </div>

      <div className="ac-customer-search-side-search-wrap">
        <div className="ac-customer-search-side-label" aria-hidden>
          Search
        </div>
        <div className="ac-customer-search-side-main">
          <div className="ac-customer-search-side-grid-area">
            <div className="ac-customer-search-side-grid">
              <div className="ac-customer-search-side-corner" />
              <div className="ac-customer-search-side-head">Customer</div>
              <div className="ac-customer-search-side-head">Job</div>

              {JOB_SEARCH_SIDE_ROWS.map((row) => (
                <div key={row.label} className="ac-customer-search-side-row">
                  <div className="ac-customer-search-side-field-label">{row.label}:</div>
                  {row.customer ? (
                    <input
                      readOnly
                      className="ac-input ac-customer-search-side-input"
                      value=""
                      aria-label={`Customer ${row.label}`}
                    />
                  ) : (
                    <div className="ac-customer-search-side-spacer" aria-hidden />
                  )}
                  {row.job ? (
                    <input
                      readOnly
                      className="ac-input ac-customer-search-side-input"
                      value=""
                      aria-label={`Job ${row.label}`}
                    />
                  ) : (
                    <div className="ac-customer-search-side-spacer" aria-hidden />
                  )}
                </div>
              ))}
            </div>

            <div className="ac-customer-search-side-search-col">
              <AccessButton xs disabled className="ac-customer-search-side-search-btn">
                Search
              </AccessButton>
              <div className="ac-customer-search-use-button">
                <span className="ac-customer-search-use-button-label">Use Button</span>
                <label className="ac-customer-search-use-radio">
                  <input type="radio" name="job-use-button" defaultChecked disabled />
                  <span>Yes</span>
                </label>
                <label className="ac-customer-search-use-radio">
                  <input type="radio" name="job-use-button" disabled />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          <div className="ac-employee-search-side-footer ac-job-search-side-footer">
            <span className="ac-customer-search-action-label">Select:</span>
            <AccessButton xs disabled>
              Text All #
            </AccessButton>
          </div>
        </div>
      </div>
    </aside>
  );
}

function JobGridToolbar() {
  return (
    <div className="ac-employee-search-grid-toolbar ac-job-search-grid-toolbar shrink-0">
      <div className="ac-customer-search-action-group">
        <span className="ac-customer-search-action-label">Select:</span>
        <AccessButton xs disabled>
          Clear
        </AccessButton>
        <AccessButton xs disabled>
          All
        </AccessButton>
        <AccessButton xs disabled>
          Email
        </AccessButton>
        <AccessButton xs disabled>
          Text
        </AccessButton>
        <AccessButton xs disabled>
          Text All #
        </AccessButton>
        <AccessButton xs disabled>
          Letter
        </AccessButton>
        <AccessButton xs disabled>
          Postcard
        </AccessButton>
      </div>
      <input readOnly className="ac-input ac-employee-search-yellow-input" aria-label="Selection highlight" />
      <AccessButton xs disabled>
        Update Column
      </AccessButton>
      <span className="ac-flabel">View:</span>
      <select disabled className="ac-select ac-customer-search-view-select-wide" defaultValue="01" aria-label="View">
        <option value="01">View 01</option>
      </select>
      <AccessButton xs disabled>
        Save
      </AccessButton>
      <AccessButton xs disabled>
        Delete
      </AccessButton>
      <label className="ac-employee-search-goto-field">
        <span className="ac-flabel">Go To:</span>
        <input readOnly className="ac-input" aria-label="Go To" />
      </label>
      <Link href="/jobs">
        <AccessButton xs>Clear Filters</AccessButton>
      </Link>
      <AccessButton xs disabled>
        Sort
      </AccessButton>
      <AccessButton xs disabled className="ac-job-search-delete-job-btn">
        Delete Job
      </AccessButton>
    </div>
  );
}

export function JobSearchScreen({
  jobs,
  loadError,
  customers,
  salesmen,
  customerTypes,
  statuses,
  cities,
  states,
  currentSearch,
  currentCustomerId,
  currentSalesmanId,
  currentCustomerTypeId,
  currentStatusId,
  currentCity,
  currentStateId,
}: JobSearchScreenProps) {
  return (
    <div className="ac-customer-search-page ac-employee-search-page ac-job-search-page flex min-h-0 flex-1 flex-col">
      <div className="ac-customer-search ac-employee-search ac-job-search ac-tracking--modern flex min-h-0 flex-1 flex-col">
        <div className="ac-customer-search-titlebar ac-employee-search-titlebar ac-job-search-titlebar shrink-0">
          <span className="ac-customer-search-title">Job Search</span>
          <AccessButton xs disabled>
            New
          </AccessButton>
          <AccessButton xs disabled>
            New Sub Job
          </AccessButton>
          <AccessButton xs disabled className="ac-employee-search-cancel-btn">
            Cancel
          </AccessButton>
        </div>

        <div className="ac-customer-search-body min-h-0 flex-1 flex-col">
          <div className="ac-panel ac-panel-elevated ac-customer-search-shell ac-employee-search-shell ac-job-search-shell min-h-0 flex-1">
            <div className="ac-customer-search-shell-inner">
              <JobSearchSidebar />
              <JobSearchViewsPanel
                customers={customers}
                salesmen={salesmen}
                customerTypes={customerTypes}
                statuses={statuses}
                cities={cities}
                states={states}
                currentSearch={currentSearch}
                currentCustomerId={currentCustomerId}
                currentSalesmanId={currentSalesmanId}
                currentCustomerTypeId={currentCustomerTypeId}
                currentStatusId={currentStatusId}
                currentCity={currentCity}
                currentStateId={currentStateId}
              />
              <JobSearchUtilityRail />
            </div>
          </div>

          <div className="ac-panel ac-panel-elevated ac-employee-search-grid-panel ac-job-search-grid-panel shrink-0">
            <JobGridToolbar />
          </div>

          <div className="ac-panel ac-panel-elevated ac-customer-search-results-panel ac-employee-search-results-panel ac-job-search-results-panel min-h-0 flex-1">
            <div className="ac-customer-search-results min-h-0 flex-1">
              {loadError ? (
                <ErrorAlert title="Could not load jobs" message={loadError} />
              ) : (
                <Suspense
                  fallback={
                    <div className="ac-panel p-3">
                      <Spinner label="Loading jobs…" />
                    </div>
                  }
                >
                  <JobSearchTable jobs={jobs} />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
