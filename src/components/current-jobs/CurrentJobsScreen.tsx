"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import type { JobSummary } from "@/types/job";

const DEFAULT_VIEW = "View 01";
const STORAGE_KEY = "current-jobs-views";
const COLUMNS = ["S", "Customer", "Customer Type", "Salesman", "Job", "City", "State", "Special Job Instructions", "Office Note", "Week Ending", "Start Date", "Entry User", "Entry Date", "Post Type", "Job History", "Age of"];

export function CurrentJobsScreen({ jobs }: { jobs: JobSummary[] }) {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [job, setJob] = useState("");
  const [applied, setApplied] = useState({ customer: "", job: "" });
  const [views, setViews] = useState([DEFAULT_VIEW]);
  const [selectedView, setSelectedView] = useState(DEFAULT_VIEW);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try { const parsed = JSON.parse(saved) as string[]; if (parsed.length) setViews(parsed); } catch { /* Ignore invalid saved data. */ }
  }, []);

  const visibleJobs = useMemo(() => jobs.filter((row) =>
    (!applied.customer || row.customerName.toLowerCase().includes(applied.customer.toLowerCase())) &&
    (!applied.job || row.jobName.toLowerCase().includes(applied.job.toLowerCase()))
  ), [jobs, applied]);

  function persist(next: string[]) { setViews(next); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  function saveView() {
    const name = window.prompt("View name", selectedView)?.trim();
    if (!name) return;
    persist(Array.from(new Set([...views, name]))); setSelectedView(name);
  }
  function deleteView() {
    if (views.length === 1) return;
    const next = views.filter((view) => view !== selectedView); persist(next); setSelectedView(next[0]);
  }
  function runSearch() { setApplied({ customer: customer.trim(), job: job.trim() }); }
  function clearFilters() { setCustomer(""); setJob(""); setApplied({ customer: "", job: "" }); }

  return (
    <section className="ac-current-jobs">
      <header className="ac-current-jobs-header">
        <h1>Current Jobs</h1>
        <div className="ac-current-jobs-viewbar">
          <Link href="/jobs"><AccessButton className="ac-current-jobs-post">Post a Job</AccessButton></Link>
          <label htmlFor="current-jobs-view">View:</label>
          <select id="current-jobs-view" value={selectedView} onChange={(event) => setSelectedView(event.target.value)}>{views.map((view) => <option key={view}>{view}</option>)}</select>
          <AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={deleteView} disabled={views.length === 1}>Delete View</AccessButton>
          <label htmlFor="current-jobs-go-to">Go To:</label><select id="current-jobs-go-to" defaultValue=""><option value="" />{COLUMNS.map((column) => <option key={column}>{column}</option>)}</select>
          <AccessButton onClick={runSearch}>Refresh</AccessButton><AccessButton onClick={clearFilters}>Zero</AccessButton><AccessButton onClick={() => window.print()}>Export View</AccessButton>
        </div>
        <div className="ac-current-jobs-closebar"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button className="ac-job-app-help" type="button" title="Help" aria-label="Help">?</button></div>
      </header>
      <div className="ac-current-jobs-tools">
        <form className="ac-current-jobs-search" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
          <strong>SEARCH</strong><label htmlFor="current-customer">Customer:</label><input id="current-customer" value={customer} onChange={(event) => setCustomer(event.target.value)} />
          <label htmlFor="current-job">Job:</label><input id="current-job" value={job} onChange={(event) => setJob(event.target.value)} />
        </form>
        <AccessButton onClick={clearFilters}>Clear Filters</AccessButton><em>Click in the Select column for one job</em>
      </div>
      <div className="ac-current-jobs-grid-wrap">
        <table className="ac-current-jobs-grid">
          <thead><tr>{COLUMNS.map((column) => <th key={column}>{column}<i /></th>)}</tr></thead>
          <tbody>{visibleJobs.map((row, index) => <tr key={row.jobId} className={index === 0 ? "is-current" : undefined}>
            <td /><td><Link href={`/jobs/${row.jobId}`}>{row.customerName}</Link></td><td>{row.customerType}</td><td>{row.salesman}</td><td>{row.jobName}</td><td>{row.city}</td><td>{row.state}</td><td>{row.status}</td><td /><td /><td>{row.startDate}</td><td /><td /><td /><td /><td className="age">0</td>
          </tr>)}</tbody>
        </table>
      </div>
      <footer className="ac-current-jobs-recordbar"><span>Record:</span><button disabled>|◀</button><button disabled>◀</button><input aria-label="Record number" value={visibleJobs.length ? 1 : 0} readOnly /><span>of {visibleJobs.length}</span><button disabled>▶</button><button disabled>▶|</button><span className="filter">▽ {applied.customer || applied.job ? "Filtered" : "Unfiltered"}</span><span className="status">Search</span><div /></footer>
    </section>
  );
}
