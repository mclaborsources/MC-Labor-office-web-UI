"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { TrackingPreviewRow } from "@/types/tracking";

export function TrackingSearchScreen({ rows, weekEnding, error = "" }: { rows: TrackingPreviewRow[]; weekEnding: string; error?: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [employee, setEmployee] = useState("");
  const visible = useMemo(() => rows.filter((row) =>
    (!customer || row.customer.toLowerCase().includes(customer.toLowerCase()) || row.jobSite.toLowerCase().includes(customer.toLowerCase())) &&
    (!employee || `${row.firstName} ${row.lastName}`.toLowerCase().includes(employee.toLowerCase())),
  ), [rows, customer, employee]);
  return <section className="ac-tracking-search">
    <header><h1>Tracking Search</h1><span>Week ending {weekEnding || "—"}</span><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => { setCustomer(""); setEmployee(""); }}>Clear</AccessButton><AccessButton onClick={() => window.print()}>Print / Export</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></header>
    <div className="tracking-search-tools"><label>Customer or job<input value={customer} onChange={(event) => setCustomer(event.target.value)} /></label><label>Employee name<input value={employee} onChange={(event) => setEmployee(event.target.value)} /></label></div>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="tracking-search-grid-wrap"><table className="legacy-report-grid tracking-search-grid"><thead><tr><th>Customer</th><th>Job</th><th>Employee</th><th>Cell</th><th>Week Ending</th><th>Payroll Co</th></tr></thead><tbody>
      {visible.map((row, index) => <tr key={`${row.employeeId}-${row.jobSite}-${index}`}><td>{row.customer}</td><td>{row.jobSite}</td><td>{`${row.firstName} ${row.lastName}`.trim()}</td><td>{row.cell}</td><td>{row.weekEnding}</td><td>{row.payrollCo}</td></tr>)}
      {!visible.length && <tr><td colSpan={6}>{error ? "Tracking data is unavailable." : "No tracking assignments found for this week."}</td></tr>}
    </tbody></table></div><footer>{visible.length} tracking assignments</footer>
  </section>;
}
