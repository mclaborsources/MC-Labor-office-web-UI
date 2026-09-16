"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { DeletedEmployeeRow } from "@/lib/deletedEmployees";
import { trackingCsv } from "@/lib/trackingGrid";

interface Props { rows: DeletedEmployeeRow[]; comparisonOffset: 1 | 2; currentWeekEnding: string; comparisonWeekEnding: string; error?: string; }
const EXTRA_COLUMNS = ["Text Msg Add", "Advance Amount", "E", "PayrollCoOn", "S L Ck"];

export function DeletedEmployeesScreen({ rows, comparisonOffset, currentWeekEnding, comparisonWeekEnding, error = "" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("View 13");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const visible = useMemo(() => rows.filter((row) => !query || Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const allSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));

  function saveView() { localStorage.setItem("deleted-employees-view", JSON.stringify({ view, query, comparisonOffset })); setMessage("View saved on this computer."); }
  function exportReport() {
    const columns = ["Customer", "Salesman", "Job", "Em First Name", "Em Last Name", "Cell", "Trade", "Week Ending", "Payroll Co", "Margin", "Last Week Assigned"];
    const csv = trackingCsv(columns, visible.map((row) => [row.customer, row.salesman, row.job, row.firstName, row.lastName, row.cell, row.trade, row.weekEnding, row.payrollCompany, row.margin ?? "", row.lastWeekAssigned]));
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `deleted-employees-${comparisonWeekEnding.replaceAll("/", "-")}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="deleted-employees-screen">
    <header><h1>Deleted Employees</h1><div className="deleted-view-controls"><label>View:</label><select value={view} onChange={(event) => setView(event.target.value)}>{[13,14,15,16,17,18].map((number) => <option key={number}>View {number}</option>)}</select><AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={() => { localStorage.removeItem("deleted-employees-view"); setMessage("Saved view deleted."); }}>Delete View</AccessButton><label>Go To:</label><select defaultValue="" onChange={(event) => event.target.value && router.push(`/employees/${event.target.value}`)}><option value="" />{visible.map((row) => <option key={row.id} value={row.employeeId}>{row.firstName} {row.lastName}</option>)}</select><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton></div><AccessButton className="deleted-report" onClick={exportReport}>Report</AccessButton><div className="deleted-presets">{["Default", "View 14", "View 15", "View 16", "View 17", "View 18"].map((label) => <AccessButton key={label} onClick={() => setView(label === "Default" ? "View 13" : label)}>{label}</AccessButton>)}</div><AccessButton className="deleted-cancel" onClick={() => router.push("/tracking")}>Cancel</AccessButton><button className="deleted-help" aria-label="Deleted Employees help" onClick={() => setMessage(`Comparing current week ${currentWeekEnding} with ${comparisonWeekEnding}.`)}>?</button></header>
    <div className="deleted-week-filter"><label>Current Week vs.<select value={comparisonOffset} onChange={(event) => router.push(`/deleted-employees?compare=${event.target.value}`)}><option value={1}>Last Week</option><option value={2}>Two Weeks Ago</option></select></label></div>
    <div className="deleted-search-row"><label>Search in Employee:<input value={query} onChange={(event) => setQuery(event.target.value)} /></label><div><span>Select:</span><AccessButton onClick={() => setSelected(allSelected ? new Set() : new Set(visible.map((row) => row.id)))}>{allSelected ? "None" : "All"}</AccessButton></div></div>
    {(error || message) && <p className="deleted-message" role={error ? "alert" : "status"}>{error || message}</p>}
    <div className="deleted-grid-wrap"><table><thead><tr><th /><th>Customer</th><th>Salesman</th><th>Job</th><th>Em First Name</th><th>Em Last Name</th><th>Cell</th><th>Trade</th><th>Week Ending</th><th /><th>Payroll Co</th><th>Text Msg Add</th><th>Advance Amount</th><th>Margin</th><th>Last Week Assigned</th><th>E</th><th>PayrollCoOn</th><th>S L Ck</th></tr></thead><tbody>{visible.map((row, index) => <tr key={row.id} className={index === 0 ? "is-current" : undefined} onDoubleClick={() => router.push(`/employees/${row.employeeId}`)}><td><input type="checkbox" checked={selected.has(row.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })} aria-label={`Select ${row.firstName} ${row.lastName}`} /></td><td>{row.customer}</td><td>{row.salesman}</td><td>{row.job}</td><td>{row.firstName}</td><td>{row.lastName}</td><td>{row.cell}</td><td>{row.trade}</td><td>{row.weekEnding}</td><td /><td>{row.payrollCompany}</td><td /><td /><td>{row.margin}</td><td>{row.lastWeekAssigned}</td>{EXTRA_COLUMNS.slice(2).map((column) => <td key={column}>{column === "E" ? <a href={`/employees/${row.employeeId}`}>Notes</a> : ""}</td>)}</tr>)}{!visible.length && <tr><td colSpan={18}>No employees were removed between the selected tracking weeks.</td></tr>}</tbody></table></div>
    <footer><span>Record: {visible.length ? 1 : 0} of {visible.length}</span><span className={query ? "is-filtered" : ""}>⌕ {query ? "Filtered" : "No Filter"}</span><input aria-label="Search deleted employees" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} /></footer>
  </section>;
}
