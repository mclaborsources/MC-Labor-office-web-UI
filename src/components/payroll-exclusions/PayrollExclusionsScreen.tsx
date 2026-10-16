"use client";

import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { PayrollExclusionRow } from "@/lib/adminReportQueries";

export function PayrollExclusionsScreen({ rows, error = "" }: { rows: PayrollExclusionRow[]; error?: string }) {
  const router = useRouter();
  return <section className="ac-payroll-exclusions">
    <header><h1>Payroll Exclusions</h1><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></header>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <table className="legacy-report-grid"><thead><tr><th /><th>ID</th><th>Employee, City</th><th>Payroll Co</th><th>Active</th><th /></tr></thead><tbody>
      {rows.map((row, index) => <tr key={row.id} className={index === 0 ? "is-current" : undefined}><td /><td>{row.id}</td><td><a href={"/employees/"+encodeURIComponent(row.employeeId)}>{[row.employee, row.city].filter(Boolean).join(", ")}</a></td><td>{row.payroll}</td><td><input type="checkbox" checked={row.active} readOnly aria-label={"Active exclusion for "+row.employee} /></td><td /></tr>)}
      {!rows.length && <tr><td colSpan={6}>{error ? "Payroll exclusions are unavailable." : "No payroll exclusions found."}</td></tr>}
    </tbody></table><footer>{rows.length} exclusions</footer>
  </section>;
}
