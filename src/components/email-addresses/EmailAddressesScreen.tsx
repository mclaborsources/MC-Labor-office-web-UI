"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

export function EmailAddressesScreen({ rows, error = "" }: { rows: OperationalReportRow[]; error?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const visible = useMemo(() => rows.filter((row) =>
    !search || `${row["Em First Name"]} ${row["Em Last Name"]} ${row.Email} ${row.Customer}`.toLowerCase().includes(search.toLowerCase()),
  ), [rows, search]);
  const columns = ["Customer", "Job", "Em First Name", "Em Last Name", "Cell", "Week Ending", "Payroll Co", "Email", "Assignment"];
  return <section className="ac-email-addresses">
    <header><h1>Email Addresses</h1><div><label>Search:</label><input value={search} onChange={(event) => setSearch(event.target.value)} /><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => setSearch("")}>Clear</AccessButton></div><aside><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></aside></header>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="email-address-grid-wrap"><table className="legacy-report-grid email-address-grid"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {visible.map((row) => <tr key={String(row.id)}>{columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}</tr>)}
      {!visible.length && <tr><td colSpan={columns.length}>{error ? "Email records are unavailable." : "No employee assignment email records found."}</td></tr>}
    </tbody></table></div><footer>{visible.length} employee email records</footer>
  </section>;
}
