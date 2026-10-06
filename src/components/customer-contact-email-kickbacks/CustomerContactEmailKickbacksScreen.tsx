"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AccessButton } from "@/components/access/AccessButton";

type Match = { id: number; email: string; customer: string; contact: string };
type Row = { key: string; email: string; customer: string; contact: string; status: string; contactId?: number };
type SchemaState = { loading: boolean; canSet: boolean; message: string };
const STORAGE_KEY = "customer-contact-email-kickbacks-v1";
const cleanEmail = (value: unknown) => String(value ?? "").trim();

export function CustomerContactEmailKickbacksScreen({ kind = "customer" }: { kind?: "customer" | "employee" }) {
  const employeeMode = kind === "employee";
  const apiPath = employeeMode ? "/api/admin/employee-contact-email-kickbacks" : "/api/admin/customer-contact-email-kickbacks";
  const title = `${employeeMode ? "Employee" : "Customer"} Contact Email Address Kickbacks`;
  const [rows, setRows] = useState<Row[]>([]);
  const [schema, setSchema] = useState<SchemaState>({ loading: true, canSet: false, message: "Checking database fields…" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const matchedIds = useMemo(() => [...new Set(rows.filter(row => row.status === "Matched" && row.contactId).map(row => row.contactId!))], [rows]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Row[];
        if (Array.isArray(parsed)) setRows(parsed.map(row => ({ ...row, status: row.status || "Not checked" })));
      }
    } catch { /* Ignore invalid browser-saved data. */ }
    void fetch(apiPath, { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Unable to inspect database fields.");
        setSchema({ loading: false, canSet: Boolean(data.canSetKickback), message: data.canSetKickback ? "Database kickback fields are available." : "Database kickback fields were not found; status updates are disabled." });
      }).catch(error => setSchema({ loading: false, canSet: false, message: error instanceof Error ? error.message : "Database schema could not be checked." }));
  }, [apiPath]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); } catch { /* Browser storage may be unavailable. */ }
  }, [rows]);

  function addEmails(emails: string[]) {
    setRows(current => {
      const known = new Set(current.map(row => row.email.toLocaleLowerCase("en-US")));
      const additions = emails.map(cleanEmail).filter(Boolean).filter(email => {
        const key = email.toLocaleLowerCase("en-US");
        if (known.has(key)) return false;
        known.add(key);
        return true;
      }).map(email => ({ key: `${Date.now()}-${Math.random()}`, email, customer: "", contact: "", status: "Not checked" }));
      return [...current, ...additions];
    });
    setNotice("");
  }

  function createTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([["Kickback Email Address"], [""]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Kickbacks");
    XLSX.writeFile(workbook, `${title} Import Template.xlsx`);
  }

  async function readFile(file?: File) {
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("The workbook has no first worksheet.");
      const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
      const headers = (values[0] ?? []).map(value => String(value ?? "").trim().toLocaleLowerCase("en-US"));
      let column = headers.findIndex(header => ["kickback email address", "email address", "email"].includes(header));
      if (column < 0) column = 0;
      const imported = values.slice(1).map(line => line[column]).map(cleanEmail).filter(Boolean);
      if (!imported.length) throw new Error("No email addresses were found under the header row in the first worksheet.");
      addEmails(imported);
      setNotice(`${imported.length} email address${imported.length === 1 ? "" : "es"} loaded.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to read this Excel file."); }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function checkRows() {
    const emails = rows.map(row => row.email.trim()).filter(Boolean);
    if (!emails.length) { setNotice("Add at least one email address first."); return; }
    setBusy(true); setNotice("");
    try {
      const response = await fetch(apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", emails }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not check the email addresses.");
      const byEmail = new Map<string, Match[]>((data.results as { email: string; matches: Match[] }[]).map(item => [item.email.toLocaleLowerCase("en-US"), item.matches]));
      setRows(current => current.map(row => {
        const matches = byEmail.get(row.email.trim().toLocaleLowerCase("en-US")) ?? [];
        if (matches.length === 1) return { ...row, customer: matches[0].customer, contact: matches[0].contact, status: "Matched", contactId: matches[0].id };
        if (matches.length > 1) return { ...row, customer: matches.map(match => match.customer).join("; "), contact: matches.map(match => match.contact).join("; "), status: `${matches.length} matches — resolve manually`, contactId: undefined };
        return { ...row, customer: "", contact: "", status: "No matching customer contact", contactId: undefined };
      }));
      setNotice("Check complete. Only uniquely matched contacts can be updated.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not check the email addresses."); }
    finally { setBusy(false); }
  }

  async function removeAddresses() {
    if (!matchedIds.length) { setNotice("Run Check first; there are no uniquely matched contacts to update."); return; }
    if (!schema.canSet) { setNotice(schema.message); return; }
    setBusy(true); setNotice("");
    try {
      const response = await fetch(apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: employeeMode ? "remove" : "set", contactIds: matchedIds }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not set kickback status.");
      setRows(current => current.map(row => row.status === "Matched" ? { ...row, status: employeeMode ? "Email removed; kickback recorded" : "Kickback set" } : row));
      setNotice(employeeMode ? `Email removed and kickback recorded for ${data.updated} employee contact${data.updated === 1 ? "" : "s"}.` : `Kickback status set for ${data.updated} contact${data.updated === 1 ? "" : "s"}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not set kickback status."); }
    finally { setBusy(false); }
  }

  function reset() { setRows([]); setNotice(""); try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore unavailable storage. */ } }

  return <section className="ac-kickbacks">
    <header className="ac-kickbacks-header"><h1>{title}</h1><div><AccessButton onClick={reset}>Reset</AccessButton><AccessButton onClick={() => window.history.back()}>Close</AccessButton></div></header>
    <div className="ac-kickbacks-steps">
      <div className="ac-kickbacks-step"><span>(1) Create a new import file.</span><AccessButton onClick={createTemplate}>Create</AccessButton></div>
      <div className="ac-kickbacks-step ac-kickbacks-browse"><span>(2) Select an import file.</span><AccessButton onClick={() => fileRef.current?.click()}>Browse</AccessButton><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={event => void readFile(event.target.files?.[0])} /><em>The Excel file must have a header row and the data must be in the first worksheet of the workbook. See the {title} Import Template.xlsx file as an example.</em></div>
      <div className="ac-kickbacks-step ac-kickbacks-edit-title"><span>(3) Edit the data.</span><em>You may manually enter kickback email addresses if you like. Rows are saved in this browser for next time; use Remove to delete an address.</em></div>
    </div>
    <div className="ac-kickbacks-grid-wrap"><table className="legacy-report-grid ac-kickbacks-grid"><thead><tr><th>Kickback Email Address</th><th>{employeeMode ? "Employee" : "Customer"}</th><th>Contact</th><th>{employeeMode ? "Removal Status" : "Status"}</th><th>Remove</th></tr></thead><tbody>
      {rows.map((row, index) => <tr className={index === 0 ? "is-current" : undefined} key={row.key}><td><input aria-label="Kickback Email Address" type="email" value={row.email} onChange={event => setRows(old => old.map(item => item.key === row.key ? { ...item, email: event.target.value, customer: "", contact: "", status: "Not checked", contactId: undefined } : item))} /></td><td>{row.customer}</td><td>{row.contact}</td><td>{row.status}</td><td><button className="ac-kickbacks-remove" onClick={() => setRows(old => old.filter(item => item.key !== row.key))}>Remove</button></td></tr>)}
      <tr className="ac-kickbacks-new"><td><input aria-label="Add kickback email address" type="email" placeholder="Add email address…" onKeyDown={event => { if (event.key === "Enter" && event.currentTarget.value.trim()) { addEmails([event.currentTarget.value]); event.currentTarget.value = ""; } }} onBlur={event => { if (event.currentTarget.value.trim()) { addEmails([event.currentTarget.value]); event.currentTarget.value = ""; } }} /></td><td/><td/><td/><td/></tr>
      {Array.from({ length: Math.max(0, 11 - rows.length) }, (_, index) => <tr key={`blank-${index}`}><td/><td/><td/><td/><td/></tr>)}
    </tbody></table><div className="ac-kickbacks-recordbar">Record: ◀ <input aria-label="Record count" readOnly value={rows.length ? `1 of ${rows.length}` : "1 of 1"} /> ▶　▽ No Filter　 <input aria-label="Search kickback email addresses" placeholder="Search" onChange={event => { const value = event.target.value.toLocaleLowerCase("en-US"); document.querySelectorAll<HTMLTableRowElement>(".ac-kickbacks-grid tbody tr").forEach(row => { row.hidden = Boolean(value) && !row.textContent?.toLocaleLowerCase("en-US").includes(value); }); }} /></div></div>
    <div className="ac-kickbacks-step ac-kickbacks-action"><span>(4) Check the data.</span><AccessButton disabled={busy || rows.length === 0} onClick={() => void checkRows()}>{busy ? "Working…" : "Check"}</AccessButton><em>Match email addresses with {employeeMode ? "employee" : "customer"} contacts. Unmatched or ambiguous addresses are noted in the {employeeMode ? "Removal Status" : "Status"} column; remove unmatched addresses from the list.</em></div>
    <div className="ac-kickbacks-step ac-kickbacks-action"><span>(5) {employeeMode ? "Remove email addresses." : "Set contact Kickback status."}</span><AccessButton disabled={busy || !matchedIds.length || !schema.canSet} title={schema.message} onClick={() => void removeAddresses()}>{employeeMode ? "Remove" : "Set to Kickback"}</AccessButton><em>{employeeMode ? "Remove the email addresses from Employee contacts, create a kickback note, and change the kickback count." : "For each matched customer contact, set Kickback = True and add 1 to Kickback Times."}</em></div>
    <div className={`ac-kickbacks-notice ${notice ? "visible" : ""}`} role="status">{notice || schema.message}</div>
  </section>;
}
