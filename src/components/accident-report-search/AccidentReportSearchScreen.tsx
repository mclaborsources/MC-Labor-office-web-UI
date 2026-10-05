"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

type Accident = {
  id: string; date: string; employee: string; job: string; state: string; trade: string; payrollCo: string; injury: string;
  howHappened: string; claim: string; customer: string; returnDate: string; why: string; daysOff: string; workdaysOut: string;
  notes: string; benefits: string; inHouse: boolean; reserve: string; totalCost: string; closed: boolean;
  future: string; adjuster: string; adjusterEmail: string; adjusterPhone: string; adjusterExtension: string; adjusterNotes: string;
  insuranceCompany: string; history: string; preparedBy: string; accidentsWithCustomer: string;
};
type ReportResponse = { ok: boolean; data?: Record<string, unknown>[]; error?: string };
function value(row: Record<string, unknown>, key: string) { return row[key] == null ? "" : String(row[key]); }
function checked(row: Record<string, unknown>, key: string) { return value(row, key) === "Yes"; }
function asDate(value: string) {
  const [month, day, year] = value.split("/").map(Number);
  return month && day && year ? new Date(year, month - 1, day) : null;
}

export function AccidentReportSearchScreen() {
  const router = useRouter();
  const [allRows, setAllRows] = useState<Accident[]>([]);
  const [activePreset, setActivePreset] = useState("01");
  const [employee,setEmployee]=useState(""); const [customer,setCustomer]=useState(""); const [job,setJob]=useState("");
  const [start,setStart]=useState(""); const [end,setEnd]=useState(""); const [year,setYear]=useState("");
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [loading,setLoading]=useState(true); const [error,setError]=useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/reports/accidents", { cache: "no-store" })
      .then(async response => {
        const result = await response.json() as ReportResponse;
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load accident reports.");
        if (!active) return;
        setAllRows((result.data ?? []).map(row => ({
          id:value(row,"id"), date:value(row,"Date"), employee:value(row,"Employee"), job:value(row,"Job"), state:value(row,"State"),
          trade:value(row,"Trade"), payrollCo:value(row,"PayrollCo"), injury:value(row,"Injury"), howHappened:value(row,"How it happened"), claim:value(row,"Claim"),
          customer:value(row,"Customer"), returnDate:value(row,"Return Date"), why:value(row,"Why Not Returned"),
          daysOff:value(row,"Days Off"), workdaysOut:value(row,"Workdays Out"), notes:value(row,"Claim Notes"),
          benefits:value(row,"Benefits Status"), inHouse:checked(row,"In House"), reserve:value(row,"Reserve"),
          totalCost:value(row,"Total Cost"), closed:checked(row,"Closed"), future:value(row,"Future Call"),
          adjuster:value(row,"Last Adjuster"), adjusterEmail:value(row,"Adjuster Email"), adjusterPhone:value(row,"Adjuster Phone"),
          adjusterExtension:value(row,"Adjuster Extension"), adjusterNotes:value(row,"Adjuster Notes"),
          insuranceCompany:value(row,"Insurance Company"), history:value(row,"History"), preparedBy:value(row,"Prepared By"),
          accidentsWithCustomer:value(row,"Accidents with Customer"),
        })));
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load accident reports."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const rows=useMemo(()=>allRows.filter(r=>{
    const injuryDate=asDate(r.injury), startDate=start?new Date(`${start}T00:00:00`):null, endDate=end?new Date(`${end}T23:59:59`):null;
    return (!employee||r.employee.toLowerCase().includes(employee.toLowerCase()))
      &&(!customer||r.customer.toLowerCase().includes(customer.toLowerCase()))
      &&(!job||r.job.toLowerCase().includes(job.toLowerCase()))
      &&(!year||r.injury.endsWith(year))
      &&(!startDate||(injuryDate!==null&&injuryDate>=startDate))
      &&(!endDate||(injuryDate!==null&&injuryDate<=endDate));
  }),[allRows,employee,customer,job,start,end,year]);
  const clear=()=>{setEmployee("");setCustomer("");setJob("");setStart("");setEnd("");setYear("")};
  const years=Array.from(new Set(allRows.map(row=>row.injury.slice(-4)).filter(value=>/^\d{4}$/.test(value)))).sort((a,b)=>Number(b)-Number(a));
  const showHowHappened = activePreset === "How it happened";
  const showClaimNotes = activePreset === "Claim Note";
  const showClaimAdjuster = activePreset === "Claim Adjuster";
  const showPreparedBy = activePreset === "Prepared By";
  const defaultHeadings = ["", "Select", "Date", "Employee Name", "A", "Regular Or", "P", "Date of Injury", "Claim #", "", "Customer Name", "Date Return", "Why Not Rtd", "Days Off To-Date", "OFF", "W Days", "Claim Notes", "Benefits Status", "In Hot", "$ Reserve", "Total Cost", "Closed", "Future Call", "L", "Last", "Last Adjuster", "History"];
  const howHeadings = ["", "Describe How Injury Occurred", "A", "Regular Or", "P", "W Days Off To-Date", "Benefits Status", "Future Call", "L"];
  const claimNoteHeadings = ["", "Claim Notes", "Employee Name", "Date of Injury", "Claim #", "Customer Name", "Regular Or", "Last Adjuster"];
  const claimAdjusterHeadings = ["", "A", "Regular Or", "Insurance Company", "Claims Adjuster", "Claims Adjuster: Email", "Claims Adjuster: Phone", "Claims Adjuster: Extension", "Claims Adjuster: Notes"];
  const preparedByHeadings = ["", "Prepared By", "Date", "P", "History Status", "W Days Off To-Date", "Benefits Status", "Num Accidents with Customer"];

  return <section className="ac-accident"><header className="ac-accident-header"><h1>Accident Report Search</h1><div className="ac-accident-view"><label>View:</label><select defaultValue="01"><option value="01">01 Default</option></select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><label>Go To:</label><select><option/></select><AccessButton onClick={()=>window.location.reload()}>Refresh</AccessButton><AccessButton onClick={clear}>Zero</AccessButton><AccessButton onClick={()=>window.print()}>Export View</AccessButton></div><div className="ac-accident-close"><AccessButton>Open Accident Report</AccessButton><AccessButton onClick={()=>router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help">?</button></div></header>
    <div className="ac-accident-tools"><div className="ac-accident-search"><strong>SEARCH</strong><label>Employee:<input value={employee} onChange={e=>setEmployee(e.target.value)}/></label><label>Customer:<input value={customer} onChange={e=>setCustomer(e.target.value)}/></label><label>Job:<input value={job} onChange={e=>setJob(e.target.value)}/></label></div><div className="ac-accident-dates"><strong>Date of Injury</strong><label>Start:<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>End:<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><label>Year:<select value={year} onChange={e=>setYear(e.target.value)}><option value="">All years</option>{years.map(y=><option key={y}>{y}</option>)}</select></label></div><div className="ac-accident-presets">{["01","Claim Note","How it happened","Claim Adjuster","Prepared By","","","","","","","","","","Meeting Report","Brian"].map((v,i)=><AccessButton key={i} variant={v===activePreset?"go":"default"} onClick={v?()=>setActivePreset(v):undefined}>{v}</AccessButton>)}</div><AccessButton className="ac-accident-clear" onClick={clear}>Clear Filters</AccessButton></div>
    <div className="ac-accident-subtools"><span>Select:</span><AccessButton onClick={()=>setSelected(new Set())}>Clear</AccessButton><AccessButton onClick={()=>setSelected(new Set(rows.map(row=>row.id)))}>All</AccessButton><AccessButton>Send Email</AccessButton><AccessButton>Clear Future Call</AccessButton><div><label>Safety Meeting Date<input type="date"/></label><AccessButton>Safety Meeting Report</AccessButton></div><em>{loading?"Loading all accident reports…":error||`Showing ${rows.length} of ${allRows.length} accident reports.`}</em></div>
    <div className={`ac-accident-grid-wrap${showHowHappened?" is-how-view":""}${showClaimNotes?" is-claim-note-view":""}${showClaimAdjuster?" is-claim-adjuster-view":""}${showPreparedBy?" is-prepared-by-view":""}`}><table className="ac-accident-grid"><thead><tr>{(showHowHappened?howHeadings:showClaimNotes?claimNoteHeadings:showClaimAdjuster?claimAdjusterHeadings:showPreparedBy?preparedByHeadings:defaultHeadings).map((h,i)=><th key={i} className={(showHowHappened||showClaimNotes)&&i===1?"ac-accident-how-column":showClaimAdjuster&&i===8?"ac-accident-how-column":undefined}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id} className={i===0?"is-current":undefined}>{showHowHappened?<><td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>setSelected(old=>{const n=new Set(old);if(n.has(r.id))n.delete(r.id);else n.add(r.id);return n})}/></td><td className="ac-accident-how-column" title={r.howHappened}>{r.howHappened}</td><td>{r.state}</td><td>{r.trade}</td><td>{r.payrollCo}</td><td>{r.workdaysOut}</td><td>{r.benefits}</td><td className="future">{r.future}</td><td className="yellow"/></>:showClaimNotes?<><td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>setSelected(old=>{const n=new Set(old);if(n.has(r.id))n.delete(r.id);else n.add(r.id);return n})}/></td><td className="ac-accident-how-column">{r.notes}</td><td>{r.employee}</td><td>{r.injury}</td><td>{r.claim}</td><td>{r.customer}</td><td>{r.trade}</td><td>{r.adjuster}</td></>:showClaimAdjuster?<><td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>setSelected(old=>{const n=new Set(old);if(n.has(r.id))n.delete(r.id);else n.add(r.id);return n})}/></td><td>{r.state}</td><td>{r.trade}</td><td>{r.insuranceCompany}</td><td>{r.adjuster}</td><td>{r.adjusterEmail}</td><td>{r.adjusterPhone}</td><td>{r.adjusterExtension}</td><td className="ac-accident-how-column">{r.adjusterNotes}</td></>:showPreparedBy?<><td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>setSelected(old=>{const n=new Set(old);if(n.has(r.id))n.delete(r.id);else n.add(r.id);return n})}/></td><td>{r.preparedBy}</td><td>{r.date}</td><td>{r.payrollCo}</td><td>{r.history}</td><td>{r.workdaysOut}</td><td>{r.benefits}</td><td>{r.accidentsWithCustomer}</td></>:<><td/><td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>setSelected(old=>{const n=new Set(old);if(n.has(r.id))n.delete(r.id);else n.add(r.id);return n})}/></td><td>{r.date}</td><td>{r.employee}</td><td>{r.state}</td><td>{r.trade}</td><td>{r.payrollCo}</td><td>{r.injury}</td><td>{r.claim}</td><td/><td>{r.customer}</td><td>{r.returnDate}</td><td>{r.why}</td><td>{r.workdaysOut}</td><td className={r.daysOff?"status":undefined}>{r.daysOff}</td><td className={r.workdaysOut?"status red":undefined}>{r.workdaysOut}</td><td>{r.notes}</td><td>{r.benefits}</td><td><input type="checkbox" checked={r.inHouse} readOnly/></td><td>{r.reserve}</td><td>{r.totalCost}</td><td><input type="checkbox" checked={r.closed} readOnly/></td><td className="future">{r.future}</td><td className="yellow"/><td className="future"/><td className="future">{r.adjuster}</td><td>{r.history}</td></>}</tr>)}</tbody></table>{error&&!loading&&<p role="alert">{error}</p>}{!loading&&!error&&rows.length===0&&<p>No accident reports match these filters.</p>}</div><footer className="ac-accident-record">Records: {rows.length} of {allRows.length}　　▽ No Filter　 <span>Search</span></footer></section>;
}
