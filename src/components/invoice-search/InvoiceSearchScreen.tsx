"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

export function InvoiceSearchScreen({ rows, error = "" }: { rows: OperationalReportRow[]; error?: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [week, setWeek] = useState("");
  const [search, setSearch] = useState("");
  const visible = useMemo(() => rows.filter((row) =>
    (!customer || String(row.Customer ?? "").toLowerCase().includes(customer.toLowerCase())) &&
    (!week || String(row["Week Ending"] ?? "").includes(week)) &&
    (!search || `${row.Customer} ${row.Invoice} ${row.Salesman}`.toLowerCase().includes(search.toLowerCase())),
  ), [rows, customer, week, search]);
  const columns = ["Customer", "Week Ending", "Invoice", "Total", "Open Balance", "Paid", "Salesman"];
  return <section className="ac-invoice-search">
    <header className="ac-invoice-header"><h1>Invoice Search</h1><div className="ac-invoice-view"><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => { setCustomer(""); setWeek(""); setSearch(""); }}>Clear</AccessButton><AccessButton onClick={() => window.print()}>Print / Export</AccessButton></div><div className="ac-invoice-close"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></div></header>
    <div className="ac-invoice-controls"><div className="ac-invoice-filters"><label>Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} /></label><label>Week Ending<input placeholder="M/D/YYYY" value={week} onChange={(e) => setWeek(e.target.value)} /></label><label>Search invoice<input value={search} onChange={(e) => setSearch(e.target.value)} /></label></div></div>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="ac-invoice-grid-wrap"><table className="ac-invoice-grid"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {visible.map((row) => <tr key={String(row.id)}>{columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}</tr>)}
      {!visible.length && <tr><td colSpan={columns.length}>{error ? "Invoice data is unavailable." : "No invoice records match the current filters."}</td></tr>}
    </tbody></table></div><footer className="ac-invoice-recordbar">{visible.length} invoice records · Source: customer week records</footer>
  </section>;
}
