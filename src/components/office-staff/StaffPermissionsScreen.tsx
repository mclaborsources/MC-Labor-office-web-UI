"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OfficeStaffRecord } from "@/lib/admin";
import { StaffPermissionsDialog, staffRequest } from "./StaffPermissionsDialog";

type Feature = { id: number; title: string; description: string; objectName: string; controlName: string; myNote: string; level: string; matt: string; ryan: string; sharon: string; joeN: string; note06: string; note07: string; note08: string; note10: string; note11: string; note12: string };
type Data = { staff: OfficeStaffRecord[]; features: Feature[]; grants: { staffId: number; featureId: number }[] };
const columns = [["id", "Feature", 75], ["title", "Title", 270], ["description", "Description", 530], ["myNote", "My Note", 280], ["level", "Level", 96], ["matt", "Matt", 250], ["ryan", "Ryan", 96], ["sharon", "Sharon", 96], ["joeN", "Joe N", 110], ["note06", "Note 06", 110], ["note07", "Note 07", 110], ["note08", "Note 08", 110], ["note10", "Note 10", 110], ["note11", "Note 11", 110], ["note12", "Note 12", 110]] as const;
type ColumnKey = typeof columns[number][0];

export function StaffPermissionsScreen({ staffId }: { staffId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Data>();
  const [changes, setChanges] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [divisionOnly, setDivisionOnly] = useState(false);
  const [sort, setSort] = useState<{ key: ColumnKey; desc: boolean } | null>(null);
  const [find, setFind] = useState("");
  const [selectedId, setSelectedId] = useState<number>();
  const [profile, setProfile] = useState("");
  const [featureDialog, setFeatureDialog] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [revision, setRevision] = useState(0);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/office-staff", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load permissions.");
      if (!cancelled) { setData(result); setError(""); }
    }).catch(reason => { if (!cancelled) setError(reason.message); });
    return () => { cancelled = true; };
  }, [revision]);
  const staff = data?.staff.find(row => row.staffId === staffId);
  const grants = useMemo(() => new Set(data?.grants.filter(grant => String(grant.staffId) === staffId).map(grant => grant.featureId)), [data, staffId]);
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = (data?.features ?? []).filter(row => (!divisionOnly || /division/i.test(`${row.title} ${row.description} ${row.objectName}`)) && (!query || columns.some(([key]) => String(row[key]).toLowerCase().includes(query))));
    return sort ? filtered.sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) * (sort.desc ? -1 : 1)) : filtered;
  }, [data, search, sort, divisionOnly]);
  const dirty = Object.keys(changes).length + Object.keys(notes).length;
  const selected = rows.find(row => row.id === selectedId) ?? rows[0];
  const index = selected ? rows.indexOf(selected) : -1;
  function checked(id: number) { return changes[id] ?? grants.has(id); }
  function toggle(id: number, enabled: boolean) { setChanges(current => { const next = { ...current }; if (enabled === grants.has(id)) delete next[id]; else next[id] = enabled; return next; }); }
  function resetScroll() { setScrollTop(0); if (grid.current) grid.current.scrollTop = 0; }
  function select(index: number) { const row = rows[index]; if (!row) return; setSelectedId(row.id); if (grid.current) grid.current.scrollTop = Math.max(0, index * 24); }
  function close() { if (!dirty || window.confirm("Discard unsaved permission changes?")) router.push(`/admin/office-staff?id=${staffId}`); }
  const first = Math.max(0, Math.floor(scrollTop / 24) - 8);
  const end = Math.min(rows.length, first + 85);
  const allChecked = rows.length > 0 && rows.every(row => checked(row.id));
  return <section className="staff-permissions-screen">
    <header><h1>Modify Permissions</h1><button type="button" disabled={busy} onClick={close}>Close</button><button type="button" title="Select features to grant access. Double-click a feature to edit its staff permissions." aria-label="Permission help" onClick={() => setMessage("Check Select to grant access. Save commits changes; Cancel restores saved permissions. Double-click a feature to manage access for all staff.")}>?</button></header>
    <div className="staff-permissions-controls">
      <div className="staff-permissions-control-row">
        <button type="button" disabled={!staff || busy || !dirty} onClick={async () => {
          setBusy(true); setError(""); setMessage("");
          try {
            await staffRequest({ action: "permissions", id: staffId, changes: Object.entries(changes).map(([featureId, enabled]) => ({ featureId: Number(featureId), enabled })), notes: Object.entries(notes).map(([featureId, value]) => ({ featureId: Number(featureId), value, original: data?.features.find(row => row.id === Number(featureId))?.myNote ?? "" })) });
            setChanges({}); setNotes({}); setRevision(value => value + 1); setMessage("Permissions saved.");
          } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save permissions."); }
          finally { setBusy(false); }
        }}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" disabled={busy || !dirty} onClick={() => { setChanges({}); setNotes({}); setError(""); setMessage("Changes cancelled."); }}>Cancel</button>
        <button type="button" onClick={() => { setSort(null); resetScroll(); }}>Clear Sort</button>
        <form onSubmit={event => { event.preventDefault(); const index = rows.findIndex(row => row.id === Number(find)); if (index >= 0) { select(index); setError(""); } else setError("Feature number not found in the current filter."); }}><label>Feature #:<input aria-label="Feature number" type="number" min={1} value={find} onChange={event => setFind(event.target.value)} /></label><button type="submit">Find</button></form>
        <fieldset><legend className="sr-only">Feature filters</legend><span>Filter</span><button type="button" aria-pressed={!divisionOnly} onClick={() => { setDivisionOnly(false); resetScroll(); }}>All</button><button type="button" aria-pressed={divisionOnly} onClick={() => { setDivisionOnly(true); resetScroll(); }}>Divisions</button></fieldset>
        <button type="button" onClick={() => { setSearch(""); setDivisionOnly(false); resetScroll(); }}>Clear Filter</button>
      </div>
      <div className="staff-permissions-control-row"><label>Name:<input aria-label="Staff name" readOnly value={staff ? `${staff.firstName} ${staff.lastName}` : ""} /></label><label>Apply Profile:<select aria-label="Apply profile" value={profile} disabled={busy} onChange={event => setProfile(event.target.value)}><option value="">{data?.staff.some(row => row.profile) ? "Select profile" : "No profiles available"}</option>{data?.staff.filter(row => row.profile).map(row => <option key={row.staffId} value={row.staffId}>{row.firstName} {row.lastName}</option>)}</select></label><button type="button" disabled={!profile || busy || !staff} onClick={() => {
        const profileGrants = new Set(data?.grants.filter(grant => String(grant.staffId) === profile).map(grant => grant.featureId));
        const next: Record<number, boolean> = {};
        data?.features.forEach(row => { if (profileGrants.has(row.id) !== grants.has(row.id)) next[row.id] = profileGrants.has(row.id); });
        setChanges(next); setMessage("Profile applied to the draft. Click Save to commit.");
      }}>Apply</button></div>
      <label className="staff-permissions-select-all">Select All: <input type="checkbox" aria-label="Select all visible features" checked={allChecked} disabled={busy || !staff || !rows.length} onChange={event => { const enabled = event.target.checked; setChanges(current => { const next = { ...current }; rows.forEach(row => { if (enabled === grants.has(row.id)) delete next[row.id]; else next[row.id] = enabled; }); return next; }); }} /></label>
      <p className="staff-permissions-hint">Double-click a Feature to set permissions for all office staff for that feature.</p>
    </div>
    {error && <p className="staff-permissions-message" role="alert">{error}</p>}{message && <p className="staff-permissions-message" role="status">{message}</p>}
    {!data && !error && <p role="status">Loading permissions…</p>}
    {data && !staff && <p role="alert">Select an office staff record before editing permissions.</p>}
    <div ref={grid} className="staff-permissions-grid" onScroll={event => setScrollTop(event.currentTarget.scrollTop)}>
      <table><colgroup><col style={{ width: 19 }} /><col style={{ width: 70 }} />{columns.map(([key, , width]) => <col key={key} style={{ width }} />)}</colgroup><thead><tr><th aria-label="Record selector" /><th>Select</th>{columns.map(([key, label]) => <th key={key}><button type="button" onClick={() => { setSort({ key, desc: sort?.key === key ? !sort.desc : false }); resetScroll(); }}>{label}<span aria-hidden="true">{sort?.key === key ? sort.desc ? "▾" : "▴" : "⌄"}</span></button></th>)}</tr></thead>
        <tbody>{first > 0 && <tr aria-hidden="true"><td colSpan={columns.length + 2} style={{ height: first * 24, padding: 0 }} /></tr>}{rows.slice(first, end).map(row => <tr key={row.id} className={selected?.id === row.id ? "is-selected" : undefined} onClick={() => setSelectedId(row.id)} onDoubleClick={event => { if ((event.target as Element).closest("input")) return; if (dirty) { setMessage("Save or cancel your changes before opening permissions by feature."); return; } setFeatureDialog(row.id); }}>
          <td aria-hidden="true">{selected?.id === row.id ? "▸" : ""}</td><td><input aria-label={`Grant feature ${row.id}: ${row.title}`} type="checkbox" checked={checked(row.id)} disabled={busy || !staff} onChange={event => toggle(row.id, event.target.checked)} /></td>
          {columns.map(([key]) => <td key={key} title={String(row[key])}>{key === "myNote" ? <input aria-label={`My Note for feature ${row.id}`} maxLength={255} disabled={busy || !staff} value={notes[row.id] ?? row.myNote} onChange={event => { const value = event.target.value; setNotes(current => { const next = { ...current }; if (value === row.myNote) delete next[row.id]; else next[row.id] = value; return next; }); }} /> : row[key]}</td>)}
        </tr>)}{end < rows.length && <tr aria-hidden="true"><td colSpan={columns.length + 2} style={{ height: (rows.length - end) * 24, padding: 0 }} /></tr>}</tbody>
      </table>
    </div>
    <footer><span>Record:</span><button aria-label="First feature" disabled={!rows.length} onClick={() => select(0)}>Ⅰ‹</button><button aria-label="Previous feature" disabled={index <= 0} onClick={() => select(index - 1)}>‹</button><span>{index + 1} of {rows.length}</span><button aria-label="Next feature" disabled={index >= rows.length - 1} onClick={() => select(index + 1)}>›</button><button aria-label="Last feature" disabled={!rows.length} onClick={() => select(rows.length - 1)}>›Ⅰ</button><span>{search || divisionOnly ? "Filtered" : "Unfiltered"}</span><input type="search" aria-label="Search features" placeholder="Search" value={search} onChange={event => { setSearch(event.target.value); resetScroll(); }} /><span>{dirty} unsaved changes</span></footer>
    {featureDialog !== undefined && <StaffPermissionsDialog mode="feature" staffId={staffId} initialFeatureId={featureDialog} onClose={() => { setFeatureDialog(undefined); setRevision(value => value + 1); }} />}
  </section>;
}
