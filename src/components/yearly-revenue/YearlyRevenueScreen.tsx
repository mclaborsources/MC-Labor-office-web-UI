"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

export function YearlyRevenueScreen({ rows, error = "" }: { rows: OperationalReportRow[]; error?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const visible = useMemo(() => rows.filter((row) => !search || String(row.Customer ?? "").toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const columns = ["Customer", "Street", "City", "State", "Customer Type", "Revenue Year", "Revenue"];
  return <section className="ac-yearly"><header><h1>Yearly Revenue</h1><label>Search customer <input value={search} onChange={(event) => setSearch(event.target.value)} /></label><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => setSearch("")}>Clear</AccessButton><AccessButton onClick={() => window.print()}>Print / Export</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></header>
    <p className="report-data-note">Revenue totals are summed from recorded customer-week invoice totals.</p>{error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="yearly-grid-wrap"><table className="legacy-report-grid yearly-grid"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {visible.map((row) => <tr key={`${row.id}-${row["Revenue Year"]}`}>{columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}</tr>)}
      {!visible.length && <tr><td colSpan={columns.length}>{error ? "Revenue data is unavailable." : "No invoice revenue records found."}</td></tr>}
    </tbody></table></div><footer>{visible.length} customer-year totals</footer>
  </section>;
}
