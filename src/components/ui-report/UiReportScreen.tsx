"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import { EmployeeWorkHistoryDialog } from "@/components/ui-report/EmployeeWorkHistoryDialog";

type RequestRow = {
  id: string; employeeId: string; date: string; employee: string; lastDay: string; customer: string; trade: string;
  reason: string; reasonCont: string; reasonDate: string; contract: string; notes: string; user: string;
};
type ContactRow = { id: string; company: string; first: string; last: string; street: string; city: string; state: string; stateId: string; zip: string; phone: string; fax: string; email: string; sort: string; notes: string; active: string };
type LookupOption = { id: string; label: string };
type ReportResponse = { ok: boolean; data?: Record<string, unknown>[]; contacts?: Record<string, unknown>[]; contactsError?: string; dropdowns?: { reasons?: Record<string, unknown>[]; reasonDetails?: Record<string, unknown>[]; contracts?: Record<string, unknown>[] }; states?: Record<string, unknown>[]; statesError?: string; faxSupported?: boolean; error?: string };
const emptyRequest: RequestRow = { id: "", employeeId: "", date: "", employee: "", lastDay: "", customer: "", trade: "", reason: "", reasonCont: "", reasonDate: "", contract: "", notes: "", user: "" };
const gridColumns: { label: string; key: keyof RequestRow }[] = [
  { label: "Date", key: "date" }, { label: "Employee", key: "employee" }, { label: "Last Day of Work", key: "lastDay" },
  { label: "Last Customer", key: "customer" }, { label: "Trade", key: "trade" }, { label: "Reason", key: "reason" },
  { label: "Reason Cont", key: "reasonCont" }, { label: "Reason Cont Date", key: "reasonDate" }, { label: "Contract With", key: "contract" },
  { label: "Notes", key: "notes" }, { label: "User Name", key: "user" },
];
const blankValue = "__ACCESS_BLANK__";

function AccessColumnFilter({ label, options, applied, onApply, onSort, onClear, open, onToggle, onClose }: {
  label: string; options: string[]; applied: string[] | undefined;
  onApply: (values: string[] | undefined) => void; onSort: (descending: boolean) => void; onClear: () => void;
  open: boolean; onToggle: () => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const choices = [blankValue, ...options.filter(value => value !== "")];
  const visibleChoices = choices.filter(value => value === blankValue || value.toLowerCase().includes(search.toLowerCase()));
  const allChecked = draft.length === choices.length;
  const isDate = label.toLowerCase().includes("date") || label === "Date";
  return <div className="ac-ui-filter">
    <button type="button" aria-label={`Filter ${label}`} title={`Filter ${label}`} aria-expanded={open} className={applied ? "is-filtered" : ""} onClick={() => { setDraft(applied ?? [...choices]); setSearch(""); onToggle(); }}>▾</button>
    {open && <div className="ac-ui-filter-menu" role="dialog" aria-label={`${label} filter`}>
      <button type="button" className="ac-ui-filter-command" onClick={() => { onSort(false); onClose(); }}>↧　Sort {isDate ? "Oldest to Newest" : "A to Z"}</button>
      <button type="button" className="ac-ui-filter-command" onClick={() => { onSort(true); onClose(); }}>↥　Sort {isDate ? "Newest to Oldest" : "Z to A"}</button>
      <button type="button" className="ac-ui-filter-command ac-ui-clear-filter" disabled={!applied} onClick={() => { onClear(); setDraft([...choices]); onClose(); }}>◇　Clear filter from {label}</button>
      <div className="ac-ui-filter-type">{isDate ? "Date Filters" : "Text Filters"}<span>›</span></div>
      <div className="ac-ui-filter-list">
        <label><input type="checkbox" checked={allChecked} onChange={event => setDraft(event.target.checked ? [...choices] : [])}/>(Select All)</label>
        <label><input type="checkbox" checked={draft.includes(blankValue)} onChange={event => setDraft(old => event.target.checked ? [...old, blankValue] : old.filter(value => value !== blankValue))}/>(Blanks)</label>
        <input className="ac-ui-filter-search" aria-label={`Search ${label} values`} placeholder="Search values" value={search} onChange={event => setSearch(event.target.value)}/>
        {visibleChoices.filter(value => value !== blankValue).map(value => <label key={value}><input type="checkbox" checked={draft.includes(value)} onChange={event => setDraft(old => event.target.checked ? [...old, value] : old.filter(item => item !== value))}/>{value}</label>)}
      </div>
      <div className="ac-ui-filter-actions"><button type="button" onClick={() => { onApply(draft.length === choices.length ? undefined : draft); onClose(); }}>OK</button><button type="button" onClick={() => { setDraft(applied ?? [...choices]); onClose(); }}>Cancel</button></div>
    </div>}
  </div>;
}

function value(row: Record<string, unknown>, key: string) {
  return row[key] == null ? "" : String(row[key]);
}

function dateInputValue(raw: string) {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}` : raw;
}
function dateDisplayValue(raw: string) {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : raw;
}

function mapRequestRow(row: Record<string, unknown>): RequestRow {
  return {
    id: value(row, "id"), employeeId: value(row, "EmployeeID"), date: dateInputValue(value(row, "Date")), employee: value(row, "Employee"),
    lastDay: dateInputValue(value(row, "Last Day of Work")), customer: value(row, "Last Customer"), trade: value(row, "Trade"),
    reason: value(row, "Reason"), reasonCont: value(row, "Reason Cont"), reasonDate: dateInputValue(value(row, "Reason Cont Date")),
    contract: value(row, "Contract With"), notes: value(row, "Notes"), user: value(row, "User Name"),
  };
}

function UnemploymentContactEditor({ contacts, states, faxSupported, onClose, onSaved }: { contacts: ContactRow[]; states: LookupOption[]; faxSupported:boolean; onClose: () => void; onSaved: (rows: ContactRow[]) => void }) {
  const [draft, setDraft] = useState<ContactRow[]>(contacts.map(row=>({...row})));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const change = (index: number, key: keyof ContactRow, next: string) => { setMessage(""); setDraft(old=>old.map((row,i)=>i===index?{...row,[key]:next,...(key==="stateId"?{state:states.find(option=>option.id===next)?.label??""}:{})}:row)); };
  const blank: ContactRow = { id:"",company:"",first:"",last:"",street:"",city:"",state:"",stateId:"",zip:"",phone:"",fax:"",email:"",sort:"0",notes:"",active:"Active" };
  const save = useCallback(async () => {
    if (saving) return false;
    const pending = draft.filter(row => {
      const original = contacts.find(item => item.id === row.id);
      if (row.id && original) return JSON.stringify(row) !== JSON.stringify(original);
      return !row.id && Boolean(row.company || row.first || row.last || row.street || row.city || row.stateId || row.zip || row.phone || row.fax || row.email || row.notes);
    });
    if (!pending.length) return true;
    setSaving(true);setMessage("");
    try {
      for (const row of pending) {
        const response=await fetch("/api/reports/ui-requests/contacts",{method:row.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:row.id,company:row.company,first:row.first,last:row.last,street:row.street,city:row.city,stateId:row.stateId,zip:row.zip,phone:row.phone,fax:row.fax,email:row.email,sort:row.sort,notes:row.notes,active:row.active==="Active"})});
        const result=await response.json() as {ok:boolean;error?:string};
        if(!response.ok||!result.ok) throw new Error(result.error||"Unable to save contact.");
      }
      const response=await fetch("/api/reports/ui-requests/contacts",{cache:"no-store"});
      const result=await response.json() as {ok:boolean;contacts?:Record<string,unknown>[];error?:string};
      if(!response.ok||!result.ok) throw new Error(result.error||"Saved, but unable to refresh contacts.");
      const savedContacts=(result.contacts??[]).map(row=>({id:value(row,"id"),company:value(row,"Company"),first:value(row,"Contact F Name"),last:value(row,"Contact L Name"),street:value(row,"Street"),city:value(row,"City"),state:value(row,"State"),stateId:value(row,"StateID"),zip:value(row,"Zip"),phone:value(row,"Phone"),fax:value(row,"Fax"),email:value(row,"Email"),sort:value(row,"Sort"),notes:value(row,"Notes"),active:value(row,"Active")}));
      onSaved(savedContacts);
      setDraft([...savedContacts,...draft.filter(row=>!row.id&&!pending.includes(row))]);
      setMessage("Saved");
      return true;
    } catch(error) { setMessage(error instanceof Error?error.message:"Unable to save contacts."); return false; }
    finally { setSaving(false); }
  },[contacts,draft,onSaved,saving]);
  useEffect(()=>{
    if(saving||message) return;
    const timer=window.setTimeout(()=>{ void save(); },650);
    return ()=>window.clearTimeout(timer);
  },[draft,save,saving,message]);
  const undo = () => { setMessage(""); setDraft(contacts.map(row=>({...row}))); };
  const close = async () => { if(await save()) onClose(); };
  const fields: {label:string;key:keyof ContactRow}[]=[{label:"ID",key:"id"},{label:"Company",key:"company"},{label:"Contact FName",key:"first"},{label:"Contact LName",key:"last"},{label:"Street",key:"street"},{label:"City",key:"city"},{label:"State",key:"stateId"},{label:"Zip",key:"zip"},{label:"Phone",key:"phone"},{label:"Fax",key:"fax"},{label:"Email",key:"email"},{label:"Sort",key:"sort"},{label:"Notes",key:"notes"},{label:"Active",key:"active"}];
  return <div className="ui-contact-editor-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!saving)void close();}}><section className="ui-contact-editor" role="dialog" aria-modal="true" aria-label="Unemployment Request Contacts"><header><h1>Unemployment Request Contacts</h1><button type="button" aria-label="Close" disabled={saving} onClick={()=>void close()}>×</button></header><div className="ui-contact-editor-tools"><button type="button" disabled={saving} onClick={()=>setDraft(old=>[...old,{...blank}])}>New</button><button type="button" disabled={saving} onClick={undo}>Undo</button><button type="button" disabled={saving} onClick={()=>void close()}>Close</button>{saving&&<span role="status">Saving…</span>}{message&&<span role={message==="Saved"?"status":"alert"}>{message}</span>}{!faxSupported&&<span>Fax is not available in the SQL contact table.</span>}</div><div className="ui-contact-editor-grid"><table><thead><tr><th/>{fields.map(field=><th key={field.key}>{field.label}<b>▾</b></th>)}</tr></thead><tbody>{draft.map((row,index)=><tr key={row.id||`new-${index}`}><td>{index+1}</td>{fields.map(field=><td key={field.key}>{field.key==="stateId"?<select aria-label="State" disabled={saving} value={row.stateId} onChange={event=>change(index,"stateId",event.target.value)}><option value="">—</option>{states.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select>:field.key==="active"?<input type="checkbox" disabled={saving} checked={row.active==="Active"} onChange={event=>change(index,"active",event.target.checked?"Active":"Inactive")}/>:<input aria-label={field.label} disabled={saving} value={row[field.key]} readOnly={(field.key==="id"&&Boolean(row.id))||(field.key==="fax"&&!faxSupported)} onChange={event=>change(index,field.key,event.target.value)}/>}</td>)}</tr>)}</tbody></table></div><footer>Records: {draft.length}</footer></section></div>;
}

export function UiReportScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactStates, setContactStates] = useState<LookupOption[]>([]);
  const [faxSupported, setFaxSupported] = useState(false);
  const [reasonOptions, setReasonOptions] = useState<LookupOption[]>([]);
  const [reasonDetailOptions, setReasonDetailOptions] = useState<LookupOption[]>([]);
  const [contractOptions, setContractOptions] = useState<LookupOption[]>([]);
  const [selected, setSelected] = useState(0);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof RequestRow, string[]>>>({});
  const [sortState, setSortState] = useState<{ key: keyof RequestRow; descending: boolean } | null>(null);
  const [activeFilter, setActiveFilter] = useState<keyof RequestRow | null>(null);
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactsError, setContactsError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contactEditorOpen, setContactEditorOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/reports/ui-requests", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as ReportResponse;
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load unemployment requests.");
        if (!active) return;
        setRows((result.data ?? []).map(mapRequestRow));
        setContacts((result.contacts ?? []).map((row) => ({
          id: value(row, "id"), company: value(row, "Company"), first: value(row, "Contact F Name"),
          last: value(row, "Contact L Name"), street: value(row,"Street"), city:value(row,"City"), state: value(row, "State"), stateId:value(row,"StateID"),
          zip:value(row,"Zip"),phone:value(row,"Phone"),fax:value(row,"Fax"),email: value(row, "Email"),sort:value(row,"Sort"),
          notes: value(row, "Notes"), active: value(row, "Active"),
        })));
        setContactStates((result.states??[]).map(row=>({id:value(row,"id"),label:value(row,"label")})));
        setFaxSupported(result.faxSupported===true);
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

  useEffect(() => {
    if (gridWrapRef.current) gridWrapRef.current.scrollLeft = 0;
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
  const startNewRequest = () => {
    setColumnFilters({}); setSortState(null); setActiveFilter(null);
    setRows(old => [...old, { ...emptyRequest }]);
    setSelected(rows.length);
    setError("");
    requestAnimationFrame(() => { if (gridWrapRef.current) gridWrapRef.current.scrollTop = gridWrapRef.current.scrollHeight; });
  };
  const changeCurrent = (key: keyof RequestRow, next: string) => {
    const rowId = current.id;
    setRows(old => old.map(row => row.id === rowId && (rowId !== "" || row === current)
      ? { ...row, [key]: next, ...(key === "reason" ? { reasonCont: "" } : {}) }
      : row));
  };
  const saveCurrent = async () => {
    if (!current.employee.trim()) { setError("Enter the employee name before saving."); return; }
    setError("");
    try {
      const response = await fetch("/api/reports/ui-requests", {
        method: current.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save unemployment request.");
      const refreshed = await fetch("/api/reports/ui-requests", { cache: "no-store" });
      const report = await refreshed.json() as ReportResponse;
      if (!refreshed.ok || !report.ok) throw new Error(report.error || "Saved, but unable to refresh the request list.");
      const savedId = current.id;
      const nextRows = (report.data ?? []).map(mapRequestRow);
      setRows(nextRows);
      const savedIndex = nextRows.findIndex(row => row.id === savedId && savedId !== "");
      setSelected(savedIndex >= 0 ? savedIndex : 0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save unemployment request."); }
  };

  return <section className="ac-ui-report">
    <div ref={gridWrapRef} className="ac-ui-grid-wrap"><table className="ac-ui-grid"><thead><tr><th/><>{gridColumns.map(({ label, key })=><th key={key} className={columnFilters[key]!==undefined?"has-filter":""}><span>{label}</span><AccessColumnFilter label={label} options={columnOptions(key)} applied={columnFilters[key]} onApply={value=>setFilter(key,value)} onSort={descending=>setSortState({key,descending})} onClear={()=>setFilter(key,undefined)} open={activeFilter===key} onToggle={()=>setActiveFilter(active=>active===key?null:key)} onClose={()=>setActiveFilter(null)}/></th>)}</><th>Select</th><th/></tr></thead><tbody>
      {filteredRows.map((row, i) => <tr key={row.id || `draft-${i}`} className={i === selected ? "is-current" : undefined} onClick={() => setSelected(i)}><td/>{gridColumns.map(({key})=><td key={key}>{key === "date" || key === "lastDay" || key === "reasonDate" ? dateDisplayValue(row[key]) : row[key]}</td>)}<td/><td/></tr>)}
    </tbody></table>{loading && <p role="status">Loading all unemployment requests…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && rows.length === 0 && <p>No unemployment requests found.</p>}</div>
    <header className="ac-ui-title"><h1>Unemployment Requests</h1><div><AccessButton className="ac-ui-work" onClick={()=>setHistoryOpen(true)}>Employee Work History</AccessButton><AccessButton onClick={startNewRequest}>New</AccessButton><AccessButton onClick={saveCurrent}>Save</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><AccessButton>Delete</AccessButton><AccessButton>View Email</AccessButton></div><button type="button" aria-label="Help">?</button></header>
    <div className="ac-ui-editor"><strong>Enter/Edit Request</strong><div className="ac-ui-fields">{(["date","employee","lastDay","customer","trade","reason","reasonCont","reasonDate","contract","notes","user"] as (keyof RequestRow)[]).map((key,i)=>{const label=["Date","Employee","Last Day of Work","Last Customer","Trade","Reason","Reason Cont","Reason Cont Date","Contract With","Notes","User Name"][i];const options=key==="reason"?reasonOptions:key==="reasonCont"?reasonDetailOptions:key==="contract"?contractOptions:null;return <label key={key}><span>{label}</span>{options?<select value={current[key]} onChange={event=>changeCurrent(key,event.target.value)}><option value="">Select {label.toLowerCase()}…</option>{options.map(option=><option key={option.id} value={option.label}>{option.label}</option>)}</select>:<input type={key==="date"||key==="lastDay"||key==="reasonDate"?"date":"text"} value={current[key]} readOnly={key==="user"} onChange={event=>changeCurrent(key,event.target.value)} placeholder={key==="employee"||key==="customer"||key==="trade"?`Enter ${label.toLowerCase()}`:undefined}/>}</label>})}</div>{error&&<p role="alert">{error}</p>}</div>
    <div className="ac-ui-contacts"><strong>Select One Contact</strong><AccessButton onClick={()=>setContactEditorOpen(true)}>Edit Contact List</AccessButton><table><thead><tr><th/><th>Company</th><th>Contact F Name</th><th>Contact L Name</th><th>State</th><th>Email</th><th>Notes</th><th>Active</th><th>Select</th></tr></thead><tbody>{contacts.map((contact,i)=><tr key={contact.id} className={i===0?"is-current":undefined}><td/><td>{contact.company}</td><td>{contact.first}</td><td>{contact.last}</td><td>{contact.state}</td><td>{contact.email}</td><td>{contact.notes}</td><td>{contact.active}</td><td/></tr>)}</tbody></table>{contactsError && <p role="alert">Contact list: {contactsError}</p>}<div className="ac-ui-contact-record">Records: {contacts.length}　　▽ No Filter　 <span>Search</span></div></div>
    <footer className="ac-ui-record">Record:　|◀　◀　 <input value={filteredRows.length ? selected + 1 : 0} readOnly aria-label="Record number"/> of {filteredRows.length}　▶　▶|　　{Object.values(columnFilters).some(Boolean)?"▽ Filtered":"▽ No Filter"}　 <button type="button" onClick={()=>{setColumnFilters({});setSelected(0);}}>Clear Filters</button></footer>
    {historyOpen && (current.employeeId ? <EmployeeWorkHistoryDialog employeeId={current.employeeId} employeeName={current.employee} onClose={()=>setHistoryOpen(false)}/> : <div className="ui-work-history-backdrop"><section className="ui-work-history" role="dialog" aria-modal="true"><p role="alert">This request does not have a linked employee record.</p><AccessButton onClick={()=>setHistoryOpen(false)}>Close</AccessButton></section></div>)}
    {contactEditorOpen&&<UnemploymentContactEditor contacts={contacts} states={contactStates} faxSupported={faxSupported} onClose={()=>setContactEditorOpen(false)} onSaved={setContacts}/>}
  </section>;
}
