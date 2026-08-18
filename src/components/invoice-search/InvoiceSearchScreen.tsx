"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

type Invoice = { name: string; week: string; invoice: string; total: string; salesman: string; margin: string; note: string; sender: string; sent: string };

const ROWS: Invoice[] = [
  ["Agilitas Energy, Inc. (29 Randall Lane)","7/10/2026","56","$2,424.00","Ryan O'Neill","27.17%","","AN","7/14/2026 4:32:00 PM"],
  ["Agilitas Energy, Inc. (523 Snipatuitt Rd)","7/10/2026","109","$3,115.00","Ryan O'Neill","15.71%","","AN","7/15/2026 8:03:31 AM"],
  ["Agilitas Energy, Inc. (Braily Hill North)","7/10/2026","319","$3,630.00","Ryan O'Neill","11.05%","","AN","7/14/2026 4:32:01 PM"],
  ["Agilitas Energy, Inc. (Middle Rd)","7/10/2026","215","$2,945.25","Ryan O'Neill","16.74%","","AN","7/14/2026 4:32:03 PM"],
  ["Alaris Construction, LLC","7/10/2026","16","$1,400.00","Ryan O'Neill","8.45%","","AN","7/15/2026 8:24:26 AM"],
  ["All-State Power And Controls, Inc","7/10/2026","10","$4,620.00","Eamon O'Hara","12.60%","","AN","7/14/2026 4:32:04 PM"],
  ["Amore Electric Co","7/10/2026","28","$4,920.00","Eamon O'Hara","9.20%","","AN","7/15/2026 11:55:33 AM"],
  ["Anytime Plumbing & Heating, Inc.","7/10/2026","16","$2,960.00","Ryan O'Neill","7.70%","","AN","7/14/2026 4:32:07 PM"],
  ["Atlantic Restoration","7/10/2026","27","$1,120.00","Ryan O'Neill","17.14%","","AN","7/14/2026 4:32:08 PM"],
  ["Bay State Piping Co Inc","7/10/2026","04","$2,176.00","Brian Lupo","34.64%","","AN","7/14/2026 4:32:10 PM"],
  ["Belsan Built LLC","7/10/2026","03","$280.00","Eamon O'Hara","17.14%","","AN","7/14/2026 4:32:11 PM"],
  ["Brookline Housing Authority","7/10/2026","28","$2,680.00","Eamon O'Hara","16.42%","","AN","7/15/2026 9:23:31 AM"],
  ["Commercial Air Control Inc","7/10/2026","01","$296.00","Ryan O'Neill","24.40%","","AN","7/15/2026 10:39:41 AM"],
  ["Commlink Integration Corporation","7/10/2026","05","$3,600.00","Y G","14.24%","","AN","7/14/2026 4:32:12 PM"],
  ["Crocker Electrical Co Inc","7/10/2026","12","$10,296.00","House House","11.86%","","AN","7/14/2026 4:32:14 PM"],
  ["D M H Electric, Inc","7/10/2026","04","$5,375.40","Eamon O'Hara","9.72%","","AN","7/15/2026 12:42:02 PM"],
  ["Daniels Electric Corporation","7/10/2026","27","$1,400.00","Eamon O'Hara","16.65%","","AN","7/14/2026 4:32:16 PM"],
  ["Darana Hybrid, Inc.","7/10/2026","27","$464.00","Ryan O'Neill","99.58%","","AN","7/14/2026 4:32:17 PM"],
  ["Desmond Tech LLC","7/10/2026","26","$1,521.00","Kevin Hy","15.45%","","AN","7/14/2026 4:32:18 PM"],
  ["Di Foggio Electric","7/10/2026","04","$3,480.00","Eamon O'Hara","16.84%","","AN","7/14/2026 4:32:20 PM"],
  ["Dignis Electric Inc","7/10/2026","25","$1,128.00","House House","21.30%","","AN","7/14/2026 4:32:21 PM"],
  ["East Coast Electric","7/10/2026","17","$7,860.00","Eamon O'Hara","15.45%","SEND TIMESHEETS!!!!!","AN","7/14/2026 4:32:23 PM"],
  ["ENERGY SYSTEMS","7/10/2026","28","$2,760.00","Ryan O'Neill","10.44%","SEND TIMESHEETS WI","AN","7/14/2026 4:32:24 PM"],
  ["Florence Electric LLC","7/10/2026","09","$9,008.00","House House","12.27%","","AN","7/15/2026 9:23:21 AM"],
].map(([name,week,invoice,total,salesman,margin,note,sender,sent]) => ({name,week,invoice,total,salesman,margin,note,sender,sent}));

export function InvoiceSearchScreen() {
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [week, setWeek] = useState("7/10/2026");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const visible = useMemo(() => ROWS.filter(row => (!customer || row.name.toLowerCase().includes(customer.toLowerCase())) && (!week || row.week === week) && (!name || row.name.toLowerCase().includes(name.toLowerCase()))), [customer, week, name]);
  const toggle = (index: number) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });
  return <section className="ac-invoice-search">
    <header className="ac-invoice-header"><h1>Invoice Search</h1><div className="ac-invoice-view"><label>View:</label><select defaultValue="01"><option value="01">01 Default Invoice View</option></select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><AccessButton>Refresh</AccessButton><AccessButton onClick={() => window.print()}>Export View</AccessButton></div><div className="ac-invoice-close"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button type="button" aria-label="Help">?</button></div></header>
    <div className="ac-invoice-controls"><div className="ac-invoice-filters"><label>Customer<select value={customer} onChange={e => setCustomer(e.target.value)}><option value="" />{Array.from(new Set(ROWS.map(r => r.name))).map(v => <option key={v}>{v}</option>)}</select></label><label>Week Ending<input value={week} onChange={e => setWeek(e.target.value)} /></label><label>Search in Name<input value={name} onChange={e => setName(e.target.value)} /></label></div><div className="ac-invoice-actions"><div><AccessButton onClick={() => window.print()}>Print Invoices</AccessButton><label>Print Address <input type="checkbox" /></label></div><AccessButton onClick={() => window.print()}>Save Invoices to Single PDF</AccessButton><AccessButton>Invoice Payments Search</AccessButton></div></div>
    <div className="ac-invoice-selectbar"><span>Select:</span><AccessButton onClick={() => setSelected(new Set())}>Clear</AccessButton><AccessButton onClick={() => setSelected(new Set(visible.map((_, i) => i)))}>All</AccessButton></div>
    <div className="ac-invoice-grid-wrap"><table className="ac-invoice-grid"><thead><tr><th /><th>Select</th><th>Name</th><th>Week Ending Date</th><th>Invoice</th><th>Total</th><th>Salesman</th><th>Margin</th><th>Invoice Note</th><th>Sender</th><th>Invoice Sent Timestamp</th><th /></tr></thead><tbody>{visible.map((row, i) => <tr key={`${row.name}-${row.invoice}`} className={i === 0 ? "is-current" : undefined}><td /><td><input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} aria-label={`Select invoice ${row.invoice}`} /></td><td>{row.name}</td><td>{row.week}</td><td>{row.invoice}</td><td>{row.total}</td><td>{row.salesman}</td><td>{row.margin}</td><td>{row.note}</td><td>{row.sender}</td><td>{row.sent}</td><td /></tr>)}</tbody></table></div>
    <footer className="ac-invoice-recordbar"><span>Record:</span><button disabled>|◀</button><button disabled>◀</button><input value={visible.length ? 1 : 0} readOnly aria-label="Record number" /><span>of {visible.length}</span><button disabled>▶</button><button disabled>▶|</button><span>▽ No Filter</span><span>Search</span><div /></footer>
  </section>;
}
