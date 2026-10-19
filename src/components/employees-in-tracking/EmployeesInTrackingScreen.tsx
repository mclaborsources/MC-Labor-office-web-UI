"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { AllEmployeesOnJobRow } from "@/lib/allEmployeesOnJob";

const PRESET_VIEWS = ["Default", "View 02", "View 03", "View 04", "View 05", "View 06"];

export function EmployeesInTrackingScreen({ rows: sourceRows }: { rows: AllEmployeesOnJobRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [customer, setCustomer] = useState("");
  const [job, setJob] = useState("<ALL>");
  const [onePerEmployee, setOnePerEmployee] = useState(false);
  const [view, setView] = useState("View 01");
  const [messageMode, setMessageMode] = useState<"freehand" | "list">("list");
  const [messageText, setMessageText] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchCommitted, setSearchCommitted] = useState(false);
  const jobs = useMemo(() => [...new Set(sourceRows.map(row => row.job).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [sourceRows]);
  const filteredRows = useMemo(() => {
    const query = name.trim().toLocaleLowerCase();
    const filtered = sourceRows.filter(row =>
      (!query || `${row.first} ${row.middle} ${row.last}`.toLocaleLowerCase().includes(query)) &&
      (!customer.trim() || row.customer.toLocaleLowerCase().includes(customer.trim().toLocaleLowerCase())) &&
      (job === "<ALL>" || row.job === job)
    );
    if (!onePerEmployee) return filtered;
    const latestByEmployee = new Map<string, AllEmployeesOnJobRow>();
    for (const row of filtered) if (!latestByEmployee.has(row.employeeId)) latestByEmployee.set(row.employeeId, row);
    return [...latestByEmployee.values()];
  }, [sourceRows, name, customer, job, onePerEmployee]);
  const visibleRows = searchCommitted ? filteredRows : sourceRows;

  function clearFilters() {
    setName(""); setCustomer(""); setJob("<ALL>"); setSearchCommitted(false); setMessage("");
  }
  function saveView() {
    try {
      const saved = JSON.parse(localStorage.getItem("all-employees-on-job-views") ?? "{}");
      saved[view] = { name, customer, job, onePerEmployee };
      localStorage.setItem("all-employees-on-job-views", JSON.stringify(saved));
      setMessage(`${view} saved.`);
    } catch { setMessage("Could not save this view in the browser."); }
  }
  function selectView(next: string) {
    setView(next);
    try {
      const saved = JSON.parse(localStorage.getItem("all-employees-on-job-views") ?? "{}");
      const state = saved[next];
      if (state) { setName(state.name ?? ""); setCustomer(state.customer ?? ""); setJob(state.job ?? "<ALL>"); setOnePerEmployee(Boolean(state.onePerEmployee)); setSearchCommitted(true); }
      else if (next === "Default") clearFilters();
    } catch { /* Ignore invalid saved local settings. */ }
  }
  function deleteView() {
    try {
      const saved = JSON.parse(localStorage.getItem("all-employees-on-job-views") ?? "{}");
      delete saved[view]; localStorage.setItem("all-employees-on-job-views", JSON.stringify(saved)); setMessage(`${view} deleted.`);
    } catch { setMessage("Could not delete this view."); }
  }
  function toggleRow(id: string) {
    setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleAll() {
    setSelected(current => current.size === visibleRows.length ? new Set() : new Set(visibleRows.map(row => row.id)));
  }
  function sendText() {
    const count = visibleRows.filter(row => selected.has(row.id) && row.cell).length;
    setMessage(count ? `Text sending is not configured in this portal yet. ${count} selected employee${count === 1 ? "" : "s"} have a cell number.` : "Select employees with cell numbers first.");
  }

  return <section className="aej-screen">
    <header className="aej-titlebar"><h1>All Employees on a Job</h1><div className="aej-toolbar"><label>View: <select value={view} onChange={event => selectView(event.target.value)}>{["View 01", ...PRESET_VIEWS.slice(1)].map(item => <option key={item}>{item}</option>)}</select></label><AccessButton data-action-status="complete" onClick={saveView}>Save View</AccessButton><AccessButton data-action-status="complete" onClick={deleteView}>Delete View</AccessButton><label>Go To: <select aria-label="Go To" defaultValue=""><option value="" />{visibleRows.map((row, index) => <option key={row.id} value={index + 1}>{index + 1} - {row.first} {row.last}</option>)}</select></label><AccessButton data-action-status="complete" onClick={() => { setSearchCommitted(true); setMessage(""); }}>Refresh</AccessButton><AccessButton data-action-status="complete" onClick={clearFilters}>Zero</AccessButton><AccessButton data-action-status="complete" onClick={() => window.print()}>Export View</AccessButton></div><AccessButton data-action-status="linked" className="aej-cancel" onClick={() => router.push("/reports")}>Cancel</AccessButton></header>
    <div className="aej-control-area">
      <div className="aej-search-panel"><div className="aej-search-heading">SEARCH</div><label>Name:<input autoComplete="off" value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") setSearchCommitted(true); }} /></label></div>
      <div className="aej-filter-panel"><label>Customer<input value={customer} onChange={event => setCustomer(event.target.value)} onKeyDown={event => { if (event.key === "Enter") setSearchCommitted(true); }} /></label><div className="aej-like"><label><input type="radio" name="aej-match" defaultChecked />Like</label><label><input type="radio" name="aej-match" />=</label><AccessButton data-action-status="complete" onClick={() => setSearchCommitted(true)}>Search</AccessButton></div><label className="aej-job">Job<select value={job} onChange={event => { setJob(event.target.value); setSearchCommitted(true); }}><option>&lt;ALL&gt;</option>{jobs.map(item => <option key={item}>{item}</option>)}</select></label><label className="aej-records">Records:<span><label><input type="radio" checked={!onePerEmployee} onChange={() => setOnePerEmployee(false)} />All</label><label><input type="radio" checked={onePerEmployee} onChange={() => setOnePerEmployee(true)} />1 Per Employee</label></span></label></div>
      <div className="aej-views">{PRESET_VIEWS.map((preset, index) => <AccessButton data-action-status="complete" key={preset} className={view === (index === 0 ? "View 01" : preset) ? "is-active" : ""} onClick={() => selectView(index === 0 ? "View 01" : preset)}>{preset}</AccessButton>)}</div>
      <AccessButton data-action-status="complete" className="aej-clear" onClick={clearFilters}>Clear Filters</AccessButton>
      <div className="aej-textbox"><div className="aej-textbox-head"><strong>Text:</strong><label><input type="radio" checked={messageMode === "freehand"} onChange={() => setMessageMode("freehand")} />Freehand</label><label><input type="radio" checked={messageMode === "list"} onChange={() => setMessageMode("list")} />Select from List</label><AccessButton data-action-status="partial" disabled={!selected.size} onClick={sendText}>Send Text</AccessButton></div>{messageMode === "freehand" ? <textarea value={messageText} onChange={event => setMessageText(event.target.value)} aria-label="Text message" /> : <select className="aej-message-list" aria-label="Select message" value={messageText} onChange={event => setMessageText(event.target.value)}><option value="" />{["Please call the office when available.", "Your assignment has been updated.", "Please confirm your availability for this job."].map(item => <option key={item}>{item}</option>)}</select>}<small>Placeholders: [Employee First Name], [User First Name], [User Full Name]</small></div>
    </div>
    <div className="aej-selection"><span>Select:</span><AccessButton data-action-status="complete" onClick={() => setSelected(new Set())}>Clear</AccessButton><AccessButton data-action-status="complete" onClick={toggleAll}>All</AccessButton>{message && <span role="status">{message}</span>}</div>
    <div className="aej-grid-wrap"><table className="aej-grid"><thead><tr><th className="aej-select-col">Sel</th>{[["customer","Customer"],["job","Job"],["city","Job City"],["state","Job State"],["first","First"],["middle","MI"],["last","Last"],["trade","Trade"],["cell","Cell #"],["status","EE Status"],["weekEnding","Week Ending"],["firstWeek","First Week"],["lastWeek","Last Week"],["text","Text Msg Add"]].map(([key,label]) => <th key={key}>{label}<span>⌄</span></th>)}</tr></thead><tbody>{visibleRows.map(row => <tr key={row.id}><td className="aej-select-col"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} aria-label={`Select ${row.first} ${row.last}`} /></td><td>{row.customer}</td><td>{row.job}</td><td>{row.city}</td><td>{row.state}</td><td>{row.first}</td><td>{row.middle}</td><td>{row.last}</td><td>{row.trade}</td><td>{row.cell}</td><td>{row.status}</td><td>{row.weekEnding}</td><td>{row.firstWeek}</td><td>{row.lastWeek}</td><td /></tr>)}</tbody></table>{visibleRows.length === 0 && <div className="aej-empty">No employee/job records match these filters.</div>}</div>
    <footer className="aej-recordbar"><span>Record:</span><button data-action-status="missing" disabled>|◀</button><button data-action-status="missing" disabled>◀</button><input readOnly value={visibleRows.length ? "1" : "0"} aria-label="Current record"/><span>of {visibleRows.length}</span><button data-action-status="missing" disabled>▶</button><button data-action-status="missing" disabled>▶|</button><span>▽ No Filter</span><span>Search</span><div /></footer>
  </section>;
}
