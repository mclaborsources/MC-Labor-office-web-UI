"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

type RequestRow = {
  id: string; date: string; employee: string; lastDay: string; customer: string; trade: string;
  reason: string; reasonCont: string; reasonDate: string; contract: string; notes: string; user: string;
};
type ContactRow = { id: string; company: string; first: string; last: string; state: string; email: string; notes: string; active: string };
type LookupOption = { id: string; label: string };
type ReportResponse = { ok: boolean; data?: Record<string, unknown>[]; contacts?: Record<string, unknown>[]; contactsError?: string; dropdowns?: { reasons?: Record<string, unknown>[]; reasonDetails?: Record<string, unknown>[]; contracts?: Record<string, unknown>[] }; error?: string };
const emptyRequest: RequestRow = { id: "", date: "", employee: "", lastDay: "", customer: "", trade: "", reason: "", reasonCont: "", reasonDate: "", contract: "", notes: "", user: "" };

function value(row: Record<string, unknown>, key: string) {
  return row[key] == null ? "" : String(row[key]);
}

export function UiReportScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [reasonOptions, setReasonOptions] = useState<LookupOption[]>([]);
  const [reasonDetailOptions, setReasonDetailOptions] = useState<LookupOption[]>([]);
  const [contractOptions, setContractOptions] = useState<LookupOption[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactsError, setContactsError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/reports/ui-requests", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as ReportResponse;
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load unemployment requests.");
        if (!active) return;
        setRows((result.data ?? []).map((row) => ({
          id: value(row, "id"), date: value(row, "Date"), employee: value(row, "Employee"),
          lastDay: value(row, "Last Day of Work"), customer: value(row, "Last Customer"), trade: value(row, "Trade"),
          reason: value(row, "Reason"), reasonCont: value(row, "Reason Cont"), reasonDate: value(row, "Reason Cont Date"),
          contract: value(row, "Contract With"), notes: value(row, "Notes"), user: value(row, "User Name"),
        })));
        setContacts((result.contacts ?? []).map((row) => ({
          id: value(row, "id"), company: value(row, "Company"), first: value(row, "Contact F Name"),
          last: value(row, "Contact L Name"), state: value(row, "State"), email: value(row, "Email"),
          notes: value(row, "Notes"), active: value(row, "Active"),
        })));
        setContactsError(result.contactsError ?? "");
        const mapOptions = (items: Record<string, unknown>[] | undefined) => (items ?? []).map(row => ({ id: value(row, "id"), label: value(row, "label") })).filter(option => option.label);
        setReasonOptions(mapOptions(result.dropdowns?.reasons));
        setReasonDetailOptions(mapOptions(result.dropdowns?.reasonDetails));
        setContractOptions(mapOptions(result.dropdowns?.contracts));
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load unemployment requests."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const current = rows[selected] ?? emptyRequest;

  return <section className="ac-ui-report">
    <div className="ac-ui-grid-wrap"><table className="ac-ui-grid"><thead><tr><th/><th>Date</th><th>Employee</th><th>Last Day of Work</th><th>Last Customer</th><th>Trade</th><th>Reason</th><th>Reason Cont</th><th>Reason Cont Date</th><th>Contract With</th><th>Notes</th><th>User Name</th><th>Select</th><th/></tr></thead><tbody>
      {rows.map((row, i) => <tr key={row.id} className={i === selected ? "is-current" : undefined} onClick={() => setSelected(i)}><td/><td>{row.date}</td><td>{row.employee}</td><td>{row.lastDay}</td><td>{row.customer}</td><td>{row.trade}</td><td>{row.reason}</td><td>{row.reasonCont}</td><td>{row.reasonDate}</td><td>{row.contract}</td><td>{row.notes}</td><td>{row.user}</td><td/><td/></tr>)}
    </tbody></table>{loading && <p role="status">Loading all unemployment requests…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && rows.length === 0 && <p>No unemployment requests found.</p>}</div>
    <header className="ac-ui-title"><h1>Unemployment Requests</h1><div><AccessButton>New</AccessButton><AccessButton>Save</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><AccessButton>Delete</AccessButton><AccessButton>View Email</AccessButton></div><button type="button" aria-label="Help">?</button></header>
    <div className="ac-ui-editor"><strong>Enter/Edit Request</strong><AccessButton className="ac-ui-work">Employee Work History</AccessButton><div className="ac-ui-fields">{(["date","employee","lastDay","customer","trade","reason","reasonCont","reasonDate","contract","notes","user"] as (keyof RequestRow)[]).map((key,i)=>{const label=["Date","Employee","Last Day of Work","Last Customer","Trade","Reason","Reason Cont","Reason Cont Date","Contract With","Notes","User Name"][i];const options=key==="reason"?reasonOptions:key==="reasonCont"?reasonDetailOptions:key==="contract"?contractOptions:null;return <label key={key}><span>{label}</span>{options?<select value={current[key]} onChange={event=>setRows(old=>old.map((row,index)=>index===selected?{...row,[key]:event.target.value,...(key==="reason"?{reasonCont:""}:{})}:row))}><option value="">Select {label.toLowerCase()}…</option>{options.map(option=><option key={option.id} value={option.label}>{option.label}</option>)}</select>:<input value={current[key]} readOnly/>}</label>})}</div></div>
    <div className="ac-ui-contacts"><strong>Select One Contact</strong><AccessButton>Edit Contact List</AccessButton><table><thead><tr><th/><th>Company</th><th>Contact F Name</th><th>Contact L Name</th><th>State</th><th>Email</th><th>Notes</th><th>Active</th><th>Select</th></tr></thead><tbody>{contacts.map((contact,i)=><tr key={contact.id} className={i===0?"is-current":undefined}><td/><td>{contact.company}</td><td>{contact.first}</td><td>{contact.last}</td><td>{contact.state}</td><td>{contact.email}</td><td>{contact.notes}</td><td>{contact.active}</td><td/></tr>)}</tbody></table>{contactsError && <p role="alert">Contact list: {contactsError}</p>}<div className="ac-ui-contact-record">Records: {contacts.length}　　▽ No Filter　 <span>Search</span></div></div>
    <footer className="ac-ui-record">Record:　|◀　◀　 <input value={rows.length ? selected + 1 : 0} readOnly aria-label="Record number"/> of {rows.length}　▶　▶|　　▽ No Filter　 <span>Search</span></footer>
  </section>;
}
