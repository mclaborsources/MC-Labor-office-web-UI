"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";

type Row = Record<string, unknown>;
type Result = { ok: boolean; rows?: Row[]; columns?: string[]; sourceTable?: string; limited?: boolean; rateMasterFound?: boolean; error?: string };
const viewKey = "wcc-rates-view";
const clean = (value: unknown) => value === null || value === undefined ? "" : String(value);
const field = (columns: string[], terms: string[]) => columns.find(column => terms.includes(column.toLowerCase().replace(/[^a-z0-9]/g, "")));
const choicesFor = (rows: Row[], column?: string) => [...new Set(rows.map(row => column ? clean(row[column]) : "").filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));

export function WccRatesScreen() {
  const router = useRouter();
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("View 01");
  const [contractWith, setContractWith] = useState("");
  const [state, setState] = useState("");
  const [wcc, setWcc] = useState("");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [notes, setNotes] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/reports/wcc-rates?refresh=${refresh}`, { cache: "no-store" });
      const result = await response.json() as Result;
      if (!response.ok || !result.ok) throw new Error(result.error || "WCC data request failed.");
      setAllRows(result.rows ?? []); setColumns(result.columns ?? []); setSource(result.sourceTable ?? "");
      if (result.rateMasterFound === false) setNotice("No WCC rate master table was found. Showing actual WCC/state/payroll company combinations from Tracking.");
      else if (result.limited) setNotice("Showing the first 2,000 WCC rate rows.");
      else setNotice("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load WCC rates."); }
    finally { setLoading(false); }
  }, [refresh]);
  useEffect(() => { void load(); }, [load]);

  const contractField = useMemo(() => field(columns, ["contractwith", "contractwithname", "payrollcompany", "payrollco", "company"]), [columns]);
  const stateField = useMemo(() => field(columns, ["state", "statecode", "statename", "pull down state"]), [columns]);
  const wccField = useMemo(() => field(columns, ["wcc", "wcccode", "wccid", "code"]), [columns]);
  const hiddenField = useMemo(() => field(columns, ["hide", "hidden", "wccishidden", "hidewcc"]), [columns]);
  const contracts = useMemo(() => choicesFor(allRows, contractField), [allRows, contractField]);
  const states = useMemo(() => choicesFor(allRows, stateField), [allRows, stateField]);
  const wccCodes = useMemo(() => choicesFor(allRows, wccField), [allRows, wccField]);
  const rows = useMemo(() => allRows.filter(row => {
    if (contractWith && clean(row[contractField ?? ""]) !== contractWith) return false;
    if (state && clean(row[stateField ?? ""]) !== state) return false;
    if (wcc && clean(row[wccField ?? ""]) !== wcc) return false;
    if (!includeHidden && hiddenField && /^(1|true|yes|y)$/i.test(clean(row[hiddenField]))) return false;
    return true;
  }), [allRows, contractWith, contractField, state, stateField, wcc, wccField, includeHidden, hiddenField]);

  function saveView() {
    localStorage.setItem(`${viewKey}-${view}`, JSON.stringify({ contractWith, state, wcc, includeHidden, notes })); setNotice(`${view} saved on this computer.`);
  }
  function deleteView() {
    localStorage.removeItem(`${viewKey}-${view}`); setView("View 01"); clearFilters(); setNotice("Saved view deleted.");
  }
  function loadView(name: string) {
    setView(name);
    try { const raw = localStorage.getItem(`${viewKey}-${name}`); if (raw) { const saved = JSON.parse(raw) as { contractWith?: string; state?: string; wcc?: string; includeHidden?: boolean; notes?: string }; setContractWith(saved.contractWith ?? ""); setState(saved.state ?? ""); setWcc(saved.wcc ?? ""); setIncludeHidden(saved.includeHidden ?? false); setNotes(saved.notes ?? ""); } }
    catch { setError("Unable to load the saved view."); }
  }
  function clearFilters() { setContractWith(""); setState(""); setWcc(""); setIncludeHidden(false); setSelected(new Set()); }
  function exportRows() {
    const escape = (value: unknown) => `"${clean(value).replaceAll('"','""')}"`;
    const text = [columns.map(escape).join(","), ...rows.map(row => columns.map(column => escape(row[column])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "wcc-rates.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  function setAllSelected(value: boolean) { setSelected(value ? new Set(rows.map((_, index) => index)) : new Set()); }

  return <section className="wcc-rates-screen">
    <header className="wcc-rates-header"><h1>Wcc Rates</h1><label>View: <select value={view} onChange={event => loadView(event.target.value)}>{Array.from({length:8},(_,index)=><option key={index}>{index===0?"View 01":`View ${String(index+1).padStart(2,"0")}`}</option>)}</select></label><AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={deleteView}>Delete View</AccessButton><AccessButton onClick={exportRows} disabled={!rows.length}>Export View</AccessButton><AccessButton onClick={() => setRefresh(value => value + 1)} disabled={loading}>{loading?"Loading…":"Refresh"}</AccessButton><div className="wcc-rates-notes"><label>Notes: <input value={notes} onChange={event => setNotes(event.target.value)}/></label><AccessButton onClick={() => setNotice("Open File is not connected to a WCC rate document yet.")}>Open File</AccessButton><AccessButton onClick={() => setNotice("Select File is not connected to a WCC rate document yet.")}>Select File</AccessButton></div><AccessButton onClick={() => router.push("/tracking")}>Close</AccessButton></header>
    <div className="wcc-rates-toolbar"><fieldset><legend>FILTER</legend><label>Contract With <select value={contractWith} onChange={event=>setContractWith(event.target.value)}><option value=""/>{contracts.map(value=><option key={value}>{value}</option>)}</select></label><label>State <select value={state} onChange={event=>setState(event.target.value)}><option value=""/>{states.map(value=><option key={value}>{value}</option>)}</select></label><label>WCC <select value={wcc} onChange={event=>setWcc(event.target.value)}><option value=""/>{wccCodes.map(value=><option key={value}>{value}</option>)}</select></label><span>Incl Hide: <label><input type="radio" checked={!includeHidden} onChange={()=>setIncludeHidden(false)}/> No</label><label><input type="radio" checked={includeHidden} onChange={()=>setIncludeHidden(true)}/> Yes</label></span></fieldset><AccessButton onClick={clearFilters}>Clear Filters</AccessButton><fieldset className="wcc-rates-autofill"><legend>Auto Fill:</legend><span>State Rate <input aria-label="State Rate"/></span><span>Penalty % <input aria-label="Penalty percent"/></span><span>MLS Markup <input aria-label="MLS Markup"/></span><AccessButton onClick={()=>setNotice("Auto Fill edits are unavailable until the WCC rate write fields are verified.")}>Fill</AccessButton><span>SS <input aria-label="SS"/></span><span>Med <input aria-label="Med"/></span><span>State UI <input aria-label="State UI"/></span><span>EMAC <input aria-label="EMAC"/></span><span>Fed UI <input aria-label="Fed UI"/></span><AccessButton onClick={()=>setNotice("No auto-fill changes to clear.")}>Clear</AccessButton></fieldset><AccessButton onClick={()=>setNotice("Delete Rate is unavailable until the WCC rate write schema is confirmed.")}>Delete Rate</AccessButton><div className="wcc-rates-links"><button onClick={()=>setNotice("Web search opens when an individual rate record is selected.")}>RE-SEARCH</button><a href="https://www.google.com/search?q=workers+compensation+rate" target="_blank" rel="noreferrer">Business info on Google</a><a href="https://www.ncci.com/" target="_blank" rel="noreferrer">Google WCRIBMA</a><button onClick={()=>setNotice("Select a rate row to open its related lookup.")}>➜</button></div></div>
    {(error||notice)&&<p className={error?"wcc-rates-error":"wcc-rates-notice"} role={error?"alert":"status"}>{error||notice}</p>}
    <div className="wcc-rates-source">Data source: {source || "SQL Server"}{loading?" · Loading records…":` · ${rows.length} of ${allRows.length} records`}</div>
    <div className="wcc-rates-grid">
      <table>
        <thead><tr><th>Select</th>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => <tr key={`${clean(row[columns[0] ?? ""])}-${index}`} onClick={() => setSelected(old => { const next = new Set(old); if (next.has(index)) next.delete(index); else next.add(index); return next; })} className={selected.has(index) ? "is-selected" : index === 0 ? "is-current" : undefined}>
            <td><input type="checkbox" checked={selected.has(index)} onChange={() => setSelected(old => { const next = new Set(old); if (next.has(index)) next.delete(index); else next.add(index); return next; })} aria-label={`Select WCC row ${index + 1}`} /></td>
            {columns.map(column => <td key={column}>{typeof row[column] === "boolean" ? <input type="checkbox" checked={Boolean(row[column])} readOnly aria-label={`${column} value`} /> : clean(row[column])}</td>)}
          </tr>)}
          {!rows.length && !loading && <tr><td colSpan={columns.length + 1}>No WCC rate records match these filters.</td></tr>}
        </tbody>
      </table>
    </div>
    <footer><span>{rows.length} row{rows.length===1?"":"s"}{notice&&` · ${notice}`}</span><div><AccessButton onClick={()=>setAllSelected(true)}>Select All</AccessButton><AccessButton onClick={()=>setAllSelected(false)}>Clear</AccessButton></div></footer>
  </section>;
}
