"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AlertRow, AlertTypeOption } from "@/lib/alerts";

export function AlertsScreen({ rows, types, error: initialError }: { rows: AlertRow[]; types: AlertTypeOption[]; error?: string }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(rows[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [typeId, setTypeId] = useState(String(types[0]?.id ?? ""));
  const [alertText, setAlertText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(payload: { action: string; id?: number; typeId?: number; alert?: string }) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Could not save alert.");
      setAdding(false); setAlertText(""); setMessage("Alert updated."); router.refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not save alert."); }
    finally { setBusy(false); }
  }

  function removeSelected() {
    if (selectedId === null) { setMessage("Select an alert first."); return; }
    if (window.confirm("Delete the selected alert?")) void save({ action: "delete", id: selectedId });
  }

  return <section className="alerts-screen">
    <header><h1>Alerts</h1></header>
    <div className="alerts-content">
      <aside className="alerts-actions" aria-label="Alert actions">
        <button onClick={() => { setTypeId(String(types[0]?.id ?? "")); setAlertText(""); setAdding(true); }} aria-label="Add alert" title="Add alert">+</button>
        <button onClick={removeSelected} aria-label="Delete selected alert" title="Delete selected alert">×</button>
      </aside>
      <div className="alerts-grid-wrap">
        <table className="alerts-grid">
          <colgroup>{[24,145,580,98,105,110,130,145].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
          <thead><tr><th/><th>Type</th><th>Alert</th><th>Entry User</th><th>Entry Date</th><th/><th>Completed User</th><th>Completed Date</th></tr></thead>
          <tbody>{rows.map(row => {
            const complete = Boolean(row.completedDate);
            return <tr key={row.id} className={selectedId === row.id ? "is-current" : undefined} onClick={() => setSelectedId(row.id)}>
              <td className="alerts-selector">{selectedId === row.id ? "▸" : ""}</td>
              <td><input readOnly aria-label="Alert type" value={row.type}/></td>
              <td><input readOnly aria-label="Alert text" value={row.alert} title={row.alert}/></td>
              <td><input readOnly aria-label="Entry user" value={row.entryUser}/></td>
              <td><input readOnly aria-label="Entry date" value={row.entryDate}/></td>
                <td><button className="alerts-complete" disabled={complete || busy} onClick={event => { event.stopPropagation(); setSelectedId(row.id); void save({ action: "complete", id: row.id }); }}>Completed</button></td>
              <td><input readOnly aria-label="Completed user" value={row.completedUser}/></td>
              <td><input readOnly aria-label="Completed date" value={row.completedDate}/></td>
            </tr>;
          })}{rows.length === 0 && <tr><td colSpan={8} className="alerts-empty">{initialError || "No alerts were found."}</td></tr>}</tbody>
        </table>
      </div>
    </div>
    {(initialError || message) && <p className="alerts-message" role={initialError ? "alert" : "status"}>{initialError || message}</p>}
    {adding && <div className="alerts-modal-backdrop"><form className="alerts-modal" onSubmit={event => { event.preventDefault(); void save({ action: "add", typeId: Number(typeId), alert: alertText }); }}>
      <h2>New Alert</h2>
      <label>Type<select required value={typeId} onChange={event => setTypeId(event.target.value)}><option value="">Select type</option>{types.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
      <label>Alert<input required maxLength={8000} value={alertText} onChange={event => setAlertText(event.target.value)}/></label>
      <footer><button type="submit" disabled={busy}>Save</button><button type="button" onClick={() => setAdding(false)}>Cancel</button></footer>
    </form></div>}
  </section>;
}
