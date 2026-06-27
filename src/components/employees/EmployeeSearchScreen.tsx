import Link from "next/link";
import { Suspense } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import { EmployeeSearchViewsPanel, EmployeeSearchUtilityRail } from "@/components/employees/EmployeeSearchViewsPanel";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import {
  EMPLOYEE_SEARCH_COLUMNS,
  type EmployeeSearchColumnKey,
} from "@/lib/employeeSearchColumns";
import type { EmployeeSummary } from "@/types/employee";
import type { FilterOption } from "@/types/search";

interface EmployeeSearchScreenProps {
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

function cellValue(row: EmployeeSummary, key: EmployeeSearchColumnKey): string {
  const map: Partial<Record<EmployeeSearchColumnKey, string | undefined>> = {
    status: row.status,
    firstName: row.firstName,
    middleInitial: row.middleInitial,
    lastName: row.lastName,
    street: row.street,
    city: row.city,
    state: row.state,
    cellPhone: row.cellPhone,
    grade: row.grade,
    trade: row.trade,
    online: "Online",
  };
  return map[key] ?? "";
}

function EmployeeSearchTable({ employees }: { employees: EmployeeSummary[] }) {
  return (
    <div className="ac-customer-search-grid-wrap ac-employee-search-grid-wrap">
      <div className="ac-grid ac-grid-tracking ac-customer-search-grid ac-employee-search-grid mc-scroll-smooth">
        <table>
          <thead>
            <tr>
              {EMPLOYEE_SEARCH_COLUMNS.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan={EMPLOYEE_SEARCH_COLUMNS.length}
                  className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]"
                >
                  No employees found. Try adjusting your search or clearing the filters.
                </td>
              </tr>
            ) : (
              employees.map((row) => (
                <tr key={row.employeeId}>
                  {EMPLOYEE_SEARCH_COLUMNS.map((col) => {
                    if (col.key === "firstName") {
                      return (
                        <td key={col.key}>
                          <Link href={`/employees/${row.employeeId}`} className="font-semibold">
                            {row.firstName || "—"}
                          </Link>
                        </td>
                      );
                    }
                    if (col.key === "online") {
                      return (
                        <td key={col.key} className="ac-employee-search-col-online">
                          {cellValue(row, col.key) || "—"}
                        </td>
                      );
                    }
                    if (col.key === "alert") {
                      return (
                        <td key={col.key} className="ac-employee-search-col-alert text-center">
                          {row.status ? "■" : "—"}
                        </td>
                      );
                    }
                    const value = cellValue(row, col.key);
                    const highlight =
                      col.key === "cell" || col.key === "grade" || col.key === "qualification" || col.key === "licExp";
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
          Record: |◄ ◄ {employees.length === 0 ? 0 : 1} of {employees.length} ► ►|
        </span>
        <span className="text-[#7a7a7a]">Unfiltered</span>
        <span className="ml-auto text-[#7a7a7a]">Max 300 per page</span>
      </div>
    </div>
  );
}

const EMPLOYEE_SEARCH_SIDE_ROWS = [
  { label: "Name", employee: true, contact: true },
  { label: "Cell #", employee: true, contact: true },
  { label: "Email", employee: true, contact: true },
  { label: "Text", employee: true, contact: true },
  { label: "Lic #", employee: true, contact: false },
] as const;

function EmployeeSearchSidebar() {
  return (
    <aside className="ac-customer-search-sidebar ac-employee-search-sidebar shrink-0">
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
              <div className="ac-customer-search-side-head">Employee</div>
              <div className="ac-customer-search-side-head">Contact</div>

              {EMPLOYEE_SEARCH_SIDE_ROWS.map((row) => (
                <div key={row.label} className="ac-customer-search-side-row">
                  <div className="ac-customer-search-side-field-label">{row.label}:</div>
                  {row.employee ? (
                    <input
                      readOnly
                      className="ac-input ac-customer-search-side-input"
                      value=""
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
              <AccessButton xs disabled className="ac-customer-search-side-search-btn">
                Search
              </AccessButton>
              <div className="ac-customer-search-use-button">
                <span className="ac-customer-search-use-button-label">Use Button</span>
                <label className="ac-customer-search-use-radio">
                  <input type="radio" name="emp-use-button" defaultChecked disabled />
                  <span>Yes</span>
                </label>
                <label className="ac-customer-search-use-radio">
                  <input type="radio" name="emp-use-button" disabled />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          <div className="ac-employee-search-side-footer">
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

function EmployeeGridToolbar() {
  return (
    <div className="ac-employee-search-grid-toolbar shrink-0">
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
      <Link href="/employees">
        <AccessButton xs>Clear Filters</AccessButton>
      </Link>
      <AccessButton xs disabled>
        Sort
      </AccessButton>
      <AccessButton xs disabled className="ac-employee-search-delete-employee-btn">
        Delete Employee
      </AccessButton>
    </div>
  );
}

export function EmployeeSearchScreen({
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
          <AccessButton xs disabled>
            New
          </AccessButton>
          <AccessButton xs disabled>
            New SUB
          </AccessButton>
          <AccessButton xs disabled className="ac-employee-search-cancel-btn">
            Cancel
          </AccessButton>
        </div>

        <div className="ac-customer-search-body min-h-0 flex-1 flex-col">
          <div className="ac-panel ac-panel-elevated ac-customer-search-shell ac-employee-search-shell min-h-0 flex-1">
            <div className="ac-customer-search-shell-inner">
              <EmployeeSearchSidebar />
              <EmployeeSearchViewsPanel
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
            <EmployeeGridToolbar />
          </div>

          <div className="ac-panel ac-panel-elevated ac-customer-search-results-panel ac-employee-search-results-panel min-h-0 flex-1">
            <div className="ac-customer-search-results min-h-0 flex-1">
              {loadError ? (
                <ErrorAlert title="Could not load employees" message={loadError} />
              ) : (
                <Suspense
                  fallback={
                    <div className="ac-panel p-3">
                      <Spinner label="Loading employees…" />
                    </div>
                  }
                >
                  <EmployeeSearchTable employees={employees} />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
