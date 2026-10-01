"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

type RequestRow = {
  id: string; date: string; employee: string; lastDay: string; customer: string; trade: string;
  reason: string; reasonCont: string; reasonDate: string; contract: string; notes: string; user: string;
};
type ContactRow = { id: string; company: string; first: string; last: string; state: string; email: string; notes: string; active: string };
type LookupOption = { id: string; label: string };
type ReportResponse = { ok: boolean; data?: Record<string, unknown>[]; contacts?: Record<string, unknown>[]; contactsError?: string; dropdowns?: { reasons?: Record<string, unknown>[]; reasonDetails?: Record<string, unknown>[]; contracts?: Record<string, unknown>[] }; error?: string };
const emptyRequest: RequestRow = { id: "", date: "", employee: "", lastDay: "", customer: "", trade: "", reason: "", reasonCont: "", reasonDate: "", contract: "", notes: "", user: "" };
const gridColumns: { label: string; key: keyof RequestRow }[] = [
  { label: "Date", key: "date" }, { label: "Employee", key: "employee" }, { label: "Last Day of Work", key: "lastDay" },
  { label: "Last Customer", key: "customer" }, { label: "Trade", key: "trade" }, { label: "Reason", key: "reason" },
  { label: "Reason Cont", key: "reasonCont" }, { label: "Reason Cont Date", key: "reasonDate" }, { label: "Contract With", key: "contract" },
  { label: "Notes", key: "notes" }, { label: "User Name", key: "user" },
];
const blankValue = "__ACCESS_BLANK__";

function AccessColumnFilter({ label, options, applied, onApply, onSort, onClear }: {
  label: string; options: string[]; applied: string[] | undefined;
  onApply: (values: string[] | undefined) => void; onSort: (descending: boolean) => void; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const choices = [blankValue, ...options.filter(value => value !== "")];
  const visibleChoices = choices.filter(value => value === blankValue || value.toLowerCase().includes(search.toLowerCase()));
  const allChecked = draft.length === choices.length;
  const isDate = label.toLowerCase().includes("date") || label === "Date";
  return <div className="ac-ui-filter">
    <button type="button" aria-label={`Filter ${label}`} title={`Filter ${label}`} className={applied ? "is-filtered" : ""} onClick={() => { setDraft(applied ?? [...choices]); setSearch(""); setOpen(value => !value); }}>▾</button>
    {open && <div className="ac-ui-filter-menu" role="dialog" aria-label={`${label} filter`}>
      <button type="button" className="ac-ui-filter-command" onClick={() => { onSort(false); setOpen(false); }}>↧　Sort {isDate ? "Oldest to Newest" : "A to Z"}</button>
      <button type="button" className="ac-ui-filter-command" onClick={() => { onSort(true); setOpen(false); }}>↥　Sort {isDate ? "Newest to Oldest" : "Z to A"}</button>
      <button type="button" className="ac-ui-filter-command ac-ui-clear-filter" disabled={!applied} onClick={() => { onClear(); setDraft([...choices]); setOpen(false); }}>◇　Clear filter from {label}</button>
      <div className="ac-ui-filter-type">{isDate ? "Date Filters" : "Text Filters"}<span>›</span></div>
      <div className="ac-ui-filter-list">
        <label><input type="checkbox" checked={allChecked} onChange={event => setDraft(event.target.checked ? [...choices] : [])}/>(Select All)</label>
        <label><input type="checkbox" checked={draft.includes(blankValue)} onChange={event => setDraft(old => event.target.checked ? [...old, blankValue] : old.filter(value => value !== blankValue))}/>(Blanks)</label>
        <input className="ac-ui-filter-search" aria-label={`Search ${label} values`} placeholder="Search values" value={search} onChange={event => setSearch(event.target.value)}/>
        {visibleChoices.filter(value => value !== blankValue).map(value => <label key={value}><input type="checkbox" checked={draft.includes(value)} onChange={event => setDraft(old => event.target.checked ? [...old, value] : old.filter(item => item !== value))}/>{value}</label>)}
      </div>
      <div className="ac-ui-filter-actions"><button type="button" onClick={() => { onApply(draft.length === choices.length ? undefined : draft); setOpen(false); }}>OK</button><button type="button" onClick={() => { setDraft(applied ?? [...choices]); setOpen(false); }}>Cancel</button></div>
    </div>}
  </div>;
}

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
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof RequestRow, string[]>>>({});
  const [sortState, setSortState] = useState<{ key: keyof RequestRow; descending: boolean } | null>(null);
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

  const filteredRows = useMemo(() => rows.filter(row => gridColumns.every(({ key }) => {
    const filter = columnFilters[key];
    return filter === undefined || filter.includes(row[key] === "" ? blankValue : row[key]);
  })).sort((a, b) => {
    if (!sortState) return 0;
    const result = a[sortState.key].localeCompare(b[sortState.key], undefined, { numeric: true, sensitivity: "base" });
    return sortState.descending ? -result : result;
  }), [rows, columnFilters, sortState]);
  const current = filteredRows[selected] ?? emptyRequest;
  const setFilter = (key: keyof RequestRow, filter: string[] | undefined) => {
    setColumnFilters(old => ({ ...old, [key]: filter }));
    setSelected(0);
  };
  const columnOptions = (key: keyof RequestRow) => Array.from(new Set(rows.map(row => row[key]))).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return <section className="ac-ui-report">
    <div className="ac-ui-grid-wrap"><table className="ac-ui-grid"><thead><tr><th/><>{gridColumns.map(({ label, key })=><th key={key} className={columnFilters[key]!==undefined?"has-filter":""}><span>{label}</span><AccessColumnFilter label={label} options={columnOptions(key)} applied={columnFilters[key]} onApply={value=>setFilter(key,value)} onSort={descending=>setSortState({key,descending})} onClear={()=>setFilter(key,undefined)}/></th>)}</><th>Select</th><th/></tr></thead><tbody>
      {filteredRows.map((row, i) => <tr key={row.id} className={i === selected ? "is-current" : undefined} onClick={() => setSelected(i)}><td/>{gridColumns.map(({key})=><td key={key}>{row[key]}</td>)}<td/><td/></tr>)}
    </tbody></table>{loading && <p role="status">Loading all unemployment requests…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && rows.length === 0 && <p>No unemployment requests found.</p>}</div>
    <header className="ac-ui-title"><h1>Unemployment Requests</h1><div><AccessButton>New</AccessButton><AccessButton>Save</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><AccessButton>Delete</AccessButton><AccessButton>View Email</AccessButton></div><button type="button" aria-label="Help">?</button></header>
    <div className="ac-ui-editor"><strong>Enter/Edit Request</strong><AccessButton className="ac-ui-work">Employee Work History</AccessButton><div className="ac-ui-fields">{(["date","employee","lastDay","customer","trade","reason","reasonCont","reasonDate","contract","notes","user"] as (keyof RequestRow)[]).map((key,i)=>{const label=["Date","Employee","Last Day of Work","Last Customer","Trade","Reason","Reason Cont","Reason Cont Date","Contract With","Notes","User Name"][i];const options=key==="reason"?reasonOptions:key==="reasonCont"?reasonDetailOptions:key==="contract"?contractOptions:null;return <label key={key}><span>{label}</span>{options?<select value={current[key]} onChange={event=>setRows(old=>old.map((row,index)=>index===selected?{...row,[key]:event.target.value,...(key==="reason"?{reasonCont:""}:{})}:row))}><option value="">Select {label.toLowerCase()}…</option>{options.map(option=><option key={option.id} value={option.label}>{option.label}</option>)}</select>:<input value={current[key]} readOnly/>}</label>})}</div></div>
    <div className="ac-ui-contacts"><strong>Select One Contact</strong><AccessButton>Edit Contact List</AccessButton><table><thead><tr><th/><th>Company</th><th>Contact F Name</th><th>Contact L Name</th><th>State</th><th>Email</th><th>Notes</th><th>Active</th><th>Select</th></tr></thead><tbody>{contacts.map((contact,i)=><tr key={contact.id} className={i===0?"is-current":undefined}><td/><td>{contact.company}</td><td>{contact.first}</td><td>{contact.last}</td><td>{contact.state}</td><td>{contact.email}</td><td>{contact.notes}</td><td>{contact.active}</td><td/></tr>)}</tbody></table>{contactsError && <p role="alert">Contact list: {contactsError}</p>}<div className="ac-ui-contact-record">Records: {contacts.length}　　▽ No Filter　 <span>Search</span></div></div>
    <footer className="ac-ui-record">Record:　|◀　◀　 <input value={filteredRows.length ? selected + 1 : 0} readOnly aria-label="Record number"/> of {filteredRows.length}　▶　▶|　　{Object.values(columnFilters).some(Boolean)?"▽ Filtered":"▽ No Filter"}　 <button type="button" onClick={()=>{setColumnFilters({});setSelected(0);}}>Clear Filters</button></footer>
  </section>;
}
