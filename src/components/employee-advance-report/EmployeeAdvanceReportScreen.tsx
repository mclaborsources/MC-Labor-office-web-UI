"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow, ReportValue } from "@/lib/operationalReports";

const columns = ["First Name", "Last Name", "MI", "Advance Date", "Advance Amount", "Repayment Amount", "Start Week Ending", "Advance Note", "User Name", "Timestamp", "Balance", "Up To Date"] as const;

function displayValue(value: ReportValue, column: string): string {
  if (value === null || value === undefined || value === "") return "";
  if (["Advance Date", "Start Week Ending", "Up To Date"].includes(column)) {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-US");
  }
  if (column === "Timestamp") {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-US");
  }
  if (["Advance Amount", "Repayment Amount", "Balance"].includes(column) && typeof value === "number") {
    return value < 0 ? `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return String(value);
}

export function EmployeeAdvanceReportScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rows, setRows] = useState<OperationalReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("View 01");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/reports/employee-advance", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Employee advance data could not be loaded.");
      setRows(payload.rows ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Employee advance data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const visibleRows = useMemo(() => rows.filter(row => {
    const fullName = `${row["First Name"] ?? ""} ${row["Last Name"] ?? ""}`.toLowerCase();
    return fullName.includes(name.trim().toLowerCase());
  }), [name, rows]);

  return <section className="ac-advance-report">
    <header>
      <h1>Employee Advance Report</h1>
      <div><label htmlFor="advance-view">View:</label><select id="advance-view" value={view} onChange={event => setView(event.target.value)}>{["View 01", "View 02", "View 03", "View 04", "View 05", "View 06"].map(option => <option key={option}>{option}</option>)}</select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><AccessButton onClick={() => void refresh()} disabled={loading}>Refresh</AccessButton></div>
      <aside><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help" title="Employee Advance Report">?</button></aside>
    </header>
    <div className="advance-tools">
      <label>Search in Name:<input value={name} onChange={event => setName(event.target.value)} /></label>
      <div>{["Default", "View 02", "View 03", "View 04", "View 05", "View 06"].map(option => <AccessButton key={option} onClick={() => setView(option === "Default" ? "View 01" : option)}>{option}</AccessButton>)}</div>
    </div>
    <div className="advance-grid-wrap">
      <table className="legacy-report-grid advance-grid">
        <thead><tr><th aria-label="Record selector" />{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {visibleRows.map((row, index) => <tr key={String(row.id ?? index)}><td />{columns.map(column => <td key={column} className={column === "Up To Date" && row[column] ? "up-to-date" : undefined}>{displayValue(row[column], column)}</td>)}</tr>)}
          {!loading && !error && visibleRows.length === 0 && <tr><td colSpan={columns.length + 1} className="advance-empty">{name ? "No employees match this search." : "No employee advance records were found."}</td></tr>}
          {error && <tr><td colSpan={columns.length + 1} className="advance-error">{error}</td></tr>}
          {loading && <tr><td colSpan={columns.length + 1} className="advance-empty">Loading employee advance records…</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
