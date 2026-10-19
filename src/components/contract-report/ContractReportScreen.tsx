"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";

const PAYROLL_COMPANIES = ["GS", "HSG", "IPG", "ISG", "MLS", "T&R", "AMP", "HDE"];
const DEFAULT_VIEW = "View 03";

type ContractReportCustomer = {
  customerId: string;
  customerName: string;
  salesman: string;
  contractLink: string;
  wcDate: string;
  wcLink: string;
  glDate: string;
  glLink: string;
  hasProblem: boolean;
};
type CustomersResponse = { ok: boolean; data: ContractReportCustomer[]; total: number; page: number; pageSize: number; error?: string };

export function ContractReportScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<ContractReportCustomer[]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [company, setCompany] = useState("IPG");
  const [problemOnly, setProblemOnly] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [views, setViews] = useState([DEFAULT_VIEW]);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    setError("");
    const params = new URLSearchParams({ search: appliedQuery, company, problemsOnly: String(problemOnly), page: String(page), pageSize: String(pageSize) });
    fetch(`/api/reports/contract-report?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as CustomersResponse;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Contract report records could not be loaded.");
        setCustomers(payload.data);
        setTotal(payload.total);
      })
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError") {
          setCustomers([]);
          setTotal(0);
          setError(reason instanceof Error ? reason.message : "Contract report records could not be loaded.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [appliedQuery, company, problemOnly, page, pageSize]);

  const selectedPageRows = useMemo(() => customers.filter((row) => selected.has(row.customerId)), [customers, selected]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function applySearch() { setPage(1); setAppliedQuery(query.trim()); }
  function saveView() {
    const name = window.prompt("View name", view)?.trim();
    if (!name) return;
    const next = Array.from(new Set([...views, name]));
    setViews(next); setView(name);
    window.localStorage.setItem("contract-report-views", JSON.stringify(next));
  }
  function deleteView() {
    if (view === DEFAULT_VIEW) return;
    const next = views.filter((item) => item !== view);
    setViews(next); setView(DEFAULT_VIEW);
    window.localStorage.setItem("contract-report-views", JSON.stringify(next));
  }
  function toggleCustomer(customerId: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(customerId)) next.delete(customerId); else next.add(customerId); return next; });
  }
  function exportView() {
    const rows = selectedPageRows.length ? selectedPageRows : customers;
    const header = ["Name", `Sales Contract Link ${company}`, `WCx Date ${company}`, `WCx Link ${company}`, `GLx Date ${company}`, `GLx Link ${company}`, "Salesman"];
    const lines = rows.map((row) => [row.customerName, row.contractLink, row.wcDate, row.wcLink, row.glDate, row.glLink, row.salesman]);
    const csv = [header, ...lines].map((line) => line.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `contract-report-${company.toLowerCase()}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  function clearFilters() { setQuery(""); setAppliedQuery(""); setProblemOnly(false); setPage(1); setSelected(new Set()); }

  return (
    <section className="ac-contract-report">
      <header className="ac-contract-header">
        <h1>Contract Report</h1>
        <div className="ac-contract-viewbar">
          <label>View:</label>
          <select value={view} onChange={(event) => setView(event.target.value)}>{views.map((item) => <option key={item}>{item}</option>)}</select>
          <AccessButton data-action-status="complete" onClick={saveView}>Save View</AccessButton>
          <AccessButton data-action-status="complete" onClick={deleteView} disabled={view === DEFAULT_VIEW}>Delete View</AccessButton>
          <AccessButton data-action-status="complete" onClick={applySearch}>Refresh</AccessButton>
          <AccessButton data-action-status="complete" onClick={() => setSelected(new Set())}>Zero</AccessButton>
          <AccessButton data-action-status="complete" onClick={exportView}>Export View</AccessButton>
        </div>
        <div className="ac-contract-closebar"><AccessButton data-action-status="linked" onClick={() => router.push("/tracking")}>Cancel</AccessButton></div>
      </header>

      <div className="ac-contract-tools">
        <div className="ac-contract-search">
          <label>Name: <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applySearch(); }} /></label>
          <AccessButton data-action-status="complete" onClick={applySearch}>Search</AccessButton>
          <span>Select:</span><AccessButton data-action-status="complete" onClick={() => setSelected(new Set())}>Clear</AccessButton>
          <AccessButton data-action-status="complete" onClick={() => setSelected(new Set([...selected, ...customers.map((row) => row.customerId)]))}>All on Page</AccessButton>
        </div>
        <div className="ac-contract-main-tools">
          <div className="ac-contract-companies" aria-label="Payroll company">
            {PAYROLL_COMPANIES.map((item) => <AccessButton data-action-status="complete" key={item} className={item === company ? "is-active" : ""} aria-pressed={item === company} onClick={() => { setCompany(item); setPage(1); }}>{item}</AccessButton>)}
          </div>
          <div className="ac-contract-subtools">
            <fieldset><legend>Customer Filter</legend>
              <label><input type="radio" checked={problemOnly} onChange={() => { setProblemOnly(true); setPage(1); }} /> Customers with Problems</label>
              <label><input type="radio" checked={!problemOnly} onChange={() => { setProblemOnly(false); setPage(1); }} /> All Customers in Tracking</label>
            </fieldset>
          </div>
        </div>
        <AccessButton data-action-status="complete" className="ac-contract-clear" onClick={clearFilters}>Clear Filters</AccessButton>
      </div>
      {error && <p className="ac-contract-error" role="alert">{error}</p>}

      <div className="ac-contract-grid-wrap" aria-busy={loading}>
        <table className="ac-contract-grid">
          <colgroup><col className="selector" /><col className="select" /><col className="name" /><col className="link" /><col className="date" /><col className="link" /><col className="date" /><col className="link" /><col className="sales" /></colgroup>
          <thead><tr><th /><th>Select</th><th>Name</th><th>Sales Contract Link {company}</th><th>WCx Date {company}</th><th>WCx Link {company}</th><th>GLx Date {company}</th><th>GLx Link {company}</th><th>Salesman</th></tr></thead>
          <tbody>
            {customers.map((row, index) => (
              <tr key={row.customerId} className={`${selected.has(row.customerId) ? "is-current" : ""} ${row.hasProblem ? "has-problem" : ""}`} onDoubleClick={() => router.push(`/customers/${encodeURIComponent(row.customerId)}`)} title="Double-click to open customer">
                <td>{(page - 1) * pageSize + index + 1}</td>
                <td><input aria-label={`Select ${row.customerName}`} type="checkbox" checked={selected.has(row.customerId)} onChange={() => toggleCustomer(row.customerId)} /></td>
                <td>{row.customerName}</td><td>{row.contractLink ? <a href={row.contractLink} target="_blank" rel="noreferrer">Open contract</a> : ""}</td>
                <td>{row.wcDate}</td><td>{row.wcLink ? <a href={row.wcLink} target="_blank" rel="noreferrer">Open WCx</a> : ""}</td>
                <td>{row.glDate}</td><td>{row.glLink ? <a href={row.glLink} target="_blank" rel="noreferrer">Open GLx</a> : ""}</td><td>{row.salesman}</td>
              </tr>
            ))}
            {loading && customers.length === 0 && <tr><td /><td colSpan={8} className="ac-contract-empty" role="status">Loading contract report records…</td></tr>}
            {!loading && customers.length === 0 && <tr><td /><td colSpan={8} className="ac-contract-empty">{error ? "Unable to load report records." : "No customer records match these filters."}</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="ac-contract-recordbar">
        <span>Record: {total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}` : "0 of 0"}</span>
        <button data-action-status="complete" type="button" disabled={page <= 1 || loading} onClick={() => setPage(1)}>First</button>
        <button data-action-status="complete" type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
        <span>Page {page} of {pageCount}</span>
        <button data-action-status="complete" type="button" disabled={page >= pageCount || loading} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
        <button data-action-status="complete" type="button" disabled={page >= pageCount || loading} onClick={() => setPage(pageCount)}>Last</button>
        <span>{loading ? "Loading" : problemOnly ? "Customers with Problems" : "All Customers in Tracking"}</span>
      </footer>
    </section>
  );
}
