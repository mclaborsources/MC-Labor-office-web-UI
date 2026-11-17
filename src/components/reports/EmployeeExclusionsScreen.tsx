"use client";
import {useState} from "react";
import {TableRecordBar} from "@/components/tables/TableRecordBar";
import {AccountingReportTable} from "@/components/tables/AccountingReportTable";
import type {EmployeeOptionsRow} from "@/lib/employeeOptionsSearch";
export function EmployeeExclusionsScreen({rows,error}:{rows:EmployeeOptionsRow[];error:string}){
 const [search,setSearch]=useState("");const [selected,setSelected]=useState("");
 const visible=rows.filter(r=>`${r.firstName} ${r.middle} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()));
 return <section className="employee-exclusions-datasheet" aria-label="Employee exclusions">
 {error&&<p role="alert">{error}</p>}
 <div className="employee-exclusions-grid"><AccountingReportTable columnLayoutKey="employee-exclusions-v1" style={{width:329,tableLayout:"fixed",borderCollapse:"collapse"}}><colgroup><col style={{width:19}}/><col style={{width:112}}/><col style={{width:90}}/><col style={{width:108}}/></colgroup><thead><tr><th/>{["EmFirstName","EmMiddle","EmLastName"].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{visible.map((r,i)=><tr key={r.id} className={selected===r.id||(!selected&&i===0)?"is-current":""} onClick={()=>setSelected(r.id)}><td/>{[r.firstName,r.middle,r.lastName].map((v,j)=><td key={j} title={v}>{v}</td>)}</tr>)}{Array.from({length:Math.max(0,50-visible.length)},(_,i)=><tr key={`blank-${i}`}><td/><td/><td/><td/></tr>)}</tbody></AccountingReportTable></div>
 <TableRecordBar recordCount={visible.length} search={search} onSearch={setSearch} filtered={Boolean(search)}/>
 </section>;
}