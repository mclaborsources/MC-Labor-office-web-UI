"use client";

import { useEffect, useMemo, useState } from "react";
import type { DepositCustomerOption, DepositPaymentRow, DepositTypeOption } from "@/lib/depositsToBeMade";

type Draft = { customerId: string; date: string; typeId: string; checkNumber: string; payment: string };
const emptyDraft = (): Draft => ({ customerId: "", date: new Date().toISOString().slice(0, 10), typeId: "", checkNumber: "", payment: "" });
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

export function DepositsToBeMadeScreen({ rows: initialRows, types, initialError }: { rows: DepositPaymentRow[]; types: DepositTypeOption[]; initialError: string }) {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [like, setLike] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<DepositCustomerOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialError);
  useEffect(() => {
    if (customerSearch.trim().length < 2 || !adding) { setCustomerOptions([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/api/deposits-to-be-made?customerSearch=${encodeURIComponent(customerSearch)}`, { signal: controller.signal, cache: "no-store" })
        .then(response => response.json())
        .then((result: { ok?: boolean; customers?: DepositCustomerOption[] }) => setCustomerOptions(result.ok ? result.customers ?? [] : []))
        .catch(() => { if (!controller.signal.aborted) setCustomerOptions([]); });
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [customerSearch, adding]);
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(row => like ? row.customer.toLowerCase().includes(needle) : row.customer.toLowerCase() === needle);
  }, [rows, search, like]);

  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/deposits-to-be-made", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, payment: Number(draft.payment) }) });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save the payment.");
      const refreshed = await fetch("/api/deposits-to-be-made", { cache: "no-store" });
      const data = await refreshed.json() as { ok?: boolean; rows?: DepositPaymentRow[]; error?: string };
      if (!refreshed.ok || !data.ok) throw new Error(data.error || "Saved, but the list could not be refreshed.");
      setRows(data.rows ?? []); setAdding(false); setDraft(emptyDraft()); setCustomerSearch(""); setMessage("Payment saved.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Unable to save the payment."); }
    finally { setBusy(false); }
  }

  function exportRows() {
    const body = [["Customer", "Date", "Type", "Check #", "Payment"], ...visible.map(row => [row.customer, row.date, row.type, row.checkNumber, row.payment])]
      .map(line => line.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", body], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "deposits-to-be-made.csv"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="deposits-screen">
    <h1>Record of Deposits to be Made</h1>
    <div className="deposits-toolbar">
      <button data-action-status="complete" onClick={() => { setAdding(true); setDraft(emptyDraft()); setMessage(""); }}>New</button>
      <label htmlFor="deposit-customer-search">Customer Search</label>
      <input id="deposit-customer-search" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} />
      <fieldset aria-label="Customer search mode"><label><input type="radio" checked={like} onChange={() => setLike(true)} />Like</label><label><input type="radio" checked={!like} onChange={() => setLike(false)} />=</label></fieldset>
      <button data-action-status="complete" onClick={() => setSearch(value => value.trim())}>Search</button>
      <button data-action-status="complete" className="deposits-export" onClick={exportRows} disabled={!visible.length}>Export</button>
    </div>
    {message && <p className="deposits-message" role="status">{message}</p>}
    <div className="deposits-grid-wrap"><table className="deposits-grid"><colgroup>{[20,360,110,120,100,115,24].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
      <thead><tr><th aria-label="Record selector"/><th>Customer</th><th>Date</th><th>Type</th><th>Check #</th><th>Payment</th><th/></tr></thead>
      <tbody>
        {adding && <tr className="deposit-draft"><td>*</td><td className="deposit-customer-cell"><input aria-label="Customer" autoComplete="off" value={customerSearch} placeholder="Search customer..." onChange={event => { setCustomerSearch(event.target.value); setDraft({ ...draft, customerId: "" }); }} />{customerOptions.length > 0 && !draft.customerId && <div className="deposit-customer-options">{customerOptions.map(customer => <button data-action-status="complete" key={customer.id} type="button" onClick={() => { setDraft({ ...draft, customerId: String(customer.id) }); setCustomerSearch(customer.name); setCustomerOptions([]); }}>{customer.name}</button>)}</div>}</td><td><input type="date" aria-label="Date" value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })}/></td><td><select aria-label="Type" value={draft.typeId} onChange={event => setDraft({ ...draft, typeId: event.target.value })}><option value="" />{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></td><td><input aria-label="Check number" value={draft.checkNumber} onChange={event => setDraft({ ...draft, checkNumber: event.target.value })}/></td><td><input type="number" min="0.01" step="0.01" aria-label="Payment" value={draft.payment} onChange={event => setDraft({ ...draft, payment: event.target.value })}/></td><td><button data-action-status="complete" disabled={busy} onClick={() => void save()}>✓</button></td></tr>}
        {visible.map(row => <tr key={row.id}><td/><td>{row.customer}</td><td>{row.date}</td><td>{row.type}</td><td>{row.checkNumber}</td><td className="deposit-amount">{formatMoney(row.payment)}</td><td/></tr>)}
        {!visible.length && !adding && <tr><td>*</td><td><button data-action-status="complete" className="deposit-new-row" onClick={() => { setAdding(true); setDraft(emptyDraft()); }}>New record</button></td><td/><td/><td/><td/><td/></tr>}
      </tbody>
    </table></div>
  </section>;
}
