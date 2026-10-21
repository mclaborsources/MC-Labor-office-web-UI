"use client";

import Link from "next/link";
import { Suspense, useState, type ReactNode } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import { EmployeeSearchViewsPanel, EmployeeSearchUtilityRail } from "@/components/employees/EmployeeSearchViewsPanel";
import { EmployeeSearchTable } from "./EmployeeSearchTable";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import type { EmployeeSummary } from "@/types/employee";
import type { FilterOption } from "@/types/search";

export interface EmployeeSearchScreenProps {
  results?: ReactNode;
  onEmployeeSearch?: (values: Record<string, string>) => void;
  onClearFilters?: () => void;
  onSort?: () => void;
  onTradeChange?: (tradeId: string) => void;
  searchResetVersion?: number;
  employees: EmployeeSummary[];
  loadError?: string;
  trades: FilterOption[];
  statuses: FilterOption[];
  grades: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
  currentSearch: string;
  currentTradeId: string;
  currentStatusId: string;
  currentGradeId: string;
  currentCity: string;
  currentState: string;
}

const EMPLOYEE_SEARCH_SIDE_ROWS = [
  { label: "Name", employee: true, contact: true },
  { label: "Cell #", employee: true, contact: true },
  { label: "Email", employee: true, contact: true },
  { label: "Text", employee: true, contact: true },
  { label: "Lic #", employee: true, contact: false },
] as const;

function EmployeeSearchSidebar({ onSearch, resetVersion = 0 }: { onSearch?: (values: Record<string, string>) => void; resetVersion?: number }) {
  const [useButton, setUseButton] = useState(false);
  const values = (form: HTMLFormElement) => Object.fromEntries(Array.from(new FormData(form)).map(([key, value]) => [key, String(value)]));
  return (
    <aside className="ac-customer-search-sidebar ac-employee-search-sidebar shrink-0">
      <div className="ac-customer-search-screen-size">
        <span className="ac-customer-search-screen-size-label">Screen Size</span>
        <AccessButton data-action-status="missing" className="ac-customer-search-screen-normal">
          Normal
        </AccessButton>
        <div className="ac-customer-search-screen-grid">
          {[1, 2, 3, 4].map((n) => (
            <AccessButton data-action-status="missing" key={n} xs className="ac-customer-search-screen-num">
              {n}
            </AccessButton>
          ))}
          {[1, 2, 3, 4].map((n) => (
            <AccessButton data-action-status="missing" key={`save-${n}`} xs className="ac-customer-search-screen-save">
              Save
            </AccessButton>
          ))}
        </div>
      </div>

      <div className="ac-customer-search-side-search-wrap">
        <div className="ac-customer-search-side-label" aria-hidden>
          Search
        </div>
        <form key={resetVersion} className="ac-customer-search-side-main" onSubmit={event => { event.preventDefault(); onSearch?.(values(event.currentTarget)); }} onChange={event => { if (!useButton) onSearch?.(values(event.currentTarget)); }}>
          <div className="ac-customer-search-side-grid-area">
            <div className="ac-customer-search-side-grid">
              <div className="ac-customer-search-side-corner" />
              <div className="ac-customer-search-side-head">Employee</div>
              <div className="ac-customer-search-side-head">Contact</div>

              {EMPLOYEE_SEARCH_SIDE_ROWS.map((row) => (
                <div key={row.label} className="ac-customer-search-side-row">
                  <div className="ac-customer-search-side-field-label">{row.label}:</div>
                  {row.employee ? (
                    <input
                      readOnly={!onSearch}
                      className="ac-input ac-customer-search-side-input"
                      name={row.label}
                      defaultValue=""
                      aria-label={`Employee ${row.label}`}
                    />
                  ) : (
                    <div className="ac-customer-search-side-spacer" aria-hidden />
                  )}
                  {row.contact ? (
                    <input
                      readOnly
                      className="ac-input ac-customer-search-side-input"
                      value=""
                      aria-label={`Contact ${row.label}`}
                    />
                  ) : (
                    <div className="ac-customer-search-side-spacer" aria-hidden />
                  )}
                </div>
              ))}
            </div>

            <div className="ac-customer-search-side-search-col">
              <AccessButton data-action-status={onSearch ? "complete" : "missing"} type="submit" xs className="ac-customer-search-side-search-btn">
                Search
              </AccessButton>
              <div className="ac-customer-search-use-button">
                <span className="ac-customer-search-use-button-label">Use Button</span>
                <label className="ac-customer-search-use-radio">
                  <input type="radio" name="emp-use-button" checked={useButton} onChange={() => setUseButton(true)} />
                  <span>Yes</span>
                </label>
                <label className="ac-customer-search-use-radio">
                  <input type="radio" name="emp-use-button" checked={!useButton} onChange={() => setUseButton(false)} />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          <div className="ac-employee-search-side-footer">
            <span className="ac-customer-search-action-label">Select:</span>
            <AccessButton data-action-status="missing" xs>
              Text All #
            </AccessButton>
          </div>
        </form>
      </div>
    </aside>
  );
}

function EmployeeGridToolbar({ onClearFilters, onSort }: Pick<EmployeeSearchScreenProps, "onClearFilters" | "onSort">) {
  return (
    <div className="ac-employee-search-grid-toolbar shrink-0">
      <div className="ac-customer-search-action-group">
        <span className="ac-customer-search-action-label">Select:</span>
        <AccessButton data-action-status="missing" xs>
          Clear
        </AccessButton>
        <AccessButton data-action-status="missing" xs>
          All
        </AccessButton>
        <AccessButton data-action-status="missing" xs>
          Email
        </AccessButton>
        <AccessButton data-action-status="missing" xs>
          Text
        </AccessButton>
        <AccessButton data-action-status="missing" xs>
          Text All #
        </AccessButton>
        <AccessButton data-action-status="missing" xs>
          Letter
        </AccessButton>
        <AccessButton data-action-status="missing" xs>
          Postcard
        </AccessButton>
      </div>
      <input readOnly className="ac-input ac-employee-search-yellow-input" aria-label="Selection highlight" />
      <AccessButton data-action-status="missing" xs>
        Update Column
      </AccessButton>
      <span className="ac-flabel">View:</span>
      <select className="ac-select ac-customer-search-view-select-wide" defaultValue="01" aria-label="View">
        {Array.from({ length: 10 }, (_, i) => {
          const value = String(i + 1).padStart(2, "0");
          return (
            <option key={value} value={value}>
              View {value}
            </option>
          );
        })}
      </select>
      <AccessButton data-action-status="missing" xs>
        Save
      </AccessButton>
      <AccessButton data-action-status="missing" xs>
        Delete
      </AccessButton>
      <label className="ac-employee-search-goto-field">
        <span className="ac-flabel">Go To:</span>
        <input readOnly className="ac-input" aria-label="Go To" />
      </label>
      {onClearFilters ? <AccessButton data-action-status="complete" onClick={onClearFilters} xs>Clear Filters</AccessButton> : <Link href="/employees"><AccessButton data-action-status="linked" xs>Clear Filters</AccessButton></Link>}
      <AccessButton data-action-status={onSort ? "complete" : "missing"} onClick={onSort} xs>
        Sort
      </AccessButton>
      <AccessButton data-action-status="missing" xs className="ac-employee-search-delete-employee-btn">
        Delete Employee
      </AccessButton>
    </div>
  );
}

export function EmployeeSearchScreen({
  onEmployeeSearch,
  onClearFilters,
  onSort,
  onTradeChange,
  searchResetVersion,
  results: resultsContent,
  employees,
  loadError,
  trades,
  statuses,
  grades,
  cities,
  states,
  currentSearch,
  currentTradeId,
  currentStatusId,
  currentGradeId,
  currentCity,
  currentState,
}: EmployeeSearchScreenProps) {
  return (
    <div className="ac-customer-search-page ac-employee-search-page flex min-h-0 flex-1 flex-col">
      <div className="ac-customer-search ac-employee-search ac-tracking--modern flex min-h-0 flex-1 flex-col">
        <div className="ac-customer-search-titlebar ac-employee-search-titlebar shrink-0">
          <span className="ac-customer-search-title">Employee Search 3</span>
          <AccessButton data-action-status="missing" xs>
            New
          </AccessButton>
          <AccessButton data-action-status="missing" xs>
            New SUB
          </AccessButton>
          <AccessButton data-action-status="missing" xs className="ac-employee-search-cancel-btn">
            Cancel
          </AccessButton>
        </div>

        <div className="ac-customer-search-body min-h-0 flex-1 flex-col">
          <div className="ac-panel ac-panel-elevated ac-customer-search-shell ac-employee-search-shell min-h-0 flex-1">
            <div className="ac-customer-search-shell-inner">
              <EmployeeSearchSidebar onSearch={onEmployeeSearch} resetVersion={searchResetVersion} />
              <EmployeeSearchViewsPanel
                onTradeChange={onTradeChange}
                onSort={onSort}
                trades={trades}
                statuses={statuses}
                grades={grades}
                cities={cities}
                states={states}
                currentSearch={currentSearch}
                currentTradeId={currentTradeId}
                currentStatusId={currentStatusId}
                currentGradeId={currentGradeId}
                currentCity={currentCity}
                currentState={currentState}
              />
              <EmployeeSearchUtilityRail />
            </div>
          </div>

          <div className="ac-panel ac-panel-elevated ac-employee-search-grid-panel shrink-0">
            <EmployeeGridToolbar onClearFilters={onClearFilters} onSort={onSort} />
          </div>

          <div className="ac-panel ac-panel-elevated ac-customer-search-results-panel ac-employee-search-results-panel min-h-0 flex-1">
            <div className="ac-customer-search-results min-h-0 flex-1">
              {loadError ? (
                <ErrorAlert title="Could not load employees" message={loadError} />
              ) : (
                <Suspense
                  fallback={
                    <div className="ac-panel p-3">
                      <Spinner label="Loading employeesâ€¦" />
                    </div>
                  }
                >
                  {resultsContent ?? <EmployeeSearchTable employees={employees} />}
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
