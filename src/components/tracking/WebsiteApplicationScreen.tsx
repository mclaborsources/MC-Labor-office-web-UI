"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { value: string; label: string };
export function WebsiteApplicationScreen() {
  const router = useRouter();

  const [raw, setRaw] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({ "Employee Status": "Web App" });
  const [reference, setReference] = useState<Record<string, Option[]>>({});
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/employees/new-employee-reference").then(r => r.json()).then(data => { if (data.ok) setReference(data); else setMessage("Employee lookup values could not be loaded."); }).catch(() => setMessage("Employee lookup values could not be loaded.")); }, []);
  useEffect(() => { try { const saved = localStorage.getItem(`website-application-${new URLSearchParams(window.location.search).get("source") ?? "mls"}`); if (saved) { const draft = JSON.parse(saved); setRaw(draft.raw ?? ""); setFields(draft.fields ?? { "Employee Status": "Web App" }); } } catch { setMessage("The saved draft could not be loaded."); } }, []);
  function field(label: string, options?: Option[] | string[], disabled = false) {
    return <label className={`wa-field wa-field-${label.toLowerCase().replaceAll(" ", "-")}`} key={label}><span>{label}</span>{options ? <select aria-label={label} value={fields[label] ?? ""} onChange={e => setFields(v => ({ ...v, [label]: e.target.value }))}><option value="" />{options.map(o => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <input aria-label={label} disabled={disabled} value={fields[label] ?? ""} onChange={e => setFields(v => ({ ...v, [label]: e.target.value }))} />}</label>;
  }
  function convert() {
    const converted: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) { const match = line.match(/^([^:]+):\s*(.*)$/); if (match) converted[match[1].trim()] = match[2].trim(); }
    const aliases: Record<string, string> = { "First Name": "First", "Last Name": "Last", "Middle Initial": "MI", "Cell Phone": "Mobile Phone" };
    for (const [key, value] of Object.entries(converted)) converted[aliases[key] ?? key] = value;
    setFields(v => ({ ...v, ...converted }));
    setMessage(Object.keys(converted).length ? "Application data converted. Review the fields before saving." : "Paste application data with one Label: Value per line.");
  }
  return <section className="website-application"><header><h1>Website Application</h1><div><button onClick={() => { localStorage.setItem(`website-application-${new URLSearchParams(window.location.search).get("source") ?? "mls"}`, JSON.stringify({ raw, fields })); setMessage("Application draft saved on this computer."); }}>Save</button><button onClick={() => router.push("/tracking")}>Close</button></div></header><div className="wa-body"><aside><div className="wa-data-heading"><strong>Website Application Data (Copy Email)</strong><button onClick={() => { setRaw(""); setFields({ "Employee Status": "Web App" }); setMessage(""); }}>Clear</button><button onClick={async () => { try { setRaw(await navigator.clipboard.readText()); } catch { setMessage("Paste the email directly into the application data box."); } }}>Paste</button></div><div className="wa-paste-grid"><div>Website Application Data <span>⌄</span></div><textarea aria-label="Website Application Data" value={raw} onChange={e => setRaw(e.target.value)} /><footer>Record: ⏮ ◀ <span>1 of 1</span> ▶ ⏭ <i>▽ No Filter</i><input aria-label="Search application data" placeholder="Search" /></footer></div></aside><button className="wa-convert" onClick={convert}>Convert<br />→</button><main><h2>Empl Name, Grade, Status</h2><div className="wa-name"><div>{field("First")}{field("Last")}{field("MI")}</div><div>{field("Grade", reference.grades ?? [])}{field("Employee Status", ["Web App", "Office Interview"])}</div></div><h2>Empl Info</h2><div className="wa-info"><div>{field("How Referred", reference.referrals ?? [])}{field("Street")}{field("City, State")}{field("Zip")}</div><div>{field("Home Phone")}{field("Mobile Phone")}{field("Smart Phone", ["Yes", "No"])}{field("Carrier", ["AT&T", "Verizon", "T-Mobile", "Other"])}{field("Text Msg Addr", undefined, true)}{field("Email")}</div><div>{field("Trade", reference.trades ?? [])}{field("Qualification", reference.qualifications ?? [])}</div></div><h2>Emergency Contact</h2><div className="wa-emergency"><div>{field("Name", undefined, true)}{field("Phone")}{field("Relationship", undefined, true)}</div><div>{field("First ")}{field("Title", ["Mr.", "Mrs.", "Ms.", "Dr."])}</div><div>{field("Last ")}</div></div><h2>W-4</h2><div className="wa-tax">{["Single", "Married", "Married but Withhold Higher Single Rate"].map(label => <label key={label}>{label}<input type="radio" name="filing-status" aria-label={label} /></label>)}{field("Amount to Claim")}{field("Are you exempt from Federal Taxes", ["Yes", "No"])}</div><h2>I-9</h2><label className="wa-citizen">US Citizen<input type="checkbox" /></label><h2>OSHA</h2>{field("OSHA 10 Status", ["Yes", "No", "Pending"])}{message && <p role="status">{message}</p>}</main></div></section>;
}
