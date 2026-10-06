"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";

type JobRow = {
  id: number; Customer: string; Salesman: string; Job: string; "Job Street": string; "Job City": string; "Job State": string;
  "Em First Name": string; MI: string; "Em Last Name": string; Cell: string; Foreman: string; "Foreman Cell": string;
  "Week Ending": string; "Job App Status": string; Pay: string; Margin: number | null; "Check Note": string;
};
const COLUMNS: [keyof JobRow, number][] = [["Customer",220],["Salesman",96],["Job",175],["Job Street",205],["Job City",110],["Job State",42],["Em First Name",96],["MI",34],["Em Last Name",100],["Cell",110],["Foreman",110],["Foreman Cell",110],["Week Ending",94],["Job App Status",120],["Pay",48],["Margin",75],["Check Note",220]];
const DEFAULT_VIEW = "01 Default Job App Problems";
type SavedView = { name: string; search: string };

export function JobAppProblemsScreen() {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<JobRow[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [views, setViews] = useState<SavedView[]>([{ name: DEFAULT_VIEW, search: "" }]);
  const [selectedView, setSelectedView] = useState(DEFAULT_VIEW);
  const [selected, setSelected] = useState<number[]>([]);
  const [sort, setSort] = useState<{ key: keyof JobRow; desc: boolean }>({ key: "Week Ending", desc: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("job-app-problem-views") || "[]") as SavedView[];
      if (saved.length) setViews([{ name: DEFAULT_VIEW, search: "" }, ...saved.filter((v) => v.name !== DEFAULT_VIEW)]);
    } catch { /* ignore corrupt browser preferences */ }
  }, []);

  const loadRows = useCallback(async (term: string) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/reports/job-app-problems?search=${encodeURIComponent(term)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load records.");
      setRows(result.data as JobRow[]); setSelected([]);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load records."); setRows([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadRows(""); }, [loadRows]);

  const sortedRows = useMemo(() => [...rows].sort((a,b) => {
    const av = a[sort.key] ?? ""; const bv = b[sort.key] ?? "";
    const cmp = typeof av === "number" && typeof bv === "number" ? av-bv : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    return sort.desc ? -cmp : cmp;
  }), [rows, sort]);
  const selectAll = selected.length > 0 && selected.length === rows.length;

  function saveView() {
    const name = window.prompt("View name", selectedView)?.trim(); if (!name) return;
    const next = [...views.filter((view) => view.name !== name), { name, search }];
    setViews(next); setSelectedView(name); localStorage.setItem("job-app-problem-views", JSON.stringify(next.filter((v) => v.name !== DEFAULT_VIEW)));
  }
  function deleteView() {
    if (selectedView === DEFAULT_VIEW) return;
    const next = views.filter((view) => view.name !== selectedView); setViews(next); setSelectedView(DEFAULT_VIEW);
    localStorage.setItem("job-app-problem-views", JSON.stringify(next.filter((v) => v.name !== DEFAULT_VIEW)));
    setSearch(""); setAppliedSearch(""); void loadRows("");
  }
  function chooseView(name: string) {
    setSelectedView(name); const view = views.find((item) => item.name === name); const term = view?.search ?? "";
    setSearch(term); setAppliedSearch(term); void loadRows(term);
  }
  function goToColumn(label: string) {
    if (!label) return;
    const index = COLUMNS.findIndex(([key]) => key === label) + 1;
    gridRef.current?.querySelectorAll("th")[index]?.scrollIntoView({ block: "nearest", inline: "center" });
  }
  function report() { window.print(); }

  return <section className="ac-job-app-problems">
    <header className="ac-job-app-problems-header">
      <h1>MLS Job App Problems</h1>
      <div className="ac-job-app-problems-viewbar">
        <label htmlFor="job-app-view">View:</label>
        <select id="job-app-view" value={selectedView} onChange={(e) => chooseView(e.target.value)}>{views.map((view) => <option key={view.name}>{view.name}</option>)}</select>
        <AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={deleteView} disabled={selectedView === DEFAULT_VIEW}>Delete View</AccessButton>
        <label htmlFor="job-app-goto">Go To:</label><select id="job-app-goto" defaultValue="" onChange={(e) => goToColumn(e.target.value)}><option value="" />{COLUMNS.map(([key]) => <option key={key}>{key}</option>)}</select>
        <AccessButton onClick={() => { setAppliedSearch(search.trim()); void loadRows(search.trim()); }}>Refresh</AccessButton><AccessButton onClick={report}>Report</AccessButton>
      </div>
      <div className="ac-job-app-problems-close"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button className="ac-job-app-help" type="button" title="Search employees, select rows, save the current search as a view, or print the report." aria-label="Help">?</button></div>
      <div className="ac-job-app-problems-filters"><label htmlFor="job-app-employee">Search in Employee:</label><input id="job-app-employee" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const term = search.trim(); setAppliedSearch(term); void loadRows(term); } }} /><AccessButton onClick={() => { setSearch(""); setAppliedSearch(""); void loadRows(""); }}>Clear</AccessButton><span className="ac-job-app-select-label">Select:</span><AccessButton onClick={() => setSelected(selectAll ? [] : rows.map((row) => row.id))}>{selectAll ? "None" : "All"}</AccessButton></div>
    </header>
    <div className="ac-job-app-grid-wrap" ref={gridRef}>
      <table className="ac-job-app-grid"><colgroup><col className="ac-job-app-selector-col" />{COLUMNS.map(([key,width]) => <col key={key} style={{ width }} />)}</colgroup>
        <thead><tr><th aria-label="Select all"><input type="checkbox" checked={selectAll} onChange={(e) => setSelected(e.target.checked ? rows.map((row) => row.id) : [])} /></th>{COLUMNS.map(([key]) => <th key={key} onClick={() => setSort((current) => ({ key, desc: current.key === key ? !current.desc : false }))} title={`Sort by ${key}`}><span>{key}</span><i aria-hidden /></th>)}</tr></thead>
        <tbody>{sortedRows.map((row) => <tr key={row.id} className={selected.includes(row.id) ? "is-selected" : ""} onClick={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current,row.id])}><td><input aria-label={`Select ${row.Customer} ${row.Job}`} type="checkbox" checked={selected.includes(row.id)} onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current,row.id])} onClick={(e) => e.stopPropagation()} /></td>{COLUMNS.map(([key]) => <td key={key}>{key === "Margin" && row[key] != null ? Number(row[key]).toFixed(2) : row[key] ?? ""}</td>)}</tr>)}</tbody>
      </table>
      {loading && <div className="ac-job-app-empty">Loading job application records…</div>}{!loading && error && <div className="ac-job-app-empty ac-job-app-error">{error}</div>}{!loading && !error && !rows.length && <div className="ac-job-app-empty">No job application records found.</div>}
    </div>
    <footer className="ac-job-app-recordbar"><span>Records: {rows.length}</span>{selected.length > 0 && <span>{selected.length} selected</span>}<span className="ac-job-app-filtered">{appliedSearch ? `Search: ${appliedSearch}` : "All records"}</span><span className="ac-job-app-search-status">{loading ? "Loading" : error ? "Error" : "Ready"}</span></footer>
  </section>;
}
