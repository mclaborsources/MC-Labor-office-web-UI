"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import { ReportWeekControls } from "@/components/reports/ReportWeekControls";
import type { RatesInvoiceTotalRow } from "@/lib/ratesInvoiceTotal";

type Problem = "all" | "problems" | "payRate" | "otPayRate" | "billRate" | "otBillRate" | "invoiceTotal";
const problemOptions: [Problem, string][] = [["all", "All Records"], ["problems", "All Problems"], ["payRate", "Pay Rate"], ["otPayRate", "OT Pay Rate"], ["billRate", "Bill Rate"], ["otBillRate", "OT Bill Rate"], ["invoiceTotal", "Invoice Total"]];
const views = ["Default", "View 02", "View 03", "View 04", "View 05", "View 06"];
const columns: [keyof RatesInvoiceTotalRow, string][] = [["customer", "Customer"], ["job", "Job"], ["weekEnding", "Week Ending"], ["firstName", "First Name"], ["lastName", "Last Name"], ["middleInitial", "MI"], ["payRate", "Pay Rate"], ["otPayRate", "OT Pay Rate"], ["billRate", "Bill Rate"], ["otBillRate", "OT Bill Rate"], ["regularHours", "Regular Hours"], ["otHours", "OT Hours"], ["totalHours", "Total Hours"], ["invoiceTotal", "Invoice Total"], ["calcInvoiceTotal", "Calc Invoice Total"]];
const problemFor: Partial<Record<Problem, keyof RatesInvoiceTotalRow>> = { payRate: "payRateProblem", otPayRate: "otPayRateProblem", billRate: "billRateProblem", otBillRate: "otBillRateProblem", invoiceTotal: "invoiceTotalProblem" };
function money(value: number | null) { if (value == null) return ""; return value.toLocaleString("en-US", { style: "currency", currency: "USD" }); }
function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export function RatesInvoiceTotalScreen({ initialWeekEnding, initialRows, initialError }: { initialWeekEnding: string; initialRows: RatesInvoiceTotalRow[]; initialError: string }) {
  const router = useRouter();
  const [weekEnding, setWeekEnding] = useState(initialWeekEnding);
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [problem, setProblem] = useState<Problem>("all");
  const [view, setView] = useState(views[0]);
  const [sort, setSort] = useState<{ key: keyof RatesInvoiceTotalRow; desc: boolean }>({ key: "customer", desc: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const filtered = rows.filter((row) => {
      if (query && !`${row.firstName} ${row.middleInitial} ${row.lastName}`.toLocaleLowerCase().includes(query)) return false;
      if (problem === "all") return true;
      if (problem === "problems") return row.payRateProblem || row.otPayRateProblem || row.billRateProblem || row.otBillRateProblem || row.invoiceTotalProblem;
      const flag = problemFor[problem];
      return flag ? Boolean(row[flag]) : true;
    });
    return [...filtered].sort((a, b) => {
      const left = a[sort.key]; const right = b[sort.key];
      const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return sort.desc ? -comparison : comparison;
    });
  }, [rows, search, problem, sort]);

  async function refresh(date = weekEnding) {
    setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/rates-invoice-total?weekEnding=${encodeURIComponent(date)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not refresh report.");
      setRows(result.rows as RatesInvoiceTotalRow[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh report."); setRows([]);
    } finally { setLoading(false); }
  }
  function saveView() {
    try { localStorage.setItem(`rates-invoice-total-${view}`, JSON.stringify({ search, problem, sort })); setMessage(`${view} saved on this computer.`); }
    catch { setMessage("The view could not be saved in this browser."); }
  }
  function changeView(name: string) {
    setView(name);
    try { const saved = localStorage.getItem(`rates-invoice-total-${name}`); if (saved) { const value = JSON.parse(saved); setSearch(value.search ?? ""); setProblem(value.problem ?? "all"); setSort(value.sort ?? { key: "customer", desc: false }); } }
    catch { setMessage("Saved view could not be loaded."); }
  }
  function exportView() {
    const csvText = [columns.map(([, label]) => label), ...visible.map((row) => columns.map(([key]) => row[key] ?? ""))].map((line) => line.map(csv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csvText], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `rates-invoice-total-${weekEnding}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="regular-payroll-screen rates-invoice-screen">
    <header className="rpr-toolbar"><h1>Rates and Invoice Total Report</h1>
      <label>View:<select value={view} onChange={(event) => changeView(event.target.value)}>{views.map((item) => <option key={item}>{item}</option>)}</select></label>
      <AccessButton onClick={saveView}>Save View</AccessButton>
      <AccessButton onClick={() => { localStorage.removeItem(`rates-invoice-total-${view}`); setMessage(`${view} deleted.`); }}>Delete View</AccessButton>
      <AccessButton onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</AccessButton>
      <button className="rpr-cancel" onClick={() => router.push("/reports")}>Cancel</button>
      <button className="rpr-help" aria-label="Help" onClick={() => setMessage("Use the problem buttons to find missing rates and customer invoice totals that differ from calculated billing.")}>?</button>
    </header>
    <div className="rit-filter-area">
      <div className="rit-top-filters"><label>Search in Name:<input value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <div className="rit-week"><ReportWeekControls date={weekEnding} onChange={(date) => { setWeekEnding(date); void refresh(date); }} /></div>
      </div>
      <div className="rit-views-and-problems"><div className="rit-view-buttons">{views.map((item) => <button key={item} className={view === item ? "is-active" : ""} onClick={() => changeView(item)}>{item}</button>)}</div>
        <div className="rit-problems"><strong>Problems:</strong>{problemOptions.map(([key, label]) => <button key={key} className={problem === key ? "is-active" : ""} onClick={() => setProblem(key)}>{label}</button>)}</div>
      </div>
    </div>
    {error && <p className="rpr-error" role="alert">{error}</p>}{message && <p className="rpr-message" role="status">{message}</p>}
    <div className="rpr-grid-wrap rit-grid-wrap"><table className="rpr-grid rit-grid"><thead><tr>{columns.map(([key, label]) => <th key={key}><button onClick={() => setSort((current) => ({ key, desc: current.key === key ? !current.desc : false }))}>{label}<span>{sort.key === key ? sort.desc ? "▼" : "▲" : "⌄"}</span></button></th>)}</tr></thead>
      <tbody>{visible.map((row) => <tr key={row.id}>{columns.map(([key]) => <td key={key} className={Object.values(problemFor).includes(key) && Boolean(row[key]) ? "rit-problem-cell" : ""}>{key === "payRate" || key === "otPayRate" || key === "billRate" || key === "otBillRate" || key === "invoiceTotal" || key === "calcInvoiceTotal" ? money(row[key] as number | null) : String(row[key] ?? "")}</td>)}</tr>)}
        {Array.from({ length: Math.max(0, 16 - Math.min(visible.length, 16)) }, (_, index) => <tr className="rpr-empty-row" key={`empty-${index}`}>{columns.map(([key]) => <td key={key} />)}</tr>)}
      </tbody></table></div>
    <footer className="rpr-footer"><span>Record: {visible.length ? `1 of ${visible.length}` : "0"}</span><span>{search || problem !== "all" ? "Filtered" : "No Filter"}</span><input aria-label="Search report rows" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} /><span>{visible.length} records</span><AccessButton onClick={exportView} disabled={!visible.length}>Export View</AccessButton></footer>
  </section>;
}
