"use client";
import {ReportPayrollCompanySelect} from "@/components/reports/ReportPayrollCompanySelect";
import {useAccountingReportData,EMPTY_REPORT_ROWS} from "./useAccountingReportData";
import {useState,useEffect,useMemo} from "react";
import {createPortal} from "react-dom";
import {trackingCsv} from "@/lib/trackingGrid";
import {totalPayrollDate} from "@/lib/totalPayrollCriteria";
import {useRouter} from "next/navigation";
import type {AccountingReportOptions} from "@/lib/accountingReportOptions";
import {WccReportCriteria} from "@/components/wcc-payroll/WccReportCriteria";
import {TableRecordBar} from "@/components/tables/TableRecordBar";
import {CustomerNameColumnHeader} from "@/components/customers/CustomerNameColumnHeader";
const columns:[string,number][]=[["First Name",88],["MI",46],["Last Name",87],["State",55],["Regular Hours",108],["OT Hours",106],["Regular Payroll = 40 Hrs",116],["OT Payroll = Hours > 40",109],["Total Reg Payroll",98],["Per Diem",130],["Per Diem",88],["Last WCC",74],["Last WCC Desc",159],["Last Pay Rate",96],["Gross Payroll",94],["Sick",85],["Vacation",75],["Commissions",101]];
const mainAuditOrder=[12,0,1,2,4,6,5,7,14,15,16,17,10,8];
const mainAuditWidths=Object.fromEntries(mainAuditOrder.map((column,i)=>[column,[112,88,46,86,114,114,84,114,114,94,84,110,94,124][i]/0.95]));
const mainAuditHidden=columns.map((_,i)=>i).filter(i=>!mainAuditOrder.includes(i));
export function TotalPayrollReportScreen({options,criteria:initialCriteria,rows:initialRows=EMPTY_REPORT_ROWS, error:initialError="", title="Total Payroll Report Search",storageKey="total-payroll"}:{rows:import("@/lib/accountingPayrollLedger").AccountingPayrollRow[];error?:string;options:AccountingReportOptions;criteria:Record<string,string|undefined>;title?:string;storageKey?:string}){
 const {rows,error,loading:fetching,refetch,criteria}=useAccountingReportData(initialRows,initialError,initialCriteria);
 const router=useRouter();const pending=fetching;const iso=(value:string|undefined,fallback:string)=>totalPayrollDate(value)||totalPayrollDate(fallback);
 const [state,setState]=useState(criteria.state||'');const [company,setCompany]=useState(criteria.payrollCompany||'');const [year,setYear]=useState(criteria.assignYear||'');const [start,setStart]=useState(iso(criteria.startDate,criteria.weekEnding||''));const [end,setEnd]=useState(iso(criteria.endDate,criteria.weekEnding||''));const [view,setView]=useState('View 01');const [activeReportView,setActiveReportView]=useState("");const [name,setName]=useState(criteria.employeeName||'');const [status,setStatus]=useState(criteria.jobAppStatus||'No SUB');const [message,setMessage]=useState('');const [filters,setFilters]=useState<Record<string,string[]>>({});const [sort,setSort]=useState<{key:string;direction:'asc'|'desc'}|null>(null);
 const [addressMode,setAddressMode]=useState(criteria.addressMode||"job");
 const [noEmployeeExclusions,setNoEmployeeExclusions]=useState(criteria.noEmployeeExclusions==="true");
 const [widths,setWidths]=useState<Record<number,number>>(mainAuditWidths);
 const [hidden,setHidden]=useState<number[]>(mainAuditHidden);
 const [order,setOrder]=useState<number[]>(mainAuditOrder);
 const [layoutReady,setLayoutReady]=useState(false);
 const [unhideOpen,setUnhideOpen]=useState(false);
 const [dragColumn,setDragColumn]=useState<number|null>(null);
 const [dropColumn,setDropColumn]=useState<number|null>(null);
 const shown=order.filter(i=>!hidden.includes(i));
 const columnWidth=(i:number)=>widths[i]??columns[i][1];
 const applyLayout=(saved:Record<string,unknown>)=>{
  const savedWidths=saved.widths as Record<string,unknown>|undefined;
  setWidths(Object.fromEntries(Object.entries(savedWidths||{}).filter(([key,value])=>Number(key)>=0&&Number(key)<columns.length&&Number.isFinite(value)&&Number(value)>=48&&Number(value)<=1600).map(([key,value])=>[Number(key),Number(value)])));
  const savedHidden=Array.isArray(saved.hidden)?saved.hidden.filter((i):i is number=>Number.isInteger(i)&&i>=0&&i<columns.length):[];
  setHidden(savedHidden.length<columns.length?savedHidden:[]);
  const savedOrder=Array.isArray(saved.order)?saved.order.filter((i):i is number=>Number.isInteger(i)&&i>=0&&i<columns.length):[];
  setOrder([...new Set([...savedOrder,...columns.map((_,i)=>i)])]);
 };
 useEffect(()=>{setLayoutReady(true);},[storageKey]);
 useEffect(()=>{if(layoutReady)try{localStorage.setItem(storageKey+"-column-layout",JSON.stringify({widths,hidden,order}));}catch{}},[layoutReady,widths,hidden,order,storageKey]);
 useEffect(()=>{
  const collect=(event:Event)=>{(event as CustomEvent).detail[storageKey]={widths,hidden,order,filters,sort};};
  const apply=(event:Event)=>{const saved=(event as CustomEvent).detail?.[storageKey];if(saved){applyLayout(saved);setFilters(saved.filters??{});setSort(saved.sort??null);}else{setWidths(mainAuditWidths);setHidden(mainAuditHidden);setOrder(mainAuditOrder);setFilters({});setSort(null);}};
  window.addEventListener("accounting-view-collect",collect);window.addEventListener("accounting-view-apply",apply);
  return()=>{window.removeEventListener("accounting-view-collect",collect);window.removeEventListener("accounting-view-apply",apply);};
 },[storageKey,widths,hidden,order,filters,sort]);
 const resizeColumn=(i:number,width?:number)=>setWidths(current=>{const next={...current};if(width===undefined)delete next[i];else next[i]=Math.max(48,Math.min(1600,width));return next;});
 const values=(r:typeof rows[number])=>[r.firstName,r.middle,r.lastName,r.jobState||"",r.regularHours,r.otHours,r.regularPay,r.otPay,r.totalRegPay,r.perDiem,r.perDiem,r.wccCode||"",r.wcc,r.billRate??0,r.grossPay,r.sick,r.vacation,r.commissions];
 const visible=useMemo(()=>rows.filter(r=>Object.entries(filters).every(([i,v])=>v.includes(String(values(r)[Number(i)]??"")))).sort((a,b)=>{if(!sort)return 0;const x=values(a)[Number(sort.key)],y=values(b)[Number(sort.key)];const c=typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y));return sort.direction==="asc"?c:-c;}),[rows,filters,sort]);


 const requestParams=()=>new URLSearchParams({...Object.fromEntries(new URLSearchParams(window.location.search)),startDate:start,endDate:end,state,payrollCompany:company,assignYear:year,addressMode,noEmployeeExclusions:String(noEmployeeExclusions),employeeName:name,jobAppStatus:status});
 const refresh=()=>void refetch("/total-payroll-report-search?"+requestParams());
 useEffect(()=>{
  setState(criteria.state||"");setCompany(criteria.payrollCompany||"");setYear(criteria.assignYear||"");
  setStart(totalPayrollDate(criteria.startDate)||totalPayrollDate(criteria.weekEnding));
  setEnd(totalPayrollDate(criteria.endDate)||totalPayrollDate(criteria.weekEnding));
  setName(criteria.employeeName||"");setStatus(criteria.jobAppStatus||"No SUB");
  setAddressMode(criteria.addressMode||"job");setNoEmployeeExclusions(criteria.noEmployeeExclusions==="true");
 },[criteria]);
 useEffect(()=>{
  const changes={startDate:start,endDate:end,state,payrollCompany:company,assignYear:year,addressMode,noEmployeeExclusions:String(noEmployeeExclusions),employeeName:name.trim(),jobAppStatus:status};
  if(Object.entries(changes).every(([key,value])=>value===(criteria[key]||"")))return;
  if(!totalPayrollDate(start)||!totalPayrollDate(end)||start>end)return;
  const timer=setTimeout(()=>void refetch("/total-payroll-report-search?"+new URLSearchParams({...Object.fromEntries(new URLSearchParams(window.location.search)),...changes})),350);
  return ()=>clearTimeout(timer);
 },[start,end,state,company,year,addressMode,noEmployeeExclusions,name,status,criteria,refetch]);
 const clear=()=>{setName("");setState("");setCompany("");setYear("");setStatus("All");setAddressMode("job");setFilters({});setSort(null);setMessage("");};
 const saveView=()=>{try{localStorage.setItem(`${storageKey}-${view}`,JSON.stringify({state,company,year,start,end,name,status,addressMode,noEmployeeExclusions,filters,sort,widths,hidden,order}));setMessage("View saved.");}catch{setMessage("View could not be saved.");}};
 const loadView=(value:string)=>{if(value==="Audit"){setWidths(Object.fromEntries(columns.map(([,width],index)=>[index,width])));setHidden([]);setOrder(columns.map((_,index)=>index));setFilters({});setSort(null);setMessage("");return;}setView(value);try{const saved=JSON.parse(localStorage.getItem(`${storageKey}-${value}`)||"null");if(!saved){return;}
 if(saved.widths||saved.hidden||saved.order)applyLayout(saved);setMessage(""); }catch{setMessage("Saved view could not be read.");}};
 const exportView=()=>{const csv=trackingCsv(shown.map(i=>columns[i][0]),visible.map(r=>shown.map(i=>values(r)[i])));const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=`total-payroll-${start}-to-${end}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const criteriaChanged=Object.entries({startDate:start,endDate:end,state,payrollCompany:company,assignYear:year,addressMode,noEmployeeExclusions:String(noEmployeeExclusions),employeeName:name.trim(),jobAppStatus:status}).some(([key,value])=>value!==(criteria[key]||""));
 const action=(label:string)=>setMessage(`${label} requires an employee work-history view, which is not connected yet.`);

 return <section className="tpj-page uir-page total-payroll-page"><header><h1>{title}</h1><label>View: <select value={view} onChange={e=>loadView(e.target.value)}>{Array.from({length:12},(_,i)=><option key={i}>View {String(i+1).padStart(2,'0')}</option>)}</select></label><button onClick={saveView}>Save View</button><button onClick={()=>{localStorage.removeItem(`${storageKey}-${view}`);setMessage('View deleted.');}}>Delete View</button><button disabled={pending} onClick={refresh}>{pending?"Loading…":"Refresh"}</button><button onClick={clear}>Zero</button><button disabled={pending||criteriaChanged||!visible.length} onClick={exportView}>Export View</button><button onClick={()=>action('Employee Work History')}>Employee Work History</button><ReportPayrollCompanySelect aria-label="Payroll company" value={company} onChange={e=>setCompany(e.target.value)}><option value="">&lt;Payroll Co&gt;</option>{options.companies.map(x=><option key={x}>{x}</option>)}</ReportPayrollCompanySelect><button onClick={()=>setMessage("Total payroll: "+visible.reduce((sum,r)=>sum+r.totalRegPay,0).toLocaleString("en-US",{style:"currency",currency:"USD"}))}>Summary</button><button className="tpj-cancel" onClick={()=>router.push('/accounting-reports')}>Cancel</button><button className="tpj-help" aria-label="Help" onClick={()=>setMessage('Criteria changes fetch payroll from the database. Blank state, company, or year includes all values within the date range.')}>?</button></header>
 <div className="uir-controls"><WccReportCriteria addressMode={addressMode} setAddressMode={setAddressMode} noEmployeeExclusions={noEmployeeExclusions} setNoEmployeeExclusions={setNoEmployeeExclusions} onRefresh={refresh} options={options} state={state} setState={setState} company={company} setCompany={setCompany} year={year} setYear={setYear} start={start} setStart={setStart} end={end} setEnd={setEnd} wcStates={criteria.wcStates||'MA, RI'}/><div className="uir-search"><b>SEARCH</b><label>Employee Name:<input value={name} onChange={e=>setName(e.target.value)}/></label></div><div className="uir-status">Job App Status: {['All','No SUB','SUB'].map(x=><label key={x}>{x}<input type="radio" name="uir-status" checked={status===x} onChange={()=>setStatus(x)}/></label>)}</div><div className="uir-views" data-managed-toggle>{['Main Audit Report','View 02','View 03','View 04','','','','Audit','View 09','','',''].map((x,i)=><button key={i} type="button" aria-pressed={activeReportView===(x||`blank-${i}`)} className={`${x==="Main Audit Report"?"uir-main-audit ":""}${activeReportView===(x||`blank-${i}`)?"is-active":""}`} onClick={()=>{setActiveReportView(x||`blank-${i}`);if(!x)return;if(x==="Main Audit Report"){setWidths(mainAuditWidths);setHidden(mainAuditHidden);setOrder(mainAuditOrder);}else if(x==="Audit")loadView(x);}}>{x}</button>)}</div><button className="uir-clear" onClick={clear}>Clear Filters</button><div className="uir-yellow" role="status"><span>{error||message||(pending||criteriaChanged?"Loading payroll from the database…":"")}</span><span data-report-column-status style={{position:"absolute",inset:0,pointerEvents:"none"}}/></div><p style={{position:"absolute",right:190,bottom:0,color:"red"}}>Per Diem on this screen is Employee-related (payroll).</p></div>
 {unhideOpen&&createPortal(<div style={{position:"fixed",inset:0,zIndex:9999,display:"grid",placeItems:"center",background:"rgba(0,0,0,.3)"}} onMouseDown={e=>{if(e.target===e.currentTarget)setUnhideOpen(false);}}>
 <section role="dialog" aria-modal="true" aria-labelledby="payroll-unhide-title" style={{background:"#eee",border:"1px solid #888",padding:12,width:480,maxWidth:"90vw"}}>
 <h2 id="payroll-unhide-title" style={{fontSize:16,margin:"0 0 10px"}}>Unhide Columns</h2>
 <div style={{maxHeight:320,overflow:"auto",background:"white",border:"1px solid #aaa",padding:6}}>{order.map(i=><label key={i} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"3px 0",font:"13px Arial"}}><input type="checkbox" checked={!hidden.includes(i)} disabled={shown.length===1&&!hidden.includes(i)} onChange={e=>setHidden(current=>e.target.checked?current.filter(x=>x!==i):[...current,i])}/>{columns[i][0]}</label>)}</div>
 <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}><button onClick={()=>{setHidden([]);setWidths({});setOrder(columns.map((_,i)=>i));}}>Reset Columns</button><button autoFocus onClick={()=>setUnhideOpen(false)}>Close</button></div></section></div>,document.body)}
 <div className="uir-grid"><table style={{width:15+shown.reduce((sum,i)=>sum+columnWidth(i),0),tableLayout:"fixed",borderCollapse:"collapse",zoom:0.93}}><colgroup><col style={{width:15}}/>{shown.map(i=><col key={i} style={{width:columnWidth(i)}}/>)}</colgroup>
 <thead><tr><th/>{shown.map(i=>{const label=columns[i][0];return <th key={i} title={label} data-column-label={label}><CustomerNameColumnHeader label={label} columnKey={`total-payroll-${i}`} kind={i>=4?"number":"text"} width={columnWidth(i)} onResize={width=>resizeColumn(i,width)} onResetWidth={()=>resizeColumn(i)} onHide={shown.length>1?()=>setHidden(current=>[...current,i]):undefined} onUnhideColumns={()=>setUnhideOpen(true)}
 onDragStart={e=>{setDragColumn(i);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(i));}} onDragOver={e=>{e.preventDefault();setDropColumn(i);}} onDrop={e=>{e.preventDefault();if(dragColumn!==null&&dragColumn!==i)setOrder(current=>{const next=current.filter(x=>x!==dragColumn);next.splice(next.indexOf(i),0,dragColumn);return next;});setDragColumn(null);setDropColumn(null);}} onDragEnd={()=>{setDragColumn(null);setDropColumn(null);}} dragging={dragColumn===i} dropTarget={dropColumn===i}
 getValues={()=>rows.map(r=>String(values(r)[i]??""))} selected={filters[i]} sort={sort?.key===String(i)?sort.direction:undefined} onSort={direction=>setSort({key:String(i),direction})} onFilter={selected=>setFilters(current=>{const next={...current};if(selected===undefined)delete next[i];else next[i]=selected;return next;})}/></th>;})}</tr></thead>
 <tbody><tr className="uir-total"><td title="Total">Σ</td>{shown.map((i,index)=><td key={i}>{[4,5,6,7,8,9,10,13,14,15,16,17].includes(i)?visible.reduce((sum,r)=>sum+Number(values(r)[i]||0),0).toLocaleString("en-US",{maximumFractionDigits:2}):index===0?"Total":""}</td>)}</tr>
 {visible.map(r=><tr key={r.id}><td/>{shown.map(i=><td key={i}>{typeof values(r)[i]==="number"?Number(values(r)[i]).toLocaleString("en-US",{maximumFractionDigits:2}):values(r)[i]}</td>)}</tr>)}
 {Array.from({length:Math.max(0,36-visible.length)},(_,index)=><tr key={index}><td/>{shown.map(i=><td key={i}/>)}</tr>)}</tbody></table></div><TableRecordBar recordCount={visible.length} search={name} onSearch={setName} filtered={Boolean(name||Object.keys(filters).length)}/></section>;
}
