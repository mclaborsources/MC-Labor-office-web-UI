"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AllJobsReportRow } from "@/lib/allJobsReport";

const VIEW_KEY = "all-jobs-report-views";
const defaultView = "01 Default All";
const columns: Array<{ key: keyof AllJobsReportRow; label: string; width: number }> = [
  { key: "customer", label: "Customer", width: 210 },
  { key: "salesman", label: "Salesman", width: 130 },
  { key: "job", label: "Job", width: 160 },
  { key: "street", label: "Street", width: 185 },
  { key: "city", label: "City", width: 120 },
  { key: "state", label: "State", width: 58 },
  { key: "foreman", label: "Foreman Name", width: 125 },
  { key: "cell", label: "Cell #", width: 115 },
  { key: "startTime", label: "Start Time", width: 82 },
  { key: "startDate", label: "Start Date", width: 105 },
  { key: "instructions", label: "Special Job Instructions", width: 330 },
  { key: "aRateNote", label: "A Rate Note", width: 180 },
  { key: "officeNote", label: "Office Note", width: 240 },
];

export function AllJobsReportScreen({ rows: initialRows, total: initialTotal, error: initialError }: { rows: AllJobsReportRow[]; total: number; error: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [job, setJob] = useState("");
  const [appliedCustomer, setAppliedCustomer] = useState("");
  const [appliedJob, setAppliedJob] = useState("");
  const [views, setViews] = useState([defaultView]);
  const [view, setView] = useState(defaultView);
  const [selected, setSelected] = useState("");
  const [goTo, setGoTo] = useState("");
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const pageSize = 100;

  async function loadPage(page: number, customerFilter = appliedCustomer, jobFilter = appliedJob) {
    setLoading(true); setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), customer: customerFilter, job: jobFilter });
    try {
      const response = await fetch(`/api/reports/all-jobs?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "All Jobs could not be loaded.");
      setRows(result.rows as AllJobsReportRow[]); setTotal(Number(result.total) || 0); setCurrentPage(page); setSelected("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "All Jobs could not be loaded from the database.");
    } finally { setLoading(false); }
  }

  function refresh() {
    const nextCustomer = customer.trim(); const nextJob = job.trim();
    setAppliedCustomer(nextCustomer); setAppliedJob(nextJob);
    void loadPage(1, nextCustomer, nextJob);
  }

  function zero() {
    setCustomer(""); setJob(""); setAppliedCustomer(""); setAppliedJob(""); setSelected("");
    void loadPage(1, "", "");
  }

  function saveView() {
    const name = window.prompt("Save view as", view)?.trim();
    if (!name) return;
    const next = Array.from(new Set([...views, name]));
    setViews(next); setView(name);
    try { localStorage.setItem(VIEW_KEY, JSON.stringify(next)); } catch { /* Keep the current view usable if storage is blocked. */ }
  }

  function deleteView() {
    if (views.length < 2) return;
    const next = views.filter((item) => item !== view);
    setViews(next); setView(next[0] ?? defaultView);
    try { localStorage.setItem(VIEW_KEY, JSON.stringify(next)); } catch { /* Ignore unavailable local storage. */ }
  }

  function exportView() {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [columns.map((column) => quote(column.label)).join(","), ...rows.map((row) => columns.map((column) => quote(row[column.key])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "all-jobs.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="ac-all-jobs">
    <header className="ac-all-jobs-toolbar">
      <h1>All Jobs</h1>
      <button data-action-status="linked" className="ac-all-jobs-post" onClick={() => router.push("/jobs")}>Post a Job</button>
      <label>View:<select value={view} onChange={(event) => setView(event.target.value)}>{views.map((item) => <option key={item}>{item}</option>)}</select></label>
      <button data-action-status="complete" onClick={saveView}>Save View</button><button data-action-status="complete" onClick={deleteView} disabled={views.length < 2}>Delete View</button>
      <label>Go To:<select aria-label="Go to column" value={goTo} onChange={(event) => { setGoTo(event.target.value); document.getElementById(`all-jobs-${event.target.value}`)?.scrollIntoView({ block: "nearest", inline: "center" }); }}><option value="" />{columns.map((column) => <option key={column.key} value={column.key}>{column.label}</option>)}</select></label>
      <button data-action-status="complete" onClick={refresh} disabled={loading}>Refresh</button><button data-action-status="complete" onClick={zero} disabled={loading}>Zero</button><button data-action-status="complete" onClick={exportView}>Export View</button>
      <button data-action-status="linked" className="ac-all-jobs-cancel" onClick={() => router.push("/reports")}>Cancel</button>
    </header>
    <div className="ac-all-jobs-filters">
      <form onSubmit={(event) => { event.preventDefault(); refresh(); }}>
        <strong>SEARCH</strong><label>Customer:<input value={customer} onChange={(event) => setCustomer(event.target.value)} /></label>
        <label>Job:<input value={job} onChange={(event) => setJob(event.target.value)} /></label>
      </form>
      <button data-action-status="complete" onClick={zero} disabled={loading}>Clear Filters</button>
      <em>Click in the Select column for one job</em>
    </div>
    {error && <p className="ac-all-jobs-error" role="alert">{error}</p>}
    <div className="ac-all-jobs-grid-wrap" aria-busy={loading}><table><colgroup><col style={{ width: 20 }} />{columns.map((column) => <col key={column.key} style={{ width: column.width }} />)}<col style={{ width: 35 }} /></colgroup>
      <thead><tr><th aria-label="Row selector" />{columns.map((column) => <th id={`all-jobs-${column.key}`} key={column.key}>{column.label}<span>⌄</span></th>)}<th>Select</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.projectId} className={selected === row.projectId ? "is-selected" : ""} onClick={() => setSelected(row.projectId)}>
        <td className="ac-all-jobs-row-marker">{selected === row.projectId ? "▶" : ""}</td>
        {columns.map((column) => <td key={column.key} title={row[column.key]}>{column.key === "job" ? <Link href={`/jobs/${encodeURIComponent(row.projectId)}`}>{row.job}</Link> : row[column.key]}</td>)}
        <td><input type="radio" name="all-jobs-select" aria-label={`Select ${row.job}`} checked={selected === row.projectId} onChange={() => setSelected(row.projectId)} /></td>
      </tr>)}{!rows.length && <tr><td colSpan={columns.length + 2} className="ac-all-jobs-empty">{loading ? "Loading jobs…" : error ? "" : "No jobs match these filters."}</td></tr>}</tbody>
    </table></div>
    <footer className="ac-all-jobs-recordbar"><span>Record:</span><button data-action-status="complete" onClick={() => void loadPage(1)} disabled={loading || currentPage <= 1}>◀◀</button><button data-action-status="complete" onClick={() => void loadPage(currentPage - 1)} disabled={loading || currentPage <= 1}>◀</button><input readOnly value={total ? (currentPage - 1) * pageSize + 1 : 0} aria-label="Current record" /><span>of {total.toLocaleString()}</span><button data-action-status="complete" onClick={() => void loadPage(currentPage + 1)} disabled={loading || currentPage * pageSize >= total}>▶</button><button data-action-status="complete" onClick={() => void loadPage(Math.max(1, Math.ceil(total / pageSize)))} disabled={loading || currentPage * pageSize >= total}>▶▶</button><span className="ac-all-jobs-filter-status">{appliedCustomer || appliedJob ? "Filtered" : "Unfiltered"}{loading ? " · Loading" : ""}</span><span>{rows.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)}` : "0"}</span><input placeholder="Search" aria-label="Search all job columns" /></footer>
  </section>;
}
