"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OpenInvoiceRow } from "@/lib/operationalReports";

function money(value:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value||0);}
function csvCell(value:unknown){return `"${String(value??"").replaceAll('"','""')}"`;}

export function AccountsReceivableReportScreen({rows,error}:{rows:OpenInvoiceRow[];error:string}){
  const router=useRouter();
  const [includeTerminated,setIncludeTerminated]=useState(false);
  const visible=useMemo(()=>rows.filter(row=>includeTerminated||!row.creditHistory.toLowerCase().includes("terminat")),[rows,includeTerminated]);
  const groups=useMemo(()=>{
    const output:{customerId:string;customer:string;credit:string;rows:OpenInvoiceRow[];total:number}[]=[];
    for(const row of visible){
      let group=output.at(-1);
      if(!group||group.customerId!==row.customerId){group={customerId:row.customerId,customer:row.customer,credit:row.creditHistory,rows:[],total:0};output.push(group);}
      group.rows.push(row);group.total+=Number(row.openBalance||0);
    }
    return output;
  },[visible]);
  const total=visible.reduce((sum,row)=>sum+Number(row.openBalance||0),0);
  const refreshedAt=new Date().toLocaleString("en-US",{weekday:"long",month:"numeric",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});

  function download(){
    const headings=["Customer","Credit History","Contract With","Invoice Date","Invoice Num","Aging","Open Balance","Invoice Note"];
    const data=[headings.join(","),...visible.map(r=>[r.customer,r.creditHistory,r.contractWith,r.invoiceDate,r.invoiceNumber,r.age,money(Number(r.openBalance)),r.invoiceNote].map(csvCell).join(","))].join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF",data],{type:"text/csv;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download="accounts-receivable-report.csv";link.click();URL.revokeObjectURL(url);
  }

  return <section className="ar-report-preview">
    <div className="ar-report-preview-toolbar">
      <button onClick={()=>window.print()}>Print / Save PDF</button>
      <button onClick={download} disabled={!visible.length}>Download CSV</button>
      <button onClick={()=>router.refresh()}>Refresh</button>
      <label><input type="checkbox" checked={includeTerminated} onChange={e=>setIncludeTerminated(e.target.checked)}/> Include Terminated</label>
      <button onClick={()=>router.push("/reports")}>Close Preview</button>
    </div>
    {error&&<p className="ar-report-error" role="alert">{error}</p>}
    <div className="ar-report-preview-scroll"><article className="ar-report-paper" aria-label="Open Invoices Report">
      <header><h1>Open Invoices Report</h1><time>Last Refresh: {refreshedAt}</time></header>
      {!error&&<>
        <table><colgroup><col className="ar-report-co"/><col className="ar-report-date"/><col className="ar-report-invoice"/><col className="ar-report-age"/><col className="ar-report-balance"/><col/></colgroup>
          <thead><tr><th>C w/</th><th>Invoice Date</th><th>Invoice Num</th><th>Aging</th><th>Open Balance</th><th>Invoice Note</th></tr></thead>
          <tbody>{groups.map(group=><Fragment key={group.customerId}>
            <tr className="ar-report-customer"><th colSpan={6}>{group.customer}<span>{group.credit}</span></th></tr>
            {group.rows.map(row=><tr key={row.id}><td>{row.contractWith}</td><td>{row.invoiceDate}</td><td>{row.invoiceNumber}</td><td>{row.age}</td><td className="ar-report-money">{money(Number(row.openBalance))}</td><td>{row.invoiceNote}</td></tr>)}
            <tr className="ar-report-customer-total"><td colSpan={4}>{group.customer} Total</td><td className="ar-report-money">{money(group.total)}</td><td/></tr>
          </Fragment>)}</tbody>
        </table>
        <div className="ar-report-total"><strong>Report Total</strong><strong>{money(total)}</strong></div>
        <section className="ar-report-summary"><h2>Summary</h2><p>{visible.length.toLocaleString()} open invoices for {groups.length.toLocaleString()} customers.</p><p>Open balance: {money(total)}</p></section>
        {!visible.length&&<p className="ar-report-empty">No open invoices match this report.</p>}
      </>}
      <footer>Page 1 of 1</footer>
    </article></div>
  </section>;
}
