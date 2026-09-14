"use client";

import { useEffect, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

interface Option { value: string; label: string }
interface SimilarEmployee { EmployeeID: string; firstName: string; lastName: string; middleInitial: string; city: string; mobilePhone: string; homePhone: string; email: string; socialSecurity: string; dateOfBirth: string }
interface ReferenceData { grades: Option[]; trades: Option[]; referrals: Option[]; qualifications: Option[]; agencies?: Option[]; similar: SimilarEmployee[] }

const EMPTY_REFERENCE: ReferenceData = { grades: [], trades: [], referrals: [], qualifications: [], similar: [] };

export function NewJobApplicationModal({ open, onClose, variant = "employee" }: { open: boolean; onClose: () => void; variant?: "employee" | "sub" }) {
  const [reference, setReference] = useState<ReferenceData>(EMPTY_REFERENCE);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    fetch("/api/employees/new-employee-reference")
      .then((response) => response.json())
      .then((data) => data.ok && setReference(data))
      .catch(() => setMessage("Unable to load employee lookup values."));
  }, [open]);

  async function checkEmployee() {
    if (!first.trim() || !last.trim()) { setMessage("First Name and Last Name are required."); return; }
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/employees/new-employee-reference?first=${encodeURIComponent(first)}&last=${encodeURIComponent(last)}`);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error);
      setReference(data);
      setMessage(data.similar.length ? "Similar employees were found. Review the list before continuing." : "No matching employee was found. Database creation is unavailable while writes are disabled.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Employee check failed."); }
    finally { setLoading(false); }
  }

  if (!open) return null;
  const reset = () => { setResetKey(v => v + 1); setFirst(""); setLast(""); setReference((value) => ({ ...value, similar: [] })); setMessage(""); };
  const fields = ["Home Phone", "Mobile Phone", "Email", "Social Security #", "Date of Birth"];
  return (
    <div className="ac-new-employee-backdrop" role="presentation">
      <section className={`ac-new-employee-modal ${variant === "sub" ? "ac-new-sub-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="new-employee-title">
        <header><h2 id="new-employee-title">{variant === "sub" ? "Add New SUB" : "Add New Employee"}</h2><AccessButton onClick={onClose}>Close</AccessButton></header>
        <div className="ac-new-employee-body">
          {variant === "sub" && <div className="ac-sub-agency" key={`agency-${resetKey}`}><label>Referral Agency<select defaultValue=""><option value="" />{reference.agencies?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label><label>Agency Referral Rate<input type="number" min="0" step="0.01" /></label></div>}
          <div className="ac-new-employee-form" key={resetKey}>
            <label>First Name<input autoFocus value={first} onChange={(e) => setFirst(e.target.value)} /></label>
            <label>Last Name<input value={last} onChange={(e) => setLast(e.target.value)} /></label>
            <label>Middle Initial<input maxLength={2} /></label>
            <label>Grade<select key={reference.grades.length} defaultValue={reference.grades.find(o => o.label === "Z")?.value ?? ""}><option value="" />{reference.grades.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            <label>How Referred<select defaultValue=""><option value="" />{reference.referrals.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            <label className="ac-new-employee-referred">Referred By<input /></label>
            {fields.map((field) => <label key={field}>{field}<input type={field === "Date of Birth" ? "date" : field === "Email" ? "email" : "text"} /></label>)}
            <label>Trade<select defaultValue=""><option value="" />{reference.trades.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            <label>Qualification<select defaultValue=""><option value="" />{reference.qualifications.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
          </div>
          <div className="ac-new-employee-similar"><h3>Similar Employees:</h3><div className="ac-new-employee-grid"><table><thead><tr>{["Profile","First Name","Last Name","MI","City","Mobile Phone","Home Phone","Email","Social Security #","Date of Birth"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{reference.similar.map((employee) => <tr key={employee.EmployeeID}><td><a href={`/employees/${employee.EmployeeID}`}>View</a></td><td>{employee.firstName}</td><td>{employee.lastName}</td><td>{employee.middleInitial}</td><td>{employee.city}</td><td>{employee.mobilePhone}</td><td>{employee.homePhone}</td><td>{employee.email}</td><td>{employee.socialSecurity}</td><td>{employee.dateOfBirth}</td></tr>)}{Array.from({ length: Math.max(0, 14-reference.similar.length) }, (_, i) => <tr key={`empty-${i}`}>{Array.from({ length: 10 }, (_, j) => <td key={j} />)}</tr>)}</tbody></table></div><div className="ac-legacy-recordbar">Record: ◀ <input aria-label="Similar employee record" readOnly value={reference.similar.length} /> ▶ ▽ No Filter <input aria-label="Search similar employees" placeholder="Search" /></div></div>
          <div className="ac-new-employee-licenses"><h3>Licenses</h3><table><thead><tr><th>State</th><th>Trade</th><th>Lic Type</th><th>Lic Number</th><th>Exp Date</th><th>Copy On File</th><th>Notes</th></tr></thead><tbody><tr>{Array.from({ length: 7 }, (_, i) => <td key={i}><input aria-label={`License field ${i + 1}`} /></td>)}</tr></tbody></table><div className="ac-legacy-recordbar">Record: ◀ 1 of 1 ▶ ▽ No Filter <input aria-label="Search licenses" placeholder="Search" /></div><label className="ac-new-employee-licensed">Licensed In<input readOnly /></label></div>
        </div>
        <footer><div><AccessButton onClick={checkEmployee} disabled={loading}>{loading ? "Checking…" : "Check/Add Employee"}</AccessButton><AccessButton onClick={reset}>Clear Screen</AccessButton></div>{message && <p>{message}</p>}<p className="ac-employee-instructions">To start over if an employee already exists, click the Clear Screen button to reset the screen.</p><p className="ac-employee-instructions">To view an existing employee profile, click the View link next to the employee name in the Similar Employees list.</p><small>{variant === "sub" ? "Default values: Grade = Z, Employee Status = Available, IPG as the Payroll Co On Site, with SUB as the Job App Status, Exclude Sick Time = Yes, Exclude Workers Comp = Yes." : "Default values: Grade = Z, Employee Status = Office Interview, IPG as the Payroll Co On Site, with N Ap as the Job App Status."}</small></footer>
      </section>
    </div>
  );
}
