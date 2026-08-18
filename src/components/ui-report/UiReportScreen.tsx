"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

type RequestRow = { date:string; employee:string; lastDay:string; customer:string; trade:string; reason:string; reasonCont:string; reasonDate:string; contract:string; notes:string; user:string };
const REQUESTS: RequestRow[] = [
  ["10/19/2015","Said M Ahmed","9/25/2015","O Keefe Plumbing & Heating Inc","Plumber","Injury out side of work","","","Industrial Power Group, Inc.","More paperwork ???? RMV 10/19/2015","RMV"],
  ["10/19/2015","Diander R Williams","11/13/2015","Ellisdale Construction and Landscaping","Laborer","Still Working for Us.","","","Industrial Power Group, Inc.","don’t know why I got this. Still working for us. RMV 10/19/2015","RMV"],
  ["10/19/2015","Diander R Williams","10/16/2015","Coulter Construction","Laborer","Left for another Job","","","Industrial Power Group, Inc.","","RMV"],
  ["10/19/2015","Andrew J Waisnor","5/29/2015","BLM & C Electrical Corporation","Electrician","Left for another Job","","","Industrial Power Group, Inc.","Returned to the Union RMV 10/19/2015","RMV"],
  ["10/19/2015","Spencer M Macomber","9/30/2015","S.E. & D. Inc (Pilot)","Solar","Laid off due to lack of work.","","","Industrial Power Group, Inc.","Laborer laid orr. Lack of work RMV 10/19/2015","RMV"],
  ["10/7/2015","Sean O McDermott","9/30/2015","Better Comfort Systems","HVAC / Sheet Metal","Quit","","","Industrial Power Group, Inc.","No Car RMV 10/7/2015","RMV"],
  ["10/7/2015","Said M Ahmed","9/25/2015","O Keefe Plumbing & Heating Inc","Plumber","Quit","","","Industrial Power Group, Inc.","got hurt playing soccer, tried to collect UI RMV 10/7/2015","RMV"],
  ["9/25/2015","Said M Ahmed","9/8/2015","MSI Mechanical Systems Inc","Plumber","Laid off due to lack of work.","Started back with us","9/21/2015","Industrial Power Group, Inc.","Off from 9/09/2015 to 9/21/2015 RMV 9/25/2015","RMV"],
  ["9/21/2015","Jeremy R Dawson","9/10/2015","Pro Star Electric Inc","Solar","Laid off due to lack of work.","","","Industrial Power Group, Inc.","CT UI Sent back with IPG Info RMV 9/21/2015","RMV"],
  ["9/21/2015","Lethel Mitchell Jr","9/10/2015","Pro Star Electric Inc","Solar","Laid off due to lack of work.","","","Industrial Power Group, Inc.","Ct, UI sent it back with IPG Info. RMV 9/21/2015","RMV"],
  ["9/17/2015","Sean O McDermott","8/24/2015","Team Mechanical","HVAC / Sheet Metal","Job Dissatisfaction","","","Industrial Power Group, Inc.","Has no Transport RMV 9/17/2015","RMV"],
  ["9/17/2015","Terrance K Williams","9/4/2015","Pro Star Electric Inc","Solar","Quit","","","Industrial Power Group, Inc.","File with State of CT RMV 9/17/2015","RMV"],
  ["7/9/2015","Paul Stanton","5/30/2014","","","Left for another Job","","","","","RMV"],
  ["7/1/2015","Colin D Clark","8/25/2014","","","Left for another Job","","","","","RMV"],
  ["7/1/2015","John Tirronen","6/30/2014","","","Left for another Job","","","","","RMV"],
  ["7/1/2015","Matthew M Arseneau","4/9/2015","","","Laid off due to lack of work.","","","","","RMV"],
  ["7/1/2015","Marcus C Giancola","6/24/2014","","","Left for another Job","","","","","RMV"],
  ["5/18/2015","Peter J Canavan","4/8/2015","","","Laid off due to lack of work.","","","","","RMV"],
].map(([date,employee,lastDay,customer,trade,reason,reasonCont,reasonDate,contract,notes,user]) => ({date,employee,lastDay,customer,trade,reason,reasonCont,reasonDate,contract,notes,user}));

const CONTACTS = [{company:"GS Staffing",first:"Laura",last:"Davis",state:"",email:"Laura.Davis@XcelR.com",notes:"",active:"Active"},{company:"Company A",first:"Joe",last:"Smith",state:"MA",email:"Joe@companya.com",notes:"Here is a note about Joe",active:"Active"}];

export function UiReportScreen() {
  const router = useRouter();
  const [rows, setRows] = useState(REQUESTS);
  const [selected, setSelected] = useState(0);
  const current = rows[selected] ?? REQUESTS[0];
  const update = (key: keyof RequestRow, value: string) => setRows(old => old.map((row,i) => i === selected ? {...row,[key]:value} : row));
  const add = () => { setRows(old => [...old,{date:"",employee:"",lastDay:"",customer:"",trade:"",reason:"",reasonCont:"",reasonDate:"",contract:"",notes:"",user:""}]); setSelected(rows.length); };
  return <section className="ac-ui-report">
    <div className="ac-ui-grid-wrap"><table className="ac-ui-grid"><thead><tr><th/><th>Date</th><th>Employee</th><th>Last Day of Work</th><th>Last Customer</th><th>Trade</th><th>Reason</th><th>Reason Cont</th><th>Reason Cont Date</th><th>Contract With</th><th>Notes</th><th>User Name</th><th>Select</th><th/></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.employee}-${i}`} className={i===selected?"is-current":undefined} onClick={()=>setSelected(i)}><td/><td>{r.date}</td><td>{r.employee}</td><td>{r.lastDay}</td><td>{r.customer}</td><td>{r.trade}</td><td>{r.reason}</td><td>{r.reasonCont}</td><td>{r.reasonDate}</td><td>{r.contract}</td><td>{r.notes}</td><td>{r.user}</td><td/><td/></tr>)}</tbody></table></div>
    <header className="ac-ui-title"><h1>Unemployment Requests</h1><div><AccessButton onClick={add}>New</AccessButton><AccessButton>Save</AccessButton><AccessButton onClick={()=>router.push("/tracking")}>Cancel</AccessButton><AccessButton onClick={()=>setRows(old=>old.filter((_,i)=>i!==selected))}>Delete</AccessButton><AccessButton>View Email</AccessButton></div><button type="button" aria-label="Help">?</button></header>
    <div className="ac-ui-editor"><strong>Enter/Edit Request</strong><AccessButton className="ac-ui-work">Employee Work History</AccessButton><div className="ac-ui-fields">{(["date","employee","lastDay","customer","trade","reason","reasonCont","reasonDate","contract","notes","user"] as (keyof RequestRow)[]).map((key,i)=><label key={key}><span>{["Date","Employee","Last Day of Work","Last Customer","Trade","Reason","Reason Cont","Reason Cont Date","Contract With","Notes","User Name"][i]}</span>{key==="reason"?<select value={current[key]} onChange={e=>update(key,e.target.value)}><option>Injury out side of work</option><option>Still Working for Us.</option><option>Left for another Job</option><option>Laid off due to lack of work.</option><option>Quit</option></select>:<input value={current[key]} onChange={e=>update(key,e.target.value)}/>}</label>)}</div></div>
    <div className="ac-ui-contacts"><strong>Select One Contact</strong><AccessButton>Edit Contact List</AccessButton><table><thead><tr><th/><th>Company</th><th>Contact F Name</th><th>Contact L Name</th><th>State</th><th>Email</th><th>Notes</th><th>Active</th><th>Select</th></tr></thead><tbody>{CONTACTS.map((c,i)=><tr key={c.email} className={i===0?"is-current":undefined}><td/><td>{c.company}</td><td>{c.first}</td><td>{c.last}</td><td>{c.state}</td><td>{c.email}</td><td>{c.notes}</td><td>{c.active}</td><td/></tr>)}</tbody></table><div className="ac-ui-contact-record">Record:　|◀　◀　 <input value="1" readOnly aria-label="Contact record"/> of 2　▶　▶|　　▽ No Filter　 <span>Search</span></div></div>
    <footer className="ac-ui-record">Record:　|◀　◀　 <input value={selected+1} readOnly aria-label="Request record"/> of {rows.length}　▶　▶|　　▽ No Filter　 <span>Search</span></footer>
  </section>;
}
