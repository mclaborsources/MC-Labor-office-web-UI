"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OperationalReportRow } from "@/lib/operationalReports";
import { trackingCsv } from "@/lib/trackingGrid";

const PAYROLL_COMPANIES = ["GS", "HSG", "IPG", "ISG", "MLS", "T&R", "AMP"];

function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T12:00:00`);
  shifted.setDate(shifted.getDate() + days);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}

function toFriday(date: string) {
  const selected = new Date(`${date}T12:00:00`);
  const daysUntilFriday = (5 - selected.getDay() + 7) % 7;
  selected.setDate(selected.getDate() + daysUntilFriday);
  return `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;
}

function readableDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export function OperationalReportScreen({
  title,
  rows: initialRows,
  error: initialError = "",
  variant,
  initialWeekEnding = "",
}: {
  title: string;
  rows: OperationalReportRow[];
  error?: string;
  variant: "noc" | "noi" | "rates" | "bonus" | "sick" | "attendance" | "job-orders" | "invoices-week" | "margin-week" | "osha" | "schooling" | "tools" | "401k" | "insurance" | "employee-review" | "job-address-wcc" | "wcc-site" | "directions" | "multiple-jobs";
  initialWeekEnding?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("View 01");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState(initialError);
  const [weekEnding, setWeekEnding] = useState(initialWeekEnding);
  const [payrollCompany, setPayrollCompany] = useState("IPG");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRows(initialRows);
    setError(initialError);
  }, [initialRows, initialError]);

  const columns = useMemo(() => Array.from(new Set(rows.flatMap(Object.keys))).filter((key) => key !== "id"), [rows]);
  const visible = useMemo(() => rows.filter((row) => {
    if (!query) return true;
    const haystack = variant === "rates" ? String(row.Customer ?? "") : Object.values(row).join(" ");
    return haystack.toLowerCase().includes(query.toLowerCase());
  }), [rows, query, variant]);
  const [page, setPage] = useState(1);
  const pageSize = 250;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const shown = visible.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [query, rows]);

  async function loadWeeklyRates(date = weekEnding, company = payrollCompany) {
    if (!date) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ weekEnding: date, payrollCompany: company === "all" ? "" : company });
      const response = await fetch(`/api/reports/weekly-rates?${params}`, { cache: "no-store" });
      const payload = await response.json() as { ok?: boolean; rows?: OperationalReportRow[]; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Weekly rates could not be loaded.");
      setRows(payload.rows ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Weekly rates could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    localStorage.setItem(`${variant}-report-view`, JSON.stringify({ view, query }));
    setMessage("View saved on this computer.");
  }

  function exportRows() {
    const csv = trackingCsv(columns, visible.map((row) => columns.map((column) => row[column] ?? "")));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${variant}-report.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function chooseDate(value: string) {
    const friday = toFriday(value);
    setWeekEnding(friday);
    void loadWeeklyRates(friday, payrollCompany);
  }

  function changePayroll(value: string) {
    setPayrollCompany(value);
    void loadWeeklyRates(weekEnding, value);
  }

  const weekStart = weekEnding ? shiftDate(weekEnding, -6) : "";
  const checkDay = weekEnding ? shiftDate(weekEnding, 6) : "";

  return <section className={`access-report-screen operational-report operational-report-${variant}`}>
    <header>
      <h1>{title}</h1>
      {variant === "rates" && <>
        <label>View: <select value={view} onChange={(event) => setView(event.target.value)}>{Array.from({ length: 8 }, (_, index) => <option key={index}>{index === 0 ? "01 Default Check" : `View ${String(index + 1).padStart(2, "0")}`}</option>)}</select></label>
        <button onClick={save}>Save View</button>
        <button onClick={() => { localStorage.removeItem(`${variant}-report-view`); setMessage("Saved view deleted."); }}>Delete View</button>
        <button onClick={() => void loadWeeklyRates()}>Refresh</button>
        <button onClick={() => { setQuery(""); changePayroll("all"); }}>Zero</button>
        <button disabled={!visible.length} onClick={exportRows}>Export View</button>
        <select aria-label="Payroll company" value={payrollCompany} onChange={(event) => changePayroll(event.target.value)}>
          <option value="IPG">IPG</option><option value="all">All</option>
          {PAYROLL_COMPANIES.filter((company) => company !== "IPG").map((company) => <option key={company} value={company}>{company}</option>)}
        </select>
        <button onClick={() => router.push("/tracking")}>Cancel</button>
      </>}
      {variant !== "rates" && <>
        <label>View: <select value={view} onChange={(event) => setView(event.target.value)}>{Array.from({ length: variant === "noc" ? 17 : 8 }, (_, index) => <option key={index}>{index === 0 ? "01 Default" : `View ${String(index + 1).padStart(2, "0")}`}</option>)}</select></label>
        <button onClick={save}>Save View</button>
        <button onClick={() => { localStorage.removeItem(`${variant}-report-view`); setMessage("Saved view deleted."); }}>Delete View</button>
        <button onClick={() => router.refresh()}>Refresh</button>
        {variant !== "noc" && <><button onClick={() => setQuery("")}>Zero</button><button disabled={!visible.length} onClick={exportRows}>Export View</button></>}
        <button onClick={() => router.push("/tracking")}>Cancel</button>
      </>}
    </header>

    {variant === "rates" ? <div className="operational-rate-tools">
      <label>Search in Customer:<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Customer name" /></label>
      <label>Week Ending Friday:<input aria-label="Week Ending Friday" type="date" value={weekEnding} onChange={(event) => event.target.value && chooseDate(event.target.value)} /></label>
      <button aria-label="Previous week" title="Previous week" onClick={() => chooseDate(shiftDate(weekEnding, -7))}>‹</button>
      <button aria-label="Next week" title="Next week" onClick={() => chooseDate(shiftDate(weekEnding, 7))}>›</button>
      <div className="operational-rate-period"><span>Start and End Days of Report</span><span>{readableDate(weekStart)}</span><span>{readableDate(weekEnding)}</span></div>
      <div className="operational-rate-checkday"><span>Payroll Chk Day</span><span>{readableDate(checkDay)}</span></div>
      <button onClick={() => { setQuery(""); setPayrollCompany("IPG"); void loadWeeklyRates(weekEnding, "IPG"); }}>Clear Filters</button>
      {loading && <span role="status">Loading week…</span>}
    </div> : <div className="operational-tools">
      <label>{variant === "bonus" ? "Name:" : "Search in Name:"}<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div>{Array.from({ length: variant === "noc" ? 17 : 5 }, (_, index) => <button key={index} onClick={() => setView(`View ${String(index + 1).padStart(2, "0")}`)}>{index === 0 ? "Default" : `View ${String(index + 1).padStart(2, "0")}`}</button>)}</div>
      <button onClick={() => setQuery("")}>Clear Filters</button>
    </div>}

    {variant === "rates" && <p className="operational-note">Showing {payrollCompany === "all" ? "all payroll companies" : payrollCompany} for week ending {weekEnding ? new Date(`${weekEnding}T12:00:00`).toLocaleDateString("en-US") : "—"}.</p>}
    {variant === "bonus" && <p className="operational-note">Bonus totals use the current $1-per-tracked-hour rule shown in the Access report. Referral-specific fields require their source column to be confirmed.</p>}
    {(error || message) && <p className="report-data-error" role={error ? "alert" : "status"}>{error || message}</p>}

    <div className="operational-grid"><table><thead><tr><th />{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {shown.map((row, index) => <tr key={String(row.id ?? index)} className={index === 0 ? "is-current" : undefined} onDoubleClick={() => variant === "bonus" && router.push(`/employees/${row.id}`)}>
        <td />{columns.map((column) => <td key={column}>{typeof row[column] === "number" && (column.includes("Amount") || column.includes("Payment") || column.includes("Balance") || column.includes("Rate") || column.includes("Owed") || column.includes("Bonus") || column === "Margin $") ? Number(row[column]).toLocaleString("en-US", { style: "currency", currency: "USD" }) : row[column]}</td>)}
      </tr>)}
      {!visible.length && <tr><td colSpan={columns.length + 1}>No records match the current filters.</td></tr>}
    </tbody></table></div>
    <footer>Records {visible.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, visible.length)} of {visible.length}<span className="operational-page-controls"><button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button></span></footer>
  </section>;
}
