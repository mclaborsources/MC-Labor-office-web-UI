"use client";

import { createContext, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { EMPLOYEE_SEARCH_PRESET_GRID, EMPLOYEE_SEARCH_VIEWS_2_GRID } from "@/lib/employeeSearchColumns";
import { defaultEmployeeViewLayout, employeeSearchPresetSchema, employeeSearchPresetLayoutForName, employeeSavedViewSchema, normalizeEmployeeSavedView, type EmployeeSavedView, type EmployeeSearchPreset, type EmployeeViewLayout } from "@/lib/employeeSavedViews";

function baseName(slot: number) {
  const grid = slot <= 30 ? EMPLOYEE_SEARCH_PRESET_GRID : EMPLOYEE_SEARCH_VIEWS_2_GRID;
  const position = (slot - 1) % 30;
  const cell = grid[Math.floor(position / 10)]?.[position % 10];
  return cell?.label ?? `View ${String(slot).padStart(2, "0")}`;
}

type EmployeeViewsContext = {
  slot: number;
  select: (slot: number) => void;
  selectPreset: (slot: number, fallbackLayout: EmployeeViewLayout) => void;
  views: EmployeeSavedView[];
  layout: EmployeeViewLayout;
  setLayout: Dispatch<SetStateAction<EmployeeViewLayout>>;
  ready: boolean;
  busy: boolean;
  message: string;
  canRename: boolean;
  openSave: () => void;
  openRename: () => void;
  openDelete: () => void;
  remove: () => Promise<void>;
};

const Context = createContext<EmployeeViewsContext | null>(null);
export const useEmployeeSavedViews = () => useContext(Context);

export function EmployeeSavedViewsProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState(1);
  const [views, setViews] = useState<EmployeeSavedView[]>([]);
  const [presets, setPresets] = useState<EmployeeSearchPreset[]>([]);
  const [layout, setLayout] = useState(defaultEmployeeViewLayout);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [dialogMode, setDialogMode] = useState<"save" | "rename">("save");
  const dialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const saveSlot = useRef(1);
  const snapshot = useRef(layout);
  const selectionRevision = useRef(0);
  useEffect(() => {
    let active = true;
    fetch("/api/employees/saved-views", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const saved = (data.views as unknown[]).map(normalizeEmployeeSavedView);
        if (active) {
          setViews(saved);
          if (selectionRevision.current === 0) setLayout(saved.find(view => view.slot === 1)?.layout ?? defaultEmployeeViewLayout());
          setReady(true);
        }
      })
      .catch(error => { if (active) { setMessage(error instanceof Error ? error.message : "Saved employee views could not be loaded."); setReady(true); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/employees/presets", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const loaded = (data.presets as unknown[]).map(value => employeeSearchPresetSchema.parse(value));
        if (active) setPresets(loaded);
      })
      .catch(error => { if (active) setMessage(error instanceof Error ? error.message : "Shared employee presets could not be loaded."); });
    return () => { active = false; };
  }, []);

  const select = (next: number) => {
    selectionRevision.current += 1;
    setSlot(next);
    const personalView = views.find(view => view.slot === next);
    const sharedPreset = presets.find(preset => preset.slot === next);
    setLayout(personalView?.layout ?? sharedPreset?.layout ?? defaultEmployeeViewLayout());
    setMessage("");
  };
  const selectPreset = (next: number, fallbackLayout: EmployeeViewLayout) => {
    selectionRevision.current += 1;
    setSlot(next);
    // A user's saved layout for this numbered slot takes precedence over the
    // shared preset. This makes Save View changes reappear when they click the
    // same preset button again, without changing the preset for other users.
    const personalView = views.find(view => view.slot === next);
    const sharedPreset = presets.find(preset => preset.slot === next);
    setLayout(personalView?.layout ?? sharedPreset?.layout ?? fallbackLayout);
    setMessage("");
  };
  const openSave = () => {
    saveSlot.current = slot;
    snapshot.current = structuredClone(layout);
    setDialogMode("save");
    setName(views.find(view => view.slot === slot)?.name ?? baseName(slot));
    setError("");
    dialog.current?.showModal();
  };
  const openRename = () => {
    const saved = views.find(view => view.slot === slot);
    saveSlot.current = slot;
    snapshot.current = structuredClone(saved?.layout ?? layout);
    setDialogMode("rename");
    setName(saved?.name ?? baseName(slot));
    setError("");
    dialog.current?.showModal();
  };
  async function save() {
    setBusy(true);
    setError("");
    try {
      const view = employeeSavedViewSchema.parse({ slot: saveSlot.current, name, layout: snapshot.current });
      const response = await fetch("/api/employees/saved-views", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(view) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const saved = employeeSavedViewSchema.parse(data.view);
      const replacing = views.some(item => item.slot === saved.slot);
      setViews(current => [...current.filter(item => item.slot !== saved.slot), saved]);
      setMessage(dialogMode === "rename" ? `${saved.name} renamed.` : replacing ? `${saved.name} updated in View ${String(saved.slot).padStart(2, "0")}.` : `${saved.name} saved to View ${String(saved.slot).padStart(2, "0")}.`);
      dialog.current?.close();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Employee view could not be saved."); }
    finally { setBusy(false); }
  }
  const openDelete = () => { if (views.some(view => view.slot === slot)) deleteDialog.current?.showModal(); };
  async function remove() {
    if (!views.some(view => view.slot === slot)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/employees/saved-views", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setViews(current => current.filter(view => view.slot !== slot));
      setLayout(defaultEmployeeViewLayout());
      setMessage("Saved employee view deleted.");
      deleteDialog.current?.close();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Employee view could not be deleted."); }
    finally { setBusy(false); }
  }

  const canRename = true;
  return <Context.Provider value={{ slot, select, selectPreset, views, layout, setLayout, ready, busy, message, canRename, openSave, openRename, openDelete, remove }}>
    {children}
    <dialog ref={dialog} className="ac-customer-saved-view-dialog" onCancel={event => { if (busy) event.preventDefault(); }}>
      <form onSubmit={event => { event.preventDefault(); void save(); }}>
        <header><h2>{dialogMode === "rename" ? "Rename View" : views.some(view => view.slot === saveSlot.current) ? "Update View" : "Save View"} {String(saveSlot.current).padStart(2, "0")}</h2></header>
        <div className="ac-customer-saved-view-body">
          <label>Button name<input autoFocus required maxLength={80} value={name} onChange={event => setName(event.target.value)} /></label>
          <p>{dialogMode === "rename" ? "Change this view button’s name." : "Save the current Employee Search columns, widths, filters, and sorting to this numbered view."}</p>
          {error && <p role="alert">{error}</p>}
        </div>
        <footer><button className="ac-btn ac-btn-xs" type="submit" disabled={busy || !name.trim()}>{busy ? "Saving…" : dialogMode === "rename" ? "Rename" : "Save View"}</button><button className="ac-btn ac-btn-xs" type="button" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button></footer>
      </form>
    </dialog>
    <dialog ref={deleteDialog} className="ac-customer-saved-view-dialog ac-customer-saved-view-delete-dialog" onCancel={event => { if (busy) event.preventDefault(); }}>
      <form onSubmit={event => { event.preventDefault(); void remove(); }}>
        <header><h2>Delete Saved View</h2></header>
        <div className="ac-customer-saved-view-body"><p>Delete “{views.find(view => view.slot === slot)?.name}” (View {String(slot).padStart(2, "0")})?</p>{message && message !== "Saved employee view deleted." && <p role="alert">{message}</p>}</div>
        <footer><button className="ac-btn ac-btn-xs" type="submit" disabled={busy}>{busy ? "Deleting…" : "Delete"}</button><button className="ac-btn ac-btn-xs" type="button" disabled={busy} onClick={() => deleteDialog.current?.close()}>Cancel</button></footer>
      </form>
    </dialog>
    {message && <span role="status" title={message} style={{ position: "fixed", right: 16, bottom: 20, zIndex: 1000, maxWidth: 420, padding: "8px 12px", border: "1px solid #aaa", background: "#fff", color: "#111", fontSize: 13 }}>{message}</span>}
  </Context.Provider>;
}

export function EmployeeSavedViewActions() {
  const state = useEmployeeSavedViews();
  if (!state) return null;
  const saved = state.views.some(view => view.slot === state.slot);
  return <>
    <button type="button" data-action-status="complete" className="ac-btn ac-btn-xs" onClick={state.openSave} disabled={!state.ready || state.busy}>Save</button>
    <button type="button" data-action-status="complete" className="ac-btn ac-btn-xs" onClick={state.openRename} disabled={!state.ready || state.busy}>Rename</button>
    <button type="button" data-action-status="complete" className="ac-btn ac-btn-xs" onClick={state.openDelete} disabled={!state.ready || state.busy || !saved}>Delete</button>
  </>;
}
