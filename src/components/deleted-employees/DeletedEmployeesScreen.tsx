"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { DeletedEmployeeRow } from "@/lib/deletedEmployees";
import { trackingCsv } from "@/lib/trackingGrid";

interface Props { rows: DeletedEmployeeRow[]; comparisonOffset: 1 | 2; currentWeekEnding: string; comparisonWeekEnding: string; error?: string; }
type ColumnKey = "customer"|"salesman"|"job"|"firstName"|"lastName"|"cell"|"trade"|"weekEnding"|"semus"|"payrollCompany"|"lastWeekAssigned"|"employeeNotes"|"payrollCompanyId"|"sendLiveCheck";
type ColumnDef = { key: ColumnKey; label: string; width: number };
const DEFAULT_COLUMNS: ColumnDef[] = [
  {key:"customer",label:"Customer",width:268},{key:"salesman",label:"Salesman",width:96},{key:"job",label:"Job",width:176},
  {key:"firstName",label:"Em First Name",width:96},{key:"lastName",label:"Em Last Name",width:96},{key:"cell",label:"Cell",width:108},{key:"weekEnding",label:"Week Ending",width:118},
];
const VIEW_13_COLUMNS: ColumnDef[] = [
  {key:"customer",label:"Customer",width:239},{key:"salesman",label:"Salesman",width:96},{key:"job",label:"Job",width:168},
  {key:"firstName",label:"Em First Name",width:96},{key:"lastName",label:"Em Last Name",width:96},{key:"cell",label:"Cell",width:108},
  {key:"trade",label:"Trade",width:137},{key:"weekEnding",label:"Week Ending",width:109},{key:"semus",label:"S",width:22},
  {key:"payrollCompany",label:"Payroll Co",width:90},{key:"lastWeekAssigned",label:"Last Week Assigned",width:150},
  {key:"employeeNotes",label:"Emp Notes",width:30},{key:"payrollCompanyId",label:"PayrollCoOnSiteID",width:96},{key:"sendLiveCheck",label:"S L Ck",width:127},
];

export function DeletedEmployeesScreen({ rows, comparisonOffset, currentWeekEnding, comparisonWeekEnding, error = "" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("View 13");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [columns, setColumns] = useState<ColumnDef[]>(VIEW_13_COLUMNS);
  const visible = useMemo(() => rows.filter((row) => !query || Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const allSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));

  useEffect(() => {
    if (view === "01 Default Deleted Employees") { setColumns(DEFAULT_COLUMNS); return; }
    if (view === "View 13") { setColumns(VIEW_13_COLUMNS); return; }
    try {
      const saved = JSON.parse(localStorage.getItem(`deleted-employees-${view}`) ?? "null") as {columns?:ColumnDef[];query?:string}|null;
      setColumns(saved?.columns?.length ? saved.columns : VIEW_13_COLUMNS);
      if (saved?.query !== undefined) setQuery(saved.query);
      setMessage(saved ? `${view} loaded.` : `${view} is an empty Access user-view slot. Save View to store the current layout and filter.`);
    } catch { setColumns(VIEW_13_COLUMNS); }
  }, [view]);
  function saveView() { localStorage.setItem(`deleted-employees-${view}`, JSON.stringify({ columns, query, comparisonOffset })); setMessage(`${view} saved on this computer.`); }
  function deleteView() { localStorage.removeItem(`deleted-employees-${view}`); if (view !== "View 13" && view !== "01 Default Deleted Employees") setColumns(VIEW_13_COLUMNS); setMessage(`${view} cleared.`); }
  function value(row: DeletedEmployeeRow, key: ColumnKey) { if (key === "employeeNotes") return "Notes"; return row[key] ?? ""; }
  function exportReport() {
    const columns = ["Customer", "Salesman", "Job", "Em First Name", "Em Last Name", "Cell", "Trade", "Week Ending", "Payroll Co", "Margin", "Last Week Assigned"];
    const csv = trackingCsv(columns, visible.map((row) => [row.customer, row.salesman, row.job, row.firstName, row.lastName, row.cell, row.trade, row.weekEnding, row.payrollCompany, row.margin ?? "", row.lastWeekAssigned]));
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `deleted-employees-${comparisonWeekEnding.replaceAll("/", "-")}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="deleted-employees-screen">
    <header><h1>Deleted Employees</h1><div className="deleted-view-controls"><label>View:</label><select value={view} onChange={(event) => setView(event.target.value)}><option>01 Default Deleted Employees</option>{[13,14,15,16,17,18].map((number) => <option key={number}>View {number}</option>)}</select><AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={deleteView}>Delete View</AccessButton><label>Go To:</label><select defaultValue="" onChange={(event) => event.target.value && router.push(`/employees/${event.target.value}`)}><option value="" />{visible.map((row) => <option key={row.id} value={row.employeeId}>{row.firstName} {row.lastName}</option>)}</select><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton></div><AccessButton className="deleted-report" onClick={exportReport}>Report</AccessButton><div className="deleted-presets">{["Default", "View 14", "View 15", "View 16", "View 17", "View 18"].map((label) => <AccessButton key={label} onClick={() => setView(label === "Default" ? "01 Default Deleted Employees" : label)}>{label}</AccessButton>)}</div><AccessButton className="deleted-cancel" onClick={() => router.push("/tracking")}>Cancel</AccessButton><button className="deleted-help" aria-label="Deleted Employees help" onClick={() => setMessage(`Comparing current week ${currentWeekEnding} with ${comparisonWeekEnding}.`)}>?</button></header>
    <div className="deleted-week-filter"><label>Current Week vs.<select value={comparisonOffset} onChange={(event) => router.push(`/deleted-employees?compare=${event.target.value}`)}><option value={1}>Last Week</option><option value={2}>Two Weeks Ago</option></select></label></div>
    <div className="deleted-search-row"><label>Search in Employee:<input value={query} onChange={(event) => setQuery(event.target.value)} /></label><div><span>Select:</span><AccessButton onClick={() => setSelected(allSelected ? new Set() : new Set(visible.map((row) => row.id)))}>{allSelected ? "None" : "All"}</AccessButton></div></div>
    {(error || message) && <p className="deleted-message" role={error ? "alert" : "status"}>{error || message}</p>}
    <div className="deleted-grid-wrap"><table style={{width: Math.max(900, columns.reduce((sum,column)=>sum+column.width,20))}}><colgroup><col style={{width:20}} />{columns.map(column=><col key={column.key} style={{width:column.width}} />)}</colgroup><thead><tr><th />{columns.map(column=><th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{visible.map((row, index) => <tr key={row.id} className={index === 0 ? "is-current" : undefined} onDoubleClick={() => router.push(`/employees/${row.employeeId}`)}><td><input type="checkbox" checked={selected.has(row.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })} aria-label={`Select ${row.firstName} ${row.lastName}`} /></td>{columns.map(column=><td key={column.key}>{column.key === "employeeNotes" ? <a href={`/employees/${row.employeeId}`}>{value(row,column.key)}</a> : value(row,column.key)}</td>)}</tr>)}{!visible.length && <tr><td colSpan={columns.length+1}>No employees were removed between the selected tracking weeks.</td></tr>}</tbody></table></div>
    <footer><span>Record: {visible.length ? 1 : 0} of {visible.length}</span><span className={query ? "is-filtered" : ""}>⌕ {query ? "Filtered" : "No Filter"}</span><input aria-label="Search deleted employees" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} /></footer>
  </section>;
}
