"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OfficeStaffLoginRow } from "@/lib/officeStaffLogins";

function iso(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function move(date: string, days: number) { const next = new Date(`${date}T12:00:00`); next.setDate(next.getDate()+days); return iso(next); }
function weekStart(endDate: string) { return move(endDate,-6); }
function displayDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }); }

const columns = ["Office Staff", "Login Date", "Day", "Login Time", "Late Start", "Login Note", "", "Logout Time", "Logout Type", "Early Leave", "Logout Note", "Worked Hours", "Worked Minutes", "Hide"];

export function OfficeStaffLoginSearchScreen({ initialStartDate, initialEndDate, currentWeekEnd, initialRows, initialError }: { initialStartDate: string; initialEndDate: string; currentWeekEnd: string; initialRows: OfficeStaffLoginRow[]; initialError: string }) {
  const router = useRouter();
  const [view, setView] = useState("View 04");
  const [staffName, setStaffName] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [type, setType] = useState("all");
  const [includeHidden, setIncludeHidden] = useState(false);
  // Treat the server/API payload as untrusted at the UI boundary. A missing
  // `rows` field should show an empty result instead of crashing the whole page.
  const [rows, setRows] = useState<OfficeStaffLoginRow[]>(() => Array.isArray(initialRows) ? initialRows : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  const views = useMemo(() => ["View 01", "View 02", "View 03", "View 04", "", ""], []);
  function selectWeek(which: "previous" | "last" | "this") {
    const end = which === "previous" ? move(endDate,-7) : which === "last" ? move(currentWeekEnd,-7) : currentWeekEnd;
    setEndDate(end); setStartDate(weekStart(end));
  }
  async function refresh(overrides?: { staffName?: string; type?: string; includeHidden?: boolean; startDate?: string; endDate?: string }) {
    const next = { staffName: overrides?.staffName ?? staffName.trim(), type: overrides?.type ?? type, includeHidden: overrides?.includeHidden ?? includeHidden, startDate: overrides?.startDate ?? startDate, endDate: overrides?.endDate ?? endDate };
    setSearch(next.staffName); setLoading(true); setError(""); setMessage("");
    try {
      const params = new URLSearchParams({ ...next, includeHidden: String(next.includeHidden) });
      const response = await fetch(`/api/office-staff-hours?${params}`, { cache: "no-store" });
      const result = await response.json() as { ok?: boolean; rows?: OfficeStaffLoginRow[]; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not refresh office staff login records.");
      setRows(Array.isArray(result.rows) ? result.rows : []);
    } catch (cause) {
      setRows([]); setError(cause instanceof Error ? cause.message : "Could not refresh office staff login records.");
    } finally { setLoading(false); }
  }
  function clearFilters() { setStaffName(""); setType("all"); setIncludeHidden(false); setMessage(""); void refresh({ staffName: "", type: "all", includeHidden: false }); }
  return <section className="office-login-screen">
    <header className="office-login-toolbar">
      <h1>Office Staff Login Data Search</h1>
      <label className="office-login-view">View: <select value={view} onChange={event => setView(event.target.value)}>{["View 01", "View 02", "View 03", "View 04"].map(option => <option key={option}>{option}</option>)}</select></label>
      <button data-action-status="partial" onClick={() => setMessage("Saved views are not connected yet.")}>Save View</button><button data-action-status="partial" onClick={() => setMessage("Saved view management is not connected yet.")}>Delete View</button><button data-action-status="complete" onClick={refresh}>Refresh</button><button data-action-status="complete" onClick={() => { setStartDate(""); setEndDate(""); setMessage(""); }}>Zero</button><button data-action-status="complete" onClick={() => setMessage("There are no login rows to export.")}>Export View</button><span className="office-login-toolbar-spacer"/><button data-action-status="linked" onClick={() => router.push("/reports")}>Cancel</button><button data-action-status="complete" className="office-login-icon" aria-label="Print" onClick={() => window.print()}>▧</button><button data-action-status="complete" className="office-login-help" aria-label="Help" onClick={() => setMessage("Search office staff login and logout activity by date range and record type.")}>?</button>
    </header>
    <div className="office-login-view-row">{views.map((item, index) => <button data-action-status="complete" key={`${item}-${index}`} className={view === item ? "active" : ""} disabled={!item} onClick={() => setView(item)}>{item}</button>)}</div>
    <div className="office-login-filters">
      <div className="office-login-name"><button data-action-status="complete" className="office-login-search" onClick={refresh}>SEARCH</button><label>Office Staff Name:<input value={staffName} onChange={event => setStaffName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") refresh(); }}/></label></div>
      <div className="office-login-dates"><label>Start Date<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)}/></label><label>End Date<input type="date" value={endDate} onChange={event => setEndDate(event.target.value)}/></label><button data-action-status="complete" onClick={refresh}>Refresh</button></div>
      <div className="office-login-week"><strong>Week</strong><div><button data-action-status="complete" onClick={() => {selectWeek("previous"); const end=move(endDate,-7); void refresh({startDate:weekStart(end),endDate:end});}}>Previous</button><button data-action-status="complete" onClick={() => {selectWeek("last"); const end=move(currentWeekEnd,-7); void refresh({startDate:weekStart(end),endDate:end});}}>Last</button><button data-action-status="complete" onClick={() => {selectWeek("this"); void refresh({startDate:weekStart(currentWeekEnd),endDate:currentWeekEnd});}}>This</button></div></div>
      <fieldset className="office-login-type"><legend>Type</legend>{[["all", "All"], ["logins", "Logins"], ["no-logins", "No Logins"]].map(([value, label]) => <label key={value}><input type="radio" checked={type === value} onChange={() => {setType(value); void refresh({type:value});}}/>{label}</label>)}</fieldset>
      <div className="office-login-hide"><button data-action-status="complete" aria-pressed={!includeHidden} onClick={() => {setIncludeHidden(false); void refresh({includeHidden:false});}}>Remove Hide</button><button data-action-status="complete" aria-pressed={includeHidden} onClick={() => {setIncludeHidden(true); void refresh({includeHidden:true});}}>All</button></div>
      <button data-action-status="complete" className="office-login-clear" onClick={clearFilters}>Clear Filters</button>
      <div className="office-login-hints"><i>Hours for the current day will not be accurate until everyone has logged out for the day.</i><i>Hours and Minutes may not reflect reality when Logout Type is System or Timeout.</i></div>
    </div>
    {error && <p className="office-login-message" role="alert">{error}</p>}{message && <p className="office-login-message" role="status">{message}</p>}
    <div className="office-login-grid-wrap"><table className="office-login-grid"><thead><tr>{columns.map((column, index) => <th key={`${column}-${index}`}>{column}<span>⌄</span></th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className={row.day === "Sat" || row.day === "Sun" ? "office-login-weekend" : ""}><td>{row.officeStaff}</td><td>{displayDate(row.loginDate)}</td><td>{row.day}</td><td>{row.loginTime}</td><td>{row.lateStart}</td><td>{row.loginNote}</td><td/><td>{row.logoutTime}</td><td>{row.logoutType}</td><td>{row.earlyLeave}</td><td>{row.logoutNote}</td><td>{row.workedHours ?? ""}</td><td>{row.workedMinutes ?? ""}</td><td><input type="checkbox" checked={row.hide} readOnly aria-label={`Hidden hours for ${row.officeStaff} on ${row.loginDate}`}/></td></tr>)}{!rows.length && <tr className="office-login-empty-row"><td colSpan={columns.length}>{loading ? "Loading login records…" : search ? "No matching login records in the selected date range." : "No login records in the selected date range."}</td></tr>}</tbody></table></div>
    <footer className="office-login-status"><span>Record:</span><button data-action-status="missing" disabled>◂</button><button data-action-status="missing" disabled>▸</button><span>{rows.length ? `1 of ${rows.length}` : "0 of 0"}</span><button data-action-status="missing" disabled>{rows.length ? "Filtered" : "No Filter"}</button><input aria-label="Search result" placeholder="Search"/><span className="office-login-form-view">Form View</span></footer>
  </section>;
}
