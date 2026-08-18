"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

type Accident = { date:string; employee:string; state:string; trade:string; injury:string; claim:string; customer:string; returnDate:string; why:string; days:string; off:string; workDays:string; notes:string; benefits:string; future:string };
const DATA: Accident[] = [
 ["7/14/2026","Edward F Gent","MA","Electrician","7/9/2026","","Summit Welding, LLC","7/14/2026","","","4","2","","",""],
 ["7/14/2026","Sean P Kimball","MA","Laborer","7/9/2026","","Summit Welding, LLC","7/14/2026","","","4","2","","",""],
 ["5/26/2026","Arin P Wilson","NH","Electrician","5/26/2026","","East Coast Electric","5/27/2026","","","0","0","","",""],
 ["5/12/2026","Thomas O Gatturano","MA","Plumber","5/11/2026","","North Shore Mechanical Contractors","","Doctors Orders","68","","","","","5/19/2026"],
 ["5/19/2026","James P Farrar","MA","HVAC / Sheet Metal","5/6/2026","","Inline Mechanical, LLC","5/7/2026","","","0","0","","",""],
 ["10/21/2025","John C Fontes","MA","Electrician","10/17/2025","","Stateline Electrical Inc","","Doctors note","214","","","","","2/19/2026"],
 ["7/29/2025","Alef Victor Soares","MA","Laborer","7/25/2025","","TWB Companies LLC","","","274","","","","","8/5/2025"],
 ["7/24/2025","James G Thomas","MA","Carpenter","7/24/2025","","Shawnlee Construction","","","275","","","","","7/31/2025"],
 ["7/21/2025","Doug P Flematti","ME","Electrician","7/16/2025","","Ewing Electrical Co Inc","","","281","","","","","7/31/2025"],
 ["7/24/2025","Robert A Wells","NH","Electrician","6/2/2025","","Pro Star Energy LLC","6/3/2025","","","0","0","","",""],
 ["7/24/2025","Louis K Njau","NH","Electrician","5/24/2025","","Pro Star Energy LLC","5/26/2025","","","1","0","","",""],
 ["12/27/2024","John P Yanovitch Jr","MA","Electrician","12/13/2024","4A2412V8J6W0","Atlantic Electrical Co","12/13/2024","","","0","0","","",""],
 ["12/6/2024","Dwayne Harris","NH","Electrician","12/4/2024","L016364","S.E. & D. Inc (Street)","12/4/2024","","","0","0","","",""],
 ["12/6/2024","Kaikai K Bamba","MA","Electrician","12/3/2024","L016359","Pro Star Energy LLC","","Doctors Note","442","","","","","5/21/2025"],
 ["11/15/2024","Brenden Thomas","MA","Electrician","11/7/2024","L015524","S & T Electrical","11/25/2024","","","17","11","","",""],
 ["9/10/2024","Michael J Spence","MA","Electrician","9/9/2024","L012522","KMS Construction LLC","10/9/2024","","","29","21","","",""],
 ["8/21/2024","Marcelle D Garrett","MA","Electrician","8/21/2024","L011558","DC Solar Inc.","11/4/2024","","","74","52","","",""],
 ["6/24/2024","Omoteji Davis","MA","Laborer","6/20/2024","L008659","Lothrop Companies","7/16/2024","","","25","17","","",""],
 ["1/18/2024","Austin S Raymond","NH","Electrician","1/17/2024","L000748","S.E. & D. Inc (Street)","1/17/2024","","","0","0","","",""],
 ["11/14/2023","Victor D Kelley","MA","Solar","11/13/2023","K014306","Elm Electrical Inc","11/20/2023","","","6","4","","",""],
 ["11/3/2023","Syrus L Almanzar","MA","Electrician","11/2/2023","K013853","KW Management Inc","12/1/2023","","","28","20","","",""],
].map(([date,employee,state,trade,injury,claim,customer,returnDate,why,days,off,workDays,notes,benefits,future])=>({date,employee,state,trade,injury,claim,customer,returnDate,why,days,off,workDays,notes,benefits,future}));

export function AccidentReportSearchScreen() {
 const router=useRouter(); const [employee,setEmployee]=useState(""); const [customer,setCustomer]=useState(""); const [job,setJob]=useState(""); const [start,setStart]=useState(""); const [end,setEnd]=useState(""); const [year,setYear]=useState(""); const [selected,setSelected]=useState<Set<number>>(new Set());
 const rows=useMemo(()=>DATA.filter(r=>(!employee||r.employee.toLowerCase().includes(employee.toLowerCase()))&&(!customer||r.customer.toLowerCase().includes(customer.toLowerCase()))&&(!job||r.customer.toLowerCase().includes(job.toLowerCase()))&&(!year||r.date.endsWith(year))),[employee,customer,job,year]);
 const clear=()=>{setEmployee("");setCustomer("");setJob("");setStart("");setEnd("");setYear("")};
 return <section className="ac-accident"><header className="ac-accident-header"><h1>Accident Report Search</h1><div className="ac-accident-view"><label>View:</label><select defaultValue="01"><option value="01">01 Default</option></select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><label>Go To:</label><select><option/></select><AccessButton>Refresh</AccessButton><AccessButton onClick={clear}>Zero</AccessButton><AccessButton onClick={()=>window.print()}>Export View</AccessButton></div><div className="ac-accident-close"><AccessButton>Open Accident Report</AccessButton><AccessButton onClick={()=>router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help">?</button></div></header>
 <div className="ac-accident-tools"><div className="ac-accident-search"><strong>SEARCH</strong><label>Employee:<input value={employee} onChange={e=>setEmployee(e.target.value)}/></label><label>Customer:<input value={customer} onChange={e=>setCustomer(e.target.value)}/></label><label>Job:<input value={job} onChange={e=>setJob(e.target.value)}/></label></div><div className="ac-accident-dates"><strong>Date of Injury</strong><label>Start:<input value={start} onChange={e=>setStart(e.target.value)}/></label><label>End:<input value={end} onChange={e=>setEnd(e.target.value)}/></label><label>Year:<select value={year} onChange={e=>setYear(e.target.value)}><option/><option>2026</option><option>2025</option><option>2024</option><option>2023</option></select></label></div><div className="ac-accident-presets">{["01","Claim Note","How it happened","Claim Adjuster","Prepared By","","","","","","","","","","Meeting Report","Brian"].map((v,i)=><AccessButton key={i}>{v}</AccessButton>)}</div><AccessButton className="ac-accident-clear" onClick={clear}>Clear Filters</AccessButton></div>
 <div className="ac-accident-subtools"><span>Select:</span><AccessButton onClick={()=>setSelected(new Set())}>Clear</AccessButton><AccessButton onClick={()=>setSelected(new Set(rows.map((_,i)=>i)))}>All</AccessButton><AccessButton>Send Email</AccessButton><AccessButton>Clear Future Call</AccessButton><div><label>Safety Meeting Date<input/></label><AccessButton>Safety Meeting Report</AccessButton></div><em>Double-click Our Cost to add cost notes and amounts. The total of the cost amounts is displayed here.</em></div>
 <div className="ac-accident-grid-wrap"><table className="ac-accident-grid"><thead><tr>{["","Select","Date","Employee Name","A","Regular Or","P","Date of Injury","Claim #","","Customer Name","Date Return","Why Not Rtd","W Days Off To-Date","OFF","W Days","Claim Notes","Benefits Status","In Hot","$ Reserve","Total Cost","Closed","Future Call","L","Last","Last Adjuster","History"].map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.employee}-${r.date}`} className={i===0?"is-current":undefined}><td/><td><input type="checkbox" checked={selected.has(i)} onChange={()=>setSelected(old=>{const n=new Set(old);if(n.has(i))n.delete(i);else n.add(i);return n})}/></td><td>{r.date}</td><td>{r.employee}</td><td>{r.state}</td><td>{r.trade}</td><td/><td>{r.injury}</td><td>{r.claim}</td><td/><td>{r.customer}</td><td>{r.returnDate}</td><td>{r.why}</td><td>{r.days}</td><td className={r.off?"status":undefined}>{r.off}</td><td className={r.workDays?"status red":undefined}>{r.workDays}</td><td>{r.notes}</td><td>{r.benefits}</td><td><input type="checkbox"/></td><td/><td/><td><input type="checkbox"/></td><td className="future">{r.future}</td><td className="yellow"/><td className="future"/><td className="future"/><td/></tr>)}</tbody></table></div><footer className="ac-accident-record">Record:　|◀　◀　 <input value={rows.length?1:0} readOnly aria-label="Record number"/> of {rows.length}　▶　▶|　　▽ No Filter　 <span>Search</span></footer></section>;
}
