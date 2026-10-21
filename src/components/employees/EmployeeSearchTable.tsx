"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CustomerNameColumnHeader } from "../customers/CustomerNameColumnHeader";
import { compareCustomerNameValues } from "@/lib/customerNameSearchColumns";
import { EmployeeNameCell } from "./EmployeeNameCell";
import { EMPLOYEE_SEARCH_DEFAULT_COLUMNS, type EmployeeSearchColumnKey } from "@/lib/employeeSearchColumns";
import type { EmployeeSummary } from "@/types/employee";

function cellValue(row: EmployeeSummary, key: EmployeeSearchColumnKey): string {
  const accessValue = row.accessFields[key];
  if (accessValue !== undefined && accessValue !== "") return accessValue;

  const map: Partial<Record<EmployeeSearchColumnKey, string | undefined>> = {
    EmployeeID: row.employeeId,
    EmEmployeeStatus: row.status,
    EmployeeUserFlag5: row.userFlag5,
    OnlineJobAppFolder: "Online",
    S1: row.s1,
    EmployeeProfileType: row.profileType,
    EmFirstName: row.firstName,
    EmMiddle: row.middleInitial,
    EmLastName: row.lastName,
    EmStreet: row.street,
    EmCity: row.city,
    EmState: row.state,
    EmMobilePhone: row.cellPhone,
    EmGrade: row.grade,
    EmHowReferred: row.howReferred,
    EmTrade: row.trade,
    EmQualification: row.qualification,
    AvgHrsWorked: row.averageInterview,
    FirstDateOnJob: row.fda,
    TotalHoursWorked: row.thw,
    LicenseExpDateFlag: row.licenseExpiration,
    WeekEndingDate: row.weekEnding,
    PayRate: row.payRate,
    PayrollCoOnSiteInitials: row.payrollCompany,
  };
  return map[key] ?? "";
}

export function EmployeeSearchTable({ employees: sourceEmployees, loadTiming, resetVersion = 0, sortResetVersion = 0, fetchedCount }: { employees: EmployeeSummary[]; loadTiming?: { queryMs: number; elapsed: number }; resetVersion?: number; sortResetVersion?: number; fetchedCount?: number }) {
  const columns = EMPLOYEE_SEARCH_DEFAULT_COLUMNS;
  const [filters, setFilters] = useState<Partial<Record<EmployeeSearchColumnKey, string[]>>>({});
  const [sort, setSort] = useState<{ key: EmployeeSearchColumnKey; direction: "asc" | "desc" }>();
  useEffect(() => { setFilters({}); setSort(undefined); }, [resetVersion]);
  useEffect(() => { setSort(undefined); }, [sortResetVersion]);
  const kind = (key: EmployeeSearchColumnKey): "text" | "date" | "number" => /Date|FirstDateOnJob/.test(key) ? "date" : /Hours|AvgHrs|PayRate/.test(key) ? "number" : "text";
  const employees = useMemo(() => {
    const active = Object.entries(filters) as [EmployeeSearchColumnKey, string[]][];
    const rows = active.length ? sourceEmployees.filter(row => active.every(([key, values]) => values.includes(cellValue(row, key)))) : sourceEmployees;
    return sort ? [...rows].sort((a, b) => compareCustomerNameValues(cellValue(a, sort.key).replace(kind(sort.key) === "number" ? /[$,]/g : /$^/g, ""), cellValue(b, sort.key).replace(kind(sort.key) === "number" ? /[$,]/g : /$^/g, ""), kind(sort.key)) * (sort.direction === "asc" ? 1 : -1)) : rows;
  }, [sourceEmployees, filters, sort]);
  const viewport = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  useEffect(() => { setScrollTop(0); if (viewport.current) viewport.current.scrollTop = 0; }, [employees]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () => setViewportHeight(element.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const rowHeight = 22;
  const first = Math.min(employees.length, Math.max(0, Math.floor(scrollTop / rowHeight) - 8));
  const last = Math.min(employees.length, first + Math.ceil(viewportHeight / rowHeight) + 16);
  const visible = employees.slice(first, last);
  return (
    <div className="ac-customer-search-grid-wrap ac-employee-search-grid-wrap">
      <div ref={viewport} onScroll={event => setScrollTop(event.currentTarget.scrollTop)} className="ac-grid ac-grid-tracking ac-customer-search-grid ac-employee-search-grid mc-scroll-smooth">
        <table>
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={{ width: `${col.width}px`, minWidth: `${col.width}px` }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>
                  <CustomerNameColumnHeader
                    label={col.label}
                    kind={kind(col.key)}
                    getValues={() => sourceEmployees.map((row) => cellValue(row, col.key))}
                    selected={filters[col.key]}
                    sort={sort?.key === col.key ? sort.direction : undefined}
                    onSort={direction => setSort({ key: col.key, direction })}
                    onFilter={values => setFilters(previous => { const next = { ...previous }; if (values) next[col.key] = values; else delete next[col.key]; return next; })}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {first > 0 && <tr className="ac-customer-search-virtual-spacer" aria-hidden="true"><td colSpan={columns.length}><div style={{ height: first * rowHeight }} /></td></tr>}
            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]"
                >
                  No employees found. Try adjusting your search or clearing the filters.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.employeeId}>
                  {columns.map((col) => {
                    if (col.key === "ActionSelect") {
                      return (
                        <td key={col.key} className="ac-employee-search-row-selector">
                          {row.employeeId === employees[0]?.employeeId ? "â–¶" : ""}
                        </td>
                      );
                    }
                    if (col.key === "EmFirstName" || col.key === "EmLastName") {
                      return (
                        <td key={col.key} className="font-semibold">
                          <EmployeeNameCell employeeId={row.employeeId} name={col.key === "EmFirstName" ? row.firstName : row.lastName} />
                        </td>
                      );
                    }
                    if (col.key === "OnlineJobAppFolder") {
                      return (
                        <td key={col.key} className="ac-employee-search-col-online">
                          {cellValue(row, col.key) || "â€”"}
                        </td>
                      );
                    }
                    const value = cellValue(row, col.key);
                    const columnClass =
                      col.key === "PayrollCoOnSiteInitials_IPG"
                        ? "ac-employee-search-col-ipg"
                        : col.key === "JobApplicationStatus_IPG"
                          ? "ac-employee-search-col-ipc"
                        : col.key === "EmployeeNoCommunicationText"
                        ? "ac-employee-search-col-alert"
                        : col.key === "EmMobilePhoneVerifyText"
                        ? "ac-employee-search-col-cell"
                        : col.key === "EmQualification"
                          ? "ac-employee-search-col-qualification"
                          : col.key === "LicenseExpDateFlag"
                            ? "ac-employee-search-col-license"
                            : col.key === "WeekEndingDate"
                              ? "ac-employee-search-col-week-end"
                              : undefined;
                    return (
                      <td key={col.key} className={columnClass}>
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
            {last < employees.length && <tr className="ac-customer-search-virtual-spacer" aria-hidden="true"><td colSpan={columns.length}><div style={{ height: (employees.length - last) * rowHeight }} /></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="ac-recordbar ac-customer-search-recordbar">
        <span className="font-mono">
          Record: {employees.length === 0 ? 0 : first + 1} of {employees.length.toLocaleString()}
        </span>
        <span className="text-[#7a7a7a]">{employees.length !== (fetchedCount ?? sourceEmployees.length) ? `Filtered · ${(fetchedCount ?? sourceEmployees.length).toLocaleString()} loaded` : "Unfiltered"}</span>
        <span className="ml-auto text-[#7a7a7a]">{loadTiming ? `Query: ${(loadTiming.queryMs / 1000).toFixed(2)}s · Total load: ${(loadTiming.elapsed / 1000).toFixed(2)}s` : "All employees loaded"}</span>
      </div>
    </div>
  );
}

