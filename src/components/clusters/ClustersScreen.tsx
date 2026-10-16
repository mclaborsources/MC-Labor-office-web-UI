"use client";

import { useMemo, useState } from "react";
import type { ClusterCityOption, ClusterCityRow, ClusterRow } from "@/lib/clusters";

type EditorData = { clusters: ClusterRow[]; cities: ClusterCityRow[]; cityOptions: ClusterCityOption[] };

export function ClustersScreen({ initialData, editingEnabled }: { initialData: EditorData; editingEnabled: boolean }) {
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState<number | null>(initialData.clusters[0]?.id ?? null);
  const [clusterDraft, setClusterDraft] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [showClusterForm, setShowClusterForm] = useState(false);
  const [showCityForm, setShowCityForm] = useState(false);
  const [copying, setCopying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const selected = data.clusters.find(row => row.id === selectedId) ?? null;
  const memberRows = useMemo(() => data.cities.filter(row => row.clusterId === selectedId && (!filterCity || `${row.city}, ${row.state}`.toLocaleLowerCase().includes(filterCity.toLocaleLowerCase()))), [data.cities, selectedId, filterCity]);

  async function mutate(payload: Record<string, unknown>) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/clusters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error || "Could not save cluster changes.");
      setData({ clusters: next.clusters, cities: next.cities, cityOptions: next.cityOptions });
      if (next.savedClusterId) setSelectedId(next.savedClusterId);
      setShowClusterForm(false); setShowCityForm(false); setCopying(false); setClusterDraft(""); setCityDraft(""); setNotice("Changes saved.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save changes."); }
    finally { setBusy(false); }
  }
  async function saveCluster(cluster: ClusterRow) {
    await mutate({ action: "update-cluster", ...cluster, id: cluster.id });
  }
  async function saveMember(member: ClusterCityRow, active: boolean) {
    await mutate({ action: "update-city", clusterId: member.clusterId, clusterCityId: member.id, active });
  }

  return <section className="clu-screen">
    <main className="clu-main">
      {!editingEnabled && <div className="clu-readonly-notice" role="status">Cluster edits are disabled because this installation has WRITES_ENABLED=false.</div>}
      <div className="clu-left-wrap"><div className="clu-cluster-table-wrap"><table className="clu-cluster-grid"><thead><tr><th>ID</th><th>Cluster</th><th>Lic Emp Search</th><th>County Filter</th><th>Sort</th><th>Active</th></tr></thead><tbody>{data.clusters.map(cluster => <tr key={cluster.id} className={selectedId === cluster.id ? "selected" : ""} onClick={() => setSelectedId(cluster.id)}><td><button className="clu-expand" aria-label={`Select ${cluster.name}`}>⊞</button>{cluster.id}</td><td><input readOnly={!editingEnabled} aria-label={`Cluster name ${cluster.name}`} value={cluster.name} onChange={event => setData(current => ({ ...current, clusters: current.clusters.map(item => item.id === cluster.id ? { ...item, name: event.target.value } : item) }))} onBlur={() => editingEnabled && void saveCluster(data.clusters.find(item => item.id === cluster.id) ?? cluster)} /></td><td><input type="checkbox" disabled={!editingEnabled} checked={cluster.licensedEmployeeSearch} aria-label="Licensed employee search" onChange={event => void saveCluster({ ...cluster, licensedEmployeeSearch: event.target.checked })} /></td><td><input readOnly={!editingEnabled} aria-label="County filter" value={cluster.countyFilter} onChange={event => setData(current => ({ ...current, clusters: current.clusters.map(item => item.id === cluster.id ? { ...item, countyFilter: event.target.value } : item) }))} onBlur={() => editingEnabled && void saveCluster(data.clusters.find(item => item.id === cluster.id) ?? cluster)} /></td><td><input readOnly={!editingEnabled} aria-label="Sort order" value={cluster.sort ?? ""} onChange={event => setData(current => ({ ...current, clusters: current.clusters.map(item => item.id === cluster.id ? { ...item, sort: event.target.value === "" ? null : Number(event.target.value) } : item) }))} onBlur={() => editingEnabled && void saveCluster(data.clusters.find(item => item.id === cluster.id) ?? cluster)} /></td><td><input type="checkbox" disabled={!editingEnabled} checked={cluster.active} aria-label="Cluster active" onChange={event => void saveCluster({ ...cluster, active: event.target.checked })} /></td></tr>)}</tbody></table></div><div className="clu-left-actions"><button disabled={!editingEnabled} className="clu-add-button" onClick={() => { setShowClusterForm(value => !value); setCopying(false); }}>＋<small>Cluster</small></button></div></div>
      <aside className="clu-right">
        <p className="clu-instructions">(1) Add or edit a Cluster in the left panel. Select a Cluster by clicking on it.<br/>(2) Use the right panel to Add or edit the City, State values for the selected cluster.</p>
        <button className="clu-cities-link" onClick={() => { window.location.href = "/state-cities"; }}>Cities &amp; Clusters</button>
        <button className="clu-copy" disabled={!selected || busy || !editingEnabled} onClick={() => { setCopying(true); setShowClusterForm(false); setClusterDraft(selected ? `${selected.name} Copy` : ""); }}><span>▤</span> Copy Cluster</button>
        <p className="clu-hint">Double-click City, State to select a value.</p>
        <div className="clu-members-wrap"><table className="clu-members"><thead><tr><th>City, State</th><th>Active</th></tr></thead><tbody>{memberRows.map(member => <tr key={member.id}><td title="Double-click to select a city/state" onDoubleClick={() => { if (!editingEnabled) return; setCityDraft(String(member.stateCityId)); setShowCityForm(true); }}>{member.city}, {member.state}</td><td><input type="checkbox" disabled={!editingEnabled} checked={member.active} aria-label={`Active ${member.city}, ${member.state}`} onChange={event => void saveMember(member, event.target.checked)} /></td></tr>)}{!selected && <tr><td colSpan={2} className="clu-empty">Select a cluster to view its cities.</td></tr>}{selected && !memberRows.length && <tr><td colSpan={2} className="clu-empty">No city/state entries for this cluster.</td></tr>}</tbody></table></div>
        <button className="clu-add-city" disabled={!selected || busy || !editingEnabled} onClick={() => { setCityDraft(""); setShowCityForm(value => !value); }}><span>＋</span><small>City</small></button>
        {showCityForm && selected && <form className="clu-city-form" onSubmit={event => { event.preventDefault(); void mutate({ action: "add-city", clusterId: selected.id, stateCityId: Number(cityDraft) }); }}><strong>Add City/State</strong><select required aria-label="Choose city and state" value={cityDraft} onChange={event => setCityDraft(event.target.value)}><option value="">Choose a city…</option>{data.cityOptions.map(option => <option key={option.id} value={option.id}>{option.city}, {option.state}</option>)}</select><button disabled={busy}>{busy ? "Saving…" : "Add"}</button></form>}
      </aside>
      {(showClusterForm || copying) && <form className="clu-cluster-form" onSubmit={event => { event.preventDefault(); if (copying && selected) void mutate({ action: "copy-cluster", sourceId: selected.id, name: clusterDraft }); else void mutate({ action: "add-cluster", name: clusterDraft }); }}><strong>{copying ? "Copy Cluster" : "Add Cluster"}</strong><input autoFocus required maxLength={150} aria-label="Cluster name" placeholder="Cluster name" value={clusterDraft} onChange={event => setClusterDraft(event.target.value)} /><button disabled={busy}>{busy ? "Saving…" : copying ? "Copy" : "Add"}</button><button type="button" onClick={() => { setShowClusterForm(false); setCopying(false); }}>Cancel</button></form>}
      <div className="clu-bottom-filter"><label>Find city/state<input value={filterCity} onChange={event => setFilterCity(event.target.value)} /></label></div>
      {notice && <div className="clu-notice" role="status">{notice}</div>}
    </main>
    <footer className="clu-recordbar"><span>{data.clusters.length} clusters</span><span>{selected ? `${memberRows.length} cities in ${selected.name}` : "No cluster selected"}</span><div /></footer>
  </section>;
}
