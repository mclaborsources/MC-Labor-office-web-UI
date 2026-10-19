"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { NewsletterContactRow, NewsletterTemplate } from "@/lib/adminReportQueries";

type Communication = "all" | "allows" | "none";
type SortKey = "selected" | "source" | "first" | "last" | "email" | "noCommunication";
const headings: {label:string;key:SortKey|null}[] = [{label:"Select",key:"selected"},{label:"Source",key:"source"},{label:"First Name",key:"first"},{label:"Last Name",key:"last"},{label:"Email Address",key:"email"},{label:"No Communication",key:"noCommunication"},{label:"Sent",key:null}];
const views = ["View 01","View 02","View 03","View 04","View 05"];
const storageKey = "mc-newsletter-search-views";
const columnWidths = [18,67,158,107,107,278,147,56];
const gridLines = [18,85,243,350,457,735,882,938,...Array.from({length:16},(_,i)=>1034+i*96)];
const gridBackground = [...gridLines.map(x=>"linear-gradient(to right,transparent "+(x-1)+"px,#ededed "+(x-1)+"px,#ededed "+x+"px,transparent "+x+"px)"),"repeating-linear-gradient(to bottom,transparent 0,transparent 19px,#ededed 19px,#ededed 20px)"].join(",");

export function NewsletterSearchScreen({ rows, templates, error = "", templateError = "" }: { rows: NewsletterContactRow[]; templates: NewsletterTemplate[]; error?: string; templateError?: string }) {
  const router = useRouter();
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [applied,setApplied] = useState({name:"",email:""});
  const [useButton,setUseButton] = useState(true);
  const [communication,setCommunication] = useState<Communication>("all");
  const [selected,setSelected] = useState<Set<string>>(new Set());
  const [activeId,setActiveId] = useState("");
  const [view,setView] = useState("View 01");
  const [newsletter,setNewsletter] = useState("");
  const [sort,setSort] = useState<{key:SortKey;desc:boolean}|null>(null);
  const [message,setMessage] = useState("");
  const [preview,setPreview] = useState(false);
  const filters = useButton ? applied : {name,email};
  const visible = useMemo(() => {
    const result = rows.filter(row => (!filters.name || (row.first+" "+row.last).toLowerCase().includes(filters.name.trim().toLowerCase()))
      && (!filters.email || row.email.toLowerCase().includes(filters.email.trim().toLowerCase()))
      && (communication==="all" || (communication==="none" ? row.noCommunication : !row.noCommunication)));
    if(sort) result.sort((a,b)=>{
      const value = (row:NewsletterContactRow) => sort.key==="selected" ? Number(selected.has(row.id)) : row[sort.key];
      const left=value(a),right=value(b);
      const comparison=typeof left==="boolean"||typeof left==="number"?Number(left)-Number(right):String(left).localeCompare(String(right),undefined,{numeric:true,sensitivity:"base"});
      return sort.desc?-comparison:comparison;
    });
    return result;
  },[rows,filters.name,filters.email,communication,sort,selected]);
  const selectedContacts = rows.filter(row=>selected.has(row.id));
  const chosenTemplate = templates.find(item=>item.id===newsletter);
  const currentId = visible.some(row=>row.id===activeId)?activeId:visible[0]?.id;
  function clear() {setName("");setEmail("");setApplied({name:"",email:""});setCommunication("all");setSort(null);setSelected(new Set());setActiveId("");setNewsletter("");setPreview(false);setMessage("");}
  function toggle(id:string) {setSelected(old=>{const next=new Set(old);if(next.has(id))next.delete(id);else next.add(id);return next});}
  function saveView() {
    try {const saved=JSON.parse(localStorage.getItem(storageKey)||"{}");localStorage.setItem(storageKey,JSON.stringify({...saved,[view]:{name:filters.name,email:filters.email,communication,useButton,sort}}));setMessage(view+" saved.");}
    catch {setMessage("The view could not be saved.");}
  }
  function chooseView(value:string) {
    setView(value);setMessage("");
    try {const saved=JSON.parse(localStorage.getItem(storageKey)||"{}")[value];if(!saved)return;
      const next={name:typeof saved.name==="string"?saved.name:"",email:typeof saved.email==="string"?saved.email:""};
      setName(next.name);setEmail(next.email);setApplied(next);setUseButton(saved.useButton!==false);
      setCommunication(["allows","none"].includes(saved.communication)?saved.communication:"all");
      setSort(saved.sort&&headings.some(h=>h.key===saved.sort.key&&h.key!==null)?{key:saved.sort.key,desc:saved.sort.desc===true}:null);
    }catch{setMessage("The saved view could not be loaded.");}
  }
  function deleteView() {try{const saved=JSON.parse(localStorage.getItem(storageKey)||"{}");delete saved[view];localStorage.setItem(storageKey,JSON.stringify(saved));setMessage(view+" deleted.");}catch{setMessage("The saved view could not be deleted.");}}
  function exportView() {
    const quote=(value:unknown)=>'"'+String(value??"").replaceAll('"','""')+'"';
    const csv=[headings.map(h=>quote(h.label)).join(","),...visible.map(row=>[selected.has(row.id)?"Yes":"No",row.source,row.first,row.last,row.email,row.noCommunication?"Yes":"No",""].map(quote).join(","))].join("\r\n");
    const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download="newsletter-contacts.csv";link.click();URL.revokeObjectURL(url);setMessage("Exported "+visible.length+" contacts.");
  }
  const previewHtml = '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="'+"default-src 'none'; style-src 'unsafe-inline'; img-src data:"+'"><style>body{font:14px Arial,sans-serif;padding:16px;overflow-wrap:anywhere}</style></head><body>'+(chosenTemplate?.body||"No newsletter content was recorded.")+'</body></html>';

  return <section className="ac-newsletter ac-newsletter-access">
    <header className="newsletter-header"><h1>Newsletter Search</h1><div className="newsletter-toolbar"><label>View: <select aria-label="Newsletter view" value={view} onChange={event=>chooseView(event.target.value)}>{views.map(value=><option key={value}>{value}</option>)}</select></label><AccessButton data-action-status="complete" onClick={saveView}>Save View</AccessButton><AccessButton data-action-status="complete" onClick={deleteView}>Delete View</AccessButton><AccessButton data-action-status="complete" onClick={()=>router.refresh()}>Refresh</AccessButton><AccessButton data-action-status="complete" onClick={clear}>Zero</AccessButton><AccessButton data-action-status="complete" onClick={exportView}>Export View</AccessButton></div><aside><AccessButton data-action-status="linked" onClick={()=>router.push("/tracking")}>Cancel</AccessButton><button data-action-status="complete" type="button" className="newsletter-help" aria-label="Help" onClick={()=>setMessage("Use Search to apply name and email filters, or choose Use Button: No to filter as you type. Select contacts with the checkboxes, then choose a newsletter to preview.")}>?</button></aside></header>
    <div className="newsletter-tools">
      <form className="newsletter-search-form" onSubmit={event=>{event.preventDefault();setApplied({name,email})}}><div className="search"><strong>SEARCH</strong><label>Name:<input aria-label="Contact name" value={name} onChange={event=>setName(event.target.value)}/></label><label>Email:<input aria-label="Contact email" value={email} onChange={event=>setEmail(event.target.value)}/></label></div><AccessButton data-action-status="complete" className="newsletter-search-button" type="submit">Search</AccessButton></form>
      <fieldset className="use"><legend>Use<br/>Button</legend><label><input type="radio" name="newsletter-use" checked={useButton} onChange={()=>{setApplied({name,email});setUseButton(true)}}/>Yes</label><label><input type="radio" name="newsletter-use" checked={!useButton} onChange={()=>setUseButton(false)}/>No</label></fieldset>
      <fieldset className="comm"><label><input type="radio" name="newsletter-comm" checked={communication==="all"} onChange={()=>setCommunication("all")}/>All</label><label><input type="radio" name="newsletter-comm" checked={communication==="allows"} onChange={()=>setCommunication("allows")}/>Allows Communication</label><label><input type="radio" name="newsletter-comm" checked={communication==="none"} onChange={()=>setCommunication("none")}/>No Communication</label></fieldset>
      <div className="presets">{views.map((value,index)=><AccessButton data-action-status="complete" key={value} onClick={()=>{if(index===0){clear();setView("View 01")}else chooseView(value)}}>{index===0?"Default":value}</AccessButton>)}</div>
      <AccessButton data-action-status="complete" className="clear" onClick={clear}>Clear Filters</AccessButton>
      <div className="newsletter-send"><label>Select Newsletter:<select aria-label="Select Newsletter" value={newsletter} onChange={event=>setNewsletter(event.target.value)}><option value=""/>{templates.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><AccessButton data-action-status="complete" disabled={!selected.size||!chosenTemplate} onClick={()=>setPreview(true)}>Preview Email</AccessButton><AccessButton data-action-status="missing" disabled title="Newsletter delivery is not connected.">Email Newsletter</AccessButton><em>{selected.size?selected.size+" contacts selected.":"Select one or more contacts first."}</em></div>
      <div className="newsletter-import"><AccessButton data-action-status="missing" disabled title="Contact import is not connected.">Import Contacts</AccessButton><em>Import from Excel file.</em><AccessButton data-action-status="missing" disabled title="Contact deletion is not connected.">Delete Contacts</AccessButton><em>Select one or more contacts first.</em></div>
      <div className="newsletter-select">Select:<AccessButton data-action-status="complete" onClick={()=>setSelected(new Set())}>Clear</AccessButton><AccessButton data-action-status="complete" onClick={()=>setSelected(new Set(visible.map(row=>row.id)))}>All</AccessButton></div>
    </div>
    {error&&<p role="alert" className="report-data-error">{error}</p>}{templateError&&<p role="alert" className="report-data-error">{templateError}</p>}{message&&<p role="status" className="newsletter-message">{message}</p>}
    <div className="newsletter-grid-wrap"><table className="legacy-report-grid newsletter-grid"><colgroup>{columnWidths.map((width,index)=><col key={index} style={{width}}/>)}<col/></colgroup><thead><tr><th aria-label="Record selector"/>{headings.map(heading=><th key={heading.label}>{heading.key?<button data-action-status="complete" onClick={()=>setSort({key:heading.key!,desc:sort?.key===heading.key?!sort.desc:false})}>{heading.label}<span aria-hidden="true">{sort?.key===heading.key?(sort.desc?"▾":"▴"):"▾"}</span></button>:heading.label}</th>)}<th className="newsletter-grid-filler" aria-hidden="true"/></tr></thead><tbody>{visible.map(row=><tr key={row.id} className={row.id===currentId?"is-current":undefined} onClick={()=>setActiveId(row.id)}><td className="newsletter-row-selector"/><td><input type="checkbox" aria-label={"Select contact "+row.id} checked={selected.has(row.id)} onChange={()=>toggle(row.id)}/></td><td>{row.source}</td><td>{row.first}</td><td>{row.last}</td><td>{row.email}</td><td><input type="checkbox" aria-label={"No communication for contact "+row.id} checked={row.noCommunication} readOnly onClick={event=>event.preventDefault()} title="Communication preference is read-only."/></td><td><input type="checkbox" aria-label={"Sent status for contact "+row.id} checked={false} disabled title="Sent status is unavailable." readOnly/></td><td className="newsletter-grid-filler" aria-hidden="true"/></tr>)}{!visible.length&&<tr><td colSpan={9}>{error?"Contact records are unavailable.":"No newsletter contacts match these filters."}</td></tr>}</tbody></table><div className="newsletter-grid-space" aria-hidden="true" style={{backgroundImage:gridBackground}}/></div>
    <footer className="newsletter-record-count">Records: {visible.length} of {rows.length} · Selected: {selected.size}</footer>
    {preview&&chosenTemplate&&<div className="newsletter-preview-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="newsletter-preview-title" className="newsletter-preview"><header><h2 id="newsletter-preview-title">Preview Email — {chosenTemplate.label}</h2><AccessButton data-action-status="complete" onClick={()=>setPreview(false)}>Close</AccessButton></header><p><b>Contacts:</b> {selectedContacts.map(row=>row.email).join("; ")}</p><p><b>Subject:</b> {chosenTemplate.subject}</p><iframe title="Newsletter content preview" sandbox="" srcDoc={previewHtml}/></section></div>}
  </section>;
}
