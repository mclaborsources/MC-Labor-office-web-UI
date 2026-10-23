"use client";

import { useState } from "react";

const columns = ["User Name", "Timestamp", "Week Ending Payment is to be Made", "Adjustment Type", "Job State", "Qty/Reg Hours", "OT Hours", "Amount/Pay Rate", "Travel Rate", "Total $", "Office Note", "Adjustment Note"];
const widths = [18,96,89,253,135,77,113,78,129,88,74,176,249,21];

export function EmployeeAdjustmentsScreen() {
  const [entry, setEntry] = useState<Record<string,string>>({ "Qty/Reg Hours":"1" });
  return <div className="er-payroll-adjustments-screen">
    <header><b>IPG</b><button type="button" data-action-status="complete" onClick={() => setEntry({ "Qty/Reg Hours":"1" })}>Delete Row</button></header>
    <div className="er-payroll-adjustments-grid-wrap"><table>
      <colgroup>{widths.map((width,index)=><col key={index} style={{width}} />)}</colgroup>
      <thead><tr><th aria-label="Record selector" />{columns.map(column=><th key={column}>{column}</th>)}<th /></tr></thead>
      <tbody>
        <tr className="er-payroll-adjustments-selected"><td />{columns.map(column=><td key={column} />)}<td /></tr>
        <tr className="er-payroll-adjustments-entry"><td>*</td>{columns.map(column=><td key={column}>{!["User Name","Timestamp","Total $"].includes(column) && <input aria-label={column} value={entry[column] ?? ""} onChange={event=>setEntry(current=>({...current,[column]:event.target.value}))} />}</td>)}<td /></tr>
        {Array.from({length:12},(_,row)=><tr key={row}>{widths.map((_,column)=><td key={column} />)}</tr>)}
      </tbody>
    </table></div>
  </div>;
}
