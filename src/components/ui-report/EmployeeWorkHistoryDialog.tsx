"use client";

import { useEffect, useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import { DAY_FLAG_BG } from "@/lib/trackingConstants";

type HistoryRecord = Record<string, unknown>;
type HistoryResponse = { ok: boolean; data?: HistoryRecord[]; error?: string };
const columns = ["Payroll Co", "Customer", "Job", "State", "Grade", "Week Ending", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Total", "Gross Payroll", "Pay Rate", "Bill Rate", "Margin", "Check Note", "Health", "Travel/Hr", "Vac/Hr", "Sick", "Schooling Per Hr", "Tools Per Hr", "Parking Per Hr", "Emp Notes"];
function text(record: HistoryRecord, key: string) { return record[key] == null ? "" : String(record[key]); }
function amount(record: HistoryRecord, key: string) {
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : 0;
}
function displayCell(record: HistoryRecord, column: string) {
  const raw = text(record, column);
  if (!raw) return "";
  if (["Gross Payroll", "Pay Rate", "Bill Rate", "Parking Per Hr"].includes(column)) {
    const value = Number(raw);
    return Number.isFinite(value) ? `$${value.toFixed(2)}` : raw;
  }
  if (column === "Margin") {
    const value = Number(raw);
    return Number.isFinite(value) ? value.toFixed(2) : raw;
  }
  if (hourColumns.includes(column as typeof hourColumns[number])) {
    const value = Number(raw);
    return Number.isFinite(value) ? String(Number(value.toFixed(2))) : raw;
  }
  return raw;
}
function isoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
const hourColumns = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"] as const;
function formatAmount(value: number) { return Number(value.toFixed(2)); }
function weeklyRows(rows: HistoryRecord[]): HistoryRecord[] {
  const byWeek = new Map<string, HistoryRecord[]>();
  for (const row of rows) {
    const week = text(row, "Week Ending");
    byWeek.set(week, [...(byWeek.get(week) ?? []), row]);
  }
  return [...byWeek].map(([week, weekRows]) => {
    const sum = (key: string) => weekRows.reduce((total, row) => total + amount(row, key), 0);
    const unique = (key: string) => [...new Set(weekRows.map(row => text(row, key)).filter(Boolean))];
    const label = (key: string) => {
      const values = unique(key);
      return values.length === 1 ? values[0] : values.length > 1 ? "Multiple" : "";
    };
    const total = sum("Total");
    const gross = sum("Gross Payroll");
    const billTotal = weekRows.reduce((value, row) => value + amount(row, "Bill Rate") * amount(row, "Total"), 0);
    const marginTotal = weekRows.reduce((value, row) => value + amount(row, "Margin") * amount(row, "Total"), 0);
    const parkingTotal = weekRows.reduce((value, row) => value + amount(row, "Parking Per Hr") * amount(row, "Total"), 0);
    return {
      id: `week-${week}`,
      "Payroll Co": label("Payroll Co"), Customer: label("Customer"), Job: label("Job"),
      State: label("State"), Grade: label("Grade"), "Week Ending": week,
      SatStatus: 0, SunStatus: 0, MonStatus: 0, TueStatus: 0, WedStatus: 0, ThuStatus: 0, FriStatus: 0,
      ...Object.fromEntries(hourColumns.map(day => [day, formatAmount(sum(day))])),
      Total: formatAmount(total), "Gross Payroll": formatAmount(gross),
      "Pay Rate": total ? formatAmount(gross / total) : 0,
      "Bill Rate": total ? formatAmount(billTotal / total) : 0,
      Margin: total ? formatAmount(marginTotal / total) : 0,
      "Check Note": label("Check Note"), Health: label("Health"),
      "Travel/Hr": "", "Vac/Hr": "", Sick: "", "Schooling Per Hr": "", "Tools Per Hr": "",
      "Parking Per Hr": total ? formatAmount(parkingTotal / total) : 0, "Emp Notes": "",
    };
  });
}

export function EmployeeWorkHistoryDialog({ employeeId, employeeName, onClose }: { employeeId: string; employeeName: string; onClose: () => void }) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [startDate, setStartDate] = useState("2000-01-07");
  const [endDate, setEndDate] = useState(isoDate(new Date()));
  const [payrollCo, setPayrollCo] = useState("");
  const [mode, setMode] = useState("adjustments");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const query = new URLSearchParams({ employeeId, startDate, endDate });
    fetch(`/api/reports/ui-requests/employee-history?${query}`, { cache: "no-store" })
      .then(async response => {
        const result = await response.json() as HistoryResponse;
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load employee work history.");
        if (active) setRecords(result.data ?? []);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load employee work history."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employeeId, startDate, endDate, refreshKey]);

  const payrollOptions = useMemo(() => [...new Set(records.map(row => text(row,"Payroll Co")).filter(Boolean))].sort(), [records]);
  const visible = useMemo(() => {
    const selected = records.filter(row => !payrollCo || text(row, "Payroll Co") === payrollCo);
    if (mode === "hours") {
      // Some adjustment-only records can have a nonzero total without any
      // daily work hours, so use the individual day columns for this filter.
      return selected.filter(row => hourColumns.some(day => amount(row, day) > 0));
    }
    if (mode === "week") return weeklyRows(selected);
    // The Access "With Adjustments" view includes every tracking record.
    return selected;
  }, [records, payrollCo, mode]);
  const exportCsv = () => {
    const quote = (v: unknown) => `"${String(v ?? "").replaceAll('"','""')}"`;
    const csv = [columns.map(quote).join(","), ...visible.map(row => columns.map(column=>quote(row[column])).join(","))].join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); link.download = `${employeeName.replace(/[^a-z0-9]+/gi,"-")}-work-history.csv`; link.click(); URL.revokeObjectURL(link.href);
  };

  return <div className="ui-work-history-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><section className="ui-work-history" role="dialog" aria-modal="true" aria-label="Employee Work History">
    <header><h1>Employee Work History</h1><div className="ui-work-history-actions"><label>View: <select defaultValue="View 07"><option>View 07</option></select></label><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><label>Go To: <select><option value=""/></select></label><AccessButton onClick={()=>setRefreshKey(key=>key+1)}>Refresh</AccessButton><AccessButton onClick={exportCsv}>Export View</AccessButton><AccessButton className="ui-work-history-cancel" onClick={onClose}>Cancel</AccessButton></div></header>
    <div className="ui-work-history-presets">{["Default","View 08","View 09","View 10","View 11","View 12"].map((view,i)=><button key={view} className={i===0?"selected":""}>{view}</button>)}</div>
    <div className="ui-work-history-modes"><label><input type="radio" name="history-mode" checked={mode==="adjustments"} onChange={()=>setMode("adjustments")}/>With Adjustments</label><label><input type="radio" name="history-mode" checked={mode==="hours"} onChange={()=>setMode("hours")}/>Just Work Hours</label><label><input type="radio" name="history-mode" checked={mode==="week"} onChange={()=>setMode("week")}/>By Week</label></div>
    <h2>{employeeName}</h2>
    <div className="ui-work-history-filters"><label>Start Week Ending<input type="date" value={startDate} onChange={event=>setStartDate(event.target.value)}/></label><label>Start Year<select defaultValue="all"><option value="all">&lt;ALL&gt;</option>{Array.from({length:new Date().getFullYear()-1999},(_,i)=>String(new Date().getFullYear()-i)).map(year=><option key={year}>{year}</option>)}</select></label><label>End Week Ending<input type="date" value={endDate} onChange={event=>setEndDate(event.target.value)}/></label><label className="ui-work-history-payroll">Payroll Co<select value={payrollCo} onChange={event=>setPayrollCo(event.target.value)}><option value="">&lt;Payroll Co&gt;</option>{payrollOptions.map(value=><option key={value}>{value}</option>)}</select></label><span>Select:</span><AccessButton onClick={()=>setPayrollCo("")}>All</AccessButton></div>
    {error&&<p role="alert" className="ui-work-history-error">{error}</p>}
    <div className="ui-work-history-grid"><table><thead><tr><th/>{columns.map(column=><th key={column}>{column==="Payroll Co"?"Pay":column}<b>▾</b></th>)}</tr></thead><tbody>{visible.map((row,index)=><tr key={text(row,"id")} className={index===0?"selected":""}><td/>{columns.map(column=>{const statusKey=`${column}Status`;const status=String(row[statusKey]??"");const dayColumn=hourColumns.includes(column as typeof hourColumns[number]);const coloredColumn=["Health","Travel/Hr","Vac/Hr","Sick"].includes(column);return <td key={column} className={column==="Payroll Co"?"payroll":coloredColumn?`work-color-${column.replace(/[^a-z]/gi,"").toLowerCase()}`:column==="Margin"?"margin":undefined} style={dayColumn&&DAY_FLAG_BG[status]?{backgroundColor:DAY_FLAG_BG[status]}:undefined}>{displayCell(row,column)}</td>})}</tr>)}</tbody></table>{loading&&<p>Loading work history…</p>}{!loading&&!error&&!visible.length&&<p>No work history found for this employee and date range.</p>}</div>
    <footer>Records: {visible.length} of {records.length}　　{loading?"Loading…":"No Filter"}</footer>
  </section></div>;
}
