"use client";

import { useId, useState, type ReactNode } from "react";
import type { ReportCustomer } from "@/lib/reportCustomers";
import { arCell } from "@/lib/accountsReceivableColumns";

export const AR_TABS = ["View, Search, Sort, Filter", "Email Customers", "Email Salesmen", "Email Customers Step 2", "Email Salesmen Step 2", "Utilities"] as const;
type Tab = typeof AR_TABS[number];
export interface ArSalesman { id: string; name: string; email: string }

function RadioGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const name = useId();
  return <fieldset className="ar-mail-radio-group"><legend>{label}</legend>{options.map(option => <label key={option}><input type="radio" name={name} checked={value === option} onChange={() => onChange(option)} />{option}</label>)}</fieldset>;
}

export function AccountsReceivableTabs({ children, customers, salesmen = [], includeTerminated, onIncludeTerminatedChange }: {
  children: ReactNode; customers: ReportCustomer[]; salesmen?: ArSalesman[];
  includeTerminated: boolean; onIncludeTerminatedChange: (value: boolean) => void;
}) {
  const id = useId();
  const [tab, setTab] = useState<Tab>(AR_TABS[0]);
  const [mode, setMode] = useState("Freehand");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedSalesmen, setSelectedSalesmen] = useState<string[]>([]);
  const [includes, setIncludes] = useState<string[]>([]);
  const [overdue, setOverdue] = useState("All");
  const [state, setState] = useState("All");
  const [jobState, setJobState] = useState("All");
  const [tenure, setTenure] = useState("All");
  const [preview, setPreview] = useState<"content" | "emails" | null>(null);
  const [message, setMessage] = useState("");
  const salesmanTab = tab === "Email Salesmen" || tab === "Email Salesmen Step 2";
  const step2 = tab.endsWith("Step 2");
  const recipients = mode === "Freehand" && email.trim() ? email.split(/[;,\s]+/).filter(Boolean)
    : salesmanTab ? salesmen.filter(person => selectedSalesmen.includes(person.id)).map(person => person.email).filter(Boolean)
    : [...new Set(customers.filter(customer => state === "All" || customer.state === state).map(customer => customer.email).filter(Boolean))];
  const states = ["All", "MA", "NH", "ME", "VT", "RI", "CT", "NY"];
  const changeTab = (next: Tab) => { setTab(next); setMessage(""); setPreview(null); };
  const emailButtons = <div className="ar-mail-buttons"><button type="button" data-action-status="complete" onClick={() => setPreview("emails")}>View Emails</button><button type="button" data-action-status="partial" onClick={() => setMessage("Email delivery is not connected yet. You can review content and recipients here.")}>Send Emails</button></div>;

  return <>
    <div className="ar-tabs ar-real-tabs" role="tablist" aria-label="Accounts receivable tools">
      {AR_TABS.map((name, index) => <button type="button" key={name} id={`${id}-tab-${index}`} role="tab" data-action-status="complete" aria-selected={tab === name} aria-controls={`${id}-panel`} tabIndex={tab === name ? 0 : -1} onClick={() => changeTab(name)} onKeyDown={event => {
        const next = event.key === "ArrowRight" ? (index + 1) % AR_TABS.length : event.key === "ArrowLeft" ? (index + AR_TABS.length - 1) % AR_TABS.length : event.key === "Home" ? 0 : event.key === "End" ? AR_TABS.length - 1 : null;
        if (next !== null) { event.preventDefault(); changeTab(AR_TABS[next]); document.getElementById(`${id}-tab-${next}`)?.focus(); }
      }}>{name}</button>)}
    </div>
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${AR_TABS.indexOf(tab)}`} className={`ar-tab-panel ${tab === AR_TABS[0] ? "ar-tab-panel-default" : ""}`}>
      {tab === AR_TABS[0] ? children : tab === "Utilities" ? <div className="ar-utilities-panel"><RadioGroup label="Include Terminated?" options={["No", "Yes"]} value={includeTerminated ? "Yes" : "No"} onChange={value => onIncludeTerminatedChange(value === "Yes")} /><span>Changing this value updates the report.</span></div> : <div className={`ar-mail-panel ${step2 ? "ar-mail-step2" : ""}`}>
        <div className="ar-mail-side-label">{salesmanTab ? "SALESMEN" : "CUSTOMER"}</div>
        <div className="ar-mail-compose">
          <RadioGroup label="Email:" options={["Freehand", "Select from List"]} value={mode} onChange={setMode} />
          {mode === "Freehand" ? <textarea aria-label="Email addresses" value={email} onChange={event => setEmail(event.target.value)} /> : <select aria-label={salesmanTab ? "Salesman email" : "Customer email"} value="" onChange={event => { if (event.target.value) { setEmail(previous => [previous, event.target.value].filter(Boolean).join("; ")); setMode("Freehand"); } }}><option value="">Select an email address</option>{(salesmanTab ? salesmen.map(person => ({ id: person.id, name: person.name, email: person.email })) : customers.map(customer => ({ id: customer.id, name: customer.customer, email: customer.email }))).filter(person => person.email).map(person => <option key={person.id} value={person.email}>{person.name} — {person.email}</option>)}</select>}
          {salesmanTab && <label className="ar-mail-subject">Subject:<input value={subject} onChange={event => setSubject(event.target.value)} /></label>}
        </div>
        {salesmanTab && !step2 && <>
          <div className="ar-salesman-picker"><table><thead><tr><th>Salesman</th><th>Select</th></tr></thead><tbody>{salesmen.map(person => <tr key={person.id}><td>{person.name}</td><td><input type="checkbox" aria-label={`Select ${person.name}`} checked={selectedSalesmen.includes(person.id)} onChange={event => setSelectedSalesmen(previous => event.target.checked ? [...previous, person.id] : previous.filter(value => value !== person.id))} /></td></tr>)}</tbody></table><small>{salesmen.length} salesmen</small></div>
          <div className="ar-salesman-selection"><span>Salesmen</span><button type="button" data-action-status="complete" onClick={() => setSelectedSalesmen(salesmen.map(person => person.id))}>Select All</button><button type="button" data-action-status="complete" onClick={() => setSelectedSalesmen([])}>Clear All</button></div>
          <fieldset className="ar-mail-includes"><legend>Include in the Email</legend><div>{["Statements", "Notes", "Invoices", "Jobs"].map(item => <label key={item}><input type="checkbox" checked={includes.includes(item)} onChange={event => setIncludes(previous => event.target.checked ? [...previous, item] : previous.filter(value => value !== item))} />{item}</label>)}</div>{emailButtons}</fieldset>
        </>}
        {!salesmanTab && <div className="ar-mail-content"><span>{step2 ? "Overdue Invoices" : "Accounts Receivable Report"}</span><button type="button" data-action-status="complete" onClick={() => setPreview("content")}>View Content</button>{emailButtons}</div>}
        {step2 && <div className="ar-mail-step2-filters"><RadioGroup label="# Overdue Invoices:" options={["All", "Overdue", "1", "2", "3", ">3"]} value={overdue} onChange={setOverdue} />{!salesmanTab && <><RadioGroup label="State:" options={states} value={state} onChange={setState} /><RadioGroup label="Job State:" options={states} value={jobState} onChange={setJobState} /></>}</div>}
        {step2 && !salesmanTab && <div className="ar-mail-tenure"><RadioGroup label="Been Customer for:" options={["All", "1 Week", "2 Weeks", "3 Weeks", "1 Month", "2 Months", "3 Months", "4 Months", "5 Months", "6 Months", ">6 Months"]} value={tenure} onChange={setTenure} /></div>}
        {step2 && salesmanTab && <div className="ar-mail-step2-buttons">{emailButtons}</div>}
      </div>}
      {message && <p className="ar-mail-status" role="status">{message}</p>}
    </div>
    {preview && <div className="ar-mail-preview-backdrop" onClick={() => setPreview(null)}><section role="dialog" aria-modal="true" aria-labelledby={`${id}-preview-title`} className="ar-mail-preview" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === "Escape") setPreview(null); }}><h2 id={`${id}-preview-title`}>{preview === "content" ? "Accounts Receivable Report" : "Email Preview"}</h2>{preview === "emails" ? <><p>{subject || (step2 ? "Overdue Invoices" : "Accounts Receivable Report")}</p><p><strong>Recipients:</strong> {recipients.join("; ") || "No email recipients selected."}</p>{includes.length > 0 && <p>Include: {includes.join(", ")}</p>}<p>Email delivery is not connected.</p></> : <><p>{customers.length} customers in the current report.</p><table className="ar-preview-table"><thead><tr><th>Customer</th><th>Total Owed</th><th>Over 30</th></tr></thead><tbody>{customers.map(customer=><tr key={customer.id}><td>{customer.customer}</td><td>{arCell(customer,{label:"Total Owed",key:"totalOwed",money:true})}</td><td>{arCell(customer,{label:"Over 30",key:"over30",money:true})}</td></tr>)}</tbody></table></>}<button type="button" data-action-status="complete" autoFocus onClick={() => setPreview(null)}>Close</button></section></div>}
  </>;
}
