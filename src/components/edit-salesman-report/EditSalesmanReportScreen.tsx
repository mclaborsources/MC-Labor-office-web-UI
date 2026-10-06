"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";

type Row = { id: number; customer: string; contractSalesmanId: number | null; salesmanId: number | null };
type Salesman = { id: number; label: string };
type Result = { ok: boolean; rows?: Row[]; salesmen?: Salesman[]; contractFieldAvailable?: boolean; total?: number; limited?: boolean; error?: string };
type ViewState = { search: string };
const viewName = "edit-salesman-report-view";

export function EditSalesmanReportScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [hasContractField, setHasContractField] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [view, setView] = useState("01 Default");
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/edit-salesman-report?search=${encodeURIComponent(search)}&refresh=${revision}`, { cache: "no-store" });
      const result = await response.json() as Result;
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load customers.");
      setRows(result.rows ?? []); setSalesmen(result.salesmen ?? []); setHasContractField(result.contractFieldAvailable ?? false);
      if (result.limited) setMessage("Showing the first 2,000 customer records. Search to narrow the list.");
      else setMessage("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load customers."); }
    finally { setLoading(false); }
  }, [search, revision]);
  useEffect(() => { void load(); }, [load]);

  const salesmanOptions = useMemo(() => salesmen.filter(item => item.label.trim()), [salesmen]);
  async function update(row: Row, field: "contractSalesmanId" | "salesmanId", value: string) {
    const updated = { ...row, [field]: value ? Number(value) : null };
    setRows(old => old.map(item => item.id === row.id ? updated : item)); setPending(row.id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/edit-salesman-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: row.id, contractSalesmanId: updated.contractSalesmanId, salesmanId: updated.salesmanId }) });
      const result = await response.json() as Result;
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save this customer.");
      setMessage(`${row.customer} updated.`);
    } catch (cause) {
      setRows(old => old.map(item => item.id === row.id ? row : item));
      setError(cause instanceof Error ? cause.message : "Unable to save this customer.");
    } finally { setPending(null); }
  }
  function saveView() {
    try { localStorage.setItem(`${viewName}-${view}`, JSON.stringify({ search } satisfies ViewState)); setMessage(`${view} saved on this computer.`); }
    catch { setError("Unable to save this view in this browser."); }
  }
  function loadView(name: string) {
    setView(name);
    try { const raw = localStorage.getItem(`${viewName}-${name}`); if (raw) { const state = JSON.parse(raw) as ViewState; setSearch(state.search ?? ""); setDraftSearch(state.search ?? ""); } }
    catch { setError("Unable to load this saved view."); }
  }
  function deleteView() {
    localStorage.removeItem(`${viewName}-${view}`); setSearch(""); setDraftSearch(""); setView("01 Default"); setMessage("Saved view deleted.");
  }
  function zero() { setSearch(""); setDraftSearch(""); setError(""); setMessage(""); }

  return <section className="edit-salesman-report">
    <header className="esr-header"><h1>Edit Salesman Report</h1><div className="esr-view"><label>View: <select value={view} onChange={event => loadView(event.target.value)}>{Array.from({ length: 10 }, (_, i) => { const name = `${String(i + 1).padStart(2, "0")} ${i === 0 ? "Default" : `View ${String(i + 1).padStart(2, "0")}`}`; return <option key={name}>{name}</option>; })}</select></label><AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={deleteView}>Delete View</AccessButton><AccessButton onClick={() => setRevision(value => value + 1)}>Refresh</AccessButton><AccessButton onClick={zero}>Zero</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Close</AccessButton></div></header>
    <div className="esr-search"><label htmlFor="esr-customer-search">Search in Customer:</label><input id="esr-customer-search" value={draftSearch} onChange={event => setDraftSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter") setSearch(draftSearch.trim()); }}/><AccessButton onClick={() => setSearch(draftSearch.trim())}>Search</AccessButton></div>
    {!hasContractField && <p className="esr-note">The connected database has no recognized Contract Salesman field. The grid is read-only until that field is confirmed.</p>}
    {(error || message) && <p className={error ? "esr-error" : "esr-message"} role={error ? "alert" : "status"}>{error || message}</p>}
    <div className="esr-grid"><table><thead><tr><th>Customer</th><th>Contract Salesman</th><th>Salesman (Master Control)</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className={pending === row.id ? "is-saving" : undefined}><td>{row.customer || "-"}</td><td><select aria-label={`${row.customer} Contract Salesman`} value={row.contractSalesmanId ?? ""} disabled={!hasContractField || pending === row.id} onChange={event => void update(row, "contractSalesmanId", event.target.value)}><option value="" />{salesmanOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></td><td><select aria-label={`${row.customer} Salesman Master Control`} value={row.salesmanId ?? ""} disabled={pending === row.id} onChange={event => void update(row, "salesmanId", event.target.value)}><option value="" />{salesmanOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></td></tr>)}{!rows.length && !loading && <tr><td colSpan={3}>No customers match this search.</td></tr>}{loading && <tr><td colSpan={3}>Loading customers…</td></tr>}</tbody></table></div>
    <footer>{rows.length} customer{rows.length === 1 ? "" : "s"} shown{pending !== null ? " · Saving…" : ""}</footer>
  </section>;
}
