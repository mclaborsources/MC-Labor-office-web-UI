"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

const COLUMNS = [
  ["Customer", 220], ["Salesman", 96], ["Job", 155], ["Em First Name", 96],
  ["MI", 36], ["Em Last Name", 96], ["Cell", 96], ["Week Ending", 94],
  ["Job App Status", 106], ["S LC", 52], ["Payroll Co", 90],
  ["App Front Desk Note", 520], ["Assignment User Name", 136],
  ["Assignment Timestamp", 150],
] as const;

const DEFAULT_VIEW = "01 Default Job App Problems";

export function JobAppProblemsScreen() {
  const router = useRouter();
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [views, setViews] = useState<string[]>([DEFAULT_VIEW]);
  const [selectedView, setSelectedView] = useState(DEFAULT_VIEW);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("job-app-problem-views");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (parsed.length) setViews(parsed);
      } catch { /* ignore invalid saved views */ }
    }
  }, []);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return "This Week";
    return weekOffset < 0 ? "Last Week" : "Next Week";
  }, [weekOffset]);

  function saveView() {
    const name = window.prompt("View name", selectedView || DEFAULT_VIEW)?.trim();
    if (!name) return;
    const next = Array.from(new Set([...views, name]));
    setViews(next);
    setSelectedView(name);
    window.localStorage.setItem("job-app-problem-views", JSON.stringify(next));
  }

  function deleteView() {
    if (selectedView === DEFAULT_VIEW) return;
    const next = views.filter((view) => view !== selectedView);
    setViews(next);
    setSelectedView(DEFAULT_VIEW);
    window.localStorage.setItem("job-app-problem-views", JSON.stringify(next));
  }

  return (
    <section className="ac-job-app-problems">
      <header className="ac-job-app-problems-header">
        <h1>Job App Problems</h1>
        <div className="ac-job-app-problems-viewbar">
          <label>View:</label>
          <select value={selectedView} onChange={(event) => setSelectedView(event.target.value)}>
            {views.map((view) => <option key={view}>{view}</option>)}
          </select>
          <AccessButton onClick={saveView}>Save View</AccessButton>
          <AccessButton onClick={deleteView} disabled={selectedView === DEFAULT_VIEW}>Delete View</AccessButton>
          <label>Go To:</label>
          <select aria-label="Go to column" defaultValue="">
            <option value="" />
            {COLUMNS.map(([label]) => <option key={label}>{label}</option>)}
          </select>
          <AccessButton onClick={() => setAppliedSearch(employeeSearch.trim())}>Refresh</AccessButton>
        </div>
        <div className="ac-job-app-problems-close">
          <AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton>
          <button className="ac-job-app-help" type="button" title="Help" aria-label="Help">?</button>
        </div>
      </header>

      <div className="ac-job-app-problems-filters">
        <label htmlFor="job-app-employee">Search in Employee:</label>
        <input
          id="job-app-employee"
          value={employeeSearch}
          onChange={(event) => setEmployeeSearch(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") setAppliedSearch(employeeSearch.trim()); }}
        />
        <div className="ac-job-app-week-buttons" aria-label={`Selected period: ${weekLabel}`}>
          <AccessButton onClick={() => setWeekOffset(-1)} aria-pressed={weekOffset === -1}>Last Week</AccessButton>
          <AccessButton onClick={() => setWeekOffset(0)} aria-pressed={weekOffset === 0}>This Week</AccessButton>
          <AccessButton onClick={() => setWeekOffset(1)} aria-pressed={weekOffset === 1}>Next Week</AccessButton>
        </div>
        <span className="ac-job-app-select-label">Select:</span>
        <AccessButton onClick={() => setEmployeeSearch("")}>All</AccessButton>
      </div>

      <div className="ac-job-app-grid-wrap">
        <table className="ac-job-app-grid">
          <colgroup><col className="ac-job-app-selector-col" />{COLUMNS.map(([label, width]) => <col key={label} style={{ width }} />)}</colgroup>
          <thead><tr><th aria-label="Row selector" />{COLUMNS.map(([label]) => <th key={label}><span>{label}</span><i aria-hidden /></th>)}</tr></thead>
          <tbody>
            {Array.from({ length: 25 }, (_, row) => (
              <tr key={row}><td />{COLUMNS.map(([label]) => <td key={label}>{row === 0 && label === "Em First Name" ? appliedSearch : ""}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="ac-job-app-recordbar">
        <span>Record:</span><button type="button" disabled>|◀</button><button type="button" disabled>◀</button>
        <input aria-label="Record number" /><button type="button" disabled>▶</button><button type="button" disabled>▶|</button>
        <span className="ac-job-app-filtered">▽ Filtered</span><span className="ac-job-app-search-status">Search</span>
        <div className="ac-job-app-scrollbar"><span /></div>
      </footer>
    </section>
  );
}
