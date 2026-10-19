"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactReportKind, ContactReportRow, ContactReportSort } from "@/lib/contactReports";

const views = ["Default", "Contact Info", "View 03", "View 04", "View 05", "View 06", "View 07", "View 08", "View 09", "View 10"];
const accountFilters = ["All Accounts", "AR Report", "Up to Term", "Over Term", "Up to 30", "Over 30", "Over 60", "Over 90", "Over 120", "01 Invoice", "Money Owed"];
type ContactReportPayload = { ok: boolean; rows: ContactReportRow[]; total: number; page: number; pageSize: number; queryMs: number; error?: string };

export function ContactReportScreen({ kind, rows: initialRows, total: initialTotal, pageSize, queryMs: initialQueryMs, salesmen, error = "" }: {
  kind: ContactReportKind;
  rows: ContactReportRow[];
  total: number;
  pageSize: number;
  queryMs: number;
  salesmen: string[];
  error?: string;
}) {
  const router = useRouter();
  const label = kind === "invoices" ? "Invoices" : "Verify Hours";
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [pageQueryMs, setPageQueryMs] = useState(initialQueryMs);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState(error);
  const [view, setView] = useState("View 01");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tracking, setTracking] = useState<"" | "yes" | "no">("");
  const [salesman, setSalesman] = useState("");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [sort, setSort] = useState<ContactReportSort>("oldestInvoice");
  const [descending, setDescending] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshTimestamp, setRefreshTimestamp] = useState("");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const moneyOwed = useMemo(() => Number(rows[0]?.filteredTotalOwed ?? 0), [rows]);

  useEffect(() => { setRefreshTimestamp(new Date().toLocaleString()); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setQuery(searchInput.trim()); }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ kind, page: String(page), pageSize: String(pageSize), search: query.trim(), tracking, salesman, accountFilter, sort, descending: String(descending) });
    setLoading(true);
    setRequestError("");
    fetch(`/api/reports/contact-report?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as ContactReportPayload;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Contact report rows could not be loaded.");
        setRows(payload.rows); setTotal(payload.total); setPageQueryMs(payload.queryMs);
      })
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError") {
          setRows([]); setTotal(0); setRequestError(reason instanceof Error ? reason.message : "Contact report rows could not be loaded.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind, page, pageSize, query, tracking, salesman, accountFilter, sort, descending]);

  function changeFilter(change: () => void) { setPage(1); change(); }
  function clear() { setSearchInput(""); setQuery(""); setTracking(""); setSalesman(""); setAccountFilter("All Accounts"); setSort("oldestInvoice"); setDescending(false); setPage(1); }
  function exportPage() {
    const columns = ["Customer", "Contact", "Phone", "Cell", "Email", "Salesman", "Customer Since", "Last Week in Tracking", "Oldest Invoice", "Total Owed"];
    const lines = rows.map((row) => [row.customer, row.contact, row.phone, row.cell, row.email, row.salesman, row.customerSince, row.lastWeekInTracking, row.oldestInvoice, row.totalOwed]);
    const csv = [columns, ...lines].map((line) => line.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${kind}-contact-report-page-${page}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <section className="access-report-screen contact-report-screen">
    <header>
      <h1>{label} Contact Report</h1>
      <label>View: <select value={view} onChange={(e) => setView(e.target.value)}>{Array.from({ length: 10 }, (_, i) => <option key={i}>{`View ${String(i + 1).padStart(2, "0")}`}</option>)}</select></label>
      <button data-action-status="complete" onClick={() => { localStorage.setItem(`${kind}-contact-report-view`, JSON.stringify({ view, sort, descending })); setMessage("View saved on this computer."); }}>Save View</button>
      <button data-action-status="complete" onClick={() => { localStorage.removeItem(`${kind}-contact-report-view`); setView("View 01"); setMessage("Saved view deleted."); }}>Delete View</button>
      <button data-action-status="complete" onClick={() => router.refresh()} disabled={loading}>Refresh</button>
      <label>Search: <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} /></label>
      <div className="contact-report-header-filters">
        <select aria-label="In Tracking" value={tracking} onChange={(e) => changeFilter(() => setTracking(e.target.value as "" | "yes" | "no"))}><option value="">&lt;In Tracking?&gt;</option><option value="yes">Yes</option><option value="no">No</option></select>
        <select aria-label="Date Range" value={accountFilter} onChange={(e) => changeFilter(() => setAccountFilter(e.target.value))}><option value="All Accounts">&lt;Date Range&gt;</option>{accountFilters.filter((x) => x.includes("30") || x.includes("60") || x.includes("90") || x.includes("120")).map((x) => <option key={x}>{x}</option>)}</select>
        <select aria-label="Salesman" value={salesman} onChange={(e) => changeFilter(() => setSalesman(e.target.value))}><option value="">&lt;Salesman&gt;</option>{salesmen.map((name) => <option key={name}>{name}</option>)}</select>
      </div>
      <button data-action-status="linked" onClick={() => router.push("/tracking")}>Cancel</button>
    </header>
    <div className="contact-report-controls">
      <div>
        <fieldset><legend>Sort By:</legend>{[["Oldest Invoice", "oldestInvoice"], ["Customer", "customer"], ["Total Owed", "totalOwed"], ["Customer Since", "customerSince"], ["Last Week in Tracking", "lastWeekInTracking"]].map(([text, key]) => <label key={key}><input type="radio" name={`${kind}-sort`} checked={sort === key} onChange={() => changeFilter(() => { setDescending(sort === key ? !descending : false); setSort(key as ContactReportSort); })} />{text}</label>)}</fieldset>
        <div className="contact-report-refresh"><span>Last Open Inv Refresh:</span><output>{refreshTimestamp || "—"}</output><button data-action-status="linked" onClick={() => router.push("/open-invoices")}>Open Invoice<br />Refresh</button></div>
      </div>
      <div className="contact-report-views">{views.map((name, i) => <button data-action-status="complete" key={name} onClick={() => setView(`View ${String(i + 1).padStart(2, "0")}`)}>{name}</button>)}</div>
      <div className="contact-report-account-filters">{accountFilters.map((name) => <button data-action-status="linked" key={name} aria-pressed={accountFilter === name} onClick={() => name === "AR Report" ? router.push("/accounts-receivable") : changeFilter(() => setAccountFilter(name))}>{name}</button>)}<output>${moneyOwed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</output></div>
      <p>Money owed may not be accurate if more than one contact is listed for any customer.</p>
    </div>
    {(requestError || message) && <p role={requestError ? "alert" : "status"} className="report-data-error">{requestError || message}</p>}
    <div className="contact-report-grid" aria-busy={loading}><table><thead><tr><th /><th>Customer</th><th /><th>Contact</th><th /><th>Phone</th><th /><th>Cell</th><th /><th>Email</th><th /><th>Position</th></tr></thead><tbody>{rows.map((row, i) => <tr key={`${row.customerId}-${i}`} className={i === 0 ? "is-current" : undefined} onDoubleClick={() => router.push(`/customers/${encodeURIComponent(row.customerId)}`)}><td /><td>{row.customer}</td><td /><td>{row.contact}</td><td /><td>{row.phone}</td><td /><td>{row.cell}</td><td /><td>{row.email}</td><td /><td>{row.contact ? label : ""}</td></tr>)}{!rows.length && <tr><td colSpan={12}>{requestError ? "Report data is unavailable." : loading ? "Loading contact records…" : "No contacts match the current filters."}</td></tr>}</tbody><tfoot><tr><td /><td>Total</td><td colSpan={10} /></tr></tfoot></table></div>
    <footer>Record: {total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}` : "0 of 0"}<button data-action-status="complete" onClick={clear}>Clear Filters</button><button data-action-status="complete" disabled={page <= 1 || loading} onClick={() => setPage(1)}>First</button><button data-action-status="complete" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button data-action-status="complete" disabled={page >= pageCount || loading} onClick={() => setPage((current) => current + 1)}>Next</button><button data-action-status="complete" disabled={page >= pageCount || loading} onClick={() => setPage(pageCount)}>Last</button><button data-action-status="complete" disabled={!rows.length} onClick={exportPage}>Export Page</button><span>{loading ? "Querying…" : `SQL query ${pageQueryMs < 1000 ? `${pageQueryMs} ms` : `${(pageQueryMs / 1000).toFixed(2)} s`}`}</span></footer>
  </section>;
}
