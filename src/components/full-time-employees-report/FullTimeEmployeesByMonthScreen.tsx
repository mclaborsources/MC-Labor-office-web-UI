"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import { PAYROLL_CO_COLORS } from "@/lib/trackingConstants";
import type { OperationalReportRow } from "@/lib/operationalReports";

type PayrollOption = { id: string; label: string };
type MonthlyRow = OperationalReportRow & { PayrollCoID: string; PayrollCoColorID?: number; MonthNum: number };
const REPORT_COLUMNS = ["Year", "Payroll Co", "Month", "Employees", "Full-Time Employees", "Part-Time Employees", "Part-Time Hours", "FTE Employees", "Total Full-Time Employees"];

export function FullTimeEmployeesByMonthScreen({ years, payrollOptions, optionsError = "" }: { years: number[]; payrollOptions: PayrollOption[]; optionsError?: string }) {
  const router = useRouter();
  const initialYear = years[0] ? String(years[0]) : "";
  const [year, setYear] = useState(initialYear);
  const [payroll, setPayroll] = useState("");
  const [view, setView] = useState("View 01");
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(optionsError);

  const visibleRows = useMemo(() => rows.filter((row) => !payroll || String(row.PayrollCoID) === payroll), [rows, payroll]);
  const loadRows = async () => {
    if (!year) { setError("Select a year before searching."); return; }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/full-time-employees-by-month?year=${encodeURIComponent(year)}`, { cache: "no-store" });
      const result = await response.json() as { ok: boolean; rows?: MonthlyRow[]; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Monthly employee data could not be loaded.");
      setRows(result.rows ?? []);
      setHasSearched(true);
    } catch (loadError) {
      setRows([]);
      setHasSearched(false);
      setError(loadError instanceof Error ? loadError.message : "Monthly employee data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };
  const clear = () => { setYear(initialYear); setPayroll(""); setRows([]); setHasSearched(false); setError(optionsError); };
  const exportRows = () => {
    if (!visibleRows.length) { setError("Search for a year before exporting."); return; }
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [REPORT_COLUMNS.map(escape).join(","), ...visibleRows.map((row) => REPORT_COLUMNS.map((column) => escape(row[column])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `full-time-employees-by-month-${year}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section className="ac-ft-report">
    <header className="ac-ft-header"><h1>Full-Time Employees by Month</h1><div className="ac-ft-view"><label>View:</label><select value={view} onChange={e => setView(e.target.value)}>{["View 01", "View 02", "View 03", "View 04", "View 05", "View 06"].map(v => <option key={v}>{v}</option>)}</select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><label>Go To:</label><select aria-label="Go to column"><option value="">Select column</option>{REPORT_COLUMNS.map(column => <option key={column}>{column}</option>)}</select><AccessButton onClick={() => hasSearched && void loadRows()}>Refresh</AccessButton><AccessButton onClick={clear}>Zero</AccessButton><AccessButton onClick={exportRows}>Export View</AccessButton></div><div className="ac-ft-close"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help" onClick={() => setError("Choose a year and select Search to load monthly employee counts.")}>?</button></div></header>
    <div className="ac-ft-tools"><div className="ac-ft-step"><b>1)</b><select aria-label="Year" value={year} onChange={e => setYear(e.target.value)}><option value="">&lt;Select Year&gt;</option>{years.map(value => <option key={value} value={value}>{value}</option>)}</select><AccessButton aria-label="Search selected year" title="Search selected year" icon={Search} disabled={loading || !year} onClick={() => void loadRows()} /></div><div className="ac-ft-step"><b>2)</b><select aria-label="Payroll company" value={payroll} onChange={e => setPayroll(e.target.value)}><option value="">&lt;Payroll Co&gt;</option>{payrollOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div><div className="ac-ft-presets">{["Default", "View 02", "View 03", "View 04", "View 05", "View 06"].map(v => <AccessButton key={v} onClick={() => setView(v === "Default" ? "View 01" : v)}>{v}</AccessButton>)}<div /></div><AccessButton className="ac-ft-clear" onClick={clear}>Clear Filters</AccessButton></div>
    {error && <p className="ac-ft-message" role="alert">{error}</p>}
    <div className="ac-ft-grid-wrap"><table className="ac-ft-grid"><thead><tr><th aria-label="Record selector" />{REPORT_COLUMNS.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {visibleRows.map((row, index) => <tr key={`${row.Year}-${row.PayrollCoID}-${row.MonthNum}`} className={index === 0 ? "is-current" : undefined}><td className="ac-ft-row-selector" />{REPORT_COLUMNS.map(column => <td key={column} className={column === "Payroll Co" ? "ac-ft-payroll" : undefined} style={column === "Payroll Co" ? { backgroundColor: PAYROLL_CO_COLORS[String(row[column] ?? "").toUpperCase()] ?? ["#888", "#e8913a", "#800080", "#008000", "#000080", "#808000", "#008080", "#ff0000"][Number(row.PayrollCoColorID ?? 0) % 8], color: "#fff" } : undefined}>{column === "Part-Time Hours" && row[column] != null ? Number(row[column]).toFixed(2) : String(row[column] ?? "")}</td>)}</tr>)}
      {!loading && hasSearched && !visibleRows.length && <tr><td colSpan={REPORT_COLUMNS.length + 1}>No monthly employee data was found for the selected filters.</td></tr>}
      {loading && <tr><td colSpan={REPORT_COLUMNS.length + 1}>Loading monthly employee data…</td></tr>}
      {!loading && !hasSearched && !error && <tr><td colSpan={REPORT_COLUMNS.length + 1}>Select a year, then click Search to load the monthly report.</td></tr>}
    </tbody></table></div><footer className="ac-ft-record">Records: {visibleRows.length}　 ▽ {payroll ? payrollOptions.find(option => option.id === payroll)?.label : "No Filter"}　 <label>Search <input aria-label="Search loaded report" /></label></footer>
  </section>;
}
