"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { EmployeeDocumentMode, EmployeeDocumentRow } from "@/lib/adminReportQueries";

const titles: Record<EmployeeDocumentMode, string> = {
  licenses: "Employee Licenses", interview: "Interview Questions", osha: "OSHA",
  resume: "Resume or Work History", smartphone: "Smart Phone", face: "Face Meeting", id: "ID Drivers License",
};
const columns = ["Employee", "Cell", "Trade", "Qualification", "Customer / Job", "Week Ending", "Status", "Details"];

export function EmployeeDocumentReportScreen({ mode, rows, page, search: initialSearch, error = "" }: { mode: EmployeeDocumentMode; rows: EmployeeDocumentRow[]; page: number; search: string; error?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const total = rows[0]?.totalRecords ?? 0;
  const navigate = (nextPage: number, query = initialSearch) => router.push(pathname + "?" + new URLSearchParams({search:query,page:String(nextPage)}));
  return <section className="ac-employee-doc">
    <header><h1>{titles[mode]}</h1><form onSubmit={event => {event.preventDefault();navigate(1,search)}}><label>Search:</label><input aria-label="Search employees" value={search} onChange={event => setSearch(event.target.value)} /><AccessButton data-action-status="complete" type="submit">Search</AccessButton><AccessButton data-action-status="complete" onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton data-action-status="linked" onClick={() => navigate(1,"")}>Clear</AccessButton><AccessButton data-action-status="complete" onClick={() => window.print()}>Print / Export</AccessButton></form><aside><AccessButton data-action-status="linked" onClick={() => router.push("/tracking")}>Cancel</AccessButton></aside></header>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="employee-doc-grid-wrap"><table className={"legacy-report-grid employee-doc-grid is-" + mode}><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {rows.map(row => <tr key={row.id}>
        <td><a href={"/employees/" + encodeURIComponent(row.employeeId)}>{row.employee || "Employee #" + row.employeeId}</a></td>
        <td>{row.cell}</td><td>{row.trade}</td><td>{row.qualification}</td>
        <td>{row.assignment}</td><td>{row.weekEnding}</td><td>{row.status}</td><td>{row.details}</td>
      </tr>)}
      {!rows.length && <tr><td colSpan={columns.length}>{error ? "Employee data is unavailable." : "No records match this search."}</td></tr>}
    </tbody></table></div><footer className="ac-employee-doc-record"><AccessButton data-action-status="linked" disabled={page<=1} onClick={() => navigate(page-1)}>Previous</AccessButton> Page {page} · {rows.length} of {total} records <AccessButton data-action-status="linked" disabled={page*200>=total} onClick={() => navigate(page+1)}>Next</AccessButton></footer>
  </section>;
}
