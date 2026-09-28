"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AllContactRow } from "@/types/allContacts";

type Filters = { search: string; name: string; cell: string; email: string; includeCompanies: boolean; includeEmployees: boolean; includeNoCommunication: boolean };
const DEFAULTS: Filters = { search: "", name: "", cell: "", email: "", includeCompanies: true, includeEmployees: true, includeNoCommunication: false };
const VIEWS = ["Default", "View 02", "View 03", "View 04", "View 05"];

export function AllContactsSearchScreen({ rows, error, initialFilters = DEFAULTS }: { rows: AllContactRow[]; error: string; initialFilters?: Filters }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [view, setView] = useState("View 01");
  const [sort, setSort] = useState<{ key: keyof AllContactRow; desc: boolean }>({ key: "lastName", desc: false });
  const [message, setMessage] = useState("");
  const sorted = useMemo(() => [...rows].sort((a, b) => String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? "")) * (sort.desc ? -1 : 1)), [rows, sort]);
  function update<K extends keyof Filters>(key: K, value: Filters[K]) { setDraft((old) => ({ ...old, [key]: value })); }
  function apply(next = draft) {
    const q = new URLSearchParams();
    for (const key of ["search", "name", "cell", "email"] as const) if (next[key].trim()) q.set(key, next[key].trim());
    if (!next.includeCompanies) q.set("companies", "0");
    if (!next.includeEmployees) q.set("employees", "0");
    if (next.includeNoCommunication) q.set("noCommunication", "1");
    router.push(`/all-contacts-search${q.size ? `?${q}` : ""}`);
  }
  function clear() { setDraft(DEFAULTS); apply(DEFAULTS); setMessage("Filters cleared."); }
  function saveView() { try { localStorage.setItem(`all-contacts-search-${view}`, JSON.stringify({ filters: draft, sort })); setMessage(`${view} saved on this computer.`); } catch { setMessage("This view could not be saved in this browser."); } }
  function loadView(name: string) {
    setView(name);
    try { const saved = localStorage.getItem(`all-contacts-search-${name}`); if (saved) { const value = JSON.parse(saved); setDraft(value.filters ?? DEFAULTS); setSort(value.sort ?? { key: "lastName", desc: false }); setMessage(`${name} loaded. Select Search to apply its filters.`); } } catch { setMessage("Saved view could not be loaded."); }
  }
  function exportCsv() {
    const columns: [string, (row: AllContactRow) => string][] = [["Profile Type", r => r.profileType], ["Customer / Employee", r => r.customerName || r.employeeName], ["First Name", r => r.firstName], ["Last Name", r => r.lastName], ["Cell #1", r => r.cell1], ["Cell #2", r => r.cell2], ["Cell #3", r => r.cell3], ["Cell #4", r => r.cell4], ["Email Address", r => r.email], ["No Communication", r => r.noCommunication ? "Yes" : ""]];
    const csv = [columns.map(c => c[0]), ...sorted.map(r => columns.map(c => c[1](r)))].map(line => line.map(v => `"${v.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "all-contacts.csv"; a.click(); URL.revokeObjectURL(a.href);
  }
  async function copyContacts() {
    const text = sorted.map(r => [r.firstName, r.lastName, r.customerName || r.employeeName, r.cell1, r.email].filter(Boolean).join("\t")).join("\n");
    try { await navigator.clipboard.writeText(text); setMessage(`${sorted.length} contact(s) copied.`); } catch { setMessage("Clipboard access was blocked by the browser."); }
  }
  const columns: [keyof AllContactRow, string][] = [["profileType", "Profile Type"], ["customerName", "Customer / Employee"], ["firstName", "First Name"], ["lastName", "Last Name"], ["cell1", "Cell #1"], ["cell2", "Cell #2"], ["cell3", "Cell #3"], ["cell4", "Cell #4"], ["email", "Email Address"], ["noCommunication", "No Communication"]];
  const rowsPerPage = 100;
  const input = (label: string, key: "name" | "cell" | "email") => <label className="acs-filter"><span>{label}:</span><input value={draft[key]} onChange={e => update(key, e.target.value)} onKeyDown={e => { if (e.key === "Enter") apply(); }} /></label>;
  return <section className="acs-screen">
    <header className="acs-header"><h1>All Contacts Search</h1><div className="acs-view-label">View: <select value={view} onChange={e => loadView(e.target.value)}>{["View 01", ...VIEWS.slice(1)].map(v => <option key={v}>{v}</option>)}</select></div><button onClick={saveView}>Save View</button><button onClick={() => { localStorage.removeItem(`all-contacts-search-${view}`); setMessage(`${view} deleted.`); }}>Delete View</button><button onClick={clear}>Zero</button><button onClick={exportCsv}>Export View</button><button className="acs-cancel" onClick={() => router.push("/tracking")}>Cancel</button></header>
    <div className="acs-search-area"><div className="acs-search-title">SEARCH</div>{input("Name", "name")}{input("Cell #", "cell")}{input("Email", "email")}<button className="acs-search-button" onClick={() => apply()}>Search</button><fieldset><legend>Use Button</legend><label><input type="radio" name="use-button" checked={true} readOnly /> Yes</label><label><input type="radio" name="use-button" checked={false} readOnly /> No</label></fieldset><button className="acs-copy" onClick={copyContacts}>Copy Contacts</button></div>
    <nav className="acs-presets">{VIEWS.map(v => <button key={v} onClick={() => loadView(v)}>{v}</button>)}</nav>
    <div className="acs-includes"><strong>INCLUDE:</strong><label><input type="checkbox" checked={draft.includeCompanies} onChange={e => update("includeCompanies", e.target.checked)} /> Companies</label><label><input type="checkbox" checked={draft.includeCompanies} onChange={e => update("includeCompanies", e.target.checked)} /> Company Contacts</label><label><input type="checkbox" checked={draft.includeEmployees} onChange={e => update("includeEmployees", e.target.checked)} /> Employees</label><label><input type="checkbox" checked={draft.includeEmployees} onChange={e => update("includeEmployees", e.target.checked)} /> Employee Contacts</label><button onClick={() => { update("includeCompanies", true); update("includeEmployees", true); }}>All</button><button onClick={() => router.refresh()}>Refresh</button><button className="acs-clear" onClick={clear}>Clear Filters</button></div>
    {error && <p className="acs-error" role="alert">{error}</p>}{message && <p className="acs-message" role="status">{message}</p>}
    <div className="acs-grid-wrap"><table className="acs-grid"><thead><tr>{columns.map(([key, label]) => <th key={key}><button onClick={() => setSort(s => ({ key, desc: s.key === key ? !s.desc : false }))}>{label} <span>{sort.key === key ? sort.desc ? "▼" : "▲" : "⌄"}</span></button></th>)}</tr></thead><tbody>{sorted.slice(0, rowsPerPage).map(row => <tr key={row.id}>{columns.map(([key]) => <td key={key}>{key === "noCommunication" ? row.noCommunication ? "Yes" : "" : String(row[key] ?? "")}</td>)}</tr>)}{Array.from({ length: Math.max(0, 18 - Math.min(sorted.length, rowsPerPage)) }, (_, i) => <tr className="acs-empty-row" key={`empty-${i}`}>{columns.map(([key]) => <td key={key}/>)}</tr>)}</tbody></table></div>
    <footer className="acs-recordbar">Record: <button disabled>◀</button> <input aria-label="Current record" readOnly value={sorted.length ? "1" : "0"} /> of {sorted.length} <button disabled>▶</button> <span>▽ Filtered</span><input aria-label="Search displayed contacts" placeholder="Search" value={draft.search} onChange={e => update("search", e.target.value)} onKeyDown={e => { if (e.key === "Enter") apply(); }} /></footer>
  </section>;
}
