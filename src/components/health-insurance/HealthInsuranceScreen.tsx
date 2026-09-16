"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HealthInsuranceRow } from "@/lib/healthInsurance";
import { AccessButton } from "@/components/access/AccessButton";

interface Props { rows: HealthInsuranceRow[]; minWeekEndingDate: string; error?: string; }

const EMPTY_COLUMNS = ["Text Msg Add", "Rec", "Em Allow Time Texts", "Last Week Assigned", "Advance Amount"];

export function HealthInsuranceScreen({ rows, minWeekEndingDate, error = "" }: Props) {
  const router = useRouter();
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [view, setView] = useState("01 Default Health Ins");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const healthOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.healthInsurance).filter(Boolean))).sort(), [rows]);
  const visible = useMemo(() => rows.filter((row) => {
    const employee = `${row.firstName} ${row.middleInitial} ${row.lastName}`.toLowerCase();
    return (!employeeQuery || employee.includes(employeeQuery.toLowerCase())) && (!healthFilter || row.healthInsurance === healthFilter);
  }), [rows, employeeQuery, healthFilter]);
  const allSelected = visible.length > 0 && visible.every((row) => selected.has(row.id));
  const selectedEmployee = rows.find((row) => selected.has(row.id));

  function saveView() {
    localStorage.setItem("health-ins-view", JSON.stringify({ view, employeeQuery, healthFilter }));
    setMessage("View saved on this computer.");
  }

  return <section className="health-ins-screen">
    <header>
      <h1>Health Ins</h1>
      <div className="health-ins-view-controls"><label>View:</label><select value={view} onChange={(event) => setView(event.target.value)}><option>01 Default Health Ins</option><option>02 Health Insurance</option></select><AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={() => { localStorage.removeItem("health-ins-view"); setMessage("Saved view deleted."); }}>Delete View</AccessButton><label>Go To:</label><select onChange={(event) => { const id = event.target.value; if (id) router.push(`/employees/${id}`); }} defaultValue=""><option value="" />{visible.map((row) => <option key={row.id} value={row.employeeId}>{row.firstName} {row.lastName}</option>)}</select><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton></div>
      <AccessButton className="health-ins-cancel" onClick={() => router.push("/tracking")}>Cancel</AccessButton><button className="health-ins-help" type="button" aria-label="Health Insurance help" onClick={() => setMessage(`Showing assignments on or after ${minWeekEndingDate}.`)}>?</button>
    </header>
    <div className="health-ins-filters"><label>Health Ins<select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}><option value="" />{healthOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>Search in Employee:<input value={employeeQuery} onChange={(event) => setEmployeeQuery(event.target.value)} /></label><div><span>Select:</span><AccessButton onClick={() => setSelected(allSelected ? new Set() : new Set(visible.map((row) => row.id)))}>{allSelected ? "None" : "All"}</AccessButton></div></div>
    {(error || message) && <p className="health-ins-message" role={error ? "alert" : "status"}>{error || message}</p>}
    <div className="health-ins-grid-wrap"><table><thead><tr><th /><th>Customer</th><th>Salesman</th><th>Job</th><th>Em First Name</th><th>MI</th><th>Em Last Name</th><th>Cell</th><th>Week Ending</th><th>Health Ins</th>{EMPTY_COLUMNS.map((column) => <th key={column}>{column}</th>)}<th>Margin</th></tr></thead><tbody>{visible.map((row, index) => <tr key={row.id} className={index === 0 ? "is-current" : undefined} onDoubleClick={() => row.employeeId !== "0" && router.push(`/employees/${row.employeeId}`)}><td><input type="checkbox" aria-label={`Select ${row.firstName} ${row.lastName}`} checked={selected.has(row.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })} /></td><td>{row.customer}</td><td>{row.salesman}</td><td>{row.job}</td><td>{row.firstName}</td><td>{row.middleInitial}</td><td>{row.lastName}</td><td>{row.cell}</td><td>{row.weekEnding}</td><td>{row.healthInsurance}</td>{EMPTY_COLUMNS.map((column) => <td key={column}>{column === "Em Allow Time Texts" ? <input type="checkbox" disabled aria-label="Employee allows time texts" /> : ""}</td>)}<td>{row.margin}</td></tr>)}{!visible.length && <tr><td colSpan={16}>No assignments were found for the selected minimum week-ending date and filters.</td></tr>}</tbody></table></div>
    <footer><span>Record: {visible.length ? 1 : 0} of {visible.length}</span><span className="filtered-indicator">⌕ {employeeQuery || healthFilter ? "Filtered" : "All records"}</span><input aria-label="Search records" placeholder="Search" value={employeeQuery} onChange={(event) => setEmployeeQuery(event.target.value)} /><AccessButton disabled={!selectedEmployee} onClick={() => selectedEmployee && router.push(`/employees/${selectedEmployee.employeeId}`)}>Edit Employee</AccessButton></footer>
  </section>;
}
