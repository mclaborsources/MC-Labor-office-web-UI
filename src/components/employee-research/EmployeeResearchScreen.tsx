"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { EmployeeResearchRow } from "@/lib/employeeResearchReport";

const columns = ["Staff Name", "Screen Name", "Type", "First Name", "MI", "Last Name", "Date", "Start Time", "End Time", "Time Sec"];
const text = (row: EmployeeResearchRow, key: string) => String(row[key] ?? "");
const duration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)} Hrs, ${minutes % 60} Mins`;
};
function missingReason(row: EmployeeResearchRow, column: string): string {
  if (["First Name", "MI", "Last Name"].includes(column) && !Number(row["Employee ID"])) return "No employee was selected for this screen activity.";
  if (column === "End Time") return "No end time was recorded.";
  if (column === "Time Sec" && !text(row, "End Time")) return "Duration is unavailable because no end time was recorded.";
  return `${column} was not recorded.`;
}

export function EmployeeResearchScreen({ rows, error = "" }: { rows: EmployeeResearchRow[]; error?: string }) {
  const router = useRouter();
  const [employee, setEmployee] = useState("");
  const [staff, setStaff] = useState("");
  const filtered = useMemo(() => rows.filter(row => {
    const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
    const names = [
      [text(row, "First Name"), text(row, "MI"), text(row, "Last Name")].filter(Boolean).join(" "),
      [text(row, "First Name"), text(row, "Last Name")].filter(Boolean).join(" "),
    ];
    return (!employee || names.some(name => normalizeName(name).includes(normalizeName(employee))))
      && (!staff || text(row, "Staff Name").toLowerCase().includes(staff.trim().toLowerCase()));
  }), [rows, employee, staff]);
  const totals = useMemo(() => {
    const seconds = (type: string) => filtered.reduce((sum, row) => text(row, "Type").toLowerCase().includes(type) ? sum + Number(row["Time Sec"] ?? 0) : sum, 0);
    const sleep = seconds("sleep");
    const work = seconds("work");
    return { sleep, work, all: sleep + work };
  }, [filtered]);
  const clear = () => { setEmployee(""); setStaff(""); };

  return <section className="ac-research-report">
    <header><h1>Employee Research</h1><div><label>View:</label><select defaultValue="View 01"><option>View 01</option></select><AccessButton data-action-status="missing">Save View</AccessButton><AccessButton data-action-status="missing">Delete View</AccessButton><AccessButton data-action-status="complete" onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton data-action-status="complete" onClick={clear}>Zero</AccessButton><AccessButton data-action-status="complete" onClick={() => window.print()}>Export View</AccessButton></div><aside><AccessButton data-action-status="linked" onClick={() => router.push("/tracking")}>Cancel</AccessButton><AccessButton data-action-status="missing">▣</AccessButton><button data-action-status="missing" type="button" aria-label="Help">?</button></aside></header>
    <div className="research-tools"><div className="search"><strong>SEARCH</strong><label>Employee Name:<input value={employee} onChange={event => setEmployee(event.target.value)} /></label><label>Staff Name:<input value={staff} onChange={event => setStaff(event.target.value)} /></label></div><div className="research-presets">{["Default", "View 02", "View 03", "View 04", "View 05"].map(value => <AccessButton data-action-status="missing" key={value}>{value}</AccessButton>)}<label>Delete records up to, and including, this date:<input type="date" disabled /><AccessButton data-action-status="missing" disabled>Delete Records</AccessButton></label></div><div className="research-totals"><label>Sleep Time Total:<input value={duration(totals.sleep)} readOnly /></label><label>Work Time Total:<input value={duration(totals.work)} readOnly /></label><label>Overall Total:<input value={duration(totals.all)} readOnly /></label></div><AccessButton data-action-status="complete" className="clear" onClick={clear}>Clear Filters</AccessButton></div>
    {error && <p className="report-data-error" role="alert">{error}</p>}
    <div className="research-grid-wrap"><table className="legacy-report-grid research-grid"><thead><tr><th aria-label="Record selector" />{columns.map(column => <th key={column}>{column}</th>)}<th aria-label="Record actions" /></tr></thead><tbody>{filtered.map((row, index) => <tr key={String(row.id ?? index)} className={index === 0 ? "is-current" : undefined}><td />{columns.map(column => <td key={column} title={text(row, column) ? undefined : missingReason(row, column)}>{text(row, column)}</td>)}<td /></tr>)}{!filtered.length && <tr><td colSpan={columns.length + 2} className="margin-empty">{error ? "Employee research data could not be loaded." : "No employee research records match these filters."}</td></tr>}</tbody></table></div>
    <footer className="research-record-count">Records: {filtered.length} of {rows.length}</footer>
  </section>;
}
