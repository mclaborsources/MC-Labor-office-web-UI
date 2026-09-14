"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { EmployeeSummary } from "@/types/employee";

const views = Array.from({ length: 8 }, (_, i) => `View ${String(i + 1).padStart(2, "0")}`);
const columns = ["", "Payroll Co On Site", "Employee Status", "First Name", "MI", "Last Name", "Cell #", "City", "St", "Grade", "Pay", "Lic-State", "", "Week Ending", "Customer Assignment", "Profile Type", "", "", "", "", ""];
const widths = [19, 138, 96, 84, 44, 78, 112, 98, 32, 65, 75, 82, 16, 96, 191, 96, 23, 23, 23, 23, 23];

export function EmployeeQuickSearchScreen({ employees, loadError }: { employees: EmployeeSummary[]; loadError?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cell, setCell] = useState("");
  const [view, setView] = useState(views[0]);
  const [selectedId, setSelectedId] = useState(employees[0]?.employeeId ?? "");
  const [recordSearch, setRecordSearch] = useState("");
  const rows = useMemo(() => employees.filter(row => row.fullName.toLowerCase().includes(name.toLowerCase()) && row.cellPhone.replace(/\D/g, "").includes(cell.replace(/\D/g, "")) && (!recordSearch || Object.values(row).some(value => typeof value === "string" && value.toLowerCase().includes(recordSearch.toLowerCase())))), [employees, name, cell, recordSearch]);
  const selected = rows.find(row => row.employeeId === selectedId) ?? rows[0];
  const index = selected ? rows.indexOf(selected) : -1;
  const clear = () => { setName(""); setCell(""); setRecordSearch(""); };
  const selectRecord = (position: number) => { if (rows[position]) setSelectedId(rows[position].employeeId); };
  const exportView = () => {
    const csv = [columns.slice(1, 16), ...rows.map(row => values(row).slice(1, 16))].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "employee-quick-search.csv"; a.click(); URL.revokeObjectURL(url);
  };
  function values(row: EmployeeSummary) {
    return ["", row.payrollCompany || "Payroll Co On Site", row.status, row.firstName, row.middleInitial, row.lastName, row.cellPhone, row.city, row.state, row.grade, row.payRate ? `$${row.payRate.replace(/^\$/, "")}` : "", row.accessFields.LicenseState ?? "", "", row.weekEnding, row.currentAssignment, row.profileType, "", "", "", "", ""];
  }
  return <section className="eqs-screen">
    <div className="eqs-top">
      <h1>Employee Quick Search</h1>
      <div className="eqs-commands"><button onClick={() => router.push("/employees?new=1")}>New</button><button onClick={() => router.refresh()}>Refresh</button><button onClick={clear}>Zero</button></div>
      <div className="eqs-right-commands"><button onClick={clear}>Clear Filters</button><button onClick={() => { if (selected?.currentAssignment) setRecordSearch(selected.currentAssignment); }}>Fill Last Customer</button><span /><button className="eqs-ok" onClick={() => router.push(selected ? `/tracking?employeeId=${encodeURIComponent(selected.employeeId)}` : "/tracking")}>OK</button><button onClick={() => router.push("/tracking")}>Cancel</button></div>
      <div className="eqs-search"><strong>SEARCH</strong><label>Name:<input value={name} onChange={e => setName(e.target.value)} /></label><label>Cell #:<input value={cell} onChange={e => setCell(e.target.value)} /></label></div>
      <div className="eqs-presets">{views.map((v, i) => <button key={v} className={view === v ? "is-active" : ""} onClick={() => setView(v)}>{i === 0 ? "Default" : v}</button>)}</div>
      <div className="eqs-view"><label>View: <select value={view} onChange={e => setView(e.target.value)}>{views.map(v => <option key={v}>{v}</option>)}</select></label><button onClick={() => localStorage.setItem("employee-quick-search-view", view)}>Save View</button><button onClick={() => { localStorage.removeItem("employee-quick-search-view"); setView(views[0]); }}>Delete View</button><label>Go To: <select aria-label="Go to employee" value={selected?.employeeId ?? ""} onChange={e => setSelectedId(e.target.value)}><option value="" />{rows.map(row => <option key={row.employeeId} value={row.employeeId}>{row.fullName}</option>)}</select></label><button onClick={exportView}>Export View</button></div>
      <div className="eqs-selected-name">{selected?.fullName ?? ""}</div>
      <div className="eqs-detail"><table><thead><tr>{["", "Payroll Company On Site", "Default", "Job App Date", "Job App Status", "Last Week Assigned", "Customer", "PIS", "PIS User", "PIS Date", "PIS Notes"].map((label, i) => <th key={i}>{label}<span>⌄</span></th>)}</tr></thead><tbody><tr className="is-current"><td /> <td>{selected?.payrollCompany}</td><td><input type="checkbox" checked={!!selected} readOnly aria-label="Default payroll company" /></td><td>{selected?.accessFields.JobAppDate}</td><td>{selected?.accessFields.JobAppStatus}</td><td>{selected?.weekEnding}</td><td>{selected?.currentAssignment}</td><td><input type="checkbox" checked={selected?.accessFields.PIS === "1"} readOnly aria-label="PIS" /></td><td>{selected?.accessFields.PISUser}</td><td>{selected?.accessFields.PISDate}</td><td>{selected?.accessFields.PISNotes}</td></tr>{[0,1].map(i => <tr key={i}>{Array.from({length:11},(_,j)=><td key={j} />)}</tr>)}</tbody></table><div className="eqs-recordbar">Record: <button disabled>|◀</button><button disabled>◀</button><span>{selected ? "1 of 1" : "0 of 0"}</span><button disabled>▶</button><button disabled>▶|</button><em>▽ No Filter</em><input placeholder="Search" aria-label="Search payroll details" /></div></div>
    </div>
    {loadError && <p role="alert" className="eqs-error">{loadError}</p>}
    <div className="eqs-grid"><table><colgroup>{widths.map((width,i) => <col key={i} style={{width}} />)}<col style={{width:450}} /></colgroup><thead><tr>{columns.map((label,i) => <th key={i}>{label}{i > 0 && <span>⌄</span>}</th>)}<th /></tr></thead><tbody>{rows.map(row => <tr key={row.employeeId} className={row.employeeId === selected?.employeeId ? "is-current" : ""} onClick={() => setSelectedId(row.employeeId)} onDoubleClick={() => router.push(`/employees/${row.employeeId}`)}>{values(row).map((value,i) => <td key={i} className={i === 13 ? "eqs-week" : undefined}>{i === 1 ? <Link href={`/employees/${row.employeeId}`}>{value}</Link> : value}</td>)}<td /></tr>)}{Array.from({length:Math.max(0,30-rows.length)},(_,i) => <tr key={`empty-${i}`}>{Array.from({length:22},(_,j)=><td key={j} />)}</tr>)}</tbody></table></div>
    <footer className="eqs-recordbar">Record: <button disabled={index <= 0} onClick={() => selectRecord(0)}>|◀</button><button disabled={index <= 0} onClick={() => selectRecord(index-1)}>◀</button><span>{index+1} of {rows.length}</span><button disabled={index >= rows.length-1} onClick={() => selectRecord(index+1)}>▶</button><button disabled={index >= rows.length-1} onClick={() => selectRecord(rows.length-1)}>▶|</button><em>▽ No Filter</em><input placeholder="Search" aria-label="Search employee records" value={recordSearch} onChange={e => setRecordSearch(e.target.value)} /></footer>
  </section>;
}
