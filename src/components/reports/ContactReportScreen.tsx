"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactReportKind, ContactReportRow } from "@/lib/contactReports";

type SortKey = "oldestInvoice" | "customer" | "totalOwed" | "customerSince" | "lastWeekInTracking";
const views = ["Default", "Contact Info", "View 03", "View 04", "View 05", "View 06", "View 07", "View 08", "View 09", "View 10"];
const accountFilters = ["All Accounts", "AR Report", "Up to Term", "Over Term", "Up to 30", "Over 30", "Over 60", "Over 90", "Over 120", "01 Invoice", "Money Owed"];

function ageInDays(value: string) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(`${value}T00:00:00`).getTime()) / 86400000));
}

export function ContactReportScreen({ kind, rows, error = "" }: { kind: ContactReportKind; rows: ContactReportRow[]; error?: string }) {
  const router = useRouter();
  const label = kind === "invoices" ? "Invoices" : "Verify Hours";
  const [view, setView] = useState("View 01");
  const [query, setQuery] = useState("");
  const [tracking, setTracking] = useState("");
  const [salesman, setSalesman] = useState("");
  const [accountFilter, setAccountFilter] = useState("All Accounts");
  const [sort, setSort] = useState<SortKey>("oldestInvoice");
  const [descending, setDescending] = useState(false);
  const [message, setMessage] = useState("");
  const salesmen = useMemo(() => Array.from(new Set(rows.map((row) => row.salesman))).filter(Boolean).sort(), [rows]);
  const visible = useMemo(() => rows.filter((row) => {
    if (query && !Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())) return false;
    if (tracking === "yes" && !row.lastWeekInTracking) return false;
    if (tracking === "no" && row.lastWeekInTracking) return false;
    if (salesman && row.salesman !== salesman) return false;
    const age = ageInDays(row.oldestInvoice);
    if (accountFilter === "Money Owed" && row.totalOwed <= 0) return false;
    if (accountFilter === "01 Invoice" && !row.oldestInvoice) return false;
    if (accountFilter === "Up to 30" && (!row.oldestInvoice || age > 30)) return false;
    if (accountFilter.startsWith("Over ") && age <= Number(accountFilter.slice(5))) return false;
    return true;
  }).sort((a, b) => {
    const av = a[sort]; const bv = b[sort];
    const result = typeof av === "number" ? av - Number(bv) : String(av).localeCompare(String(bv), undefined, { numeric: true });
    return (descending ? -1 : 1) * result;
  }), [rows, query, tracking, salesman, accountFilter, sort, descending]);
  const moneyOwed = visible.reduce((sum, row) => sum + Number(row.totalOwed || 0), 0);
  function clear() { setQuery(""); setTracking(""); setSalesman(""); setAccountFilter("All Accounts"); }

  return <section className="access-report-screen contact-report-screen">
    <header>
      <h1>{label} Contact Report</h1>
      <label>View: <select value={view} onChange={(e) => setView(e.target.value)}>{Array.from({ length: 10 }, (_, i) => <option key={i}>{`View ${String(i + 1).padStart(2, "0")}`}</option>)}</select></label>
      <button onClick={() => { localStorage.setItem(`${kind}-contact-report-view`, JSON.stringify({ view, sort, descending })); setMessage("View saved on this computer."); }}>Save View</button>
      <button onClick={() => { localStorage.removeItem(`${kind}-contact-report-view`); setView("View 01"); setMessage("Saved view deleted."); }}>Delete View</button>
      <button onClick={() => router.refresh()}>Refresh</button>
      <label>Search: <input value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <div className="contact-report-header-filters">
        <select aria-label="In Tracking" value={tracking} onChange={(e) => setTracking(e.target.value)}><option value="">&lt;In Tracking?&gt;</option><option value="yes">Yes</option><option value="no">No</option></select>
        <select aria-label="Date Range" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}><option value="All Accounts">&lt;Date Range&gt;</option>{accountFilters.filter((x) => x.includes("30") || x.includes("60") || x.includes("90") || x.includes("120")).map((x) => <option key={x}>{x}</option>)}</select>
        <select aria-label="Salesman" value={salesman} onChange={(e) => setSalesman(e.target.value)}><option value="">&lt;Salesman&gt;</option>{salesmen.map((name) => <option key={name}>{name}</option>)}</select>
      </div>
      <button onClick={() => router.push("/tracking")}>Cancel</button>
    </header>
    <div className="contact-report-controls">
      <div>
        <fieldset><legend>Sort By:</legend>{[["Oldest Invoice", "oldestInvoice"], ["Customer", "customer"], ["Total Owed", "totalOwed"], ["Customer Since", "customerSince"], ["Last Week in Tracking", "lastWeekInTracking"]].map(([text, key]) => <label key={key}><input type="radio" name={`${kind}-sort`} checked={sort === key} onChange={() => { setDescending(sort === key ? !descending : false); setSort(key as SortKey); }} />{text}</label>)}</fieldset>
        <div className="contact-report-refresh"><span>Last Open Inv Refresh:</span><output>{new Date().toLocaleString()}</output><button onClick={() => router.push("/open-invoices")}>Open Invoice<br />Refresh</button></div>
      </div>
      <div className="contact-report-views">{views.map((name, i) => <button key={name} onClick={() => setView(`View ${String(i + 1).padStart(2, "0")}`)}>{name}</button>)}</div>
      <div className="contact-report-account-filters">{accountFilters.map((name) => <button key={name} aria-pressed={accountFilter === name} onClick={() => name === "AR Report" ? router.push("/accounts-receivable") : setAccountFilter(name)}>{name}</button>)}<output>${moneyOwed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</output></div>
      <p>Money owed may not be accurate if more than one contact is listed for any customer.</p>
    </div>
    {(error || message) && <p role={error ? "alert" : "status"} className="report-data-error">{error || message}</p>}
    <div className="contact-report-grid"><table><thead><tr><th /><th>Customer</th><th /><th>Contact</th><th /><th>Phone</th><th /><th>Cell</th><th /><th>Email</th><th /><th>Position</th></tr></thead><tbody>{visible.map((row, i) => <tr key={`${row.customerId}-${i}`} className={i === 0 ? "is-current" : undefined} onDoubleClick={() => router.push(`/customers/${encodeURIComponent(row.customerId)}`)}><td /><td>{row.customer}</td><td /><td>{row.contact}</td><td /><td>{row.phone}</td><td /><td>{row.cell}</td><td /><td>{row.email}</td><td /><td>{row.contact ? label : ""}</td></tr>)}{!visible.length && <tr><td colSpan={12}>No contacts match the current filters.</td></tr>}</tbody><tfoot><tr><td /><td>Total</td><td colSpan={10} /></tr></tfoot></table></div>
    <footer>Record: {visible.length ? 1 : 0} of {visible.length}<button onClick={clear}>Clear Filters</button></footer>
  </section>;
}
