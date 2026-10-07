"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

type HoursRow = OperationalReportRow & { Period: number; PeriodDate?: string; Hours: number; "Total Hours"?: number; Days?: number };

export function EmployeeHoursReportScreen({ mode, rows, year, error = "" }: { mode: "week" | "month"; rows: OperationalReportRow[]; year: number; error?: string }) {
  const router = useRouter();
  const isWeek = mode === "week";
  const [name, setName] = useState("");
  const [quarter, setQuarter] = useState("all");
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payroll, setPayroll] = useState("all");
  const [hoursMode, setHoursMode] = useState("regular");
  const [workDays, setWorkDays] = useState("all");
  const [daysOnSite, setDaysOnSite] = useState("all");
  const [showDates, setShowDates] = useState(false);
  const periodCount = isWeek ? 53 : 12;
  const periods = Array.from({ length: periodCount }, (_, index) => index + 1);
  const sourceRows = rows as HoursRow[];
  const payrollOptions = [...new Set(sourceRows.map((row) => String(row["Payroll Co"] ?? "")).filter(Boolean))].sort();
  const grouped = useMemo(() => {
    const map = new Map<string, HoursRow>();
    for (const row of sourceRows) {
      const key = String(row.id);
      const existing = map.get(key) ?? { ...row, Days: 0, ...Object.fromEntries(periods.map((p) => [String(p).padStart(2, "0"), ""])) } as HoursRow;
      const p = Number(row.Period);
      existing[String(p).padStart(2, "0")] = hoursMode === "total" ? (row["Total Hours"] ?? row.Hours) : row.Hours;
      existing[`date-${String(p).padStart(2, "0")}`] = row.PeriodDate ? new Date(row.PeriodDate).toLocaleDateString() : "";
      existing[`iso-${String(p).padStart(2, "0")}`] = row.PeriodDate ? String(row.PeriodDate).slice(0, 10) : "";
      existing.Days = Number(existing.Days ?? 0) + Number(row.Days ?? 0);
      map.set(key, existing);
    }
    return [...map.values()].filter((row) => {
      const fullName = `${row["First Name"] ?? ""} ${row["Last Name"] ?? ""}`.toLowerCase();
      const p = Number(period);
      return (!name || fullName.includes(name.toLowerCase()))
        && (payroll === "all" || String(row["Payroll Co"] ?? "") === payroll)
        && (period === "all" || Number(row[String(p).padStart(2, "0")] ?? 0) > 0)
        && periods.some((value) => {
          const key = String(value).padStart(2, "0");
          const date = String(row[`iso-${key}`] ?? "");
          return (!startDate || !date || date >= startDate) && (!endDate || !date || date <= endDate) && Number(row[key] ?? 0) > 0;
        })
        && (quarter === "all" || [...Array.from({ length: isWeek ? 13 : 3 }, (_, i) => (Number(quarter) - 1) * (isWeek ? 13 : 3) + i + 1)].some((month) => Number(row[String(month).padStart(2, "0")] ?? 0) > 0))
        && (workDays === "all" || Number(row.Days ?? 0) >= Number(workDays))
        && (daysOnSite === "all" || Number(row.Days ?? 0) === Number(daysOnSite));
    });
  }, [sourceRows, periods, name, payroll, period, quarter, workDays, daysOnSite, startDate, endDate, hoursMode, isWeek]);
  const columns = ["First Name", "Last Name", "MI", "Payroll Co", ...periods.map((p) => String(p).padStart(2, "0"))];
  const clear = () => { setName(""); setQuarter("all"); setPeriod("all"); setStartDate(""); setEndDate(""); setPayroll("all"); setHoursMode("regular"); setWorkDays("all"); setDaysOnSite("all"); setShowDates(false); };
  const yearOptions = Array.from({ length: 8 }, (_, i) => year - i);

  return <section className="ac-hours-report">
    <div className="ac-hours-titlebar"><h1>Employee Hours By {isWeek ? "Week" : "Month"} Report</h1><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={clear}>Zero</AccessButton><div className="ac-hours-close"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></div></div>
    <div className="ac-hours-controls">
      <div className="ac-hours-control-row">
        <label className="numbered"><b>1)</b><select aria-label="Year" value={year} onChange={(event) => router.push(`${isWeek ? "/employee-hours-by-week" : "/employee-hours-by-month"}?year=${event.target.value}`)}>{yearOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="numbered"><b>2)</b><select aria-label="Quarter" value={quarter} onChange={(event) => setQuarter(event.target.value)}><option value="all">&lt;Quarter&gt;</option>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>Quarter {value}</option>)}</select></label>
        <span>Between</span><input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><span>And</span><input aria-label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        <select aria-label="Hours category" value={hoursMode} onChange={(event) => setHoursMode(event.target.value)}><option value="regular">Regular Hours</option><option value="total">Total Hours</option></select><select aria-label="Hours view" value={showDates ? "dates" : "work"} onChange={(event) => setShowDates(event.target.value === "dates")}><option value="work">&lt;Work Hours&gt;</option><option value="dates">&lt;Calendar Dates&gt;</option></select>
      </div>
      <div className="ac-hours-control-row secondary"><span className="numbered"><b>3)</b></span><label className="radio-choice"><input type="radio" checked={!showDates} onChange={() => setShowDates(false)} />No Dates</label><label className="radio-choice"><input type="radio" checked={showDates} onChange={() => setShowDates(true)} />Show Dates</label>
        <select aria-label={isWeek ? "Week" : "Month"} value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">&lt;{isWeek ? "Week" : "Month"}&gt;</option>{periods.map((value) => <option key={value} value={value}>{isWeek ? "Week" : "Month"} {String(value).padStart(2, "0")}</option>)}</select>
        <select aria-label="Work days filter" value={workDays} onChange={(event) => setWorkDays(event.target.value)}><option value="all">&lt;Work Days&gt;</option>{[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>{value}+ days worked</option>)}</select>
        <select aria-label="Days on site filter" value={daysOnSite} onChange={(event) => setDaysOnSite(event.target.value)}><option value="all">&lt;Days On Site&gt;</option>{[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>{value} days on site</option>)}</select>
        <select aria-label="Payroll company" value={payroll} onChange={(event) => setPayroll(event.target.value)}><option value="all">All Payroll Companies</option>{payrollOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      </div>
      <div className="ac-hours-search"><label>Search in Name: <input value={name} onChange={(event) => setName(event.target.value)} /></label><span>{hoursMode === "all" ? "All tracked hours" : "Regular hours"} · {year}</span></div>
    </div>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="ac-hours-grid-wrap"><table className="ac-hours-grid"><thead><tr>{columns.map((column) => <th key={column}>{showDates && /^\d+$/.test(column) ? grouped.find((row) => row[`date-${column}`])?.[`date-${column}`] || column : column}</th>)}</tr></thead><tbody>
      {grouped.map((row) => <tr key={String(row.id)}>{columns.map((column) => {
        const index = /^\d+$/.test(column) ? Number(column) : 0;
        const isoDate = String(row[`iso-${column}`] ?? "");
        const quarterNumber = Math.floor((index - 1) / (isWeek ? 13 : 3)) + 1;
        const hidden = index > 0 && ((quarter !== "all" && quarterNumber !== Number(quarter)) || (startDate && isoDate && isoDate < startDate) || (endDate && isoDate && isoDate > endDate));
        return <td key={column}>{hidden ? "" : String(row[column] ?? "")}</td>;
      })}</tr>)}
      {!grouped.length && <tr><td colSpan={columns.length}>{error ? "Hours data is unavailable." : `No tracked hours found for ${year}.`}</td></tr>}
    </tbody></table></div><footer className="ac-hours-record">Records: {grouped.length} of {new Set(sourceRows.map((row) => String(row.id))).size}　 ▽ {payroll === "all" ? "No Filter" : payroll}　 <label>Search <input aria-label="Search report" value={name} onChange={(event) => setName(event.target.value)} /></label></footer>
  </section>;
}
