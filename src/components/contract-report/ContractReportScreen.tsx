"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { CustomerSummary } from "@/types/customer";

const PAYROLL_COMPANIES = ["GS", "HSG", "IPG", "ISG", "MLS", "T&R", "AMP"];
const DEFAULT_VIEW = "View 03";

type CustomersResponse = {
  ok: boolean;
  data: CustomerSummary[];
  error?: string;
};

export function ContractReportScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [company, setCompany] = useState("IPG");
  const [problemOnly, setProblemOnly] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [useButton, setUseButton] = useState(true);
  const [views, setViews] = useState([DEFAULT_VIEW]);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("contract-report-views");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (parsed.length) setViews(parsed);
      } catch { /* ignore invalid saved views */ }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/customers?search=${encodeURIComponent(appliedQuery)}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<CustomersResponse>)
      .then((payload) => { if (payload.ok) setCustomers(payload.data); })
      .catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") setCustomers([]); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [appliedQuery]);

  const visibleRows = useMemo(() => customers.slice(0, 64), [customers]);

  function saveView() {
    const name = window.prompt("View name", view)?.trim();
    if (!name) return;
    const next = Array.from(new Set([...views, name]));
    setViews(next);
    setView(name);
    window.localStorage.setItem("contract-report-views", JSON.stringify(next));
  }

  function deleteView() {
    if (view === DEFAULT_VIEW) return;
    const next = views.filter((item) => item !== view);
    setViews(next);
    setView(DEFAULT_VIEW);
    window.localStorage.setItem("contract-report-views", JSON.stringify(next));
  }

  function toggleCustomer(customerId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(customerId)) next.delete(customerId); else next.add(customerId);
      return next;
    });
  }

  function exportView() {
    const header = ["Name", `Sales Contract Link ${company}`, `WCx Date ${company}`, `WCx Link ${company}`, `GLx Date ${company}`, `GLx Link ${company}`, "Salesman"];
    const lines = visibleRows.map((row) => [row.customerName, "", "", "", "", "", row.salesman]);
    const csv = [header, ...lines].map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `contract-report-${company.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="ac-contract-report">
      <header className="ac-contract-header">
        <h1>Contract Report</h1>
        <div className="ac-contract-viewbar">
          <label>View:</label>
          <select value={view} onChange={(event) => setView(event.target.value)}>{views.map((item) => <option key={item}>{item}</option>)}</select>
          <AccessButton onClick={saveView}>Save View</AccessButton>
          <AccessButton onClick={deleteView} disabled={view === DEFAULT_VIEW}>Delete View</AccessButton>
          <label>Go To:</label><select aria-label="Go to column"><option /></select>
          <AccessButton onClick={() => setAppliedQuery(query.trim())}>Refresh</AccessButton>
          <AccessButton onClick={() => setSelected(new Set())}>Zero</AccessButton>
          <AccessButton onClick={exportView}>Export View</AccessButton>
        </div>
        <div className="ac-contract-closebar">
          <AccessButton className="ac-contract-open">Open Current Contract</AccessButton>
          <AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton>
          <button className="ac-job-app-help" type="button" title="Help" aria-label="Help">?</button>
        </div>
      </header>

      <div className="ac-contract-tools">
        <div className="ac-contract-search">
          <strong>SEARCH</strong>
          <label>Name: <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setAppliedQuery(query.trim()); }} /></label>
          <AccessButton onClick={() => setAppliedQuery(query.trim())}>Search</AccessButton>
          <fieldset><legend>Use Button</legend><label><input type="radio" checked={useButton} onChange={() => setUseButton(true)} /> Yes</label><label><input type="radio" checked={!useButton} onChange={() => setUseButton(false)} /> No</label></fieldset>
          <span>Select:</span><AccessButton onClick={() => setSelected(new Set())}>Clear</AccessButton><AccessButton onClick={() => setSelected(new Set(visibleRows.map((row) => row.customerId)))}>All</AccessButton>
        </div>
        <div className="ac-contract-main-tools">
          <div className="ac-contract-companies">
            {PAYROLL_COMPANIES.map((item) => <AccessButton key={item} className={item === company ? "is-active" : ""} onClick={() => setCompany(item)}>{item}</AccessButton>)}
            <AccessButton aria-label="Additional payroll company" />
          </div>
          <div className="ac-contract-subtools">
            <em>Your mouse is over:</em><span>S Pkg&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Sales Pks</span>
            <fieldset><label><input type="radio" checked={problemOnly} onChange={() => setProblemOnly(true)} /> Customers with Problems</label><label><input type="radio" checked={!problemOnly} onChange={() => setProblemOnly(false)} /> All Customers in Tracking</label></fieldset>
          </div>
        </div>
        <AccessButton className="ac-contract-clear" onClick={() => { setQuery(""); setAppliedQuery(""); setProblemOnly(true); }}>Clear Filters</AccessButton>
      </div>

      <div className="ac-contract-grid-wrap">
        <table className="ac-contract-grid">
          <colgroup><col className="selector" /><col className="select" /><col className="name" /><col className="link" /><col className="date" /><col className="link" /><col className="date" /><col className="link" /><col className="sales" /></colgroup>
          <thead><tr><th /><th>Select<i /></th><th>Name<i /></th><th>Sales Contract Link {company}<i /></th><th>WCx Date {company}<i /></th><th>WCx Link {company}<i /></th><th>GLx Date {company}<i /></th><th>GLx Link {company}<i /></th><th>Salesman<i /></th></tr></thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={row.customerId} className={index === 0 ? "is-current" : ""} onClick={() => toggleCustomer(row.customerId)}>
                <td>{index === 0 ? "▶" : ""}</td><td>{selected.has(row.customerId) ? "✓" : ""}</td><td>{row.customerName}</td><td className="contract-link" /><td className="contract-date" /><td className="contract-link" /><td className="contract-date" /><td className="contract-link" /><td>{row.salesman}</td>
              </tr>
            ))}
            {!loading && visibleRows.length === 0 && <tr><td /><td colSpan={8} className="ac-contract-empty">No customer records found.</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="ac-job-app-recordbar"><span>Record:</span><button type="button">|◀</button><button type="button">◀</button><input aria-label="Record number" value={visibleRows.length ? "1" : ""} readOnly /><span>of {visibleRows.length}</span><button type="button">▶</button><button type="button">▶|</button><span className="ac-job-app-filtered">▽ Filtered</span><span className="ac-job-app-search-status">Search</span><div className="ac-job-app-scrollbar"><span /></div></footer>
    </section>
  );
}
