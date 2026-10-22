"use client";

import { useEffect, useState } from "react";
import type { OfficeStaffRecord } from "@/lib/admin";
import { StaffModal } from "./StaffModal";

type Feature = { id: number; title: string; objectName: string; controlName: string };
type Data = { staff: OfficeStaffRecord[]; features: Feature[]; grants: { staffId: number; featureId: number }[] };
export async function staffRequest(body: unknown) {
  const response = await fetch("/api/admin/office-staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The change could not be saved.");
  return result as { id: string };
}

export function StaffPermissionsDialog({ mode, staffId, onClose, initialFeatureId }: { mode: "staff" | "feature"; staffId: string; onClose: () => void; initialFeatureId?: number }) {
  const [data, setData] = useState<Data>();
  const [featureId, setFeatureId] = useState(0);
  const [search, setSearch] = useState("");
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/office-staff", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load permissions.");
      if (!cancelled) { setData(result); setFeatureId(initialFeatureId ?? result.features[0]?.id ?? 0); }
    }).catch(reason => { if (!cancelled) setError(reason.message); });
    return () => { cancelled = true; };
  }, [initialFeatureId]);
  const grants = new Set(data?.grants.map(grant => `${grant.staffId}:${grant.featureId}`));
  function option(id: string, feature: number, label: string) {
    const key = `${id}:${feature}`;
    return <label className="staff-permission-option" key={key}><input type="checkbox" disabled={busy} checked={changes[key] ?? grants.has(key)} onChange={event => {
      const checked = event.target.checked;
      setChanges(current => { const next = { ...current }; if (checked === grants.has(key)) delete next[key]; else next[key] = checked; return next; });
    }} /><span>{label}</span></label>;
  }
  return <StaffModal titleId="staff-permissions-title" busy={busy} onClose={onClose}>
    <header><h2 id="staff-permissions-title">{mode === "staff" ? "Modify Permissions" : "Modify Permissions by Feature"}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close permissions">×</button></header>
    {mode === "staff" && <p>{data?.staff.find(row => row.staffId === staffId)?.firstName} {data?.staff.find(row => row.staffId === staffId)?.lastName}</p>}
    {mode === "feature" && <label>Feature <select aria-label="Feature" disabled={busy} value={featureId} onChange={event => setFeatureId(Number(event.target.value))}>{data?.features.map(feature => <option key={feature.id} value={feature.id}>{feature.title || feature.objectName}{feature.controlName ? ` — ${feature.controlName}` : ""}</option>)}</select></label>}
    <input type="search" aria-label="Search permissions" placeholder={mode === "staff" ? "Search features" : "Search staff"} value={search} onChange={event => setSearch(event.target.value)} />
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading permissions…</p>}
    <div className="staff-permission-list">{mode === "staff"
      ? data?.features.filter(feature => `${feature.title} ${feature.objectName} ${feature.controlName}`.toLowerCase().includes(search.toLowerCase())).map(feature => option(staffId, feature.id, `${feature.title || feature.objectName}${feature.controlName ? ` — ${feature.controlName}` : ""}`))
      : data?.staff.filter(row => `${row.firstName} ${row.lastName} ${row.initials}`.toLowerCase().includes(search.toLowerCase())).map(row => option(row.staffId, featureId, `${row.firstName} ${row.lastName} (${row.initials})${row.active ? "" : " — Inactive"}`))}</div>
    <footer><span>{Object.keys(changes).length} changes</span><button type="button" disabled={!data || busy || !Object.keys(changes).length} onClick={async () => {
      setBusy(true); setError("");
      try {
        await staffRequest({ action: "permissions", id: staffId, changes: Object.entries(changes).map(([key, enabled]) => { const [id, feature] = key.split(":").map(Number); return { staffId: id, featureId: feature, enabled }; }) });
        onClose();
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save permissions."); }
      finally { setBusy(false); }
    }}>{busy ? "Saving…" : "Save"}</button><button type="button" disabled={busy} onClick={onClose}>Cancel</button></footer>
  </StaffModal>;
}
