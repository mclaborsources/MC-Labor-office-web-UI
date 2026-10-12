"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow, ReportValue } from "@/lib/operationalReports";
import type { CertificateRequestRange } from "@/lib/insuranceCertificateRequestSearch";

const columns = ["Customer", "Requested By", "Cert Request Date", "State", "Audit Date Range", "Audit Start Date", "Audit End Date", "General Liability", "GL Umbrella", "GL Auto", "GL Waiver of Sub", "GL Cust Add Ins", "GL Add Others", "GL Add Verbiage", "Workers Comp"] as const;
const rangeOptions: { value: CertificateRequestRange; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "last2", label: "Last 2" },
  { value: "all", label: "All" },
];

function checked(value: ReportValue): boolean {
  return value === 1 || value === "1" || value === "True" || value === "Yes" || value === "X";
}

function cellValue(row: OperationalReportRow, column: string) {
  const value = row[column];
  if (["Audit Date Range", "General Liability", "GL Umbrella", "GL Auto", "GL Waiver of Sub", "GL Cust Add Ins", "GL Add Others", "GL Add Verbiage", "Workers Comp"].includes(column)) {
    return <input type="checkbox" checked={checked(value)} readOnly aria-label={`${column}: ${checked(value) ? "yes" : "no"}`} />;
  }
  if (value === null || value === undefined) return "";
  if (["Audit Start Date", "Audit End Date"].includes(column) && value !== "") {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-US");
  }
  return String(value);
}

export function InsuranceCertificateSearchScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [goTo, setGoTo] = useState("");
  const [range, setRange] = useState<CertificateRequestRange>("recent");
  const [selectedRange, setSelectedRange] = useState<CertificateRequestRange>("recent");
  const [rows, setRows] = useState<OperationalReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("View 01");

  const refresh = useCallback(async (selectedRange: CertificateRequestRange) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/insurance-certificate-requests?range=${selectedRange}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Insurance certificate requests could not be loaded.");
      setRows(payload.rows ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Insurance certificate requests could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(range); }, [range, refresh]);

  const customers = useMemo(() => [...new Set(rows.map(row => String(row.Customer ?? "")).filter(Boolean))], [rows]);
  const visibleRows = useMemo(() => rows.filter(row => String(row.Customer ?? "").toLowerCase().includes(search.trim().toLowerCase())), [rows, search]);

  function applyRange() {
    if (selectedRange === range) {
      void refresh(selectedRange);
    } else {
      setRange(selectedRange);
    }
  }

  function resetFilters() {
    setSearch("");
    setGoTo("");
    setSelectedRange("recent");
    if (range === "recent") {
      void refresh("recent");
    } else {
      setRange("recent");
    }
  }

  return <section className="ac-cert-report">
    <header>
      <h1>Insurance Certificate Request Search</h1>
      <div>
        <label htmlFor="cert-view">View:</label><select id="cert-view" value={view} onChange={event => setView(event.target.value)}>{["View 01", "View 02", "View 03", "View 04", "View 05", "View 06"].map(option => <option key={option}>{option}</option>)}</select>
        <AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton>
        <label htmlFor="cert-go-to">Go To:</label><select id="cert-go-to" value={goTo} onChange={event => { setGoTo(event.target.value); setSearch(event.target.value); }}><option value="">Choose a customer</option>{customers.map(customer => <option key={customer} value={customer}>{customer}</option>)}</select>
        <AccessButton onClick={applyRange} disabled={loading}>Refresh</AccessButton>
        <AccessButton onClick={resetFilters}>Zero</AccessButton>
        <AccessButton onClick={() => window.print()}>Export View</AccessButton>
      </div>
      <aside><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help" title="Insurance Certificate Request Search">?</button></aside>
    </header>
    <div className="cert-tools">
      <label>Search Customer:<input value={search} onChange={event => { setSearch(event.target.value); setGoTo(""); }} /></label>
      <div className="cert-presets">{["Default", "View 02", "View 03", "View 04", "View 05", "View 06"].map(option => <AccessButton key={option} onClick={() => setView(option === "Default" ? "View 01" : option)}>{option}</AccessButton>)}</div>
      <AccessButton onClick={() => { setSearch(""); setGoTo(""); }}>Clear Filters</AccessButton>
      <fieldset>{rangeOptions.map(option => <label key={option.value}><input type="radio" name="request-range" checked={selectedRange === option.value} onChange={() => setSelectedRange(option.value)} />{option.label}</label>)}<AccessButton onClick={applyRange} disabled={loading}>Refresh</AccessButton></fieldset>
    </div>
    <div className="cert-grid-wrap">
      <table className="legacy-report-grid cert-grid">
        <thead><tr><th aria-label="Record selector" />{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {visibleRows.map((row, index) => <tr key={String(row.id ?? index)} className={index === 0 ? "is-current" : undefined}><td />{columns.map(column => <td key={column}>{cellValue(row, column)}</td>)}</tr>)}
          {!loading && !error && visibleRows.length === 0 && <tr><td colSpan={columns.length + 1} className="cert-empty">{search ? "No certificate requests match this customer." : "No certificate requests were found."}</td></tr>}
          {loading && <tr><td colSpan={columns.length + 1} className="cert-empty">Loading certificate requests…</td></tr>}
          {error && <tr><td colSpan={columns.length + 1} className="cert-error">{error}</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
