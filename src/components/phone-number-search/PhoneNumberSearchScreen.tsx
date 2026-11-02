"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { AllContactRow } from "@/types/allContacts";

const VIEWS = ["View 01", "View 02", "View 03", "View 04"];
export function PhoneNumberSearchScreen({ rows, error = "" }: { rows: AllContactRow[]; error?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("View 01");
  const [notice, setNotice] = useState("");
  const visible = useMemo(() => {
    const digits = query.replace(/\D/g, "");
    if (!digits) return [];
    return rows.filter(row => [row.cell1, row.cell2, row.cell3, row.cell4].some(number => number && number.replace(/\D/g, "").includes(digits)));
  }, [rows, query]);
  function clear() { setPhone(""); setQuery(""); setNotice(""); }
  function choose(next: string) {
    setView(next);
    try { const saved = JSON.parse(localStorage.getItem("phone-number-search-views") ?? "{}")[next] ?? ""; setPhone(saved); setQuery(saved); setNotice(""); }
    catch { setNotice("Could not load the saved view."); }
  }
  function save(remove = false) {
    try { const saved = JSON.parse(localStorage.getItem("phone-number-search-views") ?? "{}"); if (remove) delete saved[view]; else saved[view] = phone; localStorage.setItem("phone-number-search-views", JSON.stringify(saved)); setNotice(`${view} ${remove ? "deleted" : "saved"}.`); }
    catch { setNotice("Could not update saved views."); }
  }
  function exportView() {
    const values = [["Name", "Title", "Type", "Refers To"], ...visible.map(row => [`${row.firstName} ${row.lastName}`.trim(), "", row.profileType, row.customerName || row.employeeName])];
    const csv = values.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "phone-number-search.csv"; link.click(); URL.revokeObjectURL(url);
  }
  return <section className="ac-phone-search">
    <header className="ac-phone-search-header"><h1>Phone Number Search</h1><div className="ac-phone-search-viewbar"><label htmlFor="phone-search-view">View:</label><select id="phone-search-view" value={view} onChange={event => choose(event.target.value)}>{VIEWS.map(item => <option key={item}>{item}</option>)}</select><AccessButton onClick={() => save()}>Save View</AccessButton><AccessButton onClick={() => save(true)}>Delete View</AccessButton><AccessButton onClick={() => { setQuery(phone); router.refresh(); }}>Refresh</AccessButton><AccessButton onClick={clear}>Zero</AccessButton><AccessButton onClick={exportView}>Export View</AccessButton></div><div className="ac-phone-search-closebar"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></div></header>
    <div className="ac-phone-search-tools"><form className="ac-phone-search-form" onSubmit={event => { event.preventDefault(); setQuery(phone); }}><strong>SEARCH</strong><label htmlFor="phone-search-number">Phone Number:</label><input id="phone-search-number" type="tel" value={phone} onChange={event => setPhone(event.target.value)} /><AccessButton type="submit">Search</AccessButton></form><div className="ac-phone-search-view-buttons">{VIEWS.map((item,index) => <AccessButton key={item} aria-pressed={item === view} onClick={() => choose(item)}>{index === 0 ? "View01" : item}</AccessButton>)}</div><AccessButton className="ac-phone-search-clear" onClick={clear}>Clear Filters</AccessButton></div>
    {(error || notice) && <p className="ac-phone-search-message" role={error ? "alert" : "status"}>{error || notice}</p>}
    <div className="ac-phone-search-grid-wrap"><table className="ac-phone-search-grid"><colgroup><col className="selector"/><col className="name"/><col className="title"/><col className="type"/><col className="refers"/>{Array.from({length:8},(_,i)=><col key={i} style={{width:96}}/>)}<col/></colgroup><thead><tr><th aria-label="Row selector"/>{["Name","Title","Type","Refers To"].map(label=><th key={label}>{label}<i/></th>)}{Array.from({length:9},(_,i)=><th key={i} aria-hidden="true"/>)}</tr></thead><tbody>{visible.map(row=><tr key={row.id}><td/><td>{`${row.firstName} ${row.lastName}`.trim()}</td><td/><td>{row.profileType}</td><td>{row.customerName || row.employeeName}</td>{Array.from({length:9},(_,i)=><td key={i}/>)}</tr>)}{Array.from({length:Math.max(0,50-visible.length)},(_,i)=><tr key={`blank-${i}`} aria-hidden="true">{Array.from({length:14},(_,j)=><td key={j}/>)}</tr>)}</tbody></table></div>
    <footer className="ac-phone-search-recordbar"><span>Record:</span><button disabled aria-label="First record">|◀</button><button disabled aria-label="Previous record">◀</button><input readOnly value={visible.length ? "1" : ""} aria-label="Current record"/><button disabled aria-label="Next record">▶</button><button disabled aria-label="Last record">▶|</button><span className="ac-phone-search-filter">▽ No Filter</span><span className="ac-phone-search-status">Search</span><div/><span>{visible.length} contacts</span></footer>
  </section>;
}
