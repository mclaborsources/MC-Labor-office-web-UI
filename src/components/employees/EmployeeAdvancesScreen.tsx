"use client";

const advanceColumns = ["Advance Date", "Advance Amount", "Repayment Amount", "Start Week Ending", "Advance Note", "User Name", "Timestamp"];
const adjustmentColumns = ["Week Ending Date", "Amount (use - for deduction)", "Adjustment Note", "User Name", "Timestamp", "Balance", "Gross Payroll"];

function EmptyGrid({ columns, rows = 7 }: { columns: string[]; rows?: number }) {
  return <div className="er-advance-grid-wrap"><table><thead><tr><th aria-label="Record selector" />{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{Array.from({ length: rows }, (_, index) => <tr key={index}>{columns.map((column, columnIndex) => <td key={`${column}-${columnIndex}`} />)}</tr>)}</tbody></table></div>;
}

export function EmployeeAdvancesScreen() {
  return <div className="er-advances-screen">
    <section className="er-advance-main"><header><b>IPG</b><h2>Employee Advances</h2><button disabled title="Deleting a saved advance requires database support">Delete a Advance</button><button disabled title="Advance editing is not connected">Edit Advances</button><p>To add a advance, use the Form Letter button above, fill in the Advance Information section, and then click the Create Advance button.</p></header><EmptyGrid columns={advanceColumns} rows={7} /><div className="er-advance-record-nav"><span>Record:</span><button disabled>◀</button><button disabled>◀</button><button disabled>No Filter</button><label>Search<input aria-label="Search advances" /></label></div></section>
    <section className="er-adjustments"><header><h2>Advance Payroll Adjustments</h2><button disabled title="Deleting an adjustment requires database support">Delete an Adjustment</button><button disabled title="Adjustment editing is not connected">Edit Adjustments</button><label>Week Ending Date<input type="date" aria-label="Adjustment week ending date" /></label><label>Amount<input type="number" step="0.01" aria-label="Adjustment amount" /></label><button disabled title="Adding payroll adjustments requires database support">Add Adjustment</button></header><EmptyGrid columns={adjustmentColumns} rows={9} /><div className="er-advance-record-nav"><span>Record:</span><button disabled>◀</button><button disabled>◀</button><button disabled>No Filter</button><label>Search<input aria-label="Search payroll adjustments" /></label></div></section>
  </div>;
}
