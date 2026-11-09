import type { EmployeeDetail } from "@/types/employee";

export function EmployeeSalesCommunicationPanel({ employee }: { employee: EmployeeDetail }) {
  const rows = [
    { label:"Act (Text)", key:"NumActionsCustomText", action:"Delete Text History" },
    { label:"Act (Letter)", key:"NumActionsCustomLetter", action:"Delete Letter History" },
    { label:"Act (PCard)", key:"NumActionsCustomPostcard", action:"Delete Postcard History" },
  ];
  return <section className="er-sales-communication-panel" aria-label="Employee communication history">
    <button className="er-sales-communication-populate" data-action-status="missing" title="Communication history population is not connected">Double-click to populate</button>
    <div className="er-sales-communication-rows">{rows.map(row => <div className="er-sales-communication-row" key={row.key}>
      <label htmlFor={`sales-communication-${row.key}`}>{row.label}</label>
      <input id={`sales-communication-${row.key}`} readOnly value={employee.accessFields[row.key] ?? ""} />
      <button data-action-status="missing" title="History deletion is not connected">{row.action}</button>
    </div>)}</div>
  </section>;
}
