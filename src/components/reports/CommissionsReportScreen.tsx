"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { CommissionsReportSummary } from "@/lib/commissionsReport";

function money(value: number) { const formatted = Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return value < 0 ? `($${formatted})` : `$${formatted}`; }
function shiftWeek(value: string, days: number) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate()+days); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function longDate(value: string) { const date = new Date(`${value}T12:00:00`); return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }

export function CommissionsReportScreen({ initialWeekEnding, initialSummary, initialError }: { initialWeekEnding: string; initialSummary: CommissionsReportSummary; initialError: string }) {
  const router = useRouter(); const [weekEnding, setWeekEnding] = useState(initialWeekEnding); const [summary, setSummary] = useState(initialSummary); const [loading, setLoading] = useState(false); const [error, setError] = useState(initialError); const [message, setMessage] = useState("");
  async function refresh(date = weekEnding) {
    setWeekEnding(date); setLoading(true); setError(""); setMessage("");
    try { const response = await fetch(`/api/commissions-report?weekEnding=${encodeURIComponent(date)}`, { cache: "no-store" }); const result = await response.json(); if (!response.ok || !result.ok) throw new Error(result.error || "Could not refresh commissions report."); setSummary(result.summary as CommissionsReportSummary); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh commissions report."); setSummary({ weekEnding: "", grossPayroll: 0, totalInvoices: 0, xcelHrPayroll: 0 }); }
    finally { setLoading(false); }
  }
  return <section className="sales-breakdown-screen commissions-report-screen">
    <header className="sales-breakdown-toolbar"><h1>Commissions Report</h1><label>Week Ending Friday<input type="date" value={weekEnding} onChange={(event) => event.target.value && setWeekEnding(event.target.value)}/></label><button data-action-status="complete" aria-label="Previous week" onClick={() => { const date=shiftWeek(weekEnding,-7); void refresh(date); }}>←</button><button data-action-status="complete" aria-label="Next week" onClick={() => { const date=shiftWeek(weekEnding,7); void refresh(date); }}>→</button><AccessButton data-action-status="complete" onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</AccessButton><AccessButton data-action-status="complete" onClick={() => window.print()}>Print</AccessButton><button data-action-status="linked" onClick={() => router.push("/reports")}>Cancel</button><button data-action-status="complete" className="rpr-help" aria-label="Help" onClick={() => setMessage("Commissions Report summarizes gross payroll, customer invoices, and Payroll Report - XcelHR for the selected week.")}>?</button></header>
    {error && <p className="sales-breakdown-message" role="alert">{error}</p>}{message && <p className="sales-breakdown-message" role="status">{message}</p>}
    <div className="sales-breakdown-preview"><article className="sales-breakdown-paper commissions-paper">
      <header><h2>Commissions Report</h2><span>Week ending {longDate(weekEnding)}</span></header>
      <table><tbody><tr><td>Gross Payroll</td><td>{money(summary.grossPayroll)}</td></tr><tr><td>Total Invoices</td><td>{money(summary.totalInvoices)}</td></tr><tr><td>Payroll Report - XcelHR</td><td>{money(summary.xcelHrPayroll)}</td></tr></tbody></table>
      <div className="commissions-rule" aria-hidden="true"/><footer>Page 1 of 1</footer>{loading && <span className="commissions-loading">Updating report…</span>}
    </article></div>
  </section>;
}
