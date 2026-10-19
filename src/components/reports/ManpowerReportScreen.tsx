"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackingCsv } from "@/lib/trackingGrid";
import type { ManpowerContactFilters, ManpowerRow } from "@/lib/manpowerReport";

const columns = ["Co", "Customer Since", "Customer", "Street", "City", "State", "Zip", "Customer Type", "Phone", "Sales Person", "Contact", "Office Phone", "Cell", "Email"];
const keys: (keyof ManpowerRow | null)[] = [null, null, "customer", "street", "city", "state", "zip", "customerType", "phone", "salesman", "contact", "officePhone", "cell", "email"];
const PAGE_SIZE = 250;

type ReportResponse = {
  ok: boolean;
  rows: ManpowerRow[];
  total: number;
  salesmen: string[];
  customerTypes: string[];
  error?: string;
};

export function ManpowerReportScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<ManpowerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [salesmen, setSalesmen] = useState<string[]>([]);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [salesman, setSalesman] = useState("");
  const [type, setType] = useState("");
  const [tracking, setTracking] = useState<"" | "yes" | "no">("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("View 01");
  const [oneContact, setOneContact] = useState(false);
  const [sort, setSort] = useState<ManpowerContactFilters["sort"]>("customer");
  const [descending, setDescending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page), search: query, salesman, customerType: type,
        tracking, oneContact: String(oneContact), sort, descending: String(descending),
      });
      fetch(`/api/reports/manpower-contact?${params}`, { signal: controller.signal })
        .then(async (response) => {
          const payload = await response.json() as ReportResponse;
          if (!response.ok || !payload.ok) throw new Error(payload.error || "Customer contacts could not be loaded.");
          setRows(payload.rows);
          setTotal(payload.total);
          setSalesmen(payload.salesmen);
          setCustomerTypes(payload.customerTypes);
        })
        .catch((fetchError: unknown) => {
          if ((fetchError as { name?: string }).name !== "AbortError") {
            setRows([]);
            setTotal(0);
            setError(fetchError instanceof Error ? fetchError.message : "Customer contacts could not be loaded.");
          }
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, query, salesman, type, tracking, oneContact, sort, descending]);

  const widths = useMemo(() => [30, 110, 180, 205, 108, 60, 46, 106, 100, 90, 142, 142, 143, 270], []);

  function clear() {
    setQuery(""); setSalesman(""); setType(""); setTracking(""); setOneContact(false); setSort("customer"); setDescending(false); setPage(1);
  }

  function exportView() {
    const csv = trackingCsv(columns, rows.map((row) => keys.map((key) => key ? row[key] : "")));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `manpower-contacts-page-${page}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function sortBy(key: keyof ManpowerRow) {
    if (key !== "customer" && key !== "salesman" && key !== "contact") return;
    const next = key as ManpowerContactFilters["sort"];
    setDescending(sort === next ? !descending : false);
    setSort(next);
    setPage(1);
  }

  function unavailable() {
    setMessage("Invoice balances, aging, customer-since dates and contract company mappings are not connected yet.");
  }

  return <section className="access-report-screen manpower-report">
    <header>
      <h1>Manpower Contact Report</h1>
      <label>View: <select value={view} onChange={(event) => setView(event.target.value)}>{Array.from({ length: 10 }, (_, index) => <option key={index}>{`View ${String(index + 1).padStart(2, "0")}`}</option>)}</select></label>
      <button data-action-status="complete" onClick={() => { localStorage.setItem("manpower-report-view", JSON.stringify({ view, query, salesman, type, tracking, oneContact, sort, descending })); setMessage("View saved on this computer."); }}>Save View</button>
      <button data-action-status="complete" onClick={() => { localStorage.removeItem("manpower-report-view"); setView("View 01"); setMessage("Saved view deleted."); }}>Delete View</button>
      <button data-action-status="complete" onClick={() => setPage(1)}>Refresh</button>
      <button data-action-status="complete" onClick={clear}>Zero</button>
      <button data-action-status="complete" disabled={!rows.length} onClick={exportView}>Export Page</button>
      <div className="manpower-filters">
        <select aria-label="In Tracking" value={tracking} onChange={(event) => { setTracking(event.target.value as typeof tracking); setPage(1); }}><option value="">&lt;In Tracking?&gt;</option><option value="yes">Has tracking history</option><option value="no">No tracking history</option></select>
        <select aria-label="Date Range" disabled><option>&lt;Date Range&gt;</option></select>
        <select aria-label="Salesman" value={salesman} onChange={(event) => { setSalesman(event.target.value); setPage(1); }}><option value="">&lt;Salesman&gt;</option>{salesmen.map((name) => <option key={name}>{name}</option>)}</select>
        <select aria-label="Customer Type" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option value="">&lt;Customer Type&gt;</option>{customerTypes.map((name) => <option key={name}>{name}</option>)}</select>
      </div>
      <button data-action-status="linked" onClick={() => router.push("/tracking")}>Cancel</button>
    </header>
    <div className="manpower-controls">
      <div>
        <label>Search: <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <fieldset><span>Sort By:</span>{["Oldest Invoice", "Customer", "Total Owed", "Customer Since", "Last Week in Tracking"].map((label) => <label key={label}><input type="radio" name="manpower-sort" checked={label === "Customer" && sort === "customer"} onChange={() => label === "Customer" ? (setSort("customer"), setDescending(false), setPage(1)) : unavailable()} />{label}</label>)}</fieldset>
        <div className="manpower-refresh">Last Open Inv Refresh: <output>Not loaded</output><button data-action-status="linked" onClick={() => router.push("/open-invoices")}>Open Invoice Refresh</button></div>
      </div>
      <div className="manpower-views">{["Default", "Contact Info", ...Array.from({ length: 8 }, (_, index) => `View ${String(index + 3).padStart(2, "0")}`)].map((label, index) => <button data-action-status="complete" key={label} onClick={() => setView(`View ${String(index + 1).padStart(2, "0")}`)}>{label}</button>)}</div>
      <div>
        <div className="manpower-account-buttons">{["All Accounts", "AR Report", "Up to Term", "Over Term", "Up to 30", "Over 30", "Over 60", "Over 90", "Over 120", "01 Invoice", "Money Owed"].map((label) => <button data-action-status={label === "All Accounts" || label === "AR Report" ? "complete" : "partial"} key={label} onClick={() => label === "All Accounts" ? clear() : label === "AR Report" ? router.push("/accounts-receivable") : unavailable()}>{label}</button>)}<output>—</output></div>
        <div className="manpower-audit"><span>Audit Report:</span><button data-action-status="complete" onClick={() => { setOneContact(false); setPage(1); }} aria-pressed={!oneContact}>All Contacts</button><button data-action-status="complete" onClick={() => { setOneContact(true); setPage(1); }} aria-pressed={oneContact}>One Contact per Customer</button></div>
      </div>
      <div className="manpower-note"><p>Money owed is unavailable until Seamus invoice data is connected. The contact list is paged to keep the report responsive.</p><button data-action-status="complete" onClick={clear}>Clear Filters</button></div>
    </div>
    {(error || message) && <p role="status" className="report-data-error">{error || message}</p>}
    <div className="customer-report-grid"><table><colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
      <thead><tr>{columns.map((label, index) => { const key = keys[index]; const sortable = key === "customer" || key === "salesman" || key === "contact"; return <th key={label}>{sortable && key ? <button data-action-status="complete" onClick={() => sortBy(key)}>{label} <span aria-hidden="true">⌄</span></button> : <span>{label}</span>}</th>; })}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={`${row.id}-${index}`} onDoubleClick={() => router.push(`/customers/${encodeURIComponent(row.id)}`)}>{keys.map((key, cellIndex) => { const value = key ? String(row[key] ?? "") : "—"; return <td key={cellIndex} title={value}>{value}</td>; })}</tr>)}
        {loading && !rows.length && <tr><td colSpan={14} role="status">Loading customer contacts…</td></tr>}
        {!loading && !error && !rows.length && <tr><td colSpan={14}>No contacts match the current filters.</td></tr>}
      </tbody>
    </table></div>
    <footer className="manpower-pagination">
      <span>{total.toLocaleString()} contacts</span>
      <button data-action-status="complete" disabled={page <= 1 || loading} onClick={() => setPage(1)}>First</button>
      <button data-action-status="complete" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
      <span>Page {page} of {pageCount}</span>
      <button data-action-status="complete" disabled={page >= pageCount || loading} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
      <button data-action-status="complete" disabled={page >= pageCount || loading} onClick={() => setPage(pageCount)}>Last</button>
      <span>Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}</span>
    </footer>
  </section>;
}
