"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import type { JobListingKind, JobListingPage, JobListingRow } from "@/lib/jobListingReports";

const CURRENT_COLUMNS: Array<{ key: keyof JobListingRow | "select"; label: string }> = [
  { key: "select", label: "S" }, { key: "customer", label: "Customer" }, { key: "customerType", label: "Customer Type" },
  { key: "salesman", label: "Salesman" }, { key: "job", label: "Job" }, { key: "city", label: "City" }, { key: "state", label: "State" },
  { key: "instructions", label: "Special Job Instructions" }, { key: "officeNote", label: "Office Note" }, { key: "weekEnding", label: "Week Ending" },
  { key: "startDate", label: "Start Date" }, { key: "entryUser", label: "Entry User" }, { key: "entryDate", label: "Entry Date" },
  { key: "postType", label: "Post Type" }, { key: "jobHistory", label: "Job History" }, { key: "age", label: "Age of" },
];
const OCIP_COLUMNS: Array<{ key: keyof JobListingRow | "select"; label: string }> = [
  { key: "select", label: "S" }, { key: "customer", label: "Customer" }, { key: "salesman", label: "Salesman" },
  { key: "job", label: "Job" }, { key: "street", label: "Street" }, { key: "city", label: "City" },
  { key: "state", label: "State" }, { key: "ocipJob", label: "OCIP Job" }, { key: "weekEnding", label: "Week Ending" },
  { key: "customerType", label: "Customer Type" }, { key: "entryUser", label: "Entry User" }, { key: "entryDate", label: "Entry Date" },
  { key: "postType", label: "Post Type" }, { key: "jobHistory", label: "Job History" }, { key: "age", label: "Age of" },
];
const RATE_COLUMNS: Array<{ key: keyof JobListingRow | "select"; label: string }> = [
  { key: "select", label: "S" }, { key: "customer", label: "Customer" }, { key: "salesman", label: "Salesman" },
  { key: "job", label: "Job" }, { key: "street", label: "Street" }, { key: "city", label: "City" },
  { key: "state", label: "State" }, { key: "rateJob", label: "Rate Job" }, { key: "weekEnding", label: "Week Ending" },
  { key: "rateReport", label: "Rate Report" }, { key: "rateReportUser", label: "Rate Report User" },
  { key: "rateReportTimestamp", label: "Rate Report Timestamp" }, { key: "customerType", label: "Customer Type" },
  { key: "entryUser", label: "Entry User" }, { key: "entryDate", label: "Entry Date" }, { key: "postType", label: "Post Type" },
  { key: "jobHistory", label: "Job History" }, { key: "age", label: "Age of" },
];
const SHIFT_COLUMNS: Array<{ key: keyof JobListingRow | "select"; label: string }> = [
  { key: "select", label: "S" }, { key: "customer", label: "Customer" }, { key: "salesman", label: "Salesman" },
  { key: "job", label: "Job" }, { key: "street", label: "Street" }, { key: "city", label: "City" },
  { key: "state", label: "State" }, { key: "shiftDifferential", label: "Shift Differential" }, { key: "weekEnding", label: "Week Ending" },
  { key: "customerType", label: "Customer Type" }, { key: "entryUser", label: "Entry User" }, { key: "entryDate", label: "Entry Date" },
  { key: "postType", label: "Post Type" }, { key: "jobHistory", label: "Job History" }, { key: "age", label: "Age of" },
];
const VIEWS_KEY = "current-jobs-views";

export function CurrentJobsScreen({ initialPage, kind = "current" }: { initialPage: JobListingPage; kind?: JobListingKind }) {
  const router = useRouter();
  const title = kind === "employees" ? "Job Employees" : kind === "ocip" ? "OCIP Jobs" : kind === "rate" ? "Rate Jobs" : kind === "shift" ? "Shift Differential Jobs" : "Current Jobs";
  const columns = kind === "ocip" ? OCIP_COLUMNS : kind === "rate" ? RATE_COLUMNS : kind === "shift" ? SHIFT_COLUMNS : CURRENT_COLUMNS;
  const [customer, setCustomer] = useState("");
  const [job, setJob] = useState("");
  const [applied, setApplied] = useState({ customer: "", job: "" });
  const [result, setResult] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [views, setViews] = useState(["View 01"]);
  const [selectedView, setSelectedView] = useState("View 01");
  const [selectedRowId, setSelectedRowId] = useState(initialPage.rows[0]?.id ?? "");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEWS_KEY);
      const parsed = saved ? JSON.parse(saved) as string[] : [];
      if (parsed.length) { setViews(parsed); setSelectedView(parsed[0]); }
    } catch { /* Ignore invalid saved view data. */ }
  }, []);

  async function load(page: number, filters = applied) {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ kind, page: String(page), pageSize: String(result.pageSize), customer: filters.customer, job: filters.job });
      const response = await fetch(`/api/reports/job-listings?${query}`, { cache: "no-store" });
      const data = await response.json() as JobListingPage & { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load this report.");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load this report.");
    } finally {
      setLoading(false);
    }
  }

  function runSearch() {
    const filters = { customer: customer.trim(), job: job.trim() };
    setApplied(filters);
    void load(1, filters);
  }

  function clearFilters() {
    setCustomer(""); setJob("");
    const filters = { customer: "", job: "" };
    setApplied(filters);
    void load(1, filters);
  }

  function browseRateReport() {
    const selected = result.rows.find((row) => row.id === selectedRowId);
    if (!selected?.rateReport) { setNotice("No rate report is linked to the selected job week."); return; }
    if (/^https?:\/\//i.test(selected.rateReport)) window.open(selected.rateReport, "_blank", "noopener,noreferrer");
    else setNotice(`Rate report link: ${selected.rateReport}`);
  }

  function saveView() {
    const name = window.prompt("View name", selectedView)?.trim();
    if (!name) return;
    const next = Array.from(new Set([...views, name]));
    setViews(next); setSelectedView(name); window.localStorage.setItem(VIEWS_KEY, JSON.stringify(next));
  }

  function deleteView() {
    if (views.length < 2) return;
    const next = views.filter((view) => view !== selectedView);
    setViews(next); setSelectedView(next[0]); window.localStorage.setItem(VIEWS_KEY, JSON.stringify(next));
  }

  const firstRecord = result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const lastRecord = Math.min(result.page * result.pageSize, result.total);
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <section className="ac-current-jobs">
      <header className="ac-current-jobs-header">
        <h1>{title}</h1>
        <div className="ac-current-jobs-viewbar">
          {kind !== "employees" && <Link href="/jobs"><AccessButton data-action-status="linked" className="ac-current-jobs-post">Post a Job</AccessButton></Link>}
          <label htmlFor="current-jobs-view">View:</label><select id="current-jobs-view" value={selectedView} onChange={(event) => setSelectedView(event.target.value)}>{views.map((view) => <option key={view}>{view}</option>)}</select>
          <AccessButton data-action-status="complete" onClick={saveView}>Save View</AccessButton><AccessButton data-action-status="complete" onClick={deleteView} disabled={views.length < 2}>Delete View</AccessButton>
          <label htmlFor="current-jobs-go-to">Go To:</label><select id="current-jobs-go-to" defaultValue=""><option value="" />{columns.map((column) => <option key={column.key}>{column.label}</option>)}</select>
          <AccessButton data-action-status="complete" onClick={runSearch}>Refresh</AccessButton><AccessButton data-action-status="complete" onClick={clearFilters}>Zero</AccessButton><AccessButton data-action-status="complete" onClick={() => window.print()}>Export View</AccessButton>
        </div>
        <div className="ac-current-jobs-closebar"><AccessButton data-action-status="linked" onClick={() => router.push("/reports")}>Cancel</AccessButton><button data-action-status="missing" className="ac-job-app-help" type="button" title="Help" aria-label="Help">?</button></div>
      </header>
      <div className="ac-current-jobs-tools">
        <form className="ac-current-jobs-search" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
          <strong>SEARCH</strong><label htmlFor="current-customer">Customer:</label><input id="current-customer" value={customer} onChange={(event) => setCustomer(event.target.value)} />
          <label htmlFor="current-job">Job:</label><input id="current-job" value={job} onChange={(event) => setJob(event.target.value)} />
        </form>
        <AccessButton data-action-status="complete" onClick={clearFilters}>Clear Filters</AccessButton><em>Click in the Select column for one job</em>
        {kind === "rate" && <AccessButton data-action-status="linked" onClick={browseRateReport}>Browse for Rate Report</AccessButton>}
      </div>
      {notice && <p role="status" className="ac-job-listing-error">{notice}</p>}
      {error && <p role="alert" className="ac-job-listing-error">{error}</p>}
      <div className="ac-current-jobs-grid-wrap" aria-busy={loading}>
        <table className="ac-current-jobs-grid">
          <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}<i /></th>)}</tr></thead>
          <tbody>{result.rows.map((row, index) => <tr key={row.id} className={index === 0 ? "is-current" : undefined}>
            <td>{kind === "rate" ? <button data-action-status="complete" type="button" title="Select this job" aria-label={`Select ${row.customer} - ${row.job}`} onClick={() => { setSelectedRowId(row.id); setNotice(""); }}>{selectedRowId === row.id ? "●" : "○"}</button> : null}</td>{columns.filter((column) => column.key !== "select").map(({ key }) => <td key={key}>
              {key === "ocipJob" ? <input type="checkbox" checked={row.ocipJob} readOnly aria-label="OCIP job" />
                : key === "rateJob" ? <input type="checkbox" checked={row.rateJob} readOnly aria-label="Rate job" />
                : key === "shiftDifferential" ? <input type="checkbox" checked={row.shiftDifferential} readOnly aria-label="Shift differential job" />
                : row[key as keyof JobListingRow]}
            </td>)}
          </tr>)}</tbody>
        </table>
        {loading && <div className="ac-job-listing-loading">Loading {title.toLowerCase()}…</div>}
      </div>
      <footer className="ac-current-jobs-recordbar">
        <span>Record:</span><button data-action-status="complete" onClick={() => void load(1)} disabled={result.page <= 1 || loading}>|◀</button><button data-action-status="complete" onClick={() => void load(result.page - 1)} disabled={result.page <= 1 || loading}>◀</button>
        <span>{firstRecord}–{lastRecord}</span><button data-action-status="complete" onClick={() => void load(result.page + 1)} disabled={result.page >= pageCount || loading}>▶</button><button data-action-status="complete" onClick={() => void load(pageCount)} disabled={result.page >= pageCount || loading}>▶|</button>
        <span>of {result.total.toLocaleString()}</span><span className="filter">▽ {applied.customer || applied.job ? "Filtered" : "Unfiltered"}</span><span className="status">Page {result.page} of {pageCount}</span><div />
      </footer>
    </section>
  );
}
