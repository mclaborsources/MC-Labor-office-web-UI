"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

export function EmployeeHoursReportScreen({ mode, rows, year, error = "" }: { mode: "week" | "month"; rows: OperationalReportRow[]; year: number; error?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const isWeek = mode === "week";
  const periods = Array.from({ length: isWeek ? 53 : 12 }, (_, index) => index + 1);
  const grouped = useMemo(() => {
    const map = new Map<string, OperationalReportRow>();
    for (const row of rows) {
      const key = `${row.id}`;
      const existing = map.get(key) ?? { ...row, ...Object.fromEntries(periods.map((period) => [String(period).padStart(2, "0"), ""])) };
      existing[String(row.Period).padStart(2, "0")] = row.Hours;
      map.set(key, existing);
    }
    return [...map.values()].filter((row) => !name || `${row["First Name"]} ${row["Last Name"]}`.toLowerCase().includes(name.toLowerCase()));
  }, [rows, periods, name]);
  const fixed = ["First Name", "Last Name", "MI", "Payroll Co"];
  const columns = [...fixed, ...periods.map((period) => String(period).padStart(2, "0"))];
  return <section className="ac-hours-report">
    <header><h1>Employee Hours By {isWeek ? "Week" : "Month"} Report</h1><label>Year <select value={year} onChange={(event) => router.push(`${isWeek ? "/employee-hours-by-week" : "/employee-hours-by-month"}?year=${event.target.value}`)}>{[year, year - 1, year - 2].map((value) => <option key={value}>{value}</option>)}</select></label><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => setName("")}>Clear</AccessButton><label>Search employee <input value={name} onChange={(event) => setName(event.target.value)} /></label><AccessButton onClick={() => window.print()}>Print / Export</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></header>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="ac-hours-grid-wrap"><table className="ac-hours-grid"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {grouped.map((row) => <tr key={String(row.id)}>{columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}</tr>)}
      {!grouped.length && <tr><td colSpan={columns.length}>{error ? "Hours data is unavailable." : `No tracked hours found for ${year}.`}</td></tr>}
    </tbody></table></div><footer>{grouped.length} employees · values aggregated from tracking assignments for {year}</footer>
  </section>;
}
