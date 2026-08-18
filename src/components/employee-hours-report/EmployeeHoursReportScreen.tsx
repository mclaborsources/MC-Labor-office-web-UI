"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

export function EmployeeHoursReportScreen({ mode }: { mode: "week" | "month" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [year, setYear] = useState("2026");
  const [showDates, setShowDates] = useState(false);
  const isWeek = mode === "week";
  const numbered = Array.from({ length: isWeek ? 52 : 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const columns = ["", "First Name", "Last Name", "MI", "Payroll Co", ...numbered, ...(isWeek ? [] : ["Total Hours", "Work Days", "Days On Site"] )];
  return <section className="ac-hours-report">
    <header className="ac-hours-header"><h1>Employee Hours By {isWeek ? "Week" : "Month"} Report</h1><AccessButton>Refresh</AccessButton><AccessButton onClick={() => setName("")}>Zero</AccessButton><div className="ac-hours-step"><b>1)</b><select value={year} onChange={e => setYear(e.target.value)}><option>2026</option><option>2025</option><option>2024</option></select><AccessButton className="ac-hours-find">⌕</AccessButton></div><div className="ac-hours-step ac-hours-step2"><b>2)</b><select defaultValue=""><option value="">&lt;Quarter&gt;</option><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select><span>Between</span><input/><span>And</span><input/><select defaultValue={isWeek ? "Regular Hours" : "Total Hours"}><option>{isWeek ? "Regular Hours" : "Total Hours"}</option><option>Overtime Hours</option></select>{isWeek && <select defaultValue=""><option value="">&lt;Work Hours&gt;</option></select>}<AccessButton className="ac-hours-find">⌕</AccessButton></div><div className="ac-hours-close"><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help">?</button></div></header>
    <div className="ac-hours-filter"><label>Search in Name:<input value={name} onChange={e => setName(e.target.value)}/></label><div className="ac-hours-step ac-hours-step3"><b>3)</b><label><input type="radio" checked={!showDates} onChange={() => setShowDates(false)}/> No {isWeek ? "Dates" : "Months"}</label><label><input type="radio" checked={showDates} onChange={() => setShowDates(true)}/> Show {isWeek ? "Dates" : "Months"}</label><select defaultValue=""><option value="">&lt;{isWeek ? "Week" : "Month"}&gt;</option></select><select defaultValue=""><option value="">&lt;Work Days&gt;</option></select><select defaultValue=""><option value="">&lt;Days On Site&gt;</option></select><select defaultValue="IPG"><option>IPG</option><option>All</option></select></div></div>
    <div className="ac-hours-grid-wrap"><table className="ac-hours-grid"><thead><tr>{columns.map((c,i) => <th key={`${c}-${i}`}>{c}</th>)}</tr></thead><tbody>{Array.from({length:34},(_,r)=><tr key={r}>{columns.map((_,c)=><td key={c}/>)}</tr>)}</tbody></table></div>
    <footer className="ac-hours-record">Record:　|◀　◀　 <input aria-label="Record number"/>　▶　▶|　　<span>▽ Filtered</span>　 <b>Search</b></footer>
  </section>;
}
