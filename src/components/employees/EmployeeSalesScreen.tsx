"use client";

import { useState } from "react";
import type { EmployeeDetail, EmployeeSummary } from "@/types/employee";

type EmployeeOption = Pick<EmployeeSummary, "employeeId" | "fullName">;

export function EmployeeSalesScreen({ employee, employeeOptions, tradeOptions, qualificationOptions, licenseDropdowns }: { employee: EmployeeDetail; employeeOptions: EmployeeOption[]; tradeOptions: string[]; qualificationOptions: string[]; licenseDropdowns: Record<string, string[]> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState("Default");
  const [rightPanel, setRightPanel] = useState("Default");
  const fields = employee.accessFields;
  const value = (...keys: string[]) => keys.map(key => fields[key]).find(item => item !== undefined && item !== "") ?? "";
  const select = (label: string, key: string, current: string, options: string[]) => <label key={key}>{label}<select aria-label={label} value={values[key] ?? current} onChange={event => setValues(state => ({ ...state, [key]: event.target.value }))}><option value="" />{current && !options.includes(current) && <option value={current}>{current}</option>}{options.filter(Boolean).map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
  const howReferredOptions = ["Agency Referral", "Employee Referral", "Walk-In", "Online", "Other"];
  const referredByOptions = employeeOptions.map(option => option.fullName).filter(Boolean);

  return <div className="er-sales-screen">
    <aside className="er-sales-sidebar">
      {select("Trade", "trade", employee.trade, tradeOptions)}
      {select("Qualification", "qualification", employee.qualification, qualificationOptions)}
      <label>Licensed In<input readOnly value={value("EmLicensedIn")} /><button data-action-status="missing" disabled>Edit</button></label>
      {select("How Referred", "howReferred", value("EmHowReferred"), howReferredOptions)}
      {select("Referred by Employee", "referredBy", value("EmReferredBy"), referredByOptions)}
      {select("Level", "level", value("CTLevel"), licenseDropdowns.CTLevel ?? [])}
      <label>Lic Number<input readOnly value={value("LicenseNumber")} /></label>
      <label>Lic Issue Date<input readOnly value={value("LicenseIssueDate")} /></label>
      <label>License Age<input readOnly value={value("LicenseAge")} /></label>
      {select("Lic Status", "licenseStatus", value("LicenseStatus"), licenseDropdowns.LicenseStatus ?? [])}
      <label>School Cmplt&apos;d<input readOnly value={value("SchoolCompleted")} /></label>
      <label>Years In Trade<input readOnly value={value("YearsInTrade")} /></label>
      <label>Experience<input readOnly value={employee.averageInterview || value("EmExperience")} /></label>
      <label>OSHA 10<input readOnly value={value("OSHA10Status")} /><button data-action-status="missing" disabled>Face Sheet</button></label>
      <fieldset className="er-sales-car"><legend>Car</legend><label>Yes<input type="checkbox" checked={["1", "true", "yes"].includes(value("Car").toLowerCase())} readOnly /></label><label>No<input type="checkbox" checked={Boolean(value("Car")) && !["1", "true", "yes"].includes(value("Car").toLowerCase())} readOnly /></label><button data-action-status="missing" disabled>History</button></fieldset>
      <fieldset className="er-sales-ppe"><legend>PPE</legend><button data-action-status="missing" disabled>All</button>{["Hard Hat", "Steel Toe Boots", "Safety Glasses", "Gloves", "Masks", "High Visibility Vest"].map((name, index) => <label key={name}>{name}<input type="checkbox" checked={employee.extended.ppe.includes(["Hard Hat", "Steel-Toe Boots", "Safety Glasses", "Gloves", "Masks", "Hi-Vis Vest"][index])} readOnly /></label>)}</fieldset>
    </aside>
    <section className="er-sales-main"><nav>{["Default", "History", "Previous Employers", "Questions", "Tool List", "Bio", "Sub Trades"].map(item => <button data-action-status="complete" key={item} className={panel === item ? "active" : ""} onClick={() => setPanel(item)}>{item}</button>)}</nav>
      <div className="er-sales-default">
        {panel === "Default" ? <>
          <section className="er-sales-phones"><h3>Mobile Phone #　　User　 Date　　Text Msg Addr　　No Comm　　User　 Date　 Valid　 Verify Primary Mobile #</h3>{employee.phoneRows.map((phone, index) => <div key={index}><b>{index + 1}</b><input readOnly value={phone.number} /><button data-action-status="missing" disabled aria-label="Copy mobile number">▤</button><input readOnly value={phone.user} /><input readOnly value={phone.date} /><input readOnly value={phone.textAddress} /><input type="checkbox" checked={phone.noCommunication} readOnly /><input readOnly /><input readOnly /><input type="checkbox" checked={phone.valid} readOnly /><input type="checkbox" checked={phone.verifyPrimary} readOnly /></div>)}<p>Select a Mobile Phone # first</p><section className="er-sales-text"><b>Text:</b><label><input type="radio" name="sales-text-mode" defaultChecked />Freehand</label><label><input type="radio" name="sales-text-mode" />Select from List</label><textarea readOnly /><button data-action-status="missing" disabled>Send Text</button><small>Placeholders: [Employee First Name], [User First Name], [User Full Name]</small></section></section>
          <section className="er-sales-homes"><h3>Home Phone #　　Valid　 Verify Primary Home #</h3>{[1, 2, 3, 4].map(number => <div key={number}><b>{number}</b><input readOnly value={number === 1 ? employee.homePhone : value(`EmHomePhone${number}`)} /><input type="checkbox" readOnly /><input type="checkbox" readOnly /></div>)}<p>Select a Home Phone # first</p></section>
          <section className="er-sales-address"><label>Street<input readOnly value={employee.address} /></label><label>City, State<input readOnly value={[employee.city, employee.state].filter(Boolean).join(", ")} /></label><label>Zip<input readOnly value={employee.zip} /></label><button data-action-status="missing" disabled>Update Mobile, Home, and Email in Employee Search 3</button></section>
          <section className="er-sales-emails">{["Email (primary)", "Email 2", "Email 3", "Email 4", "Email 5", "Email 6"].map((label, index) => <label key={label}>{label}<input readOnly value={index === 0 ? employee.email : value(`EmEmail${index + 1}`)} /><button data-action-status="missing" disabled aria-label={`Copy ${label}`}>▤</button></label>)}</section>
          <label className="er-sales-interview-notes">Interview Questions Notes:<textarea readOnly value={value("InterviewedByLocation")} /></label>
        </> : <div className="er-sales-panel-placeholder"><h3>{panel}</h3><p>No {panel.toLowerCase()} records are available for this employee.</p></div>}
      </div>
    </section>
    <aside className="er-sales-history"><nav>{["Default", "Interview #", "Work # / History", "Communication"].map(item => <button data-action-status="complete" key={item} className={rightPanel === item ? "active" : ""} onClick={() => setRightPanel(item)}>{item}</button>)}</nav>
      <button data-action-status="missing" disabled>Double-click to populate</button><b>User &amp; Date　 History</b>
      {rightPanel === "Default" ? <><label>Entry<input readOnly value={value("EmEntryUserName")} /><input readOnly value={value("EmEntryDate")} /></label><label>Call #<select aria-label="Call number"><option value="" />{value("CallNumber") && <option>{value("CallNumber")}</option>}</select><input readOnly /><input readOnly /><button data-action-status="missing" disabled>H</button></label><label>Last Action<input readOnly value={value("EmployeeContactHistoryActionType")} /><input readOnly value={value("EmployeeContactHistoryUserName")} /><input readOnly value={value("EmployeeContactHistoryDate")} /></label><label>Future Call Dt<input readOnly value={value("EmployeeFutureCall")} /><input readOnly /><input readOnly /><button data-action-status="missing" disabled>×</button></label></> : <div className="er-sales-panel-placeholder"><p>No {rightPanel.toLowerCase()} records are available for this employee.</p></div>}
      <div className="er-sales-communication"><label><input type="checkbox" checked={value("EmployeeNoCommunicationText") === "1"} readOnly />No Communication</label><label><input type="checkbox" readOnly />Return to Sender</label><label><input type="checkbox" readOnly />RIP</label></div>
      <footer><button data-action-status="missing" disabled>Add Notes</button><button data-action-status="missing" disabled>Populate Employee Face Sheet</button><button data-action-status="missing" disabled>Snapshot</button><button data-action-status="missing" disabled>True People</button></footer>
    </aside>
  </div>;
}
