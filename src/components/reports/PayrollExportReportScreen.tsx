"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import { ReportWeekControls } from "@/components/reports/ReportWeekControls";
import { buildTextSearchIndex, searchTextIndex } from "@/lib/textSearchIndex";
import { trackingCsv } from "@/lib/trackingGrid";
import type { NewReportSearchRow } from "@/lib/newReportSearch";

type ColumnKey = "payrollCompany"|"weekEnding"|"multiple"|"ssn"|"name"|"regularPayRate"|"regularRegHours"|"regularOtHours"|"regularPayAmount"|"juryDutyRate"|"juryDutyRegHours"|"juryDutyAmount"|"retroRate"|"retroRegHours"|"retroAmount"|"advanceRepayment";
type Column = { key: ColumnKey | null; id: string; label: string; width: number };
const DEFAULT_COLUMNS: Column[] = [
  {id:"payrollCompany",key:"payrollCompany",label:"Payroll Co",width:96},{id:"weekEnding",key:"weekEnding",label:"Week Ending",width:98},
  {id:"preMultiple",key:null,label:"",width:36},{id:"multiple",key:"multiple",label:"Multiple",width:80},
  {id:"ssn",key:"ssn",label:"SSN",width:95},{id:"name",key:"name",label:"Name",width:140},
  {id:"postName",key:null,label:"",width:38},{id:"regularPayRate",key:"regularPayRate",label:"Regular Pay Rate",width:118},
  {id:"regularRegHours",key:"regularRegHours",label:"Regular Pay Reg Hours",width:145},{id:"regularOtHours",key:"regularOtHours",label:"Regular Pay OT Hours",width:140},
  {id:"regularPayAmount",key:"regularPayAmount",label:"Regular Pay Amount",width:132},{id:"juryDutyRate",key:"juryDutyRate",label:"Jury Duty Rate",width:112},
  {id:"juryDutyRegHours",key:"juryDutyRegHours",label:"Jury Duty Reg Hours",width:140},{id:"juryDutyAmount",key:"juryDutyAmount",label:"Jury Duty Amount",width:128},
  {id:"preRetro",key:null,label:"",width:36},{id:"retroRate",key:"retroRate",label:"Retro Rate",width:105},{id:"retroRegHours",key:"retroRegHours",label:"Retro Reg Hours",width:125},
  {id:"retroAmount",key:"retroAmount",label:"Retro Amount",width:115},
];
const ALL_COLUMNS: Column[] = [...DEFAULT_COLUMNS,{id:"advanceRepayment",key:"advanceRepayment",label:"Advance Repayment",width:135}];
const VIEW_COLUMNS: Record<string, Column[]> = {"View 01":DEFAULT_COLUMNS,"All Columns":ALL_COLUMNS,"View 03":DEFAULT_COLUMNS,"View 06":DEFAULT_COLUMNS,"View 07":DEFAULT_COLUMNS,"View 11":DEFAULT_COLUMNS};
const COMPANY_COLORS: Record<string,string> = { IPG:"#ff9800",HDE:"#07877e",HSG:"#60a74c",GS:"#8c55ad",ISG:"#4a79bd",MLS:"#2a8c9c","T&R":"#d17e3a" };
const PAGE_SIZE = 200;

interface Props { companies: string[]; rows: NewReportSearchRow[]; initialWeekEnding: string; error?: string }

export function PayrollExportReportScreen({ companies, rows, initialWeekEnding, error = "" }: Props) {
  const router = useRouter();
  const [query,setQuery] = useState("");
  const [payrollCompany,setPayrollCompany] = useState("IPG + HDE");
  const [incomeOnly,setIncomeOnly] = useState(true);
  const [advanceOnly,setAdvanceOnly] = useState(false);
  const [view,setView] = useState("View 01");
  const [columns,setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [page,setPage] = useState(1);
  const [message,setMessage] = useState("");
  const [selected,setSelected] = useState("");
  const [sort,setSort] = useState<{key:ColumnKey;direction:"asc"|"desc"}>({key:"name",direction:"asc"});

  useEffect(() => {
    if (view === "All Columns") { setColumns(ALL_COLUMNS); return; }
    if (VIEW_COLUMNS[view]) { setColumns(VIEW_COLUMNS[view]); return; }
    try {
      const saved = JSON.parse(localStorage.getItem(`payroll-export-report-${view}`) ?? "null") as {columns?:Column[];query?:string;payrollCompany?:string}|null;
      setColumns(saved?.columns?.length ? saved.columns : DEFAULT_COLUMNS);
      if (saved?.query !== undefined) setQuery(saved.query);
      if (saved?.payrollCompany !== undefined) setPayrollCompany(saved.payrollCompany);
      setMessage(saved ? `${view} loaded.` : `${view} is an empty view slot. Save View to keep the current layout and filters.`);
    } catch { setColumns(DEFAULT_COLUMNS); }
  },[view]);

  const index = useMemo(() => buildTextSearchIndex(rows.map((row) => [row.name,row.ssn,row.employeeId])),[rows]);
  const filtered = useMemo(() => {
    const matches = searchTextIndex(index,query);
    const companyCodes = payrollCompany === "IPG + HDE" ? ["IPG","HDE"] : payrollCompany === "All Companies" ? [] : [payrollCompany];
    const result = matches.map((rowIndex) => rows[rowIndex]).filter((row) => {
      const companyMatch = !companyCodes.length || companyCodes.includes(row.payrollCompany);
      const incomeMatch = !incomeOnly || row.regularPayAmount > 0;
      const advanceMatch = !advanceOnly || row.advanceRepayment !== 0;
      return companyMatch && incomeMatch && advanceMatch;
    });
    const direction = sort.direction === "asc" ? 1 : -1;
    return result.sort((a,b) => String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""),undefined,{numeric:true,sensitivity:"base"}) * direction);
  },[index,rows,query,payrollCompany,incomeOnly,advanceOnly,sort]);
  const pageCount = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const visible = filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const employeeOptions = useMemo(() => [...new Map(filtered.map((row) => [row.employeeId,row])).values()],[filtered]);

  function changeWeek(date:string) {
    router.push(date ? `/payroll-export-report?weekEnding=${encodeURIComponent(date)}` : "/payroll-export-report");
    setPage(1);
  }
  function saveView() { localStorage.setItem(`payroll-export-report-${view}`,JSON.stringify({columns,query,payrollCompany}));setMessage(`${view} saved on this computer.`); }
  function deleteView() { localStorage.removeItem(`payroll-export-report-${view}`);setColumns(DEFAULT_COLUMNS);setQuery("");setMessage(`${view} cleared.`); }
  function zero() { setQuery("");setPayrollCompany("All Companies");setIncomeOnly(false);setAdvanceOnly(false);setPage(1); }
  function exportView() {
    const headers = columns.map((column) => column.label);
    const csv = trackingCsv(headers,filtered.map((row) => columns.map(({key}) => cell(row,key))));
    const url = URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
    const anchor = document.createElement("a");anchor.href=url;anchor.download=`payroll-export-report-${initialWeekEnding||"report"}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function cell(row:NewReportSearchRow,key:ColumnKey | null) {
    if (!key) return "";
    const value = row[key];
    if (value === null || value === undefined) return "";
    if (["regularPayRate","regularPayAmount","juryDutyRate","juryDutyAmount","retroRate","retroAmount","advanceRepayment"].includes(key)) return `$${Number(value).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    return String(value);
  }

  return <section className="payroll-export-report-screen">
    <header className="payroll-export-report-toolbar">
      <h1>Payroll Export Report</h1>
      <label>View:<select value={view} onChange={(event)=>setView(event.target.value)}>{["View 01","All Columns","View 03","View 06","View 07","View 11","View 02","View 04","View 05","View 08","View 09","View 10"].map((name)=><option key={name}>{name}</option>)}</select></label>
      <AccessButton data-action-status="complete" onClick={saveView}>Save View</AccessButton><AccessButton data-action-status="complete" onClick={deleteView}>Delete View</AccessButton>
      <label>Go To:<select value={selected} onChange={(event)=>{setSelected(event.target.value);if(event.target.value)router.push(`/employees/${event.target.value}`);}}><option value="" />{employeeOptions.map((row)=><option key={row.employeeId} value={row.employeeId}>{row.name}</option>)}</select></label>
      <AccessButton data-action-status="complete" onClick={()=>router.refresh()}>Refresh</AccessButton><AccessButton data-action-status="complete" onClick={zero}>Zero</AccessButton><AccessButton data-action-status="complete" onClick={exportView}>Export View</AccessButton>
      <select className="nrs-company-select" aria-label="Payroll Company" value={payrollCompany} onChange={(event)=>{setPayrollCompany(event.target.value);setPage(1);}}>
        <option>IPG + HDE</option><option>All Companies</option>{companies.filter((company)=>!(["IPG","HDE"].includes(company))).map((company)=><option key={company}>{company}</option>)}
      </select>
      <div className="nrs-income-switch"><AccessButton data-action-status="complete" aria-pressed={incomeOnly} className={incomeOnly?"is-active":""} onClick={()=>{setIncomeOnly(true);setPage(1);}}>Employees with Income</AccessButton>
      <AccessButton data-action-status="complete" aria-pressed={!incomeOnly} className={!incomeOnly?"is-active":""} onClick={()=>{setIncomeOnly(false);setPage(1);}}>All Employees</AccessButton></div>
      <AccessButton data-action-status="linked" className="nrs-cancel" onClick={()=>router.push("/reports")}>Cancel</AccessButton>
      <AccessButton data-action-status="complete" className="nrs-help" aria-label="Payroll Export Report help" title="Search by employee name, Social Security number, or ID. Choose a payroll week and company to filter the report." onClick={()=>setMessage("Search by employee name, SSN, or ID. Choose a payroll week and company to filter the report.")}>?</AccessButton>
    </header>
    <div className="payroll-export-report-filters">
      <div className="nrs-criteria">
      <label>Search in Name:<input value={query} onChange={(event)=>{setQuery(event.target.value);setPage(1);}} placeholder="Full name includes middle initial" /></label>
      <ReportWeekControls date={initialWeekEnding} onChange={changeWeek} onRefresh={()=>router.refresh()}/>
      </div>
      <div className="nrs-view-presets">{["Default","All Columns","View 03","","","View 06","View 07","","","View 11","",""].map((name,index)=><AccessButton data-action-status="complete" key={`${name}-${index}`} disabled={!name} onClick={()=>name&&setView(name === "Default" ? "View 01" : name)}>{name}</AccessButton>)}</div>
      <div className="nrs-filter-actions"><div><AccessButton data-action-status="complete" aria-pressed={advanceOnly} onClick={()=>{setAdvanceOnly(true);setPage(1);}}>Advance Repayments</AccessButton><AccessButton data-action-status="complete" onClick={()=>{setAdvanceOnly(false);setPage(1);}}>All</AccessButton></div><AccessButton data-action-status="complete" onClick={()=>{setQuery("");setPayrollCompany("All Companies");setAdvanceOnly(false);setPage(1);}}>Clear Filters</AccessButton></div>
    </div>
    {error&&<p className="payroll-export-report-error" role="alert">{error}</p>}{message&&<p className="payroll-export-report-message" role="status">{message}</p>}
    <div className="payroll-export-report-grid"><table><colgroup><col style={{width:30}}/>{columns.map((column)=><col key={column.id} style={{width:column.width}}/>)}</colgroup><thead><tr><th/>{columns.map((column)=><th key={column.id}><button data-action-status="complete" type="button" disabled={!column.key} onClick={()=>column.key&&setSort((current)=>({key:column.key!,direction:current.key===column.key&&current.direction==="asc"?"desc":"asc"}))}>{column.label}<span><i className="nrs-sort-indicator" aria-hidden="true"/></span></button></th>)}</tr></thead><tbody>
      {visible.map((row,index)=>{const color=COMPANY_COLORS[row.payrollCompany]??"#888";return <tr key={row.id} className={index===0?"is-current":""} onClick={()=>setSelected(row.employeeId)}><td/>{columns.map(({id,key})=><td key={id} className={key==="payrollCompany"?"nrs-payroll-code":""} style={key==="payrollCompany"?{backgroundColor:color}:undefined}>{cell(row,key)}</td>)}</tr>;})}
      {!visible.length&&<tr><td colSpan={columns.length+1}>{error?"": "No payroll employees match the selected filters."}</td></tr>}
    </tbody></table></div>
    <footer className="payroll-export-report-footer"><span>Record:</span><AccessButton data-action-status="complete" disabled={page<=1} onClick={()=>setPage(1)}>First</AccessButton><AccessButton data-action-status="complete" disabled={page<=1} onClick={()=>setPage((value)=>Math.max(1,value-1))}>Prev</AccessButton><span>{filtered.length?`${(page-1)*PAGE_SIZE+1}-${Math.min(page*PAGE_SIZE,filtered.length)} of ${filtered.length}`:"0 records"}</span><AccessButton data-action-status="complete" disabled={page>=pageCount} onClick={()=>setPage((value)=>Math.min(pageCount,value+1))}>Next</AccessButton><AccessButton data-action-status="complete" disabled={page>=pageCount} onClick={()=>setPage(pageCount)}>Last</AccessButton><span>Page {page} of {pageCount}</span><span className="nrs-search-method">Search matches employee name, SSN, or ID</span><span className="nrs-page-size">200 per page</span></footer>
    <p className="payroll-export-report-source-note">Jury duty and retro pay cells are blank when those values are not stored in the current weekly tracking rows.</p>
  </section>;
}
