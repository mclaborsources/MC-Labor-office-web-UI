"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OfficeStaffRecord } from "@/lib/admin";
import { StaffPermissionsDialog, staffRequest } from "./StaffPermissionsDialog";
import { StaffModal } from "./StaffModal";

const emailLabels = ["Employee Health Insurance Alarm Email?", "AR Report BCC Email?", "Tracking Report Email - SEND Login?", "Tracking Report Email - SEND Logout?", "Tracking Report Email - RECEIVE?", "Salesman Records - Customers Logout?", "Money Owed Email - SEND Login?", "Money Owed Email - RECEIVE?"];
type SortKey = "initials" | "firstName" | "lastName" | "active";
const blank: OfficeStaffRecord = { staffId: "", firstName: "", lastName: "", initials: "", title: "", email: "", active: true, canDelete: false, profile: false, employeeResearch: false, emailOptions: Array(8).fill(false) };

export function OfficeStaffScreen({ staff: suppliedStaff, initialId }: { staff: OfficeStaffRecord[]; initialId?: string }) {
  const router = useRouter();
  const [staff, setStaff] = useState(suppliedStaff);
  const [draft, setDraft] = useState<OfficeStaffRecord | null>(null);
  const [initialPassword, setInitialPassword] = useState("");
  const passwordField = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [permissions, setPermissions] = useState<"staff" | "feature" | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const initial = staff.find(row => row.staffId === initialId);
  const [active, setActive] = useState(initial?.active ?? true);
  const [selectedId, setSelectedId] = useState(initialId ?? "");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean } | null>(null);
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = staff.filter(row => row.active === active && (!query || [row.initials, row.firstName, row.lastName].some(value => value.toLowerCase().includes(query))));
    return sort ? result.sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) * (sort.desc ? -1 : 1)) : result;
  }, [staff, active, search, sort]);
  const current = rows.find(row => row.staffId === selectedId) ?? rows[0];
  const selected = draft ?? current;
  const index = current ? rows.indexOf(current) : -1;
  function edit(patch: Partial<OfficeStaffRecord>) { if (selected) setDraft({ ...selected, emailOptions: selected.emailOptions ?? Array(8).fill(false), ...patch }); }
  function discard() { if (draft && !window.confirm("Discard unsaved staff changes?")) return false; setDraft(null); setInitialPassword(""); setError(""); return true; }
  function choose(id: string) { if (busy || !discard()) return; setSelectedId(id); setMessage(""); }
  async function reload(id?: string) {
    const response = await fetch("/api/admin/office-staff", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not refresh office staff.");
    setStaff(result.staff);
    if (id) { setSelectedId(id); const row = (result.staff as OfficeStaffRecord[]).find(item => item.staffId === id); if (row) setActive(row.active); }
  }
  async function save() {
    if (!draft || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { staffId, ...record } = draft;
      const hasInitialPassword = !staffId && !!initialPassword;
      const result = await staffRequest({ action: "save", record: { ...record, ...(staffId ? { staffId } : {}) }, ...(hasInitialPassword ? { initialPassword } : {}) });
      setDraft(null); setInitialPassword(""); setSearch(""); await reload(result.id);
      setMessage(staffId ? "Staff record saved." : hasInitialPassword ? "Staff record and password saved." : "Staff record created. Use New/Reset to set its login password.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save staff."); }
    finally { setBusy(false); }
  }
  function yesNo(label: string, value: boolean | undefined, update: (value: boolean) => void) {
    return <label key={label}><span>{label}</span><select aria-label={label} disabled={busy || !selected} onChange={event => update(event.target.value === "Yes")} value={value === undefined ? "" : value ? "Yes" : "No"}><option value="">—</option><option>Yes</option><option>No</option></select></label>;
  }
  function field(label: string, key: "firstName" | "lastName" | "initials" | "title" | "email", wide = false) {
    return <label className={wide ? "is-wide" : undefined}><span>{label}</span><input aria-label={label} disabled={busy || !selected} maxLength={key === "initials" ? 4 : key === "firstName" || key === "lastName" ? 20 : 255} value={selected?.[key] ?? ""} onChange={event => edit({ [key]: event.target.value })} /></label>;
  }
  return <section className="office-staff-screen">
    <h1>Edit Office Staff</h1>
    <div className="office-staff-toolbar">
      <button type="button" disabled={busy} onClick={() => { if (!discard()) return; setDraft({ ...blank }); setMessage(""); }}>New</button>
      <button type="button" disabled={busy || !draft} onClick={() => void save()}>{busy ? "Working…" : "Save"}</button>
      <button type="button" disabled={busy || !selected?.staffId || !!draft} onClick={() => router.push(`/admin/office-staff/permissions?id=${selected.staffId}`)}>Modify Permissions</button>
      <button type="button" disabled={busy || !draft} onClick={() => { setDraft(null); setInitialPassword(""); setError(""); }}>Cancel</button>
      <button type="button" disabled={busy || !selected?.staffId || !!draft} onClick={async () => {
        if (!selected || !window.confirm(`Delete office staff ${selected.firstName} ${selected.lastName}? This cannot be undone.`)) return;
        setBusy(true); setError(""); setMessage("");
        try { await staffRequest({ action: "delete", id: selected.staffId }); await reload(); setSelectedId(""); setMessage("Staff record deleted."); }
        catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete staff."); }
        finally { setBusy(false); }
      }}>Delete</button>
      <button type="button" onClick={() => setSort(null)}>Clear Sort</button>
      <fieldset><label>Active <input type="radio" name="office-staff-status" checked={active} disabled={busy} onChange={() => { if (discard()) setActive(true); }} /></label><label>Inactive <input type="radio" name="office-staff-status" checked={!active} disabled={busy} onChange={() => { if (discard()) setActive(false); }} /></label></fieldset>
      <button type="button" className="office-staff-feature" disabled={busy || !selected?.staffId || !!draft} onClick={() => setPermissions("feature")}>Modify Permissions by Feature</button>
    </div>
    {error && !passwordOpen && <p className="office-staff-message" role="alert">{error}</p>}
    {message && <p className="office-staff-message" role="status">{message}</p>}
    <div className="office-staff-content">
      <div className="office-staff-details">
        {field("First Name:", "firstName")}{field("Last Name:", "lastName")}{field("Initials:", "initials")}{field("Title:", "title", true)}
        <label><span>Password:</span><input ref={passwordField} aria-label="Password" type="password" autoComplete="new-password" maxLength={20} disabled={busy || !selected} readOnly={!!selected?.staffId} value={selected?.staffId ? "*****" : initialPassword} onChange={event => setInitialPassword(event.target.value)} title={selected?.staffId ? "Use New/Reset to change the saved password" : "Enter the initial password, then click Save"} /><button type="button" disabled={busy || !selected || (!!selected.staffId && !!draft)} onClick={() => { if (!selected?.staffId) { setInitialPassword(""); passwordField.current?.focus(); return; } setPassword(""); setConfirmation(""); setError(""); setPasswordOpen(true); }}>New/Reset</button></label>
        {yesNo("Active?", selected?.active, value => edit({ active: value }))}
        {yesNo("Profile?", selected?.profile, value => edit({ profile: value }))}
        {yesNo("Can Delete?", selected?.canDelete, value => edit({ canDelete: value }))}
        {field("Email:", "email", true)}
        {yesNo("Emp Research?", selected?.employeeResearch, value => edit({ employeeResearch: value }))}
        <h2>Email and Report-related Options</h2>
        <div className="office-staff-email-options">{emailLabels.map((label, i) => yesNo(label, selected?.emailOptions?.[i], value => { const values = [...(selected?.emailOptions ?? Array(8).fill(false))]; values[i] = value; edit({ emailOptions: values }); }))}</div>
      </div>
      <div className="office-staff-datasheet">
        <div className="office-staff-grid">
          <table><colgroup><col style={{ width: 19 }} /><col style={{ width: 96 }} /><col style={{ width: 106 }} /><col style={{ width: 111 }} /><col style={{ width: 75 }} /><col style={{ width: 112 }} /></colgroup>
            <thead><tr><th aria-label="Record selector" />{([ ["initials", "Initials"], ["firstName", "First Name"], ["lastName", "Last Name"], ["active", "Active?"] ] as const).map(([key, label]) => <th key={key}><button type="button" onClick={() => setSort({ key, desc: sort?.key === key ? !sort.desc : false })}>{label}<span>{sort?.key === key ? sort.desc ? "▾" : "▴" : "⌄"}</span></button></th>)}<th aria-hidden="true" /></tr></thead>
            <tbody>{rows.map(row => <tr key={row.staffId} className={selected?.staffId === row.staffId ? "is-selected" : undefined} onClick={() => choose(row.staffId)}><td aria-hidden="true">{selected?.staffId === row.staffId ? "▸" : ""}</td><td><button type="button" onClick={event => { event.stopPropagation(); choose(row.staffId); }}>{row.initials || "—"}</button></td><td>{row.firstName}</td><td>{row.lastName}</td><td>{row.active ? "Yes" : "No"}</td><td /></tr>)}</tbody>
          </table>
          {!rows.length && <p className="office-staff-empty">No matching office staff.</p>}
        </div>
        <footer><span>Record:</span><button aria-label="First staff record" disabled={busy || index <= 0} onClick={() => choose(rows[0].staffId)}>Ⅰ‹</button><button aria-label="Previous staff record" disabled={busy || index <= 0} onClick={() => choose(rows[index - 1].staffId)}>‹</button><span>{index + 1} of {rows.length}</span><button aria-label="Next staff record" disabled={busy || index < 0 || index >= rows.length - 1} onClick={() => choose(rows[index + 1].staffId)}>›</button><button aria-label="Last staff record" disabled={busy || index < 0 || index >= rows.length - 1} onClick={() => choose(rows[rows.length - 1].staffId)}>›Ⅰ</button><span className="office-staff-filter-status">{search ? "Filtered" : "No Filter"}</span><input type="search" aria-label="Search office staff" placeholder="Search" value={search} disabled={busy} onChange={event => { if (discard()) setSearch(event.target.value); }} /></footer>
      </div>
    </div>
    {permissions && selected?.staffId && <StaffPermissionsDialog mode={permissions} staffId={selected.staffId} onClose={() => setPermissions(null)} />}
    {passwordOpen && <StaffModal small titleId="staff-password-title" busy={busy} onClose={() => { setPasswordOpen(false); setPassword(""); setConfirmation(""); setError(""); }}>
      <header><h2 id="staff-password-title">New/Reset Password</h2></header>
      <form onSubmit={async event => {
        event.preventDefault(); if (busy || !selected) return;
        setBusy(true); setError("");
        try { await staffRequest({ action: "password", id: selected.staffId, password, confirmation }); setPasswordOpen(false); setPassword(""); setConfirmation(""); setMessage("Password updated."); }
        catch (reason) { setError(reason instanceof Error ? reason.message : "Could not reset password."); }
        finally { setBusy(false); }
      }}>
        <p>{selected?.firstName} {selected?.lastName}</p>
        <label>New password<input autoFocus type="password" autoComplete="new-password" maxLength={20} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label>Confirm password<input type="password" autoComplete="new-password" maxLength={20} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
        {error && <p role="alert">{error}</p>}
        <footer><button disabled={busy} type="submit">{busy ? "Saving…" : "Save password"}</button><button disabled={busy} type="button" onClick={() => { setPasswordOpen(false); setPassword(""); setConfirmation(""); setError(""); }}>Cancel</button></footer>
      </form>
    </StaffModal>}
  </section>;
}
