"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { AllEmployeesOnJobRow } from "@/lib/allEmployeesOnJob";

const VIEWS = ["View 01", "View 02", "View 03", "View 04", "View 05"];
function currentFriday() {
  const date = new Date();
  date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function EmployeesInTrackingScreen({ rows: sourceRows }: { rows: AllEmployeesOnJobRow[] }) {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [employee, setEmployee] = useState("");
  const [cell, setCell] = useState("");
  const [useButton, setUseButton] = useState(false);
  const [committed, setCommitted] = useState({ customer: "", employee: "", cell: "" });
  const [weekEnding, setWeekEnding] = useState(currentFriday);
  const [view, setView] = useState("View 01");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("");
  const [zero, setZero] = useState(false);
  const filters = useButton ? committed : { customer, employee, cell };
  const rows = useMemo(() => sourceRows.filter(row => {
    if (zero) return false;
    const date = new Date(row.weekEnding);
    const week = new Date(`${weekEnding}T00:00:00`);
    return (!weekEnding || date.toDateString() === week.toDateString()) &&
      row.customer.toLowerCase().includes(filters.customer.trim().toLowerCase()) &&
      `${row.first} ${row.middle} ${row.last}`.toLowerCase().includes(filters.employee.trim().toLowerCase()) &&
      row.cell.replace(/\D/g, "").includes(filters.cell.replace(/\D/g, ""));
  }), [sourceRows, filters.customer, filters.employee, filters.cell, weekEnding, zero]);
  function clear() { setCustomer(""); setEmployee(""); setCell(""); setCommitted({ customer: "", employee: "", cell: "" }); setZero(false); setMessage(""); }
  function search() { setCommitted({ customer, employee, cell }); setZero(false); }
  function savedViews() { return JSON.parse(localStorage.getItem("employees-in-tracking-menu-views") ?? "{}"); }
  function saveView() {
    try { const saved = savedViews(); saved[view] = { customer, employee, cell, weekEnding }; localStorage.setItem("employees-in-tracking-menu-views", JSON.stringify(saved)); setMessage(`${view} saved.`); }
    catch { setMessage("Could not save this view."); }
  }
  function chooseView(next: string) {
    setView(next); setZero(false);
    try { const saved = savedViews()[next]; if (saved) { setCustomer(saved.customer ?? ""); setEmployee(saved.employee ?? ""); setCell(saved.cell ?? ""); setWeekEnding(saved.weekEnding ?? currentFriday()); setCommitted({ customer: saved.customer ?? "", employee: saved.employee ?? "", cell: saved.cell ?? "" }); } else clear(); }
    catch { setMessage("Could not load this view."); }
  }
  function deleteView() {
    try { const saved = savedViews(); delete saved[view]; localStorage.setItem("employees-in-tracking-menu-views", JSON.stringify(saved)); setMessage(`${view} deleted.`); }
    catch { setMessage("Could not delete this view."); }
  }
  function exportView() {
    const values = [["Employee", "Cell Phone", "Assigned Customer", "Trade"], ...rows.map(row => [`${row.first} ${row.middle} ${row.last}`.replace(/\s+/g, " ").trim(), row.cell, row.customer, row.trade])];
    const csv = values.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "employees-in-tracking.csv"; link.click(); URL.revokeObjectURL(url);
  }
  const fillerCount = Math.max(0, 40 - rows.length);
  return <section className="aej-screen aej-menu">
    <header className="aej-menu-titlebar"><h1>Employee Menu</h1><div className="aej-menu-toolbar"><label>View: <select aria-label="View" value={view} onChange={event => chooseView(event.target.value)}>{VIEWS.map(item => <option key={item}>{item}</option>)}</select></label><AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={deleteView}>Delete View</AccessButton><AccessButton onClick={() => { setZero(false); router.refresh(); }}>Refresh</AccessButton><AccessButton onClick={() => setZero(true)}>Zero</AccessButton><AccessButton onClick={exportView}>Export View</AccessButton></div><AccessButton className="aej-menu-cancel" onClick={() => router.push("/tracking")}>Cancel</AccessButton></header>
    <div className="aej-menu-controls">
      <form className="aej-menu-search" onSubmit={event => { event.preventDefault(); search(); }}><div className="aej-menu-search-label">SEARCH</div><div className="aej-menu-search-fields"><label>Customer:<input value={customer} onChange={event => { setCustomer(event.target.value); setZero(false); }} /></label><label>Employee:<input value={employee} onChange={event => { setEmployee(event.target.value); setZero(false); }} /></label><label>Cell #:<input value={cell} onChange={event => { setCell(event.target.value); setZero(false); }} /></label></div><div className="aej-menu-search-actions"><AccessButton type="submit">Search</AccessButton><fieldset><legend>Use Button</legend><label><input type="radio" name="use-search-button" checked={useButton} onChange={() => setUseButton(true)} />Yes</label><label><input type="radio" name="use-search-button" checked={!useButton} onChange={() => setUseButton(false)} />No</label></fieldset></div></form>
      <div className="aej-menu-presets">{VIEWS.map((item, index) => <AccessButton key={item} aria-pressed={view === item} onClick={() => chooseView(item)}>{index === 0 ? "Default" : item}</AccessButton>)}</div>
      <div className="aej-menu-yellow" aria-hidden="true" /><AccessButton className="aej-menu-clear" onClick={clear}>Clear Filters</AccessButton>
      <div className="aej-menu-week"><label>Week Ending: <input type="date" value={weekEnding} onChange={event => { setWeekEnding(event.target.value); setZero(false); }} /></label><AccessButton onClick={() => { setZero(false); router.refresh(); }}>Refresh</AccessButton></div>
      <p className="aej-menu-hint">Double-click Assigned Customer to open the customer in Tracking for the selected Week Ending.</p>
      {message && <span className="aej-menu-status" role="status">{message}</span>}
    </div>
    <div className="aej-grid-wrap"><table className="aej-menu-grid"><colgroup>{[20,135,100,258,210,134,108,57,375].map((width, index) => <col key={index} style={{ width }} />)}<col /></colgroup><thead><tr><th aria-label="Row" />{["Employee", "Cell Phone", "Assigned Customer", "Referral Agency", "Trade", "Qualification", "Grade", "WCC"].map(label => <th key={label}>{label}<span>⌄</span></th>)}<th /></tr></thead><tbody><tr className="aej-menu-total"><td /><td>Total</td><td colSpan={8} /></tr>{rows.map(row => <tr key={row.id} className={selected === row.id ? "is-selected" : ""} onClick={() => setSelected(row.id)}><td /><td>{`${row.first} ${row.middle} ${row.last}`.replace(/\s+/g, " ").trim()}</td><td>{row.cell}</td><td><button className="aej-menu-customer" onDoubleClick={() => router.push(`/tracking?customerId=${encodeURIComponent(row.customerId)}&projectId=${encodeURIComponent(row.projectId)}&date=${encodeURIComponent(weekEnding)}&load=1`)}>{row.customer}</button></td><td /><td>{row.trade}</td><td /><td /><td /><td /></tr>)}{Array.from({ length: fillerCount }, (_, index) => <tr key={`empty-${index}`} aria-hidden="true">{Array.from({ length: 10 }, (_, col) => <td key={col} />)}</tr>)}</tbody></table></div>
    <footer className="aej-recordbar"><span>Record:</span><button disabled aria-label="First record">|◀</button><button disabled aria-label="Previous record">◀</button><input readOnly value="Totals" aria-label="Current record" /><span>of {rows.length}</span><button disabled aria-label="Next record">▶</button><button disabled aria-label="Last record">▶|</button><span>▽ No Filter</span><span>Search</span><div /></footer>
  </section>;
}
