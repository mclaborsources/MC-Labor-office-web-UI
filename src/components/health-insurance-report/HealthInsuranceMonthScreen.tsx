"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

type MonthOption = { id: number; name: string };
const MONTHS: MonthOption[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((name, index) => ({ id: index + 1, name }));
const MAIN_COLUMNS = ["Health Ins", "First Name", "MI", "Last Name", "Folder", "", "Last Week", "Pay Rate", "Co Exp", "C Current", "Total Cost", "C Start Date", "Cobra Start Date", "", "E Start Date", "End Date", "Health Insurance Notes"];
const MONTH_COLUMNS = ["Company", "Employee"].flatMap(type => MONTHS.map(month => `${type === "Company" ? "C" : "E"} ${String(month.id).padStart(2, "0")}`));
const DISPLAY_COLUMNS = [...MAIN_COLUMNS, ...MONTH_COLUMNS];
type ReportRow = OperationalReportRow & { id: string };

const value = (row: ReportRow, key: string) => row[key] == null ? "" : String(row[key]);
const monthKey = (column: string) => column.startsWith("C ") ? `MonthCost${column.slice(2).replace(" ", "")}` : `MonthCost${column.slice(2).replace(" ", "")}Employee`;
const money = (input: unknown) => input == null || input === "" ? "" : `$${Number(input).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const displayDate = (input: unknown) => {
  if (!input) return "";
  const date = new Date(String(input));
  return Number.isNaN(date.getTime()) ? String(input) : date.toLocaleDateString("en-US");
};

export function HealthInsuranceMonthScreen({ years, initialError = "" }: { years: number[]; initialError?: string }) {
  const router = useRouter();
  const [year, setYear] = useState(years[0] ? String(years[0]) : "");
  const [name, setName] = useState("");
  const [monthMode, setMonthMode] = useState<"none" | "show">("none");
  const [month, setMonth] = useState("");
  const [view, setView] = useState("View 01");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const visibleRows = useMemo(() => rows.filter(row => {
    const fullName = `${value(row, "First Name")} ${value(row, "MI")} ${value(row, "Last Name")}`.toLowerCase();
    const matchesName = !name || fullName.includes(name.trim().toLowerCase());
    if (!matchesName) return false;
    if (monthMode === "show" && month) {
      const key = String(month).padStart(2, "0");
      return Number(row[`MonthCost${key}`] ?? 0) !== 0 || Number(row[`MonthCost${key}Employee`] ?? 0) !== 0 || Number(row[`Cobra${key}`] ?? 0) !== 0;
    }
    return true;
  }), [rows, name, monthMode, month]);

  const loadRows = async () => {
    if (!year) { setError("Select a year, then click Search."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/reports/employee-health-insurance-by-month?year=${encodeURIComponent(year)}`, { cache: "no-store" });
      const result = await response.json() as { ok: boolean; rows?: ReportRow[]; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Health insurance monthly data could not be loaded.");
      setRows(result.rows ?? []); setHasSearched(true);
    } catch (loadError) {
      setRows([]); setHasSearched(false); setError(loadError instanceof Error ? loadError.message : "Health insurance monthly data could not be loaded.");
    } finally { setLoading(false); }
  };
  const clear = () => { setName(""); setMonthMode("none"); setMonth(""); setRows([]); setHasSearched(false); setError(initialError); };
  const exportRows = () => {
    if (!visibleRows.length) { setError("Search for a year before exporting."); return; }
    const escape = (text: string) => `"${text.replaceAll('"', '""')}"`;
    const csv = [DISPLAY_COLUMNS.map(escape).join(","), ...visibleRows.map(row => DISPLAY_COLUMNS.map(column => escape(column.startsWith("C ") || column.startsWith("E ") ? value(row, monthKey(column)) : value(row, column))).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `employee-health-insurance-by-month-${year}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section className="ac-health-report">
    <header><h1>Employee Health Insurance By Month Report</h1><AccessButton onClick={() => hasSearched && void loadRows()}>Refresh</AccessButton><AccessButton onClick={clear}>Zero</AccessButton><AccessButton onClick={exportRows}>Export View</AccessButton>
      <div className="step"><b>1)</b><select aria-label="Year" value={year} onChange={event => setYear(event.target.value)}><option value="">&lt;Select Year&gt;</option>{years.map(item => <option key={item} value={item}>{item}</option>)}</select><AccessButton aria-label="Search selected year" title="Search selected year" icon={Search} disabled={loading || !year} onClick={() => void loadRows()} /></div>
      <div className="step months"><b>2)</b><label><input type="radio" name="month-mode" checked={monthMode === "none"} onChange={() => { setMonthMode("none"); setMonth(""); }} /> No Months</label><label><input type="radio" name="month-mode" checked={monthMode === "show"} onChange={() => setMonthMode("show")} /> Show Months</label><select aria-label="Month" value={month} disabled={monthMode !== "show"} onChange={event => setMonth(event.target.value)}><option value="">&lt;Month&gt;</option>{MONTHS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="close"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help" onClick={() => setError("Choose a year and click Search to load health insurance costs by employee and month.")}>?</button></div>
    </header>
    <div className="health-tools"><div className="search"><strong>SEARCH</strong><label>Name:<input value={name} onChange={event => setName(event.target.value)} /></label><em>C: Company, E: Employee</em></div>
      <div className="health-presets">{["View 01", "Notes", "", "", "", "", "", "", ""].map((label, index) => <AccessButton key={index} onClick={() => label && setView(label)}>{label}</AccessButton>)}</div>
      <div className="health-view"><label>View:</label><select value={view} onChange={event => setView(event.target.value)}>{["View 01", "Notes"].map(item => <option key={item}>{item}</option>)}</select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><label>Go To:</label><select aria-label="Go to column" onChange={event => document.getElementById(`health-column-${event.target.value}`)?.scrollIntoView({ block: "nearest", inline: "center" })}><option value="">Select column</option>{DISPLAY_COLUMNS.map((column, index) => <option key={`${column}-${index}`} value={index}>{column || "(blank)"}</option>)}</select></div>
      <div className="health-actions"><AccessButton className="cobra">Cobra</AccessButton><AccessButton className="alarm">Alarm</AccessButton><AccessButton>Alarms</AccessButton><AccessButton>All</AccessButton><AccessButton>Remove Hide</AccessButton><AccessButton>All</AccessButton><em>Your mouse is over column:</em><i/><AccessButton onClick={() => setName("")}>Clear Filters</AccessButton><AccessButton>Update Health Insurance</AccessButton><AccessButton>Edit Health Insurance</AccessButton></div>
    </div>
    {error && <p className="ac-health-report-message" role="alert">{error}</p>}
    <div className="health-grid-wrap"><table className="legacy-report-grid health-grid"><thead><tr><th aria-label="Record selector" />{DISPLAY_COLUMNS.map((column, index) => <th id={`health-column-${index}`} key={`${column}-${index}`}>{column}</th>)}</tr></thead><tbody>
      {visibleRows.map((row, rowIndex) => <tr key={String(row.id)} className={rowIndex === 0 ? "is-current" : undefined}><td className="ac-health-row-selector" />{DISPLAY_COLUMNS.map((column, index) => {
        if (!column) return <td key={`${column}-${index}`} />;
        if (column.startsWith("C ") || column.startsWith("E ")) {
          const mm = column.slice(2).replace(" ", "");
          const amount = row[monthKey(column)];
          const cobra = column.startsWith("C ") && Number(row[`Cobra${mm}`] ?? 0) !== 0;
          return <td key={column} className={`${column.startsWith("E ") ? "ac-health-employee-cost" : "ac-health-company-cost"}${cobra ? " is-cobra" : ""}${monthMode === "show" && month === String(Number(mm)) ? " is-selected-month" : ""}`}>{money(amount)}</td>;
        }
        const raw = row[column];
        const content = ["Pay Rate", "Co Exp", "C Current", "Total Cost"].includes(column) ? money(raw) : ["Last Week", "C Start Date", "Cobra Start Date", "E Start Date", "End Date"].includes(column) ? displayDate(raw) : value(row, column);
        return <td key={`${column}-${index}`} className={column === "Folder" && raw ? "ac-health-folder" : undefined}>{content}</td>;
      })}</tr>)}
      {loading && <tr><td colSpan={DISPLAY_COLUMNS.length + 1}>Loading employee health insurance data…</td></tr>}
      {!loading && hasSearched && !visibleRows.length && <tr><td colSpan={DISPLAY_COLUMNS.length + 1}>No health insurance records match the selected filters.</td></tr>}
      {!loading && !hasSearched && !error && <tr><td colSpan={DISPLAY_COLUMNS.length + 1}>Select a year and click Search to load the report.</td></tr>}
    </tbody></table></div><footer className="ac-health-report-record">Records: {visibleRows.length}　　{monthMode === "show" && month ? MONTHS.find(item => String(item.id) === month)?.name : "No Filter"}　 <label>Search <input aria-label="Search loaded report" value={name} onChange={event => setName(event.target.value)} /></label></footer>
  </section>;
}
