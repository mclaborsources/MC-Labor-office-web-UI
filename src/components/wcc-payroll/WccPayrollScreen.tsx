"use client";

import { useState } from "react";

const columns = ["Customer", "Salesman", "WCC", "Per Diem", "Total Sales", "SUB Sales", "Employee Sales"];

export function WccPayrollScreen() {
  const [view, setView] = useState("View 01");
  const [state, setState] = useState("");
  const [payrollCompany, setPayrollCompany] = useState("");
  const [year, setYear] = useState("");
  const [start, setStart] = useState("2026-07-10");
  const [end, setEnd] = useState("2026-07-10");
  const [customerMode, setCustomerMode] = useState("all");
  const [additionalUpdate, setAdditionalUpdate] = useState("");

  function clearFilters() {
    setState("");
    setPayrollCompany("");
    setYear("");
    setCustomerMode("all");
    setAdditionalUpdate("");
  }

  return (
    <main className="wcc-report">
      <header className="wcc-report__header">
        <h1>WCC Payroll / Sales Report By Customer</h1>
        <div className="wcc-report__view-controls">
          <label>View:</label>
          <select value={view} onChange={(event) => setView(event.target.value)}>
            {Array.from({ length: 6 }, (_, index) => (
              <option key={index}>View {String(index + 1).padStart(2, "0")}</option>
            ))}
          </select>
          <button>Save View</button><button>Delete View</button><button>Refresh</button><button>Zero</button><button>Export View</button>
        </div>
        <fieldset className="wcc-report__customers">
          <legend>Show Customers</legend>
          <label><input type="radio" checked={customerMode === "all"} onChange={() => setCustomerMode("all")} /> All</label>
          <label><input type="radio" checked={customerMode === "one"} onChange={() => setCustomerMode("one")} /> with 1 WCC</label>
          <label><input type="radio" checked={customerMode === "many"} onChange={() => setCustomerMode("many")} /> with &gt;1 WCC</label>
        </fieldset>
        <button className="wcc-report__cancel" onClick={() => window.close()}>Cancel</button>
        <button className="wcc-report__help" title="Help">?</button>
      </header>

      <section className="wcc-report__filters">
        <div className="wcc-report__left-filters">
          <label>State <select value={state} onChange={(event) => setState(event.target.value)}><option value="">&lt;State&gt;</option><option>Connecticut</option><option>Massachusetts</option><option>New York</option><option>Rhode Island</option></select></label>
          <button>MA/Others WC Report</button>
          <label>Payroll Company <select value={payrollCompany} onChange={(event) => setPayrollCompany(event.target.value)}><option value="">&lt;Payroll Co&gt;</option><option>MC Labor</option><option>Others</option></select></label>
          <div className="wcc-report__address"><span>Address:</span><button>Emp Mailing State</button><button>Job State</button></div>
          <label>Assign Year <select value={year} onChange={(event) => setYear(event.target.value)}><option value=""></option><option>2025</option><option>2026</option><option>2027</option></select></label>

          <div className="wcc-report__dates">
            <div><strong>Week Ending Friday</strong><em>(click date first)</em><label>Start <input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label><label>End <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>
            <div className="wcc-report__date-nav"><button>◀</button><button>▣</button><button>▶</button></div>
            <div><strong>Start and End Days of Report</strong><output>Saturday, July 4, 2026</output><output>Friday, July 10, 2026</output></div>
            <div><strong>Start and End Payroll Chk Days</strong><output>Thursday, July 16, 2026</output><output>Thursday, July 16, 2026</output></div>
          </div>
          <label className="wcc-report__exclusions">No Employee Exclusions <input type="checkbox" /></label>
        </div>

        <div className="wcc-report__right-filters">
          <div className="wcc-report__views"><button>Audit Report</button>{[2, 3, 4, 5, 6].map((item) => <button key={item} onClick={() => setView(`View 0${item}`)}>View 0{item}</button>)}</div>
          <div className="wcc-report__penalty"><label>Change Penalty % to: <input /></label><button>Change</button><select className="wcc-report__additional" value={additionalUpdate} onChange={(event) => setAdditionalUpdate(event.target.value)}><option value="">&lt;Additional Updates&gt;</option><option>Update costs</option><option>Update state rates</option></select></div>
          <div className="wcc-report__notes"><button>Refresh</button><i>Only records with an existing State Rate value greater than 0 will be changed.<br />A Refresh or running the Costs additional update will reset the records.</i><i>The Costs additional update only works if 1 State selection<br />and 1 Payroll Company selection is made.</i></div>
          <button className="wcc-report__clear" onClick={clearFilters}>Clear Filters</button>
          <p className="wcc-report__warning">Per Diem on this screen is Employee-related (payroll).</p>
        </div>
      </section>

      <section className="wcc-report__grid" aria-label="WCC payroll sales results">
        <table><thead><tr><th className="wcc-report__selector"></th>{columns.map((column) => <th key={column}>{column}<span>⌄</span></th>)}</tr></thead>
          <tbody><tr className="wcc-report__total"><td>⌄</td><td>Total</td>{columns.slice(1).map((column) => <td key={column}></td>)}</tr>{Array.from({ length: 26 }, (_, row) => <tr key={row}>{Array.from({ length: 8 }, (_, cell) => <td key={cell}></td>)}</tr>)}</tbody></table>
      </section>
      <footer className="wcc-report__recordbar"><span>Record:</span><button disabled>|◀</button><button disabled>◀</button><b>Totals</b><button disabled>▶</button><button disabled>▶|</button><span className="wcc-report__filter-status">⌁ No Filter</span><label>Search <input type="search" /></label></footer>
    </main>
  );
}
