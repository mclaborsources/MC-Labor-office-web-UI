"use client";

import { useMemo, useState } from "react";
import type { StateCityRecord, StateOption } from "@/lib/stateCities";

export function StateCitiesScreen({ initialCities, states }: { initialCities: StateCityRecord[]; states: StateOption[] }) {
  const [cities, setCities] = useState(initialCities);
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draftCity, setDraftCity] = useState("");
  const [draftState, setDraftState] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => cities.filter(row =>
    (!stateFilter || String(row.stateId) === stateFilter) &&
    (!cityFilter || row.city.toLocaleLowerCase().includes(cityFilter.toLocaleLowerCase()))
  ), [cities, stateFilter, cityFilter]);

  async function saveCity(payload: Record<string, unknown>) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/state-cities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save city.");
      setCities(data.cities); setAdding(false); setDraftCity(""); setDraftState(""); setNotice("City list saved.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save city."); }
    finally { setBusy(false); }
  }
  async function refresh() {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/state-cities", { cache: "no-store" }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not refresh city list.");
      setCities(data.cities); setNotice("City list refreshed.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not refresh city list."); }
    finally { setBusy(false); }
  }
  const selected = cities.find(row => row.id === selectedId);

  return <section className="sc-screen">
    <div className="sc-controls"><h1>State Cities</h1><button className="sc-icon sc-add" aria-label="Add city" title="Add city" onClick={() => { setAdding(value => !value); setSelectedId(null); }}>＋</button><button className="sc-icon sc-remove" aria-label="Deactivate selected city" title="Deactivate selected city" disabled={!selected || busy} onClick={() => selected && void saveCity({ action: "update", id: selected.id, stateId: selected.stateId, city: selected.city, active: false })}>×</button><label>State<select value={stateFilter} onChange={event => setStateFilter(event.target.value)}><option value="" />{states.map(state => <option key={state.id} value={state.id}>{state.name}</option>)}</select></label><label>City<input list="sc-city-options" value={cityFilter} onChange={event => setCityFilter(event.target.value)} /><datalist id="sc-city-options">{[...new Set(cities.map(row => row.city))].sort().map(city => <option key={city} value={city} />)}</datalist></label><button onClick={() => setNotice(`${filtered.length} cities found.`)}>Filter</button><button onClick={() => { setStateFilter(""); setCityFilter(""); setNotice(""); }}>Clear</button><em>You can select a City filter, or type a partial name for City. State is optional.</em><button className="sc-cluster-link" onClick={() => { window.location.href = "/clusters"; }}>Cities &amp; Clusters</button><button className="sc-help" aria-label="Help">?</button></div>
    <p className="sc-hint">Double-click a City value to edit it. Use the green plus to add a city; the red X deactivates the selected city.</p>
    {adding && <form className="sc-add-form" onSubmit={event => { event.preventDefault(); void saveCity({ action: "add", city: draftCity, stateId: Number(draftState) }); }}><strong>Add City</strong><label>State<select required value={draftState} onChange={event => setDraftState(event.target.value)}><option value="">Choose state</option>{states.map(state => <option key={state.id} value={state.id}>{state.name}</option>)}</select></label><label>City<input required maxLength={100} value={draftCity} onChange={event => setDraftCity(event.target.value)} /></label><button disabled={busy}>{busy ? "Saving…" : "Save"}</button><button type="button" onClick={() => setAdding(false)}>Cancel</button></form>}
    {notice && <div className="sc-notice" role="status">{notice}</div>}
    <div className="sc-grid-wrap"><table className="sc-grid"><thead><tr><th>ID</th><th>State</th><th>City</th><th>Sort</th><th>Validated</th><th>Notes</th><th>Active</th><th>Permit Search Link</th><th>Link</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id} className={`${selectedId === row.id ? "selected " : ""}${row.active ? "" : "inactive"}`} onClick={() => setSelectedId(row.id)}><td>{row.id}</td><td>{row.state}</td><td onDoubleClick={() => { setSelectedId(row.id); setDraftCity(row.city); setDraftState(String(row.stateId)); setNotice("Edit the city and state in the editor, then save."); }}>{row.city}</td><td /><td><input type="checkbox" disabled aria-label="Validated" /></td><td /><td><input type="checkbox" checked={row.active} aria-label={`Active ${row.city}`} onChange={event => void saveCity({ action: "update", id: row.id, stateId: row.stateId, city: row.city, active: event.target.checked })} /></td><td /><td><button className="sc-open-link" onClick={() => setNotice("No permit search link is configured for this city.")}>Open</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={9} className="sc-no-results">No cities match these filters.</td></tr>}</tbody></table></div>
    {selected && <div className="sc-editbar"><strong>Edit selected city</strong><label>State<select value={draftState || String(selected.stateId)} onChange={event => setDraftState(event.target.value)}>{states.map(state => <option key={state.id} value={state.id}>{state.name}</option>)}</select></label><label>City<input value={draftCity || selected.city} onChange={event => setDraftCity(event.target.value)} maxLength={100} /></label><button disabled={busy} onClick={() => void saveCity({ action: "update", id: selected.id, stateId: Number(draftState || selected.stateId), city: draftCity || selected.city, active: selected.active })}>{busy ? "Saving…" : "Save City"}</button><button onClick={() => { setSelectedId(null); setDraftCity(""); setDraftState(""); }}>Cancel</button></div>}
    <footer className="sc-footer"><span>{filtered.length} cities</span><button onClick={() => void refresh()} disabled={busy}>{busy ? "Refreshing…" : "Refresh"}</button></footer>
  </section>;
}
