"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { TrackingWeekOption } from "@/lib/adminReportQueries";
import type { WeeklyCertifiedPayrollRow } from "@/lib/weeklyCertifiedPayroll";
import { trackingCsv } from "@/lib/trackingGrid";

interface Props {
  weeks: TrackingWeekOption[];
  rows: WeeklyCertifiedPayrollRow[];
  initialWeekEnding: string;
  error?: string;
}

export function WeeklyCertifiedPayrollScreen({ weeks, rows, initialWeekEnding, error = "" }: Props) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const projects = useMemo(() => {
    const unique = new Map<string, WeeklyCertifiedPayrollRow>();
    rows.forEach((row) => { if (!unique.has(row.projectId)) unique.set(row.projectId, row); });
    return [...unique.entries()].map(([id, row]) => ({ id, label: `${row.company} — ${row.projectName}` }));
  }, [rows]);
  const selectedId = projects.some((project) => project.id === projectId) ? projectId : projects[0]?.id ?? "";
  const reportRows = rows.filter((row) => row.projectId === selectedId);
  const report = reportRows[0];
  const totalHours = reportRows.reduce((sum, row) => sum + Number(row.hours || 0), 0);

  function changeWeek(weekEnding: string) {
    router.push(weekEnding ? `/weekly-certified-payroll?weekEnding=${encodeURIComponent(weekEnding)}` : "/weekly-certified-payroll");
  }
  function download() {
    const headers = ["Employee", "Hours", "Company", "Project", "Week Ending"];
    const csv = trackingCsv(headers, reportRows.map((row) => [row.employee, row.hours, row.company, row.projectName, initialWeekEnding]));
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `weekly-certified-payroll-${initialWeekEnding || "report"}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="weekly-certified-payroll-screen">
    <header className="weekly-certified-toolbar">
      <h1>Weekly Certified Payroll</h1>
      <label>Week Ending<select aria-label="Week Ending" value={initialWeekEnding} onChange={(event) => changeWeek(event.target.value)}>
        {weeks.map((week) => <option key={week.value} value={week.value}>{week.label}</option>)}
      </select></label>
      <label>Job<select aria-label="Job" value={selectedId} onChange={(event) => setProjectId(event.target.value)}>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.label}</option>)}
      </select></label>
      <AccessButton data-action-status="complete" onClick={() => router.refresh()}>Refresh</AccessButton>
      <AccessButton data-action-status="complete" onClick={download} disabled={!reportRows.length}>Download CSV</AccessButton>
      <AccessButton data-action-status="complete" onClick={() => window.print()} disabled={!report}>Print / Save PDF</AccessButton>
    </header>
    {error && <p className="weekly-certified-error" role="alert">{error}</p>}
    {!error && !report && <p className="weekly-certified-empty">No employee hours were found for this week.</p>}
    {report && <article className="weekly-certified-document">
      <div className="weekly-certified-heading"><h2>Weekly Certified Payroll</h2><span>Week Ending: {weeks.find((week) => week.value === initialWeekEnding)?.label ?? initialWeekEnding}</span></div>
      <dl className="weekly-certified-fields">
        <div><dt>Company&apos;s Name:</dt><dd>{report.company}</dd></div>
        <div><dt>Address:</dt><dd>{report.companyAddress}</dd></div>
        <div><dt>Phone:</dt><dd>{report.companyPhone}</dd></div>
        <div><dt>Awarding Authority&apos;s Name:</dt><dd>{report.awardingAuthority}</dd></div>
        <div><dt>Public Works Project Name:</dt><dd>{report.projectName}</dd></div>
        <div><dt>Public Works Project Location:</dt><dd>{report.projectLocation}</dd></div>
        <div><dt>Min. Wage Rate Sheet No.:</dt><dd>{report.minimumWageSheet}</dd></div>
        <div><dt>General / Prime Contractor&apos;s Name:</dt><dd>{report.primeContractor}</dd></div>
        <div><dt>Report sent to:</dt><dd>{report.reportRecipient}{report.recipientContact ? ` — ${report.recipientContact}` : ""}{report.recipientAddress ? `, ${report.recipientAddress}` : ""}</dd></div>
        <div><dt>Total Hours:</dt><dd>{totalHours.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd></div>
      </dl>
      <h3>Employee Hours</h3>
      <table className="weekly-certified-hours"><thead><tr><th>Employee</th><th>Hours</th></tr></thead><tbody>
        {reportRows.map((row) => <tr key={row.id}><td>{row.employee}</td><td>{Number(row.hours || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td></tr>)}
        <tr className="weekly-certified-total"><th>Total</th><th>{totalHours.toLocaleString(undefined, { maximumFractionDigits: 2 })}</th></tr>
      </tbody></table>
    </article>}
  </section>;
}
