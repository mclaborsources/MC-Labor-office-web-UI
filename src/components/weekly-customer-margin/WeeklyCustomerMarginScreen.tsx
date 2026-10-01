"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

export function WeeklyCustomerMarginScreen({ rows, error = "" }: { rows: OperationalReportRow[]; error?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const visible = useMemo(() => rows.filter((row) => !search || String(row.Customer ?? "").toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const columns = ["Week Ending", "Customer", "Total Invoice", "Gross Payroll", "Total Profit", "Margin", "Salesman", "Total Owed"];
  return <section className="ac-margin-report">
    <header><h1>Weekly Customer Margin Report</h1><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><label>Search customer <input value={search} onChange={(event) => setSearch(event.target.value)} /></label><AccessButton onClick={() => setSearch("")}>Clear</AccessButton><AccessButton onClick={() => window.print()}>Print / Export</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></header>
    <p className="report-data-note">Live invoice and tracking aggregates from the latest customer week records.</p>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="margin-grid-wrap"><table className="legacy-report-grid margin-grid"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {visible.map((row) => <tr key={String(row.id)}>{columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}</tr>)}
      {!visible.length && <tr><td colSpan={columns.length}>{error ? "Margin data is unavailable." : "No customer week records were found."}</td></tr>}
    </tbody></table></div><footer>{visible.length} customer-week rows</footer>
  </section>;
}
