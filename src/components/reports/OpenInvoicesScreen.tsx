"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OpenInvoiceFilterOptions, OpenInvoiceRow } from "@/lib/operationalReports";

const columns=["Customer Name","Customer (dbl-click to edit)","Credit History (dbl-click)","Customer Since","Contract With","Salesman","Collections Note (dbl-click to ADD)","Invoice Date","Invoice Num","Aging","Open Balance","Invoice Note (dbl-click)"];
const BLANK_FILTER="-1";

function money(value:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value||0);}
function csvCell(value:unknown){return `"${String(value??"").replaceAll('"','""')}"`;}

export function OpenInvoicesScreen({initialRows,initialFilters,initialError}:{initialRows:OpenInvoiceRow[];initialFilters:OpenInvoiceFilterOptions;initialError:string}){
  const router=useRouter();
  const [rows,setRows]=useState(initialRows);
  const [filters,setFilters]=useState(initialFilters);
  const [error,setError]=useState(initialError);
  const [message,setMessage]=useState("");
  const [terminated,setTerminated]=useState(false);
  const [contract,setContract]=useState("");
  const [salesman,setSalesman]=useState("");
  const [aging,setAging]=useState("");
  const [lastRefresh,setLastRefresh]=useState("Not recorded");
  const [notesOpen,setNotesOpen]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [savingNote,setSavingNote]=useState(false);

  const visible=useMemo(()=>{
    return rows.filter(row=>
      (terminated||!row.creditHistory.toLowerCase().includes("terminat"))&&
      (!contract||(contract===BLANK_FILTER?row.contractWithId==="999":row.contractWithId===contract))&&(!salesman||row.salesmanFilter===salesman)&&
      (!aging||row.agingFilter===aging)
    );
  },[rows,terminated,contract,salesman,aging]);
  const total=visible.reduce((sum,row)=>sum+Number(row.openBalance||0),0);
  const grouped=useMemo(()=>{
    const output:{customerId:string;customer:string;rows:OpenInvoiceRow[];total:number}[]=[];
    for(const row of visible){
      let group=output.at(-1);
      if(!group||group.customerId!==row.customerId){group={customerId:row.customerId,customer:row.customer,rows:[],total:0};output.push(group);}
      group.rows.push(row);group.total+=Number(row.openBalance||0);
    }
    return output;
  },[visible]);
  const gridRecordCount=visible.length+grouped.length*2;

  async function refresh(notesOnly=false){
    setRefreshing(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/reports/open-invoices",{method:notesOnly?"POST":"GET",cache:"no-store"});
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||"Refresh failed.");
      setRows(result.rows as OpenInvoiceRow[]);
      if(result.filters)setFilters(result.filters as OpenInvoiceFilterOptions);
      setLastRefresh(new Date(result.refreshedAt).toLocaleString("en-US"));
      setMessage(notesOnly?"Customer notes refreshed from the active customer-note records.":"Open invoice data reloaded from the office database.");
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Unable to refresh open invoices.");}
    finally{setRefreshing(false);}
  }
  function exportRows(){
    const body=[columns.join(","),...visible.map(r=>[r.customer,r.customer,r.creditHistory,r.customerSince,r.contractWith,r.salesman,r.collectionsNote,r.invoiceDate,r.invoiceNumber,r.age,money(Number(r.openBalance)),r.invoiceNote].map(csvCell).join(","))].join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF",body],{type:"text/csv;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download="seamus-open-invoices.csv";link.click();URL.revokeObjectURL(url);
  }
  function clearFilters(){setContract("");setSalesman("");setAging("");setTerminated(false);}
  async function editNote(row:OpenInvoiceRow,field:"collectionsNote"|"invoiceNote"){
    const isCollection=field==="collectionsNote";
    const value=window.prompt(isCollection?"Add a collections note":"Edit invoice note",isCollection?"":row.invoiceNote);
    if(value===null||(isCollection&&!value.trim()))return;
    setSavingNote(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/reports/open-invoices",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:row.id,customerId:row.customerId,field,value:value.trim()})});
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||"Unable to save note.");
      setRows(current=>current.map(item=>isCollection&&item.customerId===row.customerId?{...item,collectionsNote:result.collectionsNote}:item.id===row.id?{...item,invoiceNote:value.trim()}:item));
      setMessage(isCollection?"Collections note added.":"Invoice note saved.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to save note.");}
    finally{setSavingNote(false);}
  }

  return <section className="open-invoices access-report-screen">
    <header className="oi-toolbar">
      <h1>Open Invoices</h1>
      <div className="oi-refresh"><span>Last Web Read:</span><output>{lastRefresh}</output>
        <button data-action-status="complete" className="oi-refresh-button" title="Reloads the office SQL data. The Access QuickBooks ODBC import is not connected to this web app." disabled={refreshing} onClick={()=>void refresh()}>{refreshing?"Refreshing…":"Refresh"}</button>
        <button data-action-status="complete" disabled={refreshing} onClick={()=>void refresh(true)}>Refresh Notes</button>
      </div>
      <div className="oi-filters">
        <div>
          <select aria-label="Contract With" value={contract} onChange={e=>setContract(e.target.value)}><option value="">&lt;Contract With&gt;</option><option value={BLANK_FILTER}>[BLANK]</option>{filters.contracts.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select>
          <select aria-label="Salesman" value={salesman} onChange={e=>setSalesman(e.target.value)}><option value="">&lt;Salesman&gt;</option>{filters.salesmen.map(v=><option key={v}>{v}</option>)}</select>
          <select aria-label="Aging" value={aging} onChange={e=>setAging(e.target.value)}><option value="">&lt;Aging&gt;</option>{filters.aging.map(v=><option key={v}>{v}</option>)}</select>
        </div>
        <fieldset><legend className="sr-only">Include terminated customers</legend><span>Include Terminated?</span>
          <label><input type="radio" name="terminated" checked={!terminated} onChange={()=>setTerminated(false)}/>No</label>
          <label><input type="radio" name="terminated" checked={terminated} onChange={()=>setTerminated(true)}/>Yes</label>
        </fieldset>
      </div>
      <label className="oi-total">Total<output>{money(total)}</output></label>
      <button data-action-status="complete" onClick={()=>window.print()}>Report</button>
      <button data-action-status="complete" onClick={()=>setNotesOpen(true)}>Invoice Notes History</button>
      <button data-action-status="linked" onClick={()=>router.push("/reports")}>Cancel</button>
    </header>
    {(error||message)&&<p role={error?"alert":"status"} className={error?"oi-error":"oi-message"}>{error||message}</p>}
    <div className="oi-actions"><span>{visible.length.toLocaleString()} open invoices · {grouped.length.toLocaleString()} customers</span><button data-action-status="complete" onClick={clearFilters}>Clear Filters</button><button data-action-status="complete" onClick={exportRows} disabled={!visible.length}>Export CSV</button></div>
    <div className="oi-grid" aria-busy={savingNote}><table><colgroup>{[230,250,153,96,112,95,382,105,108,64,113,280].map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup>
      <thead><tr>{columns.map(c=><th key={c}>{c}<span>⌄</span></th>)}</tr></thead>
      <tbody>{grouped.map(group=><Fragment key={group.customerId}>
        <tr className="oi-customer-start oi-customer-header">
          <td>{group.customer}</td>
          <td onDoubleClick={()=>router.push(`/customers/${encodeURIComponent(group.customerId)}`)} title="Double-click to open customer">{group.customer}</td>
          <td onDoubleClick={()=>router.push(`/customers/${encodeURIComponent(group.customerId)}`)} title="Double-click to open customer credit history">{group.rows[0].creditHistory}</td><td>{group.rows[0].customerSince}</td><td/>
          <td>{group.rows[0].salesman}</td><td className="oi-collections-note" title="Double-click to add a collections note" onDoubleClick={()=>void editNote(group.rows[0],"collectionsNote")}>{group.rows[0].collectionsNote}</td>
          <td/><td/><td/><td/><td/>
        </tr>
        {group.rows.map(row=><tr key={row.id}>
          <td/><td/><td/><td/><td className={`oi-contract oi-contract-${row.contractWith.toLowerCase()}`}>{row.contractWith}</td>
          <td/><td/><td>{row.invoiceDate}</td><td>{row.invoiceNumber}</td><td className={row.age>=30?"oi-aging":""}>{row.age}</td>
          <td className="oi-balance">{money(Number(row.openBalance))}</td><td title="Double-click to edit invoice note" onDoubleClick={()=>void editNote(row,"invoiceNote")}>{row.invoiceNote}</td>
        </tr>)}
        <tr className="oi-subtotal"><td colSpan={10}>{group.customer}</td><td>{money(group.total)}</td><td/></tr>
      </Fragment>)}</tbody>
    </table></div>
    <footer className="oi-recordbar">Record: {gridRecordCount?`1-${gridRecordCount} of ${gridRecordCount}`:"0 of 0"}<span>{visible.length===rows.filter(r=>!r.creditHistory.toLowerCase().includes("terminat")).length?"No Filter":"Filtered"}</span></footer>
    {notesOpen&&<div className="oi-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setNotesOpen(false);}}><section className="oi-notes-modal" role="dialog" aria-modal="true" aria-labelledby="oi-notes-title">
      <header><h2 id="oi-notes-title">Invoice Notes History</h2><button data-action-status="complete" onClick={()=>setNotesOpen(false)}>Close</button></header>
      <div className="oi-notes-list">{rows.filter(r=>r.invoiceNote.trim()).map(row=><article key={row.id}><strong>{row.customer} · Invoice {row.invoiceNumber||"—"}</strong><time>{row.invoiceDate}</time><p>{row.invoiceNote}</p></article>)}{!rows.some(r=>r.invoiceNote.trim())&&<p>No invoice notes are recorded.</p>}</div>
    </section></div>}
  </section>;
}
