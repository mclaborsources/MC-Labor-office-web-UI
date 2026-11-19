"use client";
import {ReportRenameViewButton} from "@/components/reports/ReportRenameViewButton";
import {useAccountingReportData,EMPTY_REPORT_ROWS} from "@/components/reports/useAccountingReportData";
import {AccountingReportTable} from "@/components/tables/AccountingReportTable";
import {TableRecordBar} from "@/components/tables/TableRecordBar";

import { useState,useEffect } from "react";
import {WccReportCriteria} from "./WccReportCriteria";



export function WccPayrollScreen({options,criteria,rows:initialRows=EMPTY_REPORT_ROWS,customerRows:initialCustomerRows=EMPTY_REPORT_ROWS,error:initialError="",loadOnOpen=false}:{loadOnOpen?:boolean;options:import("@/lib/accountingReportOptions").AccountingReportOptions;customerRows?:import("@/lib/wccPayrollReport").WccCustomerRow[];rows?:import("@/lib/wccPayrollReport").WccPayrollRow[];error?:string;criteria:Record<string,string|undefined>}) {
  const byCustomer=criteria.groupBy==="customer";
  const {rows:loadedRows,error,loading:fetching,refetch}=useAccountingReportData(byCustomer?initialCustomerRows:initialRows,initialError);
  useEffect(()=>{if(loadOnOpen)void refetch("/wcc-payroll?"+new URLSearchParams(Object.fromEntries(Object.entries(criteria).filter((entry):entry is [string,string]=>typeof entry[1]==="string"))));},[loadOnOpen,refetch,criteria]);
  const rows=byCustomer?EMPTY_REPORT_ROWS:loadedRows;const customerRows=byCustomer?loadedRows:EMPTY_REPORT_ROWS;
  const columns=byCustomer?["Customer","Salesman","WCC","Per Diem","Total Sales","SUB Sales","Employee Sales"]:["WCC","Regular Hours","Regular Payroll","OT Hours","OT Payroll = Hours","Gross Payroll","Adjusted OT for","Sick","Vacation","Commissions","Per Diem","Total Payroll WC","Total Reg Payroll","Total Sales","SUBs","SUB Sales","Employee Sales"];
  const formatSummary=(value:number,index:number)=>value.toLocaleString("en-US",{minimumFractionDigits:[1,3,14].includes(index)?0:2,maximumFractionDigits:index===14?0:2});
  const iso=(value:string|undefined)=>{const d=new Date(value||criteria.weekEnding||"2026-11-13");return Number.isNaN(d.getTime())?"2026-11-13":d.toISOString().slice(0,10);};
  const [addressMode,setAddressMode]=useState(criteria.addressMode||"job");
  const [noEmployeeExclusions,setNoEmployeeExclusions]=useState(criteria.noEmployeeExclusions==="true");
  const [view, setView] = useState("View 01");
  const [auditPreset,setAuditPreset]=useState<{id:string;order:number[];hidden:number[];widths:Record<number,number>}|null>(null);
  const [state, setState] = useState(criteria.state||"");
  const [payrollCompany, setPayrollCompany] = useState(criteria.payrollCompany||"");
  const [year, setYear] = useState(criteria.assignYear||"");
  const [start, setStart] = useState(iso(criteria.startDate));
  const [end, setEnd] = useState(iso(criteria.endDate));
  const [customerMode, setCustomerMode] = useState("all");
  const [additionalUpdate, setAdditionalUpdate] = useState("");

  function refresh(){const params=new URLSearchParams({...Object.fromEntries(new URLSearchParams(window.location.search)),...Object.fromEntries(Object.entries(criteria).filter((entry):entry is [string,string]=>typeof entry[1]==="string")),startDate:start,endDate:end,state,payrollCompany,assignYear:year,addressMode,noEmployeeExclusions:String(noEmployeeExclusions)});void refetch((byCustomer?"/wcc-payroll-by-customer?":"/wcc-payroll?")+params);}
  const customerCounts=new Map<string,Set<string>>();
  for(const row of customerRows){const codes=customerCounts.get(row.customerId)||new Set<string>();codes.add(row.wcc);customerCounts.set(row.customerId,codes);}
  const visibleCustomers=customerRows.filter(row=>customerMode==="all"||(customerMode==="one"?customerCounts.get(row.customerId)!.size===1:customerCounts.get(row.customerId)!.size>1));
  const cells=(r:typeof rows[number])=>[r.wcc,r.regularHours,r.regularPay,r.otHours,r.otPay,r.grossPay,r.adjustedOt,r.sick,r.vacation,r.commissions,r.perDiem,r.totalPayrollWc,r.totalRegPay,r.sales,r.subs,r.subSales,r.sales-r.subSales];
  function clearFilters() {
    setState("");
    setPayrollCompany("");
    setYear("");
    setCustomerMode("all");
    setAdditionalUpdate("");
  }

  return (
    <main className={`wcc-report wcc-summary${byCustomer?" wcc-customer":""}`}>
      <header className="wcc-report__header">
        <h1>WCC Payroll / Sales Report{byCustomer?" by Customer":""}</h1>
        <div className="wcc-report__view-controls">
          <label>View:</label>
          <select value={view} onChange={(event) => setView(event.target.value)}>
            {Array.from({ length: 6 }, (_, index) => (
              <option key={index}>View {String(index + 1).padStart(2, "0")}</option>
            ))}
          </select>
          <button data-action-status="missing">Save View</button><ReportRenameViewButton/><button data-action-status="missing">Delete View</button><button data-action-status="complete" disabled={fetching} onClick={refresh}>{fetching?"Loading…":"Refresh"}</button><button data-action-status="missing">Zero</button><button data-action-status="missing">Export View</button>
        </div>
        {byCustomer&&<div className="wcc-report__customers" role="group" aria-label="Show Customers">
          <span className="wcc-customers-label">Show Customers</span>
          <label><input type="radio" checked={customerMode === "all"} onChange={() => setCustomerMode("all")} /> All</label>
          <label><input type="radio" checked={customerMode === "one"} onChange={() => setCustomerMode("one")} /> with 1 WCC</label>
          <label><input type="radio" checked={customerMode === "many"} onChange={() => setCustomerMode("many")} /> with &gt;1 WCC</label>
        </div>}
        {!byCustomer&&<i className="wcc-summary-important">IMPORTANT: Regular Hours and OT Hours on this<br/> report do not include any Expense-type hours.</i>}<button data-action-status="complete" className="wcc-report__cancel" onClick={() => {window.location.href="/accounting-reports";}}>Cancel</button>
        <button data-action-status="missing" className="wcc-report__help" title="Help">?</button>
      </header>

      <section className="wcc-report__filters">
        <WccReportCriteria addressMode={addressMode} setAddressMode={setAddressMode} noEmployeeExclusions={noEmployeeExclusions} setNoEmployeeExclusions={setNoEmployeeExclusions} onRefresh={refresh} options={options} state={state} setState={setState} company={payrollCompany} setCompany={setPayrollCompany} year={year} setYear={setYear} start={start} setStart={setStart} end={end} setEnd={setEnd} wcStates={criteria.wcStates||"MA, RI"}/>
        <div className="wcc-report__right-filters">
          <div className="wcc-report__views"><button data-action-status="complete" onClick={()=>{setView("View 01");if(byCustomer)setAuditPreset({id:"customer-audit",order:[0,1,2,3,4,5,6,7],hidden:[],widths:{0:20,1:254,2:105,3:386,4:114,5:114,6:114,7:125}});else setAuditPreset({id:"audit",order:Array.from({length:18},(_,i)=>i),hidden:[],widths:Object.fromEntries([20,263,114,114,84,114,110,110,107,100,110,100,128,130,114,96,121,125].map((w,i)=>[i,w]))});}}>Audit Report</button>{[2, 3, 4, 5].map((item) => <button data-action-status="complete" key={item} onClick={() => {if(!byCustomer)setView(`View 0${item}`);}}>View 0{item}</button>)}{byCustomer?<button>View 06</button>:<button onClick={()=>{setView("View 06");setAuditPreset({id:"mccpap",order:Array.from({length:18},(_,i)=>i),hidden:Array.from({length:14},(_,i)=>i+4),widths:{0:20,1:263,2:114,3:114}});}}>MCCPAP App</button>}</div>
          <div className="wcc-report__penalty"><label>Change Penalty % to: <input /></label><button data-action-status="missing">Change</button><select className="wcc-report__additional" value={additionalUpdate} onChange={(event) => setAdditionalUpdate(event.target.value)}><option value="">&lt;Additional Updates&gt;</option><option value="costs">Update costs</option><option value="sales">Update total invoice amount</option></select></div>
          <div className="wcc-report__notes"><button data-action-status="complete" disabled={fetching} onClick={refresh}>{fetching?"Loading…":"Refresh"}</button><i>Only records with an existing State Rate value greater than 0 will be changed.<br />A Refresh or running the Costs additional update will reset the records.</i><i>The Costs additional update only works if 1 State selection<br />and 1 Payroll Company selection is made.</i></div>
          <div className="wcc-summary-yellow"><span>{error||(byCustomer?"Gross Payroll = Regular Payroll + OT Payroll":"")}</span><span data-report-column-status style={{position:"absolute",inset:0,pointerEvents:"none"}}/></div><button data-action-status="complete" className="wcc-report__clear" onClick={clearFilters}>Clear Filters</button>
          <p className="wcc-report__warning">Per Diem on this screen is Employee-related (payroll).{!byCustomer&&"　 Total Payroll WC does not include SUBs."}</p>
        </div>
      </section>

      <section className="wcc-report__grid" aria-label="WCC payroll sales results">
        <AccountingReportTable columnPreset={auditPreset} columnLayoutKey={byCustomer?"wcc-by-customer-access-v2":"wcc-payroll"}><colgroup><col style={{width:20}}/>{columns.map((x,i)=><col key={x} style={{width:byCustomer?[254,105,386,114,114,114,125][i]:[263,114,114,84,114,110,110,107,100,110,100,128,130,114,96,121,125][i]}}/>)}</colgroup><thead><tr><th className="wcc-report__selector"></th>{columns.map((column) => <th key={column}>{column}<span>⌄</span></th>)}</tr></thead>
          <tbody><tr className="wcc-report__total"><td>{byCustomer?"":"⌄"}</td><td>Total</td>{columns.slice(1).map((column) => <td key={column}>{byCustomer&&["Per Diem","Total Sales","SUB Sales","Employee Sales"].includes(column)?visibleCustomers.reduce((sum,r)=>sum+(column==="Per Diem"?r.perDiem:column==="SUB Sales"?r.subSales:column==="Employee Sales"?r.sales-r.subSales:r.sales),0).toLocaleString("en-US",{maximumFractionDigits:2}):!byCustomer&&[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].includes(columns.indexOf(column))?formatSummary(rows.reduce((sum,r)=>sum+Number(cells(r)[columns.indexOf(column)]||0),0),columns.indexOf(column)):""}</td>)}</tr>{byCustomer&&visibleCustomers.map((r,i)=><tr key={r.customerId+"-"+r.wcc+"-"+i}><td/><td>{r.customer}</td><td>{r.salesman}</td><td>{r.wcc}</td><td>{r.perDiem.toLocaleString("en-US",{maximumFractionDigits:2})}</td><td>{r.sales.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td>{r.subSales.toLocaleString("en-US",{maximumFractionDigits:2})}</td><td>{(r.sales-r.subSales).toLocaleString("en-US",{maximumFractionDigits:2})}</td></tr>)}{!byCustomer&&rows.map(r=><tr key={r.wcc}><td/>{cells(r).map((value,i)=><td key={i} title={String(value??"")}>{typeof value==="number"?formatSummary(value,i):value}</td>)}</tr>)}{Array.from({ length: Math.max(0,26-(byCustomer?visibleCustomers.length:rows.length)) }, (_, row) => <tr key={row}>{Array.from({ length: columns.length+1 }, (_, cell) => <td key={cell}></td>)}</tr>)}</tbody></AccountingReportTable>
      </section>
      <TableRecordBar recordCount={byCustomer?visibleCustomers.length:rows.length}/>
    </main>
  );
}
