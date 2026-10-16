"use client";

import { useState } from "react";

type VacationRow = { vacationDate: string; paymentWeekEnding: string; officeNote: string; hours: string; payRate: string; travelRate: string; total: string; autoNote: string };
const emptyRow = (): VacationRow => ({ vacationDate: "", paymentWeekEnding: "", officeNote: "", hours: "", payRate: "", travelRate: "", total: "", autoNote: "" });

export function EmployeeVacationHoursScreen() {
  const [rows, setRows] = useState<VacationRow[]>([emptyRow()]);
  const update = (index: number, key: keyof VacationRow, value: string) => setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  const dateValue = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

  return <div className="er-vacation-screen">
    <div className="er-vacation-toolbar"><b>IPG</b><button disabled title="Deleting a saved vacation-hours record requires database support">Delete Row</button><button disabled title="Vacation-hours report generation is not connected">Vacation Hours Report</button><strong>If you do not want the information transferred to Payroll Adjustments, do not enter a date for<br />Week Ending Payment is to be Made.</strong><button disabled title="Summary data is not connected">Get Summary</button></div>
    <div className="er-vacation-grid-wrap"><table className="er-vacation-grid"><thead><tr><th aria-label="Record selector" />{["User Name", "Timestamp", "Date of Vacation", "Week Ending Payment is to be Made", "Office Note", "Qty of Hours", "Pay Rate", "Travel Rate", "Total $", "Auto Note"].map(heading => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={index}><td className="er-vacation-star">*</td><td><input readOnly aria-label="User Name" /></td><td><input readOnly aria-label="Timestamp" /></td><td><input type="date" aria-label="Date of Vacation" value={dateValue(row.vacationDate)} onChange={event=>update(index,"vacationDate",event.target.value)} /></td><td><input type="date" aria-label="Week Ending Payment is to be Made" value={dateValue(row.paymentWeekEnding)} onChange={event=>update(index,"paymentWeekEnding",event.target.value)} /></td><td><input aria-label="Office Note" value={row.officeNote} onChange={event=>update(index,"officeNote",event.target.value)} /></td><td><input type="number" min="0" step="0.25" aria-label="Quantity of Hours" value={row.hours} onChange={event=>update(index,"hours",event.target.value)} /></td><td><input type="number" min="0" step="0.01" aria-label="Pay Rate" value={row.payRate} onChange={event=>update(index,"payRate",event.target.value)} /></td><td><input type="number" min="0" step="0.01" aria-label="Travel Rate" value={row.travelRate} onChange={event=>update(index,"travelRate",event.target.value)} /></td><td><input readOnly aria-label="Total amount" value={row.total} /></td><td><input aria-label="Auto Note" value={row.autoNote} onChange={event=>update(index,"autoNote",event.target.value)} /></td></tr>)}</tbody></table></div>
    <div className="er-vacation-record-nav"><span>Record:</span><button disabled>◀</button><button disabled>◀</button><span>1 of 1</span><button disabled>▶</button><button disabled>▶</button><button disabled>No Filter</button><label>Search<input aria-label="Search vacation hours" /></label></div>
  </div>;
}
