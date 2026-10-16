"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { TwentyPercentRuleRow } from "@/lib/salesReportBreakdown";

function money(value: number) { return value.toLocaleString("en-US", { style: "currency", currency: "USD" }); }
function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
const headers = ["Contract With", "Company Name", "Salesman", "Margin", "Total INV", "", "Adj Margin", "Adj Total INV"];

export function TwentyPercentRuleReportScreen({ initialStart, initialEnd, initialRows, initialError }: { initialStart: string; initialEnd: string; initialRows: TwentyPercentRuleRow[]; initialError: string }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  const totalInvoice = useMemo(() => rows.reduce((sum, row) => sum + Number(row.totalInvoice || 0), 0), [rows]);
  const totalAdjustedInvoice = useMemo(() => rows.reduce((sum, row) => sum + Number(row.adjustedInvoice || 0), 0), [rows]);

  async function refresh(from = startDate, to = endDate) {
    if (!from || !to || from > to) { setError("Choose a valid start and end date."); return; }
    setStartDate(from); setEndDate(to); setLoading(true); setError(""); setMessage("");
    try {
      const params = new URLSearchParams({ startDate: from, endDate: to });
      const response = await fetch(`/api/twenty-percent-rule-report?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not refresh the 20% Rule Report.");
      setRows(result.rows as TwentyPercentRuleRow[]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh the 20% Rule Report."); setRows([]); }
    finally { setLoading(false); }
  }
  function exportReport() {
    const lines = [headers, ...rows.map((row) => [row.contractWith, row.companyName, row.salesman, row.margin == null ? "" : `${row.margin}%`, row.totalInvoice, "", row.adjustedMargin == null ? "" : `${row.adjustedMargin}%`, row.adjustedInvoice])];
    const file = lines.map((line) => line.map(csv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", file], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `20-percent-rule-${startDate}-to-${endDate}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="sales-breakdown-screen twenty-rule-screen">
    <header className="sales-breakdown-toolbar"><h1>20% Rule Report</h1><label>Start<input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)}/></label><label>End<input aria-label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)}/></label><AccessButton onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</AccessButton><AccessButton onClick={exportReport} disabled={!rows.length}>Export View</AccessButton><AccessButton onClick={() => window.print()}>Print</AccessButton><button onClick={() => router.push("/reports")}>Cancel</button><button className="rpr-help" aria-label="Help" onClick={() => setMessage("The 20% Rule Report reduces each invoice total by 20% and recalculates margin using tracked payroll.")}>?</button></header>
    {error && <p className="sales-breakdown-message" role="alert">{error}</p>}{message && <p className="sales-breakdown-message" role="status">{message}</p>}
    <div className="sales-breakdown-preview"><article className="sales-breakdown-paper twenty-rule-paper">
      <h2>20% Rule Report</h2><span className="sales-breakdown-period">{startDate} — {endDate}</span>
      <table><thead><tr>{headers.map((header, index) => <th className={index === 5 ? "twenty-rule-spacer" : ""} key={`${header}-${index}`}>{header}</th>)}</tr></thead><tbody>
        {rows.map((row) => <tr key={row.id}><td>{row.contractWith}</td><td>{row.companyName}</td><td>{row.salesman}</td><td>{row.margin == null ? "" : `${row.margin.toFixed(2)}%`}</td><td>{money(row.totalInvoice)}</td><td/><td>{row.adjustedMargin == null ? "" : `${row.adjustedMargin.toFixed(2)}%`}</td><td>{money(row.adjustedInvoice)}</td></tr>)}
        {!rows.length && <tr className="sales-breakdown-empty"><td colSpan={8}>{loading ? "Loading report…" : "No sales records for this period."}</td></tr>}
      </tbody></table>
      <div className="twenty-rule-total-row"><span>{money(totalInvoice)}</span><span>{money(totalAdjustedInvoice)}</span></div>
      <div className="twenty-rule-totals"><span>{money(totalInvoice)}</span><span className="sales-red-total">{money(totalAdjustedInvoice)}</span></div>
      <footer>Page 1 of 1</footer>
    </article></div>
  </section>;
}
