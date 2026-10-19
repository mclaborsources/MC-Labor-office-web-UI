"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { SalesReportBreakdownRow } from "@/lib/salesReportBreakdown";

function money(value: number) { return value.toLocaleString("en-US", { style: "currency", currency: "USD" }); }
function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
const columns = ["Contract With", "Company Name", "Salesman", "Margin", "Total INV"];

export function SalesReportBreakdownScreen({ initialStart, initialEnd, initialRows, initialError }: { initialStart: string; initialEnd: string; initialRows: SalesReportBreakdownRow[]; initialError: string }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  const totalInvoice = useMemo(() => rows.reduce((sum, row) => sum + Number(row.totalInvoice || 0), 0), [rows]);
  const totalProfit = useMemo(() => rows.reduce((sum, row) => sum + Number(row.totalInvoice || 0) * Number(row.margin || 0) / 100, 0), [rows]);

  async function refresh(from = startDate, to = endDate) {
    if (!from || !to || from > to) { setError("Choose a valid start and end date."); return; }
    setStartDate(from); setEndDate(to); setLoading(true); setError(""); setMessage("");
    try {
      const params = new URLSearchParams({ startDate: from, endDate: to });
      const response = await fetch(`/api/sales-report-breakdown?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not refresh sales report.");
      setRows(result.rows as SalesReportBreakdownRow[]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh sales report."); setRows([]); }
    finally { setLoading(false); }
  }
  function exportReport() {
    const lines = [columns, ...rows.map((row) => [row.contractWith, row.companyName, row.salesman, row.margin == null ? "" : `${row.margin}%`, row.totalInvoice])];
    const file = lines.map((line) => line.map(csv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", file], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `sales-report-breakdown-${startDate}-to-${endDate}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="sales-breakdown-screen">
    <header className="sales-breakdown-toolbar"><h1>Sales Report Breakdown</h1><label>Start<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)}/></label><label>End<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)}/></label><AccessButton data-action-status="complete" onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</AccessButton><AccessButton data-action-status="complete" onClick={exportReport} disabled={!rows.length}>Export View</AccessButton><AccessButton data-action-status="complete" onClick={() => window.print()}>Print</AccessButton><button data-action-status="linked" onClick={() => router.push("/reports")}>Cancel</button><button data-action-status="complete" className="rpr-help" aria-label="Help" onClick={() => setMessage("Sales Report Breakdown groups invoice totals by contract, customer, and salesman. Margin is based on invoice less tracked gross payroll.")}>?</button></header>
    {error && <p className="sales-breakdown-message" role="alert">{error}</p>}{message && <p className="sales-breakdown-message" role="status">{message}</p>}
    <div className="sales-breakdown-preview"><article className="sales-breakdown-paper">
      <h2>Sales Report Breakdown</h2><span className="sales-breakdown-period">{startDate} — {endDate}</span>
      <table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>
        {rows.map((row) => <tr key={row.id}><td>{row.contractWith}</td><td>{row.companyName}</td><td>{row.salesman}</td><td>{row.margin == null ? "" : `${row.margin.toFixed(2)}%`}</td><td>{money(row.totalInvoice)}</td></tr>)}
        {!rows.length && <tr className="sales-breakdown-empty"><td colSpan={5}>{loading ? "Loading report…" : "No sales records for this period."}</td></tr>}
      </tbody></table>
      <div className="sales-breakdown-totals"><div><strong>Total INV</strong><span>{money(totalInvoice)}</span></div><div><strong>Margin Total</strong><span className="sales-red-total">{money(totalProfit)}</span></div></div>
      <footer>Page 1 of 1</footer>
    </article></div>
  </section>;
}
