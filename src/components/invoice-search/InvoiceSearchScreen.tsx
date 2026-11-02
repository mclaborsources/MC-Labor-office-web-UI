"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { OperationalReportRow } from "@/lib/operationalReports";

const COLUMNS = [
  ["Customer","Name",228], ["Week Ending","Week Ending Date",141],
  ["Invoice","Invoice",73], ["Total","Total",99], ["Salesman","Salesman",98],
  ["Margin","Margin",71], ["Invoice Note","Invoice Note",138],
  ["Sender","Sender",72], ["Invoice Sent Timestamp","Invoice Sent Timestamp",176],
] as const;

export function InvoiceSearchScreen({ rows, error = "" }: { rows: OperationalReportRow[]; error?: string }) {
  const router=useRouter();
  const [customer,setCustomer]=useState(""),[week,setWeek]=useState(""),[search,setSearch]=useState("");
  const [selected,setSelected]=useState<string[]>([]);
  const [printAddress,setPrintAddress]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    try {const saved=JSON.parse(localStorage.getItem("invoice-search-view")??"null");if(saved){setCustomer(typeof saved.customer==="string"?saved.customer:"");setWeek(typeof saved.week==="string"?saved.week:"");setSearch(typeof saved.search==="string"?saved.search:"");}}catch{/* Use defaults. */}
  },[]);  const customers=useMemo(()=>[...new Set(rows.map(row=>String(row.Customer ?? "")))].filter(Boolean).sort(),[rows]);
  const visible=useMemo(()=>rows.filter(row=>(!customer||String(row.Customer ?? "")===customer)&&(!week||String(row["Week Ending"]??"").includes(week))&&(!search||String(row.Customer??"").toLowerCase().includes(search.toLowerCase()))),[rows,customer,week,search]);
  const exportView=()=>{
    const quote=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;
    const csv=[COLUMNS.map(([,label])=>quote(label)).join(","),...visible.map(row=>COLUMNS.map(([key])=>quote(row[key])).join(","))].join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download="invoice-search.csv";link.click();URL.revokeObjectURL(url);
  };
  return <section className="ac-invoice-search">
    <header className="ac-invoice-header">
      <h1>Invoice Search</h1>
      <div className="ac-invoice-view"><label htmlFor="invoice-view">View:</label><select id="invoice-view"><option>01 Default Invoice</option></select>
        <AccessButton data-action-status="complete" onClick={()=>{try{localStorage.setItem("invoice-search-view",JSON.stringify({customer,week,search}));setMessage("View saved in this browser.");}catch{setMessage("Could not save this view.");}}}>Save View</AccessButton>
        <AccessButton data-action-status="complete" onClick={()=>{try{localStorage.removeItem("invoice-search-view");setMessage("Saved view deleted.");}catch{setMessage("Could not delete this view.");}}}>Delete View</AccessButton>
        <AccessButton data-action-status="complete" onClick={()=>router.refresh()}>Refresh</AccessButton>
        <AccessButton data-action-status="complete" onClick={exportView}>Export View</AccessButton>
      </div>
      <div className="ac-invoice-close"><AccessButton data-action-status="linked" onClick={()=>router.push("/tracking")}>Cancel</AccessButton></div>
    </header>
    <div className="ac-invoice-controls">
      <div className="ac-invoice-filters">
        <label>Customer<select value={customer} onChange={event=>setCustomer(event.target.value)}><option value="" />{customers.map(name=><option key={name}>{name}</option>)}</select></label>
        <label>Week Ending<input value={week} onChange={event=>setWeek(event.target.value)} /></label>
        <label>Search in Name<input value={search} onChange={event=>setSearch(event.target.value)} /></label>
      </div>
      <div className="ac-invoice-actions">
        <div><AccessButton data-action-status="complete" onClick={()=>window.print()}>Print Invoices</AccessButton><label>Print Address <input type="checkbox" checked={printAddress} onChange={event=>setPrintAddress(event.target.checked)} /></label></div>
        <AccessButton data-action-status="complete" onClick={()=>window.print()}>Save Invoices to Single PDF</AccessButton>
        <AccessButton data-action-status="missing" disabled title="Invoice Payments Search is not connected.">Invoice Payments Search</AccessButton>
      </div>
    </div>
    {error&&<p role="alert" className="report-data-error">{error}</p>}
    {message&&<p role="status" className="ac-invoice-view-message">{message}</p>}
    <div className="ac-invoice-selectbar"><span>Select:</span><AccessButton data-action-status="complete" onClick={()=>setSelected([])}>Clear</AccessButton><AccessButton data-action-status="complete" onClick={()=>setSelected(visible.map(row=>String(row.id)))}>All</AccessButton></div>
    <div className="ac-invoice-grid-wrap"><table className="ac-invoice-grid">
      <colgroup><col style={{width:18}}/><col style={{width:68}}/>{COLUMNS.map(([key,,width])=><col key={key} style={{width}}/>)}</colgroup>
      <thead><tr><th aria-label="Row selector"/><th>Select<span className="ac-invoice-header-arrow">▾</span></th>{COLUMNS.map(([key,label])=><th key={key}>{label}<span className="ac-invoice-header-arrow">▾</span></th>)}</tr></thead>
      <tbody>{visible.map(row=><tr key={String(row.id)}><td/><td><input type="checkbox" aria-label={`Select invoice ${row.Invoice}`} checked={selected.includes(String(row.id))} onChange={event=>setSelected(current=>event.target.checked?[...current,String(row.id)]:current.filter(id=>id!==String(row.id)))} /></td>{COLUMNS.map(([key])=><td key={key}>{String(row[key]??"")}</td>)}</tr>)}
        {Array.from({length:Math.max(0,40-visible.length)},(_,index)=><tr key={`blank-${index}`} aria-hidden="true">{Array.from({length:11},(_,column)=><td key={column}/>)}</tr>)}
      </tbody></table></div>
    <footer className="ac-invoice-recordbar">{visible.length} invoice records</footer>
  </section>;
}