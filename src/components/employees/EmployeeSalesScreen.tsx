"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import type { EmployeeDetail, EmployeeSummary } from "@/types/employee";

type EmployeeOption = Pick<EmployeeSummary, "employeeId" | "fullName">;

export function EmployeeSalesScreen({ employee, employeeOptions, tradeOptions, qualificationOptions, licenseDropdowns }: { employee: EmployeeDetail; employeeOptions: EmployeeOption[]; tradeOptions: string[]; qualificationOptions: string[]; licenseDropdowns: Record<string, string[]> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState("Default");
  const [rightPanel, setRightPanel] = useState("Default");
  const fields = employee.accessFields;
  const value = (...keys: string[]) => keys.map(key => fields[key]).find(item => item !== undefined && item !== "") ?? "";
  const select = (label: string, key: string, current: string, options: string[]) => <label key={key}><span>{label}</span><select aria-label={label} value={values[key] ?? current} onChange={event => setValues(state => ({ ...state, [key]: event.target.value }))}><option value="" />{current && !options.includes(current) && <option value={current}>{current}</option>}{[...new Set(options.filter(Boolean))].map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
  const howReferredOptions = ["Agency Referral", "Employee Referral", "Walk-In", "Online", "Other"];
  const referredByOptions = employeeOptions.map(option => option.fullName).filter(Boolean);

  return <div className="er-sales-screen">
    <button className="er-sales-get-questions" data-action-status="missing">Get Questions &amp; Tool List</button>
    <aside className="er-sales-sidebar">
      {select("Trade", "trade", employee.trade, tradeOptions)}
      {select("Qualification", "qualification", employee.qualification, qualificationOptions)}
      <label>Licensed In<input readOnly value={value("EmLicensedIn")} /><button data-action-status="missing">Edit</button></label>
      {select("How Referred", "howReferred", value("EmHowReferred"), howReferredOptions)}
      {select("Referred by Employee", "referredBy", value("EmReferredBy"), referredByOptions)}
      {select("Level", "level", value("CTLevel"), licenseDropdowns.CTLevel ?? [])}
      <label>Lic Number<input readOnly value={value("LicenseNumber")} /><button data-action-status="missing" aria-label="Copy license number"><Copy size={14} /></button></label>
      <label>Lic Issue Date<input readOnly value={value("LicenseIssueDate")} /></label>
      <label>License Age<input readOnly value={value("LicenseAge")} /></label>
      {select("Lic Status", "licenseStatus", value("LicenseStatus"), licenseDropdowns.LicenseStatus ?? [])}
      {select("School Cmplt’d", "school", value("SchoolCompleted"), licenseDropdowns.SchoolCompleted ?? [])}
      {select("Years In Trade", "years", value("YearsInTrade"), licenseDropdowns.YearsInTrade ?? [])}
      {select("Experience", "experience", employee.averageInterview || value("EmExperience"), licenseDropdowns.EmExperience ?? [])}
      <label>OSHA 10<input readOnly value={value("OSHA10Status")} /><button data-action-status="missing">Face Sheet</button></label>
      <fieldset className="er-sales-car"><legend>Car</legend><label>Yes<input type="checkbox" checked={["1", "true", "yes"].includes(value("Car").toLowerCase())} readOnly /></label><label>No<input type="checkbox" checked={Boolean(value("Car")) && !["1", "true", "yes"].includes(value("Car").toLowerCase())} readOnly /></label><button data-action-status="missing">History</button></fieldset>
      <fieldset className="er-sales-ppe"><legend>PPE</legend><button className="er-sales-ppe-history" data-action-status="missing">History</button><button data-action-status="missing">All</button>{["Hard Hat", "Steel Toe Boots", "Safety Glasses", "Gloves", "Masks", "High Visibility Vest"].map((name, index) => <label key={name}>{name}<input type="checkbox" checked={employee.extended.ppe.includes(["Hard Hat", "Steel-Toe Boots", "Safety Glasses", "Gloves", "Masks", "Hi-Vis Vest"][index])} readOnly /></label>)}</fieldset>
    </aside>
    <section className="er-sales-main"><nav>{["Default", "History", "Previous Employers", "Questions", "Tool List", "Bio", "Sub Trades"].map(item => <button data-action-status="complete" key={item} className={panel === item ? "active" : ""} onClick={() => setPanel(item)}>{item}</button>)}</nav>
      <div className="er-sales-default">
        {panel === "Default" ? <>
          <section className="er-sales-phones">
            <div className="er-sales-phone-head"><span /><span /><strong>Mobile Phone #</strong><span /><strong>User</strong><strong>Date</strong><strong>Text Msg Addr</strong><span /><strong>No Comm</strong><strong>User</strong><strong>Date</strong><strong>Valid</strong><strong>Verify Primary Mobile #</strong></div>
            <div className="er-sales-phone-actions"><button data-action-status="missing">Make<br />Primary</button><button data-action-status="missing">Remove</button></div>
            {Array.from({ length:4 }, (_,index) => { const phone=employee.phoneRows[index]; return <div className="er-sales-phone-row" key={index}><input type="radio" name="sales-primary-mobile" checked={index===0} readOnly aria-label={`Primary mobile ${index+1}`} /><b className={index===0 ? "primary" : ""}>{index+1}</b><input readOnly aria-label={`Mobile ${index+1}`} value={phone?.number ?? ""} /><button data-action-status="missing" aria-label="Copy mobile number"><Copy size={14} /></button><input readOnly value={phone?.user ?? ""} /><input readOnly value={phone?.date ?? ""} /><input readOnly value={phone?.textAddress ?? ""} /><button data-action-status="missing" aria-label="Copy text message address"><Copy size={14} /></button><input type="checkbox" checked={phone?.noCommunication ?? false} readOnly /><input readOnly /><input readOnly /><input type="checkbox" checked={phone?.valid ?? false} readOnly /><div className="er-sales-verify"><input type="checkbox" checked={phone?.verifyPrimary ?? false} readOnly /><input readOnly /><input readOnly /></div></div>; })}
            <p>Select a Mobile Phone # first</p>
            <section className="er-sales-text"><span>Text:</span><label><input type="radio" name="sales-text-mode" />Freehand</label><label><input type="radio" name="sales-text-mode" defaultChecked />Select from List</label><button data-action-status="missing">Send Text</button><textarea readOnly /><small>Placeholders: [Employee First Name], [User First Name], [User Full Name]</small></section>
          </section>
          <div className="er-sales-copy-names"><button data-action-status="missing">Copy First Name</button><button data-action-status="missing">Copy Last Name / Trade</button></div>
          <section className="er-sales-homes"><div className="er-sales-home-head"><span /><span /><strong>Home Phone #</strong><span /><strong>Valid</strong><strong>Verify Primary Home #</strong></div><div className="er-sales-phone-actions"><button data-action-status="missing">Make<br />Primary</button><button data-action-status="missing">Remove</button></div>{[1,2,3,4].map(number=><div className="er-sales-home-row" key={number}><input type="radio" name="sales-primary-home" checked={number===1} readOnly aria-label={`Primary home ${number}`} /><b className={number===1 ? "primary" : ""}>{number}</b><input readOnly value={number===1 ? employee.homePhone : value(`EmHomePhone${number}`)} /><button data-action-status="missing" aria-label="Copy home number"><Copy size={14} /></button><input type="checkbox" readOnly /><div className="er-sales-verify"><input type="checkbox" readOnly /><input readOnly /><input readOnly /></div></div>)}<p>Select a Home Phone # first</p></section>
          <section className="er-sales-address"><label>Street<input readOnly value={employee.address} /><button data-action-status="missing" aria-label="Copy street"><Copy size={14} /></button></label><label>City, State<input readOnly value={[employee.city, employee.state].filter(Boolean).join(", ")} /><button data-action-status="missing" aria-label="Copy city and state"><Copy size={14} /></button></label><label>Zip<input readOnly value={employee.zip} /></label><button data-action-status="missing">Update<br />Mobile, Home, and Email<br />in Employee Search 3</button></section>
          <div className="er-sales-onboard"><b>Request to have Employee onboarded</b><button data-action-status="missing">Email</button><button data-action-status="missing">History</button></div>
          <section className="er-sales-emails">{["Email (primary)", "Email 2", "Email 3", "Email 4", "Email 5", "Email 6"].map((label, index) => <label key={label}>{label}<input readOnly value={index === 0 ? employee.email : value(`EmEmail${index + 1}`)} /><button data-action-status="missing" aria-label={`Copy ${label}`}><Copy size={14} /></button></label>)}</section>
          <button className="er-sales-primary-email" data-action-status="missing">Email</button>
          <label className="er-sales-interview-notes">Interview Questions Notes:<textarea readOnly value={value("InterviewedByLocation")} /></label>
        </> : <div className="er-sales-panel-placeholder"><h3>{panel}</h3><p>No {panel.toLowerCase()} records are available for this employee.</p></div>}
      </div>
    </section>
    <aside className="er-sales-history"><nav>{["Default", "Interview #", "Work # / History", "Communication"].map(item => <button data-action-status="complete" key={item} className={rightPanel === item ? "active" : ""} onClick={() => setRightPanel(item)}>{item}</button>)}</nav>
      <button data-action-status="missing">Double-click to populate</button><b>User &amp; Date　 History</b>
      {rightPanel === "Default" ? <><label>Entry<input readOnly value={value("EmEntryUserName")} /><input readOnly value={value("EmEntryDate")} /></label><label>Call #<select aria-label="Call number"><option value="" />{value("CallNumber") && <option>{value("CallNumber")}</option>}</select><input readOnly /><input readOnly /><button data-action-status="missing">H</button></label><label>Last Action<input readOnly value={value("EmployeeContactHistoryActionType")} /><input readOnly value={value("EmployeeContactHistoryUserName")} /><input readOnly value={value("EmployeeContactHistoryDate")} /></label><label>Future Call Dt<input readOnly value={value("EmployeeFutureCall")} /><input readOnly /><input readOnly /><button data-action-status="missing">×</button></label></> : <div className="er-sales-panel-placeholder"><p>No {rightPanel.toLowerCase()} records are available for this employee.</p></div>}
      <div className="er-sales-communication"><label><input type="checkbox" checked={value("EmployeeNoCommunicationText") === "1"} readOnly />No Communication</label><label><input type="checkbox" readOnly />Return to Sender</label><label><input type="checkbox" readOnly />RIP</label></div>
      <footer><button data-action-status="missing">Add Notes</button><button data-action-status="missing">Populate Employee Face Sheet</button><button data-action-status="missing">Snapshot</button><button data-action-status="missing">True People</button></footer>
    </aside>
  </div>;
}
