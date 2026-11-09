import type { EmployeeDetail } from "@/types/employee";

export function EmployeeSalesInterviewPanel({ employee }: { employee: EmployeeDetail }) {
  const fields = employee.accessFields;
  const value = (...keys: string[]) => keys.map(key => fields[key]).find(Boolean) ?? "";
  const rows = [
    { label:"Interview #", key:"interview", text:value("InterviewNumber", "InterviewNumberID"), user:value("InterviewNumberUserName"), date:value("InterviewNumberDate"), audit:true },
    { label:"Interv By", key:"interviewer", text:value("InterviewedBy", "InterviewedByName", "InterviewBy"), user:value("InterviewedByUserName"), date:value("InterviewedByDate", "InterviewByDate"), audit:true },
    { label:"Location", key:"location", text:value("InterviewLocation", "InterviewedByLocation") },
    { label:"Interv Date", key:"date", text:value("InterviewDate"), input:true },
    { label:"Resume #", key:"resume", text:value("ResumeNumber", "ResumeNumberID"), user:value("ResumeNumberUserName"), date:value("ResumeNumberDate"), audit:true },
    { label:"1st Call #", key:"first-call", text:value("FirstCallNumber"), user:value("FirstCallUserName", "FirstCallNumberUserName"), date:value("FirstCallDate"), audit:true },
  ];
  return <section className="er-sales-interview-panel" aria-label="Employee interview details">
    <b>User &amp; Date</b>
    {rows.map(row => <div className={`er-sales-interview-row er-sales-interview-row--${row.key}`} key={row.key}>
      <label htmlFor={`sales-interview-${row.key}`}>{row.label}</label>
      {row.input ? <input id={`sales-interview-${row.key}`} readOnly value={row.text} /> :
        <select id={`sales-interview-${row.key}`} value={row.text} disabled={!row.text} onChange={() => {}}><option value="" />{row.text && <option value={row.text}>{row.text}</option>}</select>}
      {row.audit && <><input aria-label={`${row.label} user`} readOnly value={row.user} /><input aria-label={`${row.label} date`} readOnly value={row.date} /></>}
    </div>)}
  </section>;
}
