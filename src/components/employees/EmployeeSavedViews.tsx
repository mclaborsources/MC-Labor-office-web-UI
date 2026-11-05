"use client";

import { createContext, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { EMPLOYEE_SEARCH_PRESET_GRID, EMPLOYEE_SEARCH_VIEWS_2_GRID, type EmployeeSearchColumnKey } from "@/lib/employeeSearchColumns";
import { defaultEmployeeViewLayout, employeeSearchDefaultPresetLayout, employeeSearchViews2DefaultPresetLayout, employeeSearchViews2QualificationsPresetLayout, employeeSearchViews2SubTradesPresetLayout, employeeSearchViews2AgeLicenseLevelPresetLayout, employeeSearchViews2CarRtsRipPresetLayout, employeeSearchViews2ResumeNumberPresetLayout, employeeSearchEmergencyNumberPresetLayout, employeeSearchIdDriverLicensePresetLayout, employeeSearchViews2EmailTextPresetLayout, employeeSearchViews2CallHistoryPresetLayout, employeeSearchViews2FutureCallPresetLayout, employeeSearchViews2CustomerJobInfoPresetLayout, employeeSearchViews2TimesheetRequestPresetLayout, employeeSearchViews2AvailableManPresetLayout, employeeSearchViews2UiPresetLayout, employeeSearchViews2EeSearchPresetLayout, employeeSearchViews2View40PresetLayout, employeeSearchViews2View45PresetLayout, employeeSearchViews2View46PresetLayout, employeeSearchViews2View47PresetLayout, employeeSearchViews2View48PresetLayout, employeeSearchViews2View49PresetLayout, employeeSearchViews2View50PresetLayout, employeeSearchViews2View55PresetLayout, employeeSearchViews2View56PresetLayout, employeeSearchViews2View57PresetLayout, employeeSearchViews2View58PresetLayout, employeeSearchViews2View59PresetLayout, employeeSearchViews2View60PresetLayout, employeeSearchPresetSchema, employeeSearchPresetLayoutForName, employeeSavedViewSchema, normalizeEmployeeSavedView, type EmployeeSavedView, type EmployeeSearchPreset, type EmployeeViewLayout } from "@/lib/employeeSavedViews";

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
  setWidths: Dispatch<SetStateAction<EmployeeViewLayout["widths"]>>;
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


function normalizeViews2Layout(layout: EmployeeViewLayout): EmployeeViewLayout {
  const grade: EmployeeSearchColumnKey = "EmGrade";
  const howRef: EmployeeSearchColumnKey = "EmHowReferred";
  const trade: EmployeeSearchColumnKey = "EmTrade";
  const status: EmployeeSearchColumnKey = "EmEmployeeStatus";
  const visible = (key: EmployeeSearchColumnKey) => !layout.hidden.includes(key);
  const order: EmployeeSearchColumnKey[] = [...layout.order];
  if (visible(howRef) && (visible(grade) || visible(trade))) {
    const existingHowRefIndex = order.findIndex(key => key === howRef);
    if (existingHowRefIndex >= 0) order.splice(existingHowRefIndex, 1);
    const gradeIndex = visible(grade) ? order.findIndex(key => key === grade) : -1;
    const tradeIndex = visible(trade) ? order.findIndex(key => key === trade) : -1;
    const insertAt = gradeIndex >= 0 ? gradeIndex + 1 : tradeIndex;
    if (insertAt >= 0) order.splice(insertAt, 0, howRef);
  }
  return {...layout, order, widths: visible(status) ? {...layout.widths, [status]:70} : layout.widths};
}

export function EmployeeSavedViewsProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState(1);
  const [views, setViews] = useState<EmployeeSavedView[]>([]);
  const [presets, setPresets] = useState<EmployeeSearchPreset[]>([]);
  const [layout, setLayout] = useState(employeeSearchDefaultPresetLayout);
  const [viewWidths, setViewWidths] = useState<Record<number, EmployeeViewLayout["widths"]>>({});
  const [widthsReady, setWidthsReady] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("employee-per-view-widths-v2") ?? "{}");
      const loaded: Record<number, EmployeeViewLayout["widths"]> = {};
      for (const [view, values] of Object.entries(stored)) {
        const parsed = employeeSavedViewSchema.shape.layout.shape.widths.safeParse(values);
        if (parsed.success) loaded[Number(view)] = parsed.data;
      }
      setViewWidths(loaded);
    } catch { /* Storage is optional. */ }
    setWidthsReady(true);
  }, []);
  useEffect(() => {
    if (widthsReady) try { localStorage.setItem("employee-per-view-widths-v2", JSON.stringify(viewWidths)); } catch { /* Keep session widths. */ }
  }, [viewWidths, widthsReady]);
  const setWidths: Dispatch<SetStateAction<EmployeeViewLayout["widths"]>> = update => {
    setViewWidths(current => ({...current, [slot]: typeof update === "function" ? update(current[slot] ?? {}) : update}));
  };
  const effectiveBase = slot === 31 ? normalizeViews2Layout(employeeSearchViews2DefaultPresetLayout()) : slot === 32 ? normalizeViews2Layout(employeeSearchViews2QualificationsPresetLayout()) : slot === 33 ? normalizeViews2Layout(employeeSearchViews2SubTradesPresetLayout()) : slot === 34 ? normalizeViews2Layout(employeeSearchViews2AgeLicenseLevelPresetLayout()) : slot === 35 ? normalizeViews2Layout(employeeSearchViews2CarRtsRipPresetLayout()) : slot === 36 ? normalizeViews2Layout(employeeSearchViews2ResumeNumberPresetLayout()) : slot === 37 ? normalizeViews2Layout(employeeSearchEmergencyNumberPresetLayout()) : slot === 38 ? normalizeViews2Layout(employeeSearchIdDriverLicensePresetLayout()) : slot === 39 ? normalizeViews2Layout(employeeSearchViews2EmailTextPresetLayout()) : slot === 41 ? normalizeViews2Layout(employeeSearchViews2CallHistoryPresetLayout()) : slot === 42 ? normalizeViews2Layout(employeeSearchViews2FutureCallPresetLayout()) : slot === 43 ? normalizeViews2Layout(employeeSearchViews2CustomerJobInfoPresetLayout()) : slot === 44 ? normalizeViews2Layout(employeeSearchViews2TimesheetRequestPresetLayout()) : slot === 51 ? normalizeViews2Layout(employeeSearchViews2AvailableManPresetLayout()) : slot === 52 ? normalizeViews2Layout(employeeSearchViews2UiPresetLayout()) : slot === 54 ? normalizeViews2Layout(employeeSearchViews2EeSearchPresetLayout()) : slot === 40 ? normalizeViews2Layout(employeeSearchViews2View40PresetLayout()) : slot === 45 ? normalizeViews2Layout(employeeSearchViews2View45PresetLayout()) : slot === 46 ? normalizeViews2Layout(employeeSearchViews2View46PresetLayout()) : slot === 47 ? normalizeViews2Layout(employeeSearchViews2View47PresetLayout()) : slot === 48 ? normalizeViews2Layout(employeeSearchViews2View48PresetLayout()) : slot === 49 ? normalizeViews2Layout(employeeSearchViews2View49PresetLayout()) : slot === 50 || slot === 53 ? employeeSearchViews2View50PresetLayout() : slot === 55 ? normalizeViews2Layout(employeeSearchViews2View55PresetLayout()) : slot === 56 ? normalizeViews2Layout(employeeSearchViews2View56PresetLayout()) : slot === 57 ? normalizeViews2Layout(employeeSearchViews2View57PresetLayout()) : slot === 58 ? normalizeViews2Layout(employeeSearchViews2View58PresetLayout()) : slot === 59 ? normalizeViews2Layout(employeeSearchViews2View59PresetLayout()) : slot === 60 ? normalizeViews2Layout(employeeSearchViews2View60PresetLayout()) : slot >= 31 && slot <= 60 ? normalizeViews2Layout(layout) : layout;
  const effectiveWidths = slot === 31 || slot === 32 || slot === 33 || slot === 34 || slot === 35 || slot === 36 || slot === 37 || slot === 38 || slot === 39 || slot === 41 || slot === 42 || slot === 43 || slot === 44 || slot === 51 || slot === 52 || slot === 54 || slot === 40 || slot === 45 || slot === 46 || slot === 47 || slot === 48 || slot === 49 || slot === 50 || slot === 53 || slot === 55 || slot === 56 || slot === 57 || slot === 58 || slot === 59 || slot === 60 ? effectiveBase.widths : viewWidths[slot] ?? {};
  const effectiveLayout = {...effectiveBase, widths: slot >= 31 && slot <= 60 && !effectiveBase.hidden.includes("EmEmployeeStatus")
    ? {...effectiveWidths, EmEmployeeStatus:70}
    : effectiveWidths};
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
    const resetToDefault = () => {
      selectionRevision.current += 1;
      setSlot(1);
      setLayout(employeeSearchDefaultPresetLayout());
    };
    const reopen = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;
      const url = new URL(link.getAttribute("href")!, window.location.href);
      if (url.origin === window.location.origin && url.pathname === "/employees") resetToDefault();
    };
    const restore = (event: PageTransitionEvent) => { if (event.persisted) resetToDefault(); };
    document.addEventListener("click", reopen, true);
    window.addEventListener("pageshow", restore);
    return () => {
      document.removeEventListener("click", reopen, true);
      window.removeEventListener("pageshow", restore);
    };
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/employees/saved-views", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const saved = (data.views as unknown[]).map(normalizeEmployeeSavedView);
        if (active) {
          setViews(saved);
          if (selectionRevision.current === 0) setLayout(employeeSearchDefaultPresetLayout());
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
    const nextLayout = next === 1 ? employeeSearchDefaultPresetLayout() : next === 31 ? employeeSearchViews2DefaultPresetLayout() : next === 32 ? employeeSearchViews2QualificationsPresetLayout() : personalView?.layout ?? sharedPreset?.layout ?? defaultEmployeeViewLayout();
    setLayout(next >= 31 && next <= 60 ? normalizeViews2Layout(nextLayout) : nextLayout);
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
    const nextLayout = next === 1 ? employeeSearchDefaultPresetLayout() : next === 31 ? employeeSearchViews2DefaultPresetLayout() : next === 32 ? employeeSearchViews2QualificationsPresetLayout() : personalView?.layout ?? sharedPreset?.layout ?? fallbackLayout;
    setLayout(next >= 31 && next <= 60 ? normalizeViews2Layout(nextLayout) : nextLayout);
    setMessage("");
  };
  const openSave = () => {
    saveSlot.current = slot;
    snapshot.current = structuredClone(effectiveLayout);
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
  return <Context.Provider value={{ slot, select, selectPreset, views, layout:effectiveLayout, setLayout, setWidths, ready, busy, message, canRename, openSave, openRename, openDelete, remove }}>
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





