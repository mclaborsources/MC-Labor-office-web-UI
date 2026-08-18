"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

export function FullTimeEmployeesByMonthScreen() {
  const router = useRouter(); const [year,setYear]=useState(""); const [payroll,setPayroll]=useState(""); const [view,setView]=useState("View 01");
  const clear=()=>{setYear("");setPayroll("")};
  const columns=["","Year","Payroll Co","Month","Employees","Full-Time Employees","Part-Time Employees","Part-Time Hours","FTE Employees","Total Full-Time Employees"];
  return <section className="ac-ft-report"><header className="ac-ft-header"><h1>Full-Time Employees by Month</h1><div className="ac-ft-view"><label>View:</label><select value={view} onChange={e=>setView(e.target.value)}>{["View 01","View 02","View 03","View 04","View 05","View 06"].map(v=><option key={v}>{v}</option>)}</select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><label>Go To:</label><select><option/></select><AccessButton>Refresh</AccessButton><AccessButton onClick={clear}>Zero</AccessButton><AccessButton onClick={()=>window.print()}>Export View</AccessButton></div><div className="ac-ft-close"><AccessButton onClick={()=>router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help">?</button></div></header>
  <div className="ac-ft-tools"><div className="ac-ft-step"><b>1)</b><select value={year} onChange={e=>setYear(e.target.value)}><option value="">&lt;Select Year&gt;</option><option>2026</option><option>2025</option></select><AccessButton>⌕</AccessButton></div><div className="ac-ft-step"><b>2)</b><select value={payroll} onChange={e=>setPayroll(e.target.value)}><option value="">&lt;Payroll Co&gt;</option><option>IPG</option></select></div><div className="ac-ft-presets">{["Default","View 02","View 03","View 04","View 05","View 06"].map(v=><AccessButton key={v} onClick={()=>setView(v==="Default"?"View 01":v)}>{v}</AccessButton>)}<div/></div><AccessButton className="ac-ft-clear" onClick={clear}>Clear Filters</AccessButton></div>
  <div className="ac-ft-grid-wrap"><table className="ac-ft-grid"><thead><tr>{columns.map((c,i)=><th key={i}>{c}</th>)}</tr></thead><tbody>{Array.from({length:34},(_,r)=><tr key={r}>{columns.map((_,c)=><td key={c}/>)}</tr>)}</tbody></table></div><footer className="ac-ft-record">Record:　|◀　◀　 <input aria-label="Record number"/>　▶　▶|　　▽ No Filter　 <b>Search</b></footer></section>;
}
