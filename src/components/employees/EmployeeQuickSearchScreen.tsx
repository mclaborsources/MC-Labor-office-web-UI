"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EmployeeSummary } from "@/types/employee";
import { trackingCsv } from "@/lib/trackingGrid";
const views = Array.from({ length: 8 }, (_, i) => `View ${String(i+1).padStart(2,"0")}`);
const columns = ["", "Payroll Co On Site", "Employee Status", "First Name", "MI", "Last Name", "Cell #", "City", "St", "Grade", "Pay", "Lic-State", "Week Ending", "Customer Assignment", "Profile Type"];
type Payroll = Record<string,string|number|boolean|null>;
type Result = {data:EmployeeSummary[];total:number;offset:number;pageSize:number};
type SearchSnapshot = { rows: EmployeeSummary[]; total: number; offset: number; name: string; cell: string; search: string; view: string; selectedId: string; payrollSearch: string; scrollTop: number; expires: number };
const searchSnapshots = new Map<string, SearchSnapshot>();
const payrollCache = new Map<string, { rows: Payroll[]; expires: number }>();

export function EmployeeQuickSearchScreen({employees,total:initialTotal,loadError,cacheScope}:{employees:EmployeeSummary[];total:number;loadError?:string;cacheScope:string}) {
 const router=useRouter();
 const [restored]=useState(()=>{const saved=searchSnapshots.get(cacheScope);return saved&&saved.expires>Date.now()?saved:undefined;});
 const [rows,setRows]=useState(restored?.rows??employees),[total,setTotal]=useState(restored?.total??initialTotal),[offset,setOffset]=useState(restored?.offset??0);
 const [name,setName]=useState(restored?.name??""),[cell,setCell]=useState(restored?.cell??""),[search,setSearch]=useState(restored?.search??""),[view,setView]=useState(restored?.view??views[0]);
 const [selectedId,setSelectedId]=useState(restored?.selectedId??employees[0]?.employeeId??""),[payroll,setPayroll]=useState<Payroll[]>([]),[payrollSearch,setPayrollSearch]=useState(restored?.payrollSearch??"");
 const [loading,setLoading]=useState(false),[detailLoading,setDetailLoading]=useState(false),[exporting,setExporting]=useState(false),[error,setError]=useState(loadError??"");
 const requestId=useRef(0),first=useRef(true),grid=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(restored)return;try{const saved=JSON.parse(localStorage.getItem("employee-quick-search-View 01")??"{}");setName(saved.name??"");setCell(saved.cell??"");setSearch(saved.search??"");}catch{/* Ignore invalid saved view settings. */}},[restored]);
 const selected=rows.find(r=>r.employeeId===selectedId)??rows[0], index=selected?rows.indexOf(selected):-1;
 const selectedEmployeeId=selected?.employeeId;
 const [detailVersion,setDetailVersion]=useState(0);
 const snapshotRef=useRef<SearchSnapshot|null>(null);
 const [dataExpires,setDataExpires]=useState(restored?.expires??Date.now()+120000);
 const [loadedFilters,setLoadedFilters]=useState(JSON.stringify([restored?.name??"",restored?.cell??"",restored?.search??""]));
 useEffect(()=>{if(!loading&&loadedFilters===JSON.stringify([name,cell,search]))snapshotRef.current={rows,total,offset,name,cell,search,view,selectedId,payrollSearch,scrollTop:0,expires:dataExpires};},[rows,total,offset,name,cell,search,view,selectedId,payrollSearch,loading,loadedFilters,dataExpires]);
 useEffect(()=>{const element=grid.current;if(element&&restored)element.scrollTop=restored.scrollTop;return()=>{if(snapshotRef.current){searchSnapshots.clear();searchSnapshots.set(cacheScope,{...snapshotRef.current,scrollTop:element?.scrollTop??0});}};},[cacheScope,restored]);
 const busy=loading||detailLoading||exporting;
 useEffect(()=>{document.documentElement.classList.toggle("mc-employee-search-busy",busy);return()=>document.documentElement.classList.remove("mc-employee-search-busy");},[busy]);
 async function load(nextOffset=0,signal?:AbortSignal,pickLast=false,refresh=false) {
  const id=++requestId.current;setLoading(true);setError("");
  try{const response=await fetch(`/api/employees/quick-search?${new URLSearchParams({name,cell,search,offset:String(nextOffset),...(refresh?{refresh:"1"}:{})})}`,{cache:"no-store",signal});const result=await response.json();if(!response.ok)throw Error(result.error??"Could not load employees.");if(id!==requestId.current)return;setDataExpires(Date.now()+120000);setLoadedFilters(JSON.stringify([name,cell,search]));setRows(result.data);setTotal(result.total);setOffset(result.offset);setSelectedId((pickLast?result.data[result.data.length-1]:result.data[0])?.employeeId??"");if(grid.current)grid.current.scrollTop=0;}
  catch(cause){if(!signal?.aborted&&id===requestId.current)setError(cause instanceof Error?cause.message:"Could not load employees.");}finally{if(id===requestId.current)setLoading(false);}
 }
 useEffect(()=>{if(first.current){first.current=false;return;}const controller=new AbortController();const timer=setTimeout(()=>void load(0,controller.signal),250);return()=>{clearTimeout(timer);controller.abort();};
 // Search inputs trigger a new database query; pagination explicitly calls load.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[name,cell,search]);
 useEffect(()=>{const controller=new AbortController();if(!selectedEmployeeId){setPayroll([]);setDetailLoading(false);return;}const key=cacheScope+":"+selectedEmployeeId;const saved=payrollCache.get(key);if(saved&&saved.expires>Date.now()){setPayroll(saved.rows);setDetailLoading(false);return;}setDetailLoading(true);setPayroll([]);
 void fetch(`/api/employees/quick-search?employeeId=${selectedEmployeeId}`,{cache:"no-store",signal:controller.signal}).then(async response=>{const result=await response.json();if(!response.ok)throw Error(result.error??"Payroll details unavailable.");if(!controller.signal.aborted){if(payrollCache.size>=50)payrollCache.delete(payrollCache.keys().next().value!);payrollCache.set(key,{rows:result.payroll,expires:Date.now()+120000});setPayroll(result.payroll);}}).catch(cause=>{if(!controller.signal.aborted)setError(cause.message);}).finally(()=>{if(!controller.signal.aborted)setDetailLoading(false);});return()=>controller.abort();},[selectedEmployeeId,cacheScope,detailVersion]);
 const clear=()=>{setName("");setCell("");setSearch("");setPayrollSearch("");};
 function openView(slot:string){setView(slot);try{const saved=JSON.parse(localStorage.getItem(`employee-quick-search-${slot}`)??"{}");setName(saved.name??"");setCell(saved.cell??"");setSearch(saved.search??"");}catch{clear();}}
 function values(row:EmployeeSummary){return ["",row.payrollCompany,row.status,row.firstName,row.middleInitial,row.lastName,row.cellPhone,row.city,row.state,row.grade,row.payRate?`$${row.payRate}`:"",row.accessFields.LicenseState??"",row.weekEnding,row.currentAssignment,row.profileType];}
 async function exportView(){setExporting(true);setError("");try{const all:EmployeeSummary[]=[];for(let start=0;;start+=500){const response=await fetch(`/api/employees/quick-search?${new URLSearchParams({name,cell,search,offset:String(start)})}`,{cache:"no-store"});const result:Result&{error?:string}=await response.json();if(!response.ok)throw Error(result.error??"Export failed.");all.push(...result.data);if(all.length>=result.total||!result.data.length)break;}const url=URL.createObjectURL(new Blob([trackingCsv(columns,all.map(values))],{type:"text/csv;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download="employee-quick-search.csv";anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(cause){setError(cause instanceof Error?cause.message:"Export failed.");}finally{setExporting(false);}}
 function selectRecord(position:number){if(rows[position]){setSelectedId(rows[position].employeeId);document.getElementById(`eqs-${rows[position].employeeId}`)?.scrollIntoView({block:"nearest"});}}
 const payrollRows=payroll.filter(row=>Object.values(row).join(" ").toLowerCase().includes(payrollSearch.toLowerCase()));
 return <section className="eqs-screen" aria-busy={busy}>
 <div className="eqs-top"><h1>Employee Quick Search</h1>
 <div className="eqs-commands"><button onClick={()=>router.push("/employees?new=1")}>New</button><button disabled={loading} onClick={()=>{payrollCache.clear();void load(offset,undefined,false,true).then(()=>setDetailVersion(v=>v+1));}}>{loading?"Loading…":"Refresh"}</button><button onClick={clear}>Zero</button></div>
 <div className="eqs-right-commands"><button onClick={clear}>Clear Filters</button><button disabled={loading} onClick={()=>void load(offset)}>Fill Last Customer</button><span/><button className="eqs-ok" disabled={!selected} onClick={()=>selected&&router.push(`/employees/${selected.employeeId}`)}>OK</button><button onClick={()=>router.push("/tracking")}>Cancel</button></div>
 <div className="eqs-search"><strong>SEARCH</strong><label>Name:<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Cell #:<input value={cell} onChange={e=>setCell(e.target.value)}/></label></div>
 <div className="eqs-presets">{views.map((slot,i)=><button key={slot} className={view===slot?"is-active":undefined} onClick={()=>openView(slot)}>{i===0?"Default":slot}</button>)}</div>
 <div className="eqs-view"><label>View: <select value={view} onChange={e=>openView(e.target.value)}>{views.map(slot=><option key={slot}>{slot}</option>)}</select></label><button onClick={()=>localStorage.setItem(`employee-quick-search-${view}`,JSON.stringify({name,cell,search}))}>Save View</button><button onClick={()=>{localStorage.removeItem(`employee-quick-search-${view}`);clear();}}>Delete View</button><label>Go To: <select value={selected?.employeeId??""} onChange={e=>setSelectedId(e.target.value)}><option value=""/>{rows.map(row=><option key={row.employeeId} value={row.employeeId}>{row.fullName}</option>)}</select></label><button disabled={exporting||!total} onClick={()=>void exportView()}>{exporting?"Exporting all matches…":"Export View"}</button></div>
 <div className="eqs-selected-name">{selected?.fullName??""}</div>
 <div className="eqs-detail" style={{overflow:"auto"}}><table><thead><tr>{["Payroll Company On Site","Default","Job App Date","Job App Status","Last Week Assigned","Customer","PIS","PIS User","PIS Date","PIS Notes"].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{payrollRows.map(row=><tr key={String(row.id)}><td>{String(row.company??"")}</td><td><input type="checkbox" readOnly checked={!!row.isDefault} aria-label="Default payroll company"/></td><td>{String(row.applicationDate??"")}</td><td>{String(row.applicationStatus??"")}</td><td>{String(row.lastWeek??"")}</td><td>{String(row.customer??"")}</td><td><input type="checkbox" readOnly checked={!!row.sent} aria-label="Payroll information sent"/></td><td>{String(row.sentUser??"")}</td><td>{String(row.sentDate??"")}</td><td title={String(row.sentNotes??"")}>{String(row.sentNotes??"")}</td></tr>)}{!payrollRows.length&&<tr><td colSpan={10}>{detailLoading?"Loading payroll details…":"No matching payroll company details."}</td></tr>}</tbody></table><div className="eqs-recordbar">{payrollRows.length} payroll records <input aria-label="Search payroll details" value={payrollSearch} onChange={e=>setPayrollSearch(e.target.value)} placeholder="Search"/></div></div>
 </div>
 {error&&<p role="alert" className="eqs-error">{error}</p>}
 {loading&&<p role="status">Loading matching employee records…</p>}
 <div className="eqs-grid" ref={grid}><table><thead><tr>{columns.map((label,i)=><th key={i}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr id={`eqs-${row.employeeId}`} key={row.employeeId} className={row.employeeId===selected?.employeeId?"is-current":undefined} onClick={()=>setSelectedId(row.employeeId)} onDoubleClick={()=>router.push(`/employees/${row.employeeId}`)}>{values(row).map((value,i)=><td key={i}>{i===1?<Link href={`/employees/${row.employeeId}`}>{value}</Link>:value}</td>)}</tr>)}</tbody></table></div>
 <footer className="eqs-recordbar">Record: <button disabled={loading||offset===0&&index<=0} onClick={()=>offset?void load(0):selectRecord(0)}>|◀</button><button disabled={loading||offset===0&&index<=0} onClick={()=>index>0?selectRecord(index-1):void load(Math.max(0,offset-500),undefined,true)}>◀</button><span>{total?offset+index+1:0} of {total.toLocaleString()}</span><button disabled={loading||offset+index+1>=total} onClick={()=>index<rows.length-1?selectRecord(index+1):void load(offset+500)}>▶</button><button disabled={loading||!total||offset+index+1>=total} onClick={()=>offset<Math.floor((total-1)/500)*500?void load(Math.floor((total-1)/500)*500,undefined,true):selectRecord(rows.length-1)}>▶|</button><em>{name||cell||search?"Filtered":"No Filter"}</em><input aria-label="Search employee records" placeholder="Search all employees" value={search} onChange={e=>setSearch(e.target.value)}/><button disabled={loading||offset===0} onClick={()=>void load(Math.max(0,offset-500))}>Previous 500</button><button disabled={loading||offset+rows.length>=total} onClick={()=>void load(offset+500)}>Next 500</button></footer>
 </section>;
}
