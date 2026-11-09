import type { EmployeeDetail } from "@/types/employee";

export function EmployeeSalesWorkHistoryPanel({ employee }: { employee: EmployeeDetail }) {
  const fields = employee.accessFields;
  const value = (...keys: string[]) => keys.map(key => fields[key]).find(Boolean) ?? "";
  const rows = [
    { label:"Work #", key:"work", text:value("WorkNumber", "WorkNumberID"), user:value("WorkNumberUserName"), date:value("WorkNumberDate"), dropdown:true },
    { label:"UI", key:"ui", text:value("EmployeeOnUnemploymentText", "UnemploymentText"), user:value("EmployeeOnUnemploymentUserName"), date:value("EmployeeOnUnemploymentDate"), history:true },
    { label:"Avail ManP", key:"available", text:value("PostEmployeeAsAvailableText"), user:value("PostEmployeeAsAvailableUserName"), date:value("PostEmployeeAsAvailableDate"), history:true },
    { label:"Leaving #", key:"leaving", text:value("LeavingNumber", "LeavingNumberID"), user:value("LeavingNumberUserName"), date:value("LeavingNumberDate"), dropdown:true },
  ];
  return <section className="er-sales-work-panel" aria-label="Employee work history">
    <button className="er-sales-work-populate" data-action-status="missing" title="Work history population is not connected">Double-click to populate</button>
    <b>User &amp; Date　 History</b>
    {rows.map(row => <div className={`er-sales-work-row er-sales-work-row--${row.key}`} key={row.key}>
      <label htmlFor={`sales-work-${row.key}`}>{row.label}</label>
      {row.dropdown ? <select id={`sales-work-${row.key}`} value={row.text} disabled={!row.text} onChange={() => {}}><option value="" />{row.text && <option value={row.text}>{row.text}</option>}</select> : <input className="er-sales-work-blue" id={`sales-work-${row.key}`} readOnly value={row.text} />}
      <input aria-label={`${row.label} user`} readOnly value={row.user} /><input aria-label={`${row.label} date`} readOnly value={row.date} />
      {row.history && <button data-action-status="missing" aria-label={`${row.label} history`} title="History is not connected">H</button>}
    </div>)}
    <div className="er-sales-work-totals">{[
      ["First Week Assigned",value("FirstWeekAssigned", "FirstWeekEndingDate", "FirstDateOnJob")],
      ["Last Week Assigned",value("LastWeekAssigned", "LastWeekEndingDate", "WeekEndingDate")],
      ["Total Hours Worked",value("TotalHoursWorked")],
    ].map(([label,text]) => <label key={label}>{label}<input readOnly value={text} /></label>)}</div>
  </section>;
}
