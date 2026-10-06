"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AccessButton } from "@/components/access/AccessButton";

type Row = { key: string; kickbackAddress: string; employee: string; contact: string; currentCell: string; correctedCell: string; currentCarrier: string; importCarrier: string; correctedCarrier: string; correctedAddress: string; status: string; contactId?: number };
const STORE = "employee-contact-text-kickbacks-v1";
const blankRow = (kickbackAddress = ""): Row => ({ key: `${Date.now()}-${Math.random()}`, kickbackAddress, employee: "", contact: "", currentCell: "", correctedCell: "", currentCarrier: "", importCarrier: "", correctedCarrier: "", correctedAddress: "", status: "Not checked" });

export function EmployeeContactTextKickbacksScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [canFix, setCanFix] = useState(false);
  const [schemaMessage, setSchemaMessage] = useState("Checking database fields…");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORE); if (saved) { const value = JSON.parse(saved) as Row[]; if (Array.isArray(value)) setRows(value); } } catch { /* Ignore invalid local cache. */ }
    void fetch("/api/admin/employee-contact-text-kickbacks", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to check employee contact fields.");
      setCanFix(Boolean(data.canFix)); setSchemaMessage(data.message || "Database correction fields checked.");
    }).catch(error => setSchemaMessage(error instanceof Error ? error.message : "Unable to check database fields."));
  }, []);
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(rows)); } catch { /* Browser storage may be unavailable. */ } }, [rows]);

  function addAddresses(values: string[]) {
    setRows(current => {
      const seen = new Set(current.map(row => row.kickbackAddress.trim().toLowerCase()));
      const added = values.map(value => String(value ?? "").trim()).filter(Boolean).filter(value => { const key = value.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).map(blankRow);
      return [...current, ...added];
    });
  }
  function createTemplate() {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Kickback Text Msg Address", "Cell - Corrected", "Import Cell Carrier - Corrected", "Carrier - Corrected", "Text Msg Address - Corrected"], ["", "", "", "", ""]]), "Kickbacks");
    XLSX.writeFile(book, "Employee Contact Text Msg Address Kickbacks Import Template.xlsx");
  }
  async function browse(file?: File) {
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("The workbook has no first worksheet.");
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
      const headers = (data[0] ?? []).map(value => String(value ?? "").trim().toLowerCase());
      const aliases: Record<string, keyof Row> = { "kickback text msg address": "kickbackAddress", "text msg address": "kickbackAddress", "text message address": "kickbackAddress", address: "kickbackAddress", "cell - corrected": "correctedCell", "import cell carrier - corrected": "importCarrier", "carrier - corrected": "correctedCarrier", "text msg address - corrected": "correctedAddress" };
      const parsed = data.slice(1).map(values => {
        const row = blankRow();
        headers.forEach((header, index) => { const field = aliases[header]; if (field) row[field] = String(values[index] ?? "").trim() as never; });
        return row;
      }).filter(row => row.kickbackAddress);
      if (!parsed.length) throw new Error("No text message addresses were found under the header row.");
      setRows(current => {
        const existing = new Set(current.map(row => row.kickbackAddress.trim().toLowerCase()));
        return [...current, ...parsed.filter(row => !existing.has(row.kickbackAddress.trim().toLowerCase()))];
      });
      setMessage(`${parsed.length} address${parsed.length === 1 ? "" : "es"} loaded.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to read the Excel file."); }
    if (fileRef.current) fileRef.current.value = "";
  }
  async function check() {
    const addresses = rows.map(row => row.kickbackAddress.trim()).filter(Boolean);
    if (!addresses.length) { setMessage("Add at least one text message address first."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/employee-contact-text-kickbacks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", addresses }) });
      const result = await response.json(); if (!response.ok || !result.ok) throw new Error(result.error || "Could not check text message addresses.");
      const found = new Map<string, { id: number; employee: string; contact: string; currentCell: string; currentCarrier: string }[]>((result.results as { address: string; matches: { id: number; employee: string; contact: string; currentCell: string; currentCarrier: string }[] }[]).map(row => [row.address.toLowerCase(), row.matches]));
      setRows(old => old.map(row => {
        const matches = found.get(row.kickbackAddress.trim().toLowerCase()) ?? [];
        if (matches.length === 1) return { ...row, employee: matches[0].employee, contact: matches[0].contact, currentCell: matches[0].currentCell, currentCarrier: matches[0].currentCarrier, contactId: matches[0].id, status: "Matched" };
        if (matches.length > 1) return { ...row, employee: matches.map(item => item.employee).join("; "), contact: matches.map(item => item.contact).join("; "), status: `${matches.length} matches — review required`, contactId: undefined };
        return { ...row, employee: "", contact: "", status: "No match", contactId: undefined };
      }));
      setMessage("Check complete. Review corrected values before using Remove/Fix.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not check addresses."); }
    finally { setBusy(false); }
  }
  async function removeFix() {
    const selected = rows.filter(row => row.contactId && row.status === "Matched");
    if (!selected.length) { setMessage("Run Check first; no unique employee contacts are matched."); return; }
    if (!canFix) { setMessage(schemaMessage); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/employee-contact-text-kickbacks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove-fix", rows: selected.map(row => ({ contactId: row.contactId, correctedCell: row.correctedCell, importCarrier: row.importCarrier, correctedCarrier: row.correctedCarrier, correctedAddress: row.correctedAddress })) }) });
      const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || "Could not remove or fix the addresses.");
      setRows(old => old.map(row => row.status === "Matched" ? { ...row, status: "Removed / fixed" } : row));
      setMessage(`Removed/fixed ${data.updated} employee contact${data.updated === 1 ? "" : "s"}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not remove or fix addresses."); }
    finally { setBusy(false); }
  }
  function reset() { setRows([]); setMessage(""); try { localStorage.removeItem(STORE); } catch { /* Ignore. */ } }
  const update = (key: string, field: keyof Row, value: string) => setRows(old => old.map(row => row.key === key ? { ...row, [field]: value, ...(field === "kickbackAddress" ? { status: "Not checked", contactId: undefined } : {}) } : row));
  const columns: { key: keyof Row; label: string; edit?: boolean }[] = [
    { key: "kickbackAddress", label: "Kickback Text Msg Address", edit: true }, { key: "employee", label: "Employee" }, { key: "contact", label: "Contact" }, { key: "currentCell", label: "Current Cell" }, { key: "correctedCell", label: "Cell - Corrected", edit: true }, { key: "currentCarrier", label: "Current Carrier" }, { key: "importCarrier", label: "Import Cell Carrier - Corrected", edit: true }, { key: "correctedCarrier", label: "Carrier - Corrected", edit: true }, { key: "correctedAddress", label: "Text Msg Address - Corrected", edit: true }, { key: "status", label: "Removal/Fix Status" },
  ];

  return <div className="ac-text-kickbacks-overlay"><section className="ac-text-kickbacks-modal" role="dialog" aria-modal="true" aria-labelledby="text-kickbacks-title">
    <div className="ac-text-kickbacks-titlebar">Employee Contact Text Msg Address Kickbacks <button aria-label="Close" onClick={() => window.history.back()}>×</button></div>
    <header className="ac-kickbacks-header"><h1 id="text-kickbacks-title">Employee Contact Text Msg Address Kickbacks</h1><div><AccessButton onClick={reset}>Reset</AccessButton><AccessButton onClick={() => window.history.back()}>Close</AccessButton></div></header>
    <div className="ac-text-kickbacks-body">
      <div className="ac-kickbacks-step"><span>(1) Create a new import file.</span><AccessButton onClick={createTemplate}>Create</AccessButton></div>
      <div className="ac-kickbacks-step ac-kickbacks-browse"><span>(2) Select an import file.</span><AccessButton onClick={() => fileRef.current?.click()}>Browse</AccessButton><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={event => void browse(event.target.files?.[0])} /><em>The Excel file must have a header row and data in the first worksheet. See the Employee Contact Text Msg Address Kickbacks import template as an example.</em></div>
      <div className="ac-kickbacks-step ac-kickbacks-edit-title"><span>(3) Edit the data.</span><em>You may manually enter kickback Text Msg Addresses. Rows are saved in this browser; use Remove to delete an address.</em></div>
      <div className="ac-text-kickbacks-grid-wrap"><table className="legacy-report-grid ac-text-kickbacks-grid"><thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}<th>Remove</th></tr></thead><tbody>
        {rows.map((row, index) => <tr key={row.key} className={index === 0 ? "is-current" : undefined}>{columns.map(column => <td key={column.key}>{column.edit ? <input aria-label={column.label} value={String(row[column.key] ?? "")} onChange={event => update(row.key, column.key, event.target.value)} /> : String(row[column.key] ?? "")}</td>)}<td><button className="ac-kickbacks-remove" onClick={() => setRows(old => old.filter(item => item.key !== row.key))}>Remove</button></td></tr>)}
        <tr className="ac-text-kickbacks-new"><td><input aria-label="Add kickback text address" placeholder="Add text address…" onKeyDown={event => { if (event.key === "Enter" && event.currentTarget.value.trim()) { addAddresses([event.currentTarget.value]); event.currentTarget.value = ""; } }} onBlur={event => { if (event.currentTarget.value.trim()) { addAddresses([event.currentTarget.value]); event.currentTarget.value = ""; } }} /></td>{columns.slice(1).map(column => <td key={column.key} />)}<td /></tr>
        {Array.from({ length: Math.max(0, 15 - rows.length) }, (_, index) => <tr key={`empty-${index}`}>{columns.map(column => <td key={column.key} />)}<td /></tr>)}
      </tbody></table><div className="ac-kickbacks-recordbar">Record: ◀ <input readOnly value={rows.length ? `1 of ${rows.length}` : "1 of 1"} aria-label="Record count" /> ▶　▽ No Filter　 Search</div></div>
      <div className="ac-kickbacks-step ac-kickbacks-action"><span>(4) Check the data.</span><AccessButton disabled={busy || !rows.length} onClick={() => void check()}>{busy ? "Working…" : "Check"}</AccessButton><em>Match Text Msg Addresses with Employee contacts. Problems appear in Removal/Fix Status; unmatched addresses can be removed.</em></div>
      <div className="ac-kickbacks-step ac-kickbacks-action"><span>(5) Remove/Fix Text Msg Addresses.</span><AccessButton disabled={busy || !canFix || !rows.some(row => row.status === "Matched")} title={schemaMessage} onClick={() => void removeFix()}>{busy ? "Working…" : "Remove/Fix"}</AccessButton><em>Remove or fix addresses for Employee contacts, create a kickback note, and change the kickback count.</em></div>
      <div className={`ac-kickbacks-notice ${message ? "visible" : ""}`} role="status">{message || schemaMessage}</div>
    </div>
  </section></div>;
}
