"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { CustomerNameColumnHeader } from "../customers/CustomerNameColumnHeader";
import { compareCustomerNameValues } from "@/lib/customerNameSearchColumns";
import { EmployeeNameCell } from "./EmployeeNameCell";
import { EMPLOYEE_SEARCH_DEFAULT_COLUMNS, EMPLOYEE_SEARCH_COLUMNS, type EmployeeSearchColumnKey } from "@/lib/employeeSearchColumns";
import { defaultEmployeeViewLayout } from "@/lib/employeeSavedViews";
import { useEmployeeSavedViews } from "./EmployeeSavedViews";
import type { EmployeeSummary } from "@/types/employee";

function cellValue(row: EmployeeSummary, key: EmployeeSearchColumnKey): string {
  const accessValue = row.accessFields[key];
  if (accessValue !== undefined && accessValue !== "") return accessValue;

  const map: Partial<Record<EmployeeSearchColumnKey, string | undefined>> = {
    EmployeeID: row.employeeId,
    EmEmployeeStatus: row.status,
    EmployeeUserFlag5: row.userFlag5,
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
  const saved = useEmployeeSavedViews();
  const [localLayout, setLocalLayout] = useState(defaultEmployeeViewLayout);
  const layout = saved?.layout ?? localLayout;
  const setLayout = saved?.setLayout ?? setLocalLayout;
  const columns = useMemo(() => layout.order
    .filter(key => !layout.hidden.includes(key))
    .map(key => EMPLOYEE_SEARCH_DEFAULT_COLUMNS.find(column => column.key === key) ?? EMPLOYEE_SEARCH_COLUMNS.find(column => column.key === key))
    .filter((column): column is NonNullable<typeof column> => Boolean(column)), [layout.order, layout.hidden]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>();
  const [flagOverrides, setFlagOverrides] = useState<Record<string, boolean>>({});
  const filters = layout.filters;
  const sort = layout.sort;
  const [draggedColumn, setDraggedColumn] = useState<EmployeeSearchColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<EmployeeSearchColumnKey | null>(null);
  const [unhideColumnsOpen, setUnhideColumnsOpen] = useState(false);
  const setFilters = (update: typeof filters | ((current: typeof filters) => typeof filters)) => setLayout(current => ({ ...current, filters: typeof update === "function" ? update(current.filters) : update }));
  const setSort = (next: typeof sort) => setLayout(current => ({ ...current, sort: next }));
  const resizeColumn = (key: EmployeeSearchColumnKey, width: number) => setLayout(current => ({ ...current, widths: { ...current.widths, [key]: Math.max(48, Math.min(1600, Math.round(width))) } }));
  const resetColumnWidth = (key: EmployeeSearchColumnKey) => setLayout(current => { const widths = { ...current.widths }; delete widths[key]; return { ...current, widths }; });
  useEffect(() => { setFilters({}); setSort(null); }, [resetVersion]);
  useEffect(() => { setSort(null); }, [sortResetVersion]);
  function hideColumn(key: EmployeeSearchColumnKey) {
    setLayout(current => current.hidden.length >= EMPLOYEE_SEARCH_COLUMNS.length - 1 || current.hidden.includes(key)
      ? current
      : { ...current, hidden: [...current.hidden, key] });
  }
  function setColumnVisible(key: EmployeeSearchColumnKey, visible: boolean) {
    setLayout(current => ({ ...current, hidden: visible ? current.hidden.filter(item => item !== key) : current.hidden.includes(key) || current.hidden.length >= EMPLOYEE_SEARCH_COLUMNS.length - 1 ? current.hidden : [...current.hidden, key] }));
  }
  function reorderColumn(source: EmployeeSearchColumnKey, target: EmployeeSearchColumnKey) {
    if (source === target) return;
    setLayout(current => {
      const from = current.order.indexOf(source), to = current.order.indexOf(target);
      if (from < 0 || to < 0) return current;
      const order = [...current.order];
      order.splice(from, 1);
      order.splice(to, 0, source);
      return { ...current, order };
    });
  }
  function beginColumnDrag(key: EmployeeSearchColumnKey, event: DragEvent<HTMLDivElement>) {
    setDraggedColumn(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }
  function dropColumn(key: EmployeeSearchColumnKey, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const source = draggedColumn ?? event.dataTransfer.getData("text/plain") as EmployeeSearchColumnKey;
    if (source) reorderColumn(source, key);
    setDraggedColumn(null);
    setDragOverColumn(null);
  }
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
        <table data-column-count={columns.length}>
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={{ width: `${layout.widths[col.key] ?? col.width}px`, minWidth: `${layout.widths[col.key] ?? col.width}px` }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>
                  <CustomerNameColumnHeader
                    label={col.label}
                    columnKey={col.key}
                    kind={kind(col.key)}
                    getValues={() => sourceEmployees.map((row) => cellValue(row, col.key))}
                    selected={filters[col.key]}
                    sort={sort?.key === col.key ? sort.direction : undefined}
                    onSort={direction => setSort({ key: col.key, direction })}
                    onFilter={values => setFilters(previous => { const next = { ...previous }; if (values) next[col.key] = values; else delete next[col.key]; return next; })}
                    width={layout.widths[col.key] ?? col.width}
                    onResize={width => resizeColumn(col.key, width)}
                    onResetWidth={() => resetColumnWidth(col.key)}
                    onHide={columns.length > 1 ? () => hideColumn(col.key) : undefined}
                    onUnhideColumns={() => setUnhideColumnsOpen(true)}
                    onDragStart={event => beginColumnDrag(col.key, event)}
                    onDragOver={event => { event.preventDefault(); setDragOverColumn(col.key); }}
                    onDrop={event => dropColumn(col.key, event)}
                    onDragEnd={() => { setDraggedColumn(null); setDragOverColumn(null); }}
                    dragging={draggedColumn === col.key}
                    dropTarget={dragOverColumn === col.key && draggedColumn !== col.key}
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
                <tr key={row.employeeId} className={(selectedEmployee ?? employees[0]?.employeeId) === row.employeeId ? "is-selected" : undefined} onClick={() => setSelectedEmployee(row.employeeId)}>
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
                    if (col.key === "EmployeeReturnToSender" || col.key === "EmployeeRIP") {
                      const flagId = `${row.employeeId}:${col.key}`;
                      const checked = flagOverrides[flagId] ?? /^(1|true|yes|y|x|-1)$/i.test(value.trim());
                      return <td key={col.key} className="ac-employee-search-boolean-cell"><input type="checkbox" aria-label={`${col.label} for ${row.firstName} ${row.lastName}`} checked={checked} onChange={event => setFlagOverrides(current => ({ ...current, [flagId]: event.target.checked }))} /></td>;
                    }
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
      {unhideColumnsOpen && createPortal(<div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setUnhideColumnsOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", background: "rgba(0,0,0,.35)" }}>
        <section role="dialog" aria-modal="true" aria-labelledby="employee-unhide-title" style={{ width: 380, maxWidth: "calc(100vw - 32px)", maxHeight: "min(640px, calc(100vh - 32px))", display: "flex", flexDirection: "column", background: "white", border: "1px solid #999", borderRadius: 6, boxShadow: "0 12px 36px rgba(0,0,0,.28)" }}>
          <header style={{ padding: "12px 16px", borderBottom: "1px solid #ddd", fontWeight: 600 }} id="employee-unhide-title">Unhide Columns</header>
          <div style={{ overflow: "auto", padding: "12px 16px", display: "grid", gap: 5 }}>
            <span style={{ fontSize: 13, marginBottom: 3 }}>Column:</span>
            {EMPLOYEE_SEARCH_COLUMNS.map(column => {
              const checked = !layout.hidden.includes(column.key);
              return <label key={column.key} style={{ display: "flex", alignItems: "center", gap: 7, minHeight: 21, fontSize: 13 }}><input type="checkbox" checked={checked} onChange={event => setColumnVisible(column.key, event.target.checked)} />{column.label}</label>;
            })}
          </div>
          <footer style={{ padding: "10px 16px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "flex-end" }}><button type="button" className="ac-btn ac-btn-xs" onClick={() => setUnhideColumnsOpen(false)}>Close</button></footer>
        </section>
      </div>, document.body)}
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

