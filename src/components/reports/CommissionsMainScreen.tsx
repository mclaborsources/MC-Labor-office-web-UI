"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommissionMainRow } from "@/lib/commissionsMain";

function dateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function shiftWeek(value: string, days: number) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate()+days); return dateValue(date); }
function money(value: number) { return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function shortDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }); }
function timestamp(value: Date) { return value.toLocaleString("en-US", { weekday: "short", month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export function CommissionsMainScreen({ initialWeekEnding, initialRows, initialError, variant = "main" }: { initialWeekEnding: string; initialRows: CommissionMainRow[]; initialError: string; variant?: "main" | "salesman" | "cluster" | "cluster-salesman" }) {
  const router = useRouter();
  const [weekEnding, setWeekEnding] = useState(initialWeekEnding);
  const [rows, setRows] = useState(initialRows);
  const [salesman, setSalesman] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  const options = useMemo(() => [...new Set(rows.map(row => row.salesman))].sort((a,b) => a.localeCompare(b)), [rows]);
  const visibleRows = rows.filter(row => !salesman || row.salesman === salesman);

  async function refresh(date = weekEnding) {
    setWeekEnding(date); setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/commissions?weekEnding=${encodeURIComponent(date)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not refresh commissions.");
      setRows(result.rows as CommissionMainRow[]); setLastRefresh(timestamp(new Date()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh commissions."); setRows([]);
    } finally { setLoading(false); }
  }
  function exportRows() {
    const csv = ["Week Ending,Salesman,Sales after 20%,Base,Commissionable", ...visibleRows.map(row => [shortDate(row.weekEnding), `"${row.salesman.replaceAll('"','""')}"`, row.salesAfter20.toFixed(2), "", ""].join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `commissions-${weekEnding}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  function action(text: string) { setMessage(text); }

  const salesmanView = variant === "salesman";
  const clusterView = variant === "cluster";
  const clusterSalesmanView = variant === "cluster-salesman";
  const salesmanSpecificView = salesmanView || clusterSalesmanView;
  return <section className={`comm-main${salesmanView ? " comm-salesman-view" : ""}${clusterView ? " comm-cluster-view" : ""}${clusterSalesmanView ? " comm-cluster-salesman-view" : ""}`}>
    <header className="comm-main-toolbar">
      <h1>{salesmanView ? "Commissions for Salesman" : clusterSalesmanView ? "Cluster Commissions for Salesman" : clusterView ? "Cluster Commissions" : "Commissions"}</h1>
      {!salesmanSpecificView && !clusterView && <button onClick={() => action("Commission reminders are not connected yet.")}>Reminders</button>}
      {!clusterView && !clusterSalesmanView && <button className="comm-copy" aria-label="Copy week ending date" onClick={() => void navigator.clipboard?.writeText(weekEnding)}>▣</button>}
      <label>Week Ending:<input type="date" value={weekEnding} onChange={event => event.target.value && setWeekEnding(event.target.value)}/></label>
      {salesmanSpecificView ? (salesmanView && <button className="comm-slim-button" aria-label="Week options" onClick={() => action("Choose a week ending date, then refresh.")}>|</button>) : !clusterView && <button aria-label="Previous week" onClick={() => { const date = shiftWeek(weekEnding,-7); void refresh(date); }}>‹</button>}
      <button className="comm-refresh" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      <span className="comm-spacer"/>
      {!salesmanSpecificView && <label className="comm-salesman"><select aria-label="Salesman filter" value={salesman} onChange={event => setSalesman(event.target.value)}><option value="">&lt;Salesman&gt;</option>{options.map(name => <option key={name}>{name}</option>)}</select></label>}
      <span className="comm-last-refresh">Last Refresh Week: <output>{lastRefresh || "—"}</output></span>
      <button onClick={() => action("Refresh Week is not connected to the payroll refresh service yet.")}>RMV</button>
      {!salesmanSpecificView && <button className="comm-refresh-week" onClick={() => action("Weekly commission refresh is not connected to the office refresh service yet.")}>Refresh Week</button>}
      {clusterView && <><button className="comm-cluster-action" onClick={() => action("Commission reminders are not connected yet.")}>Reminders</button><button className="comm-cluster-action" onClick={() => router.push("/clusters")}>Tracking Clusters</button></>}
      {!salesmanSpecificView && <button onClick={() => router.push("/weekly-customer-margin-report")}>Weekly P&amp;L</button>}
      <button onClick={() => action("Commission history is not connected yet.")}>Commissions History</button>
      <button className="comm-cancel" onClick={() => router.push("/reports")}>Cancel</button>
      <button aria-label="Export commission rows" className="comm-export" onClick={exportRows}>▧</button>
      <button className="comm-help" aria-label="Help" onClick={() => action("Sales after 20% shows customer invoice totals reduced by 20%. Base and Commissionable require the commission rules from the office database.")}>?</button>
    </header>
    {error && <p className="comm-message" role="alert">{error}</p>}{message && <p className="comm-message" role="status">{message}</p>}
    <div className="comm-workspace">
      <div className="comm-left-pane">
        <div className="comm-grid-scroll"><table className="comm-grid"><thead><tr><th>Week Ending</th><th>Salesman</th><th>Sales after 20%</th><th>Base</th><th>Commissionable</th></tr></thead>
          <tbody>{visibleRows.map(row => <tr key={row.id}><td>{shortDate(row.weekEnding)}</td><td>{row.salesman}</td><td>{money(Number(row.salesAfter20))}</td><td></td><td></td></tr>)}{!visibleRows.length && <tr className="comm-empty"><td colSpan={5}>{loading ? "Loading commissions…" : error ? "" : "No commission sales for this week."}</td></tr>}</tbody>
        </table></div>
        <div className="comm-recordbar">Record: <button disabled>◀</button><button disabled>▶</button><span>{visibleRows.length ? `1 of ${visibleRows.length}` : "0 records"}</span><span>No Filter</span><button onClick={() => action("Use the salesman list above to filter the commission rows.")}>Search</button></div>
        <div className="comm-detail-pane" aria-label="Commission details"/>
      </div>
      <div className="comm-right-pane" aria-label="Commission detail grid"><div className="comm-detail-horizontal"><span>◀</span><div/></div></div>
    </div>
  </section>;
}
