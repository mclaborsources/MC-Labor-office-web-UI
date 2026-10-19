"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

const columns = [
  "Week Ending", "Customer", "Customer Type", "Customer Since", "Total Invoice", "Total Profit", "Margin", "Salesman",
  "Per Diem", "SUB Sales", "Employee Sales", "Adj Total INV After 20%", "Gross Payroll", "Total Referral Cost Paid to Agent", "Total Owed",
];
const monetaryColumns = new Set(["Total Invoice", "Total Profit", "Per Diem", "SUB Sales", "Employee Sales", "Adj Total INV After 20%", "Gross Payroll", "Total Referral Cost Paid to Agent", "Total Owed"]);

function displayValue(row: OperationalReportRow, column: string) {
  const value = row[column];
  if (value === null || value === undefined || value === "") return "";
  if (monetaryColumns.has(column) && Number.isFinite(Number(value))) return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" });
  if (column === "Margin" && Number.isFinite(Number(value))) return `${Number(value).toFixed(1)}%`;
  return String(value);
}

export function WeeklyCustomerMarginScreen({ rows: initialRows, error: initialError = "" }: { rows: OperationalReportRow[]; error?: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState(initialError);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payrollStart, setPayrollStart] = useState("");
  const [payrollEnd, setPayrollEnd] = useState("");
  const [groupBy, setGroupBy] = useState<"Customer" | "Week">("Customer");
  const [view, setView] = useState("View 01");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const visible = useMemo(() => {
    const matching = rows.filter(row => String(row.Customer ?? "").toLowerCase().includes(search.trim().toLowerCase()));
    const weekTime = (row: OperationalReportRow) => new Date(String(row["Week Ending"] ?? "")).getTime() || 0;
    return [...matching].sort((a, b) => groupBy === "Week"
      ? weekTime(b) - weekTime(a) || String(a.Customer ?? "").localeCompare(String(b.Customer ?? ""))
      : String(a.Customer ?? "").localeCompare(String(b.Customer ?? "")) || weekTime(b) - weekTime(a));
  }, [rows, search, groupBy]);

  const overallMargin = useMemo(() => {
    const invoice = visible.reduce((sum, row) => sum + Number(row["Total Invoice"] ?? 0), 0);
    const profit = visible.reduce((sum, row) => sum + Number(row["Total Profit"] ?? 0), 0);
    return invoice ? `${(profit * 100 / invoice).toFixed(2)}%` : "";
  }, [visible]);

  async function refresh(filterStart = startDate, filterEnd = endDate) {
    if (!filterStart || !filterEnd) {
      setError("Select both the start and end week ending dates, then click Refresh.");
      setMessage("");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (filterStart) params.set("startDate", filterStart);
      if (filterEnd) params.set("endDate", filterEnd);
      const response = await fetch(`/api/reports/weekly-customer-margin?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Customer margin data could not be loaded.");
      setRows(payload.rows ?? []);
      setHasLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Customer margin data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function shiftWeek(delta: number) {
    const date = new Date(`${endDate || new Date().toISOString().slice(0, 10)}T12:00:00`);
    date.setDate(date.getDate() + delta * 7);
    const value = date.toISOString().slice(0, 10);
    setStartDate(value);
    setEndDate(value);
  }

  function clearFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPayrollStart("");
    setPayrollEnd("");
    setGroupBy("Customer");
    setRows([]);
    setHasLoaded(false);
    setError("");
    setMessage("Filters cleared. Select a week range and click Refresh to view data.");
  }

  function saveView() {
    try {
      localStorage.setItem("weekly-customer-margin-view", JSON.stringify({ view, groupBy, startDate, endDate }));
      setMessage(`${view} saved on this browser.`);
    } catch {
      setMessage("This view could not be saved in this browser.");
    }
  }

  function deleteView() {
    localStorage.removeItem("weekly-customer-margin-view");
    setMessage("Saved view deleted.");
  }

  return <section className="ac-margin-report">
    <header className="margin-header">
      <h1>Weekly Customer Margin Report</h1>
      <div className="margin-header-controls">
        <label htmlFor="margin-view">View:</label>
        <select id="margin-view" value={view} onChange={event => setView(event.target.value)}>{Array.from({ length: 5 }, (_, i) => <option key={i}>{i === 0 ? "View 01" : `View 0${i + 1}`}</option>)}</select>
        <AccessButton data-action-status="complete" onClick={saveView}>Save View</AccessButton>
        <AccessButton data-action-status="complete" onClick={deleteView}>Delete View</AccessButton>
        <AccessButton data-action-status="complete" onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</AccessButton>
        <AccessButton data-action-status="complete" onClick={clearFilters}>Zero</AccessButton>
        <AccessButton data-action-status="complete" onClick={() => window.print()}>Export View</AccessButton>
      </div>
      <aside><AccessButton data-action-status="linked" onClick={() => router.push("/tracking")}>Cancel</AccessButton><button data-action-status="missing" type="button" aria-label="Help" title="Weekly Customer Margin Report">?</button></aside>
    </header>

    <div className="margin-tools">
      <label>Search in Name:<input value={search} onChange={event => setSearch(event.target.value)} /></label>
      <fieldset><legend>Margin by:</legend>
        <label><input type="radio" name="margin-group" checked={groupBy === "Customer"} onChange={() => setGroupBy("Customer")} />Customer</label>
        <label title="Job-level invoice amounts are not available in the current SQL source."><input type="radio" name="margin-group" disabled />Job</label>
        <label><input type="radio" name="margin-group" checked={groupBy === "Week"} onChange={() => setGroupBy("Week")} />Week</label>
      </fieldset>
      <fieldset className="margin-exclude"><legend>Exclude Designated Customers:</legend>
        <label title="The exclusion flag is not mapped in the current SQL source."><input type="radio" name="margin-exclude" checked disabled />Yes</label>
        <label title="The exclusion flag is not mapped in the current SQL source."><input type="radio" name="margin-exclude" disabled />No</label>
      </fieldset>
      <em>Changing either of these options will force a Refresh.</em>
    </div>

    <div className="margin-dates">
      <div className="margin-week-dates"><b>Week Ending Friday</b><i>(click date first)</i><label>Start <input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label>End <input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></label></div>
      <div className="date-arrows"><AccessButton data-action-status="complete" aria-label="Previous week" onClick={() => shiftWeek(-1)}>◀</AccessButton><AccessButton data-action-status="complete" aria-label="Choose week" onClick={() => { if (!endDate) shiftWeek(0); }}>▣</AccessButton><AccessButton data-action-status="complete" aria-label="Next week" onClick={() => shiftWeek(1)}>▶</AccessButton></div>
      <div className="margin-report-dates"><b>Start and End Days of Report</b><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /><input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></div>
      <div className="margin-payroll-dates" title="Payroll check date filtering is not mapped in the current SQL source."><b>Start and End Payroll Chk Days</b><input type="date" value={payrollStart} disabled /><input type="date" value={payrollEnd} disabled /></div>
    </div>

    <div className="margin-presets">{["By Customer", "By Job", "By Week", "View 04", "View 05"].map((label, index) => <AccessButton data-action-status="complete" key={label} disabled={index === 1} onClick={() => { if (index === 2) setGroupBy("Week"); else if (index === 0) setGroupBy("Customer"); else if (index > 2) setView(label); }}>{label}</AccessButton>)}<AccessButton data-action-status="complete" className="margin-clear-filters" onClick={clearFilters}>Clear Filters</AccessButton></div>
    <div className="margin-summary"><label>Overall Margin <input readOnly value={overallMargin} /></label><AccessButton data-action-status="complete" onClick={() => setMessage("Overall margin recalculated from the visible rows.")}>Recalc</AccessButton><em>Your mouse is over:</em><i /><strong>See note in Help about Gross Payroll</strong></div>

    {(error || message) && <p className={error ? "margin-error" : "margin-message"} role={error ? "alert" : "status"}>{error || message}</p>}
    <div className="margin-grid-wrap"><table className="legacy-report-grid margin-grid"><thead><tr><th aria-label="Record selector" />{columns.map(column => <th key={column} title={["Per Diem", "SUB Sales", "Employee Sales", "Adj Total INV After 20%", "Total Referral Cost Paid to Agent"].includes(column) ? "Not available in the current SQL source" : undefined}>{column}</th>)}</tr></thead><tbody>
      {visible.map((row, index) => <tr key={String(row.id ?? index)} className={index === 0 ? "is-current" : undefined}><td />{columns.map(column => <td key={column} className={row[column] == null && !["Week Ending", "Customer", "Customer Type", "Customer Since", "Margin", "Salesman"].includes(column) ? "margin-unmapped" : undefined}>{displayValue(row, column)}</td>)}</tr>)}
      {!visible.length && <tr><td colSpan={columns.length + 1} className="margin-empty">{error ? "Margin data is unavailable." : hasLoaded ? "No customer week records match these filters." : "Select a start and end week ending date, then click Refresh to view data."}</td></tr>}
    </tbody></table></div>
    <footer className="margin-recordbar">Records {visible.length ? `1–${visible.length}` : "0"} of {visible.length}<span>{visible.length} customer-week rows</span><label>Search <input value={search} onChange={event => setSearch(event.target.value)} /></label></footer>
  </section>;
}
