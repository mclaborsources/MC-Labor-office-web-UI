"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { PayrollCrosscheckRow } from "@/lib/payrollCrosschecks";

type Company = { id: number; name: string; code: string };
type Bounce = { amount: number; note: string; date: string };
type CrossSortKey = "weekEnding" | "payrollCo" | "grossPayroll" | "companyGrossPayroll" | "difference";
const views = ["View 01", "View 02", "View 03", "View 04", "View 05", "View 06", "View 07", "View 08", "View 09", "View 10", "View 11"];
function dateValue(value: string) { return new Date(`${value}T12:00:00`); }
function valueDate(value: Date) { return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`; }
function nextFriday(value: string) { const date = dateValue(value); date.setDate(date.getDate() + ((5-date.getDay()+7)%7)); return valueDate(date); }
function shiftDate(value: string, days: number) { const date = dateValue(value); date.setDate(date.getDate()+days); return valueDate(date); }
function longDate(value: string, plusDays = 0) { const date = dateValue(value); date.setDate(date.getDate()+plusDays); return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
function money(value: number | null) { if (value == null) return ""; const formatted = Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return value < 0 ? `($${formatted})` : `$${formatted}`; }
function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
const columns = [["weekEnding", "Week Ending"], ["payrollCo", "Payroll Co"], ["grossPayroll", "Gross Payroll"], ["companyGrossPayroll", "Gross Payroll from Payroll Company"], ["difference", "Difference"], ["whyDifferent", "Why Different"], ["bounceBack", "Bounce Back"]] as const;

export function PayrollCrosschecksScreen({ initialStart, initialEnd, initialRows, companies, initialError }: { initialStart: string; initialEnd: string; initialRows: PayrollCrosscheckRow[]; companies: Company[]; initialError: string }) {
  const router = useRouter();
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [payrollCo, setPayrollCo] = useState(companies.find((company) => company.code.toUpperCase() === "IPG")?.code ?? companies[0]?.code ?? "");
  const [rows, setRows] = useState(initialRows);
  const [view, setView] = useState("View 01");
  const [sort, setSort] = useState<{ key: CrossSortKey; desc: boolean }>({ key: "weekEnding", desc: false });
  const [bounce, setBounce] = useState<Record<string, Bounce>>({});
  const [editing, setEditing] = useState<PayrollCrosscheckRow | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");

  useEffect(() => { try { const saved = localStorage.getItem("payroll-crosscheck-bouncebacks"); if (saved) setBounce(JSON.parse(saved)); } catch { setBounce({}); } }, []);

  const visible = useMemo(() => [...rows].sort((a, b) => {
    const left = a[sort.key]; const right = b[sort.key];
    const cmp = typeof left === "number" && typeof right === "number" ? left - right : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });
    return sort.desc ? -cmp : cmp;
  }), [rows, sort]);
  const totalPayroll = visible.reduce((sum, row) => sum + Number(row.grossPayroll || 0), 0);
  const totalDifference = visible.reduce((sum, row) => sum + Number(row.difference || 0), 0);

  async function load(from = start, through = end, company = payrollCo) {
    const normalizedStart = nextFriday(from); const normalizedEnd = nextFriday(through);
    if (normalizedStart > normalizedEnd) { setError("Start date must be on or before end date."); return; }
    setStart(normalizedStart); setEnd(normalizedEnd); setLoading(true); setError(""); setMessage("");
    try {
      const params = new URLSearchParams({ startDate: normalizedStart, endDate: normalizedEnd, payrollCo: company });
      const response = await fetch(`/api/payroll-crosschecks?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not refresh payroll crosschecks.");
      setRows(result.rows as PayrollCrosscheckRow[]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh payroll crosschecks."); setRows([]); }
    finally { setLoading(false); }
  }
  function saveView() { try { localStorage.setItem(`payroll-crosschecks-${view}`, JSON.stringify({ start, end, payrollCo, sort })); setMessage(`${view} saved on this computer.`); } catch { setMessage("The view could not be saved in this browser."); } }
  function changeView(name: string) { setView(name); try { const saved = localStorage.getItem(`payroll-crosschecks-${name}`); if (saved) { const data = JSON.parse(saved); setSort(data.sort ?? { key: "weekEnding", desc: false }); setPayrollCo(data.payrollCo ?? payrollCo); void load(data.start ?? start, data.end ?? end, data.payrollCo ?? payrollCo); } } catch { setMessage("Saved view could not be loaded."); } }
  function startBounce(row: PayrollCrosscheckRow) { const current = bounce[row.id] ?? { amount: 0, note: "", date: "" }; setEditing(row); setAmount(current.amount ? String(current.amount) : ""); setNote(current.note); }
  function saveBounce() {
    if (!editing) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed)) { setMessage("Enter a valid bounce-back amount."); return; }
    const next = { ...bounce, [editing.id]: { amount: parsed, note: note.trim(), date: new Date().toLocaleDateString("en-US") } };
    setBounce(next); try { localStorage.setItem("payroll-crosscheck-bouncebacks", JSON.stringify(next)); } catch { /* keep the current in-memory edit */ }
    setEditing(null); setMessage("Bounce-back note saved in this browser.");
  }
  function exportView() {
    const lines = [columns.map(([, label]) => label), ...visible.map((row) => [row.weekEnding, row.payrollCo, row.grossPayroll, row.companyGrossPayroll ?? "", row.difference, "", bounce[row.id]?.amount ?? ""])];
    const file = lines.map((line) => line.map(csv).join(",")).join("\r\n"); const url = URL.createObjectURL(new Blob(["\uFEFF", file], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `payroll-crosschecks-${start}-to-${end}-${payrollCo || "all"}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="regular-payroll-screen payroll-crosschecks-screen">
    <header className="rpr-toolbar"><h1>Payroll Crosschecks</h1><label>View:<select value={view} onChange={(event) => changeView(event.target.value)}>{views.map((name) => <option key={name}>{name}</option>)}</select></label>
      <AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={() => { localStorage.removeItem(`payroll-crosschecks-${view}`); setMessage(`${view} deleted.`); }}>Delete View</AccessButton>
      <AccessButton onClick={() => void load()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</AccessButton>
      <AccessButton onClick={() => { const resetEnd = nextFriday(initialEnd); const resetStart = shiftDate(resetEnd, -77); const resetCompany = companies.find((company) => company.code.toUpperCase() === "IPG")?.code ?? ""; setStart(resetStart); setEnd(resetEnd); setPayrollCo(resetCompany); void load(resetStart, resetEnd, resetCompany); }}>Zero</AccessButton>
      <AccessButton onClick={exportView}>Export View</AccessButton>
      <select className="pcx-code-select" aria-label="Payroll company initials" value={payrollCo} onChange={(event) => { setPayrollCo(event.target.value); void load(start, end, event.target.value); }}><option value="">All</option>{companies.map((company) => <option key={company.id} value={company.code}>{company.code}</option>)}</select>
      <button className="rpr-cancel" onClick={() => router.push("/reports")}>Cancel</button><button className="rpr-help" aria-label="Help" onClick={() => setMessage("Gross Payroll is calculated from weekly tracking and adjustments. Double-click Bounce Back to add an amount and note.")}>?</button>
    </header>
    <div className="pcx-filters"><div className="pcx-left">
      <label>Payroll Company<select value={payrollCo} onChange={(event) => { setPayrollCo(event.target.value); void load(start, end, event.target.value); }}><option value="">All Companies</option>{companies.map((company) => <option key={company.id} value={company.code}>{company.name} ({company.code})</option>)}</select><i>(for title on Export View)</i></label>
      <div className="pcx-date-row"><div className="pcx-date-pair"><strong>Week Ending Friday</strong><label>Start<input aria-label="Start week ending Friday" type="date" value={start} onChange={(event) => event.target.value && setStart(nextFriday(event.target.value))} /></label><label>End<input aria-label="End week ending Friday" type="date" value={end} onChange={(event) => event.target.value && setEnd(nextFriday(event.target.value))} /></label></div><div className="pcx-week-nav"><i>(click date first)</i><div><button aria-label="Previous week" onClick={() => { const from=shiftDate(start,-7), through=shiftDate(end,-7); setStart(from); setEnd(through); void load(from,through); }}>←</button><button aria-label="Current week" onClick={() => { const through=nextFriday(valueDate(new Date())); const from=shiftDate(through,-77); setStart(from); setEnd(through); void load(from,through); }}>▣</button><button aria-label="Next week" onClick={() => { const from=shiftDate(start,7), through=shiftDate(end,7); setStart(from); setEnd(through); void load(from,through); }}>→</button></div></div>
        <label>Start and End Days of Report<output>{longDate(start,-6)}</output><output>{longDate(start)}</output></label><label>Start and End Payroll Chk Days<output>{longDate(start,6)}</output><output>{longDate(end,6)}</output></label><AccessButton onClick={() => void load()} disabled={loading}>Refresh</AccessButton>
      </div>
    </div><div className="pcx-views-area"><div className="pcx-view-buttons">{["View 01","View 02","View 03","","","View 06","View 07","","","","View 11","","","",""].map((name,index)=><button key={`${name}-${index}`} className={view===name&&name?"is-active":""} disabled={!name} onClick={()=>changeView(name)}>{name}</button>)}</div><i>Double-click Bounce Back to add bounce back notes and amounts. The last Bounce Back amount is displayed here.</i></div></div>
    {error && <p className="rpr-error" role="alert">{error}</p>}{message && <p className="rpr-message" role="status">{message}</p>}
    <div className="rpr-grid-wrap pcx-grid-wrap"><table className="rpr-grid pcx-grid"><thead><tr>{columns.map(([key,label])=><th key={key}><button onClick={()=>{const sortKey=String(key);if(["weekEnding","payrollCo","grossPayroll","companyGrossPayroll","difference"].includes(sortKey)){setSort((current)=>({key:sortKey as CrossSortKey,desc:current.key===sortKey?!current.desc:false}));}}}>{label}<span>{sort.key===key?(sort.desc?"▼":"▲"):"⌄"}</span></button></th>)}</tr></thead><tbody>
      {visible.map((row)=><tr key={row.id}>{columns.map(([key])=><td key={key} onDoubleClick={key==="bounceBack"?()=>startBounce(row):undefined} className={key==="payrollCo"?`rpr-co rpr-co-${row.payrollCo.toLowerCase().replace(/[^a-z0-9]/g,"")}`:""}>{key==="grossPayroll"||key==="companyGrossPayroll"||key==="difference"?money(key==="grossPayroll"?row.grossPayroll:key==="companyGrossPayroll"?row.companyGrossPayroll:row.difference):key==="whyDifferent"?"":key==="bounceBack"?bounce[row.id]?.amount?money(bounce[row.id].amount):"":String(row[key]??"")}</td>)}</tr>)}
      <tr className="pcx-total"><td><strong>Total</strong></td><td>{payrollCo}</td><td>{money(totalPayroll)}</td><td/><td>{money(totalDifference)}</td><td/><td>{money(visible.reduce((sum,row)=>sum+(bounce[row.id]?.amount??0),0))}</td></tr>
      {Array.from({length:Math.max(0,15-Math.min(visible.length,15))},(_,index)=><tr className="rpr-empty-row" key={`empty-${index}`}>{columns.map(([key])=><td key={key}/>)}</tr>)}
    </tbody></table></div>
    <footer className="rpr-footer"><span>Record: {visible.length?`1 of ${visible.length}`:"0"}</span><span>No Filter</span><input aria-label="Search crosschecks" placeholder="Search"/><span>{visible.length} records</span></footer>
    {editing&&<div className="pcx-modal-backdrop"><form className="pcx-modal" onSubmit={(event)=>{event.preventDefault();saveBounce();}}><h2>Bounce Back</h2><p>{editing.payrollCo} · Week ending {editing.weekEnding}</p><label>Amount<input type="number" step="0.01" value={amount} onChange={(event)=>setAmount(event.target.value)}/></label><label>Note<textarea value={note} onChange={(event)=>setNote(event.target.value)}/></label><footer><button type="button" onClick={()=>setEditing(null)}>Cancel</button><button type="submit">Save</button></footer></form></div>}
  </section>;
}
