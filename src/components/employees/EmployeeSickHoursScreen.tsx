"use client";

import { useState } from "react";

type SickHoursRow = {
  dateOfSickDay: string;
  weekEndingPayment: string;
  officeNote: string;
  quantity: string;
  payRate: string;
  travelRate: string;
  total: string;
  autoNote: string;
  document: string;
  zeroOut: boolean;
  weekEnding: string;
};

const emptyRow = (): SickHoursRow => ({ dateOfSickDay: "", weekEndingPayment: "", officeNote: "", quantity: "", payRate: "", travelRate: "", total: "", autoNote: "", document: "", zeroOut: true, weekEnding: "" });

export function EmployeeSickHoursScreen() {
  const [rows, setRows] = useState<SickHoursRow[]>([emptyRow()]);
  const update = (index: number, key: keyof SickHoursRow, value: string | boolean) => setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  const dateValue = (value: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

  return <div className="er-sick-hours-screen">
    <div className="er-sick-toolbar"><b>IPG</b><button data-action-status="missing" title="Deleting a saved sick-hours record requires database support">Delete Row</button><button data-action-status="missing" title="Sick-hours report generation is not connected">Sick Hours Report</button><strong>If you do not want the information transferred to Payroll Adjustments, do not enter a date for Week Ending Payment is to be Made.</strong><button data-action-status="missing" title="Document linking is not connected">HL Document Browse</button><button data-action-status="missing" title="Summary data is not connected">Get Summary</button></div>
    <div className="er-sick-grid-wrap"><table className="er-sick-grid"><colgroup>{[18,96,90,126,253,176,89,81,96,74,215,69,82,109,21].map((width,index)=><col key={index} style={{width}} />)}</colgroup><thead><tr><th aria-label="Record selector" />{["User Name", "Timestamp", "Date of Sick Day", "Week Ending Payment is to be Made", "Office Note", "Qty of Hrs", "Pay Rate", "Travel Rate", "Total $", "Auto Note", "HL Doc", "Zero Out", "Week Ending"].map(heading => <th key={heading}>{heading}</th>)}<th /></tr></thead><tbody>{rows.map((row, index) => <tr className="er-sick-selected-row" key={index}><td className="er-sick-row-star">{index === 0 ? "*" : ""}</td><td><input readOnly value="" aria-label="User name" /></td><td><input readOnly value="" aria-label="Timestamp" /></td><td className="er-sick-active-cell"><input className={!row.dateOfSickDay ? "is-empty-date" : ""} type="date" aria-label="Date of Sick Day" value={dateValue(row.dateOfSickDay)} onChange={event => update(index, "dateOfSickDay", event.target.value)} /></td><td><input className={!row.weekEndingPayment ? "is-empty-date" : ""} type="date" aria-label="Week Ending Payment is to be Made" value={dateValue(row.weekEndingPayment)} onChange={event => update(index, "weekEndingPayment", event.target.value)} /></td><td><input aria-label="Office Note" value={row.officeNote} onChange={event => update(index, "officeNote", event.target.value)} /></td><td><input type="number" min="0" step="0.25" aria-label="Quantity of Hours" value={row.quantity} onChange={event => update(index, "quantity", event.target.value)} /></td><td><input type="number" min="0" step="0.01" aria-label="Pay Rate" value={row.payRate} onChange={event => update(index, "payRate", event.target.value)} /></td><td><input type="number" min="0" step="0.01" aria-label="Travel Rate" value={row.travelRate} onChange={event => update(index, "travelRate", event.target.value)} /></td><td><input readOnly value={row.total} aria-label="Total amount" /></td><td><input aria-label="Auto Note" value={row.autoNote} onChange={event => update(index, "autoNote", event.target.value)} /></td><td><input readOnly value={row.document} aria-label="Linked document" /></td><td><input type="checkbox" checked={row.zeroOut} aria-label="Zero Out" onChange={event => update(index, "zeroOut", event.target.checked)} /></td><td><input readOnly value={row.weekEnding} aria-label="Week Ending" /></td></tr>)}</tbody></table></div>
    <div className="er-sick-record-nav"><span>Record:</span><button data-action-status="missing">◀</button><button data-action-status="missing">◀</button><span>1 of 1</span><button data-action-status="missing">▶</button><button data-action-status="missing">▶</button><button data-action-status="missing">No Filter</button><label>Search<input aria-label="Search sick hours" /></label></div>
  </div>;
}
