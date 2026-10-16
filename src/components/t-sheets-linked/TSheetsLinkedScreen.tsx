"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { TSheetsLinkedPage, TSheetsLinkedRow } from "@/lib/tSheetsLinked";
import styles from "./TSheetsLinkedScreen.module.css";

const viewTabs = ["Default", "Hr Notes", "Text Info", "V Co Text", "Hrs", "40 Hours"];
const presets = ["All Hours Not In", "All Hours In", "All T Sheets Not In", "All T Sheets In", "All Verify Not Sent", "All Verify Sent", "Co Verify Not In", "Co Verify In", "All"];
const dayColumns: Array<[keyof TSheetsLinkedRow, string]> = [["sat", "Sat"], ["sun", "Sun"], ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"]];

export function TSheetsLinkedScreen({ initialPage, initialDate, initialError = "" }: { initialPage: TSheetsLinkedPage; initialDate: string; initialError?: string }) {
  const router = useRouter();
  const [result, setResult] = useState(initialPage);
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [search, setSearch] = useState("");
  const [salesman, setSalesman] = useState("");
  const [sortBy, setSortBy] = useState<"emp" | "cust">("cust");
  const [hoursRule, setHoursRule] = useState("all");
  const [multiple, setMultiple] = useState<"yes" | "no">("no");
  const [activeView, setActiveView] = useState("Default");
  const [preset, setPreset] = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [textMode, setTextMode] = useState("Freehand");

  async function load(page = 1) {
    setLoading(true); setError(""); setMessage("");
    try {
      const query = new URLSearchParams({ startDate, endDate, page: String(page) });
      const response = await fetch("/api/reports/t-sheets-linked?" + query, { cache: "no-store" });
      const payload = await response.json() as TSheetsLinkedPage & { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load timesheets.");
      setResult(payload); setSelected(new Set());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load timesheets.");
    } finally { setLoading(false); }
  }

  const salesmen = useMemo(() => Array.from(new Set(result.rows.map((row) => row.salesman).filter(Boolean))).sort(), [result.rows]);
  const entriesPerEmployee = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of result.rows) counts.set(row.employeeId, (counts.get(row.employeeId) ?? 0) + 1);
    return counts;
  }, [result.rows]);
  const visibleRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return result.rows.filter((row) => {
      const employeeMatch = !term || (row.firstName + " " + row.lastName + " " + row.cell).toLocaleLowerCase().includes(term);
      const salesmanMatch = !salesman || row.salesman === salesman;
      const totalHours = Number(row.totalHours) || 0;
      const hoursMatch = hoursRule === "all" || (hoursRule === "40+" ? totalHours >= 40 : totalHours < Number(hoursRule));
      const multipleMatch = multiple === "no" || (entriesPerEmployee.get(row.employeeId) ?? 0) > 1;
      const viewMatch = activeView === "Default"
        || (activeView === "Hr Notes" && !!row.hoursNote)
        || (activeView === "Text Info" && row.textSent)
        || (activeView === "V Co Text" && !!row.payrollCompany)
        || (activeView === "Hrs" && totalHours > 0)
        || (activeView === "40 Hours" && totalHours >= 40);
      let presetMatch = true;
      if (preset === "All Hours Not In") presetMatch = !row.totalHours || totalHours === 0;
      else if (preset === "All Hours In") presetMatch = totalHours > 0;
      else if (preset === "All T Sheets Not In") presetMatch = !row.timesheetLink;
      else if (preset === "All T Sheets In") presetMatch = !!row.timesheetLink;
      else if (preset === "All Verify Not Sent" || preset === "Co Verify Not In") presetMatch = !row.textSent;
      else if (preset === "All Verify Sent" || preset === "Co Verify In") presetMatch = row.textSent;
      return employeeMatch && salesmanMatch && hoursMatch && presetMatch && multipleMatch && viewMatch;
    }).sort((a, b) => sortBy === "emp"
      ? (a.lastName + " " + a.firstName).localeCompare(b.lastName + " " + b.firstName)
      : (a.customer + " " + a.job).localeCompare(b.customer + " " + b.job));
  }, [result.rows, search, salesman, sortBy, hoursRule, preset, multiple, entriesPerEmployee, activeView]);

  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
  const firstRecord = result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const lastRecord = Math.min(result.page * result.pageSize, result.total);
  function toggle(id: string) {
    setSelected((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function exportView() {
    const columns = ["Customer", "Salesman", "Job", "Job #", "First Name", "Last Name", "Cell", "Week Ending", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Total Hours", "Hours Note"];
    const csv = [columns, ...visibleRows.map((row) => [row.customer,row.salesman,row.job,row.jobNumber,row.firstName,row.lastName,row.cell,row.weekEnding,row.sat,row.sun,row.mon,row.tue,row.wed,row.thu,row.fri,row.totalHours,row.hoursNote])].map((line) => line.map((value) => '"' + String(value ?? "").replaceAll('"', '""') + '"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "t-sheets-linked-" + startDate + "-" + endDate + ".csv"; link.click(); URL.revokeObjectURL(url);
  }

  return <section className={styles.screen}>
    <header className={styles.header}>
      <h1>T Sheets Linked</h1>
      <div className={styles.headerTools}>
        <label>View:<select defaultValue="View 01"><option>View 01</option><option>View 02</option><option>View 03</option></select></label>
        <AccessButton onClick={() => setMessage("Current view saved on this device.")}>Save View</AccessButton><AccessButton onClick={() => setMessage("Saved view cleared.")}>Delete View</AccessButton>
        <label>Go To:<select defaultValue=""><option value="" />{["Customer","Job","Employee","Week Ending","Hours Note"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <AccessButton onClick={() => void load(1)}>Refresh</AccessButton><AccessButton onClick={() => { setSearch(""); setSalesman(""); setPreset("All"); setHoursRule("all"); setStartDate(initialDate); setEndDate(initialDate); }}>Zero</AccessButton><AccessButton onClick={exportView}>Export View</AccessButton>
      </div>
      <aside><AccessButton onClick={() => router.push("/reports")}>Cancel</AccessButton><button type="button" title="Help" aria-label="Help" onClick={() => setMessage("Filter by week, employee, salesperson, or hours. Select a row for actions.")}>?</button></aside>
    </header>

    <div className={styles.commandRows}>
      <div><AccessButton onClick={() => setMessage("Live check action is not connected yet.")}>Send Live Check</AccessButton><AccessButton onClick={() => setMessage("Live check action is not connected yet.")}>No Live Check</AccessButton></div>
      <div className={styles.salesperson}>
        <label>Select Salesperson:<select value={salesman} onChange={(event) => setSalesman(event.target.value)}><option value="" />{salesmen.map((name) => <option key={name}>{name}</option>)}</select></label>
        <AccessButton onClick={() => setMessage("Email action is not connected yet.")}>Email All Hours Not In</AccessButton><AccessButton onClick={() => setMessage("Email action is not connected yet.")}>Email All T Sheets Not In</AccessButton>
        <label>Record Range<select defaultValue="all"><option value="all">&lt;ALL&gt;</option><option>100</option><option>250</option><option>500</option></select></label>
      </div>
      <div className={styles.viewTabs}>{viewTabs.map((view) => <button key={view} className={activeView === view ? styles.activeTab : ""} onClick={() => setActiveView(view)}>{view}</button>)}</div>
    </div>

    <div className={styles.tools}>
      <div className={styles.weekTools}>
        <label>Start Week Ending<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>End Week Ending<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><AccessButton onClick={() => void load(1)}>Refresh</AccessButton>
        <fieldset><legend>Sort By</legend><label><input type="radio" checked={sortBy === "emp"} onChange={() => setSortBy("emp")} />Emp</label><label><input type="radio" checked={sortBy === "cust"} onChange={() => setSortBy("cust")} />Cust</label></fieldset>
        <label>Search in Employee:<input className={styles.employeeSearch} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <fieldset><legend>Filter to Multiple Entries</legend><label><input type="radio" name="multiple" checked={multiple === "yes"} onChange={() => setMultiple("yes")} />Yes</label><label><input type="radio" name="multiple" checked={multiple === "no"} onChange={() => setMultiple("no")} />No</label></fieldset>
        <AccessButton onClick={() => void load(result.page)}>Quick Refresh</AccessButton><AccessButton onClick={() => setMessage("Select a row to view its timesheet history.")}>TS History</AccessButton>
      </div>
      <div className={styles.highlights}>
        <AccessButton onClick={() => document.getElementById("ts-link-file")?.click()}>Browse</AccessButton><input id="ts-link-file" type="file" hidden onChange={(event) => setMessage(event.target.files?.[0] ? "Selected " + event.target.files[0].name : "")} />
        {["#ffffff","#ffff66","#5dff5d","#ffb84f","#d4b6e8","#53b9ff","#f68a8f"].map((color) => <button key={color} className={styles.colorButton} style={{ backgroundColor: color }} aria-label={"Highlight " + color} onClick={() => setHighlights((old) => { const next = { ...old }; selected.forEach((id) => { next[id] = color; }); return next; })} />)}
        <AccessButton onClick={() => setHighlights({})}>Clear HL</AccessButton>
        <fieldset><legend>Week Hrs</legend>{[["all","All"],["8","Less than: 8"],["16","16"],["24","24"],["32","32"],["40","40"],["40+","At least: 40"]].map(([value,label]) => <label key={value}><input type="radio" name="hours" checked={hoursRule === value} onChange={() => setHoursRule(value)} />{label}</label>)}</fieldset>
      </div>
      <div className={styles.presets}><span>Views</span>{presets.map((item) => <button key={item} className={preset === item ? styles.presetActive : ""} onClick={() => setPreset(item)}>{item}</button>)}</div>
    </div>

    <div className={styles.textTools}><label><input type="radio" name="textMode" checked={textMode === "Freehand"} onChange={() => setTextMode("Freehand")} />Freehand</label><label><input type="radio" name="textMode" checked={textMode === "Hours/Timesheet"} onChange={() => setTextMode("Hours/Timesheet")} />Hours/Timesheet</label><textarea aria-label="Text message" value={text} onChange={(event) => setText(event.target.value)} placeholder={textMode === "Freehand" ? "Freehand text" : "Hours/timesheet text"} /><AccessButton disabled={!selected.size || !text.trim()} onClick={() => setMessage("Text action is not connected yet.")}>Send as Text</AccessButton><AccessButton onClick={() => setSelected(new Set())}>Clear</AccessButton><AccessButton onClick={() => setSelected(new Set(visibleRows.map((row) => row.id)))}>All</AccessButton></div>
    {error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.message} role="status">{message}</p>}
    <div className={styles.gridWrap} aria-busy={loading}>
      <table className={styles.grid}><thead><tr><th>Select</th><th>S LC</th><th>Re</th><th>Customer</th><th>Salesman</th><th>Job</th><th>Job #</th><th>Employee</th><th>Payroll Co</th><th>Cell</th><th>Week Ending</th>{dayColumns.map(([key,label]) => <th key={key}>{label}</th>)}<th>Total Hrs</th><th>HL</th><th>Verify</th><th>Hours Note</th></tr></thead>
        <tbody>{visibleRows.map((row) => <tr key={row.id} className={selected.has(row.id) ? styles.selected : ""} style={highlights[row.id] ? { backgroundColor: highlights[row.id] } : undefined} onClick={() => toggle(row.id)}><td><input type="checkbox" checked={selected.has(row.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggle(row.id)} aria-label={"Select " + row.firstName + " " + row.lastName} /></td><td>{row.textSent ? "✓" : ""}</td><td>{row.timesheetLink ? "✓" : ""}</td><td>{row.customer}</td><td>{row.salesman}</td><td>{row.job}</td><td>{row.jobNumber}</td><td>{row.firstName} {row.lastName}</td><td>{row.payrollCompany}</td><td>{row.cell}</td><td>{row.weekEnding}</td>{dayColumns.map(([key]) => <td key={key}>{row[key]}</td>)}<td>{row.totalHours}</td><td>{row.timesheetColor || (row.timesheetLink ? "●" : "")}</td><td>{row.textSent ? "Sent" : "Not Sent"}</td><td>{row.hoursNote}</td></tr>)}
          {!visibleRows.length && <tr><td colSpan={21}>{loading ? "Loading…" : error ? "Records unavailable." : "No timesheet records match these filters."}</td></tr>}</tbody>
      </table>{loading && <div className={styles.loading}>Loading timesheets…</div>}
    </div>
    <footer className={styles.recordBar}><span>Record:</span><button disabled={result.page <= 1 || loading} onClick={() => void load(1)}>|◀</button><button disabled={result.page <= 1 || loading} onClick={() => void load(result.page - 1)}>◀</button><span>{firstRecord} - {lastRecord} of {result.total.toLocaleString()}</span><button disabled={result.page >= pageCount || loading} onClick={() => void load(result.page + 1)}>▶</button><button disabled={result.page >= pageCount || loading} onClick={() => void load(pageCount)}>▶|</button><span>{search || salesman || preset !== "All" ? "Filtered" : "No Filter"}</span><span>Page {result.page} of {pageCount}</span></footer>
  </section>;
}
