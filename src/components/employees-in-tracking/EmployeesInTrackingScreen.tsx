"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import type { EmployeeSummary } from "@/types/employee";

export function EmployeesInTrackingScreen({ employees }: { employees: EmployeeSummary[] }) {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [employee, setEmployee] = useState("");
  const [cell, setCell] = useState("");
  const [week, setWeek] = useState("7/10/2026");
  const [view, setView] = useState("View 01");
  const [useButton, setUseButton] = useState("no");
  const rows = useMemo(() => employees.filter(row =>
    (!customer || row.currentAssignment.toLowerCase().includes(customer.toLowerCase())) &&
    (!employee || row.fullName.toLowerCase().includes(employee.toLowerCase())) &&
    (!cell || row.cellPhone.includes(cell))
  ), [employees, customer, employee, cell]);
  const clear = () => { setCustomer(""); setEmployee(""); setCell(""); };
  return <section className="ac-eit">
    <header className="ac-eit-header"><h1>Employee Menu</h1><div className="ac-eit-view"><label>View:</label><select value={view} onChange={e => setView(e.target.value)}>{["View 01","View 02","View 03","View 04","View 05"].map(v => <option key={v}>{v}</option>)}</select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><AccessButton>Refresh</AccessButton><AccessButton onClick={clear}>Zero</AccessButton><AccessButton onClick={() => window.print()}>Export View</AccessButton></div><div className="ac-eit-close"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button type="button" aria-label="Help">?</button></div></header>
    <div className="ac-eit-tools"><div className="ac-eit-search-word">S<br/>E<br/>A<br/>R<br/>C<br/>H</div><div className="ac-eit-fields"><label>Customer:<input value={customer} onChange={e => setCustomer(e.target.value)} /></label><label>Employee:<input value={employee} onChange={e => setEmployee(e.target.value)} /></label><label>Cell #:<input value={cell} onChange={e => setCell(e.target.value)} /></label></div><AccessButton className="ac-eit-search-btn">Search</AccessButton><fieldset><legend>Use<br/>Button</legend><label><input type="radio" checked={useButton === "yes"} onChange={() => setUseButton("yes")} /> Yes</label><label><input type="radio" checked={useButton === "no"} onChange={() => setUseButton("no")} /> No</label></fieldset><div className="ac-eit-presets">{["Default","View 02","View 03","View 04","View 05"].map((v,i) => <AccessButton key={v} onClick={() => setView(i ? v : "View 01")}>{v}</AccessButton>)}<div /></div><AccessButton className="ac-eit-clear" onClick={clear}>Clear Filters</AccessButton></div>
    <div className="ac-eit-week"><label>Week Ending:<input value={week} onChange={e => setWeek(e.target.value)} /></label><AccessButton>Refresh</AccessButton><span>Double-click Assigned Customer to open the customer in Tracking for the selected Week Ending.</span></div>
    <div className="ac-eit-grid-wrap"><table className="ac-eit-grid"><thead><tr><th /><th>Employee</th><th>Cell Phone</th><th>Assigned Customer</th><th>Referral Agency</th><th>Trade</th><th>Qualification</th><th>Grade</th><th>WCC</th><th /></tr></thead><tbody>{rows.map((row,i) => <tr key={row.employeeId} className={i === 0 ? "is-current" : undefined}><td /><td><Link href={`/employees/${row.employeeId}`}>{row.fullName}</Link></td><td>{row.cellPhone}</td><td onDoubleClick={() => router.push(`/tracking?date=2026-07-10&customerId=${encodeURIComponent(row.currentAssignment)}`)}>{row.currentAssignment}</td><td>{row.howReferred}</td><td>{row.trade}</td><td>{row.qualification}</td><td>{row.grade}</td><td>{row.accessFields.WCC ?? row.accessFields.WCCName ?? ""}</td><td /></tr>)}</tbody></table></div>
    <footer className="ac-eit-recordbar"><span>Record:</span><button disabled>|◀</button><button disabled>◀</button><input value={rows.length ? 1 : 0} readOnly aria-label="Record number"/><span>of {rows.length}</span><button disabled>▶</button><button disabled>▶|</button><span>▽ No Filter</span><span>Search</span><div /></footer>
  </section>;
}
