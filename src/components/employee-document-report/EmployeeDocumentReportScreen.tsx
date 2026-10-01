"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { EmployeeSummary } from "@/types/employee";

type Mode = "licenses" | "interview" | "osha" | "resume" | "smartphone" | "face";
const META: Record<Mode, { title: string; flag: string; note: string }> = {
  licenses: { title: "Employee Licenses", flag: "EmployeeLicenseNumber", note: "EmployeeLicenseNotes" },
  interview: { title: "Interview Questions", flag: "InterviewQuestions", note: "InterviewQuestionsNotes" },
  osha: { title: "OSHA", flag: "OSHA", note: "OSHANotes" },
  resume: { title: "Resume or Work History", flag: "ResumeOrWorkHistory", note: "ResumeOrWorkHistoryNotes" },
  smartphone: { title: "Smart Phone", flag: "SmartPhone", note: "SmartPhoneNotes" },
  face: { title: "Face Meeting", flag: "FaceMeeting", note: "FaceMeetingNotes" },
};

export function EmployeeDocumentReportScreen({ mode, employees, error = "" }: { mode: Mode; employees: EmployeeSummary[]; error?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const info = META[mode];
  const rows = useMemo(() => employees.filter((employee) =>
    !search || `${employee.fullName} ${employee.currentAssignment} ${employee.cellPhone}`.toLowerCase().includes(search.toLowerCase()),
  ), [employees, search]);
  const columns = ["Employee", "Cell", "Trade", "Qualification", "Customer / Job", "Week Ending", "Status", "Details"];
  return <section className="ac-employee-doc">
    <header><h1>{info.title}</h1><div><label>Search:</label><input aria-label="Search employees" value={search} onChange={(event) => setSearch(event.target.value)} /><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => setSearch("")}>Clear</AccessButton></div><aside><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></aside></header>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    {!error && <p className="report-data-note">Live employee records from SQL Server. Document-specific values are shown only when present in the Access holding table.</p>}
    <div className="employee-doc-grid-wrap"><table className={`legacy-report-grid employee-doc-grid is-${mode}`}><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>
      {rows.map((employee) => {
        const fields = employee.accessFields ?? {};
        const qualification = String(fields.EmQualification ?? fields.Qualification ?? "");
        const flag = String(fields[info.flag] ?? "");
        const note = String(fields[info.note] ?? "");
        return <tr key={employee.employeeId}>
          <td><a href={`/employees/${encodeURIComponent(employee.employeeId)}`}>{employee.fullName}</a></td>
          <td>{employee.cellPhone}</td><td>{employee.trade}</td><td>{qualification}</td>
          <td>{employee.currentAssignment}</td><td>{employee.weekEnding}</td><td>{flag}</td><td>{note}</td>
        </tr>;
      })}
      {!rows.length && <tr><td colSpan={columns.length}>{search ? "No employees match this search." : "No employee records were returned by SQL Server."}</td></tr>}
    </tbody></table></div>
    <footer className="ac-employee-doc-record">{rows.length} employee records</footer>
  </section>;
}
