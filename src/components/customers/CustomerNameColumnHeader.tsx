"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";

export function CustomerNameColumnHeader({ label, columnKey, kind = "text", getValues, selected, sort, onFilter, onSort, onSelect, onDragStart, onDragOver, onDrop, onDragEnd, dragging, dropTarget, width, onResize, onResetWidth, onHide, onUnhideColumns }: {
  label: string;
  columnKey?: string;
  kind?: "text" | "date" | "number";
  getValues: () => string[];
  selected?: string[];
  sort?: "asc" | "desc";
  onFilter: (values: string[] | undefined) => void;
  onSort: (direction: "asc" | "desc") => void;
  onSelect?: () => void;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
  dropTarget?: boolean;
  onHide?: () => void;
  onUnhideColumns?: () => void;
  width?: number;
  onResize?: (width: number) => void;
  onResetWidth?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [widthModalOpen, setWidthModalOpen] = useState(false);
  const [widthValue, setWidthValue] = useState(String(width ?? 100));
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const drag = useRef<{ x: number; width: number } | null>(null);

  function updateMenuPosition() {
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) setPosition({
      left: Math.max(0, Math.min(rect.left, window.innerWidth - 290)),
      top: Math.max(0, Math.min(rect.bottom + 2, window.innerHeight - 380)),
    });
  }

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    const reposition = updateMenuPosition;
    reposition();
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  return <div className="ac-column-filter" data-column={columnKey} draggable={Boolean(onDragStart)}
    onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
    style={{ position: "relative", minWidth: 0, cursor: onDragStart ? "grab" : undefined, opacity: dragging ? 0.45 : 1, outline: dropTarget ? "2px solid #2563eb" : undefined, outlineOffset: -2 }}>
    <button ref={trigger} type="button" title={label} className={`ac-column-filter-trigger${selected || sort ? " is-active" : ""}`} aria-label={`Sort or filter ${label}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => { onSelect?.(); if (!open) updateMenuPosition(); setOpen(!open); }}>
      <span>{label}{sort ? (sort === "asc" ? " ↑" : " ↓") : ""}{selected ? " •" : ""}</span><span aria-hidden="true">▾</span>
    </button>
    {onResize && <span role="separator" aria-orientation="vertical" aria-label={`Resize ${label} column`} tabIndex={0}
      aria-valuemin={48} aria-valuemax={1600} aria-valuenow={width}
      title="Drag to resize; double-click to reset width"
      style={{ position: "absolute", right: -3, top: 0, bottom: 0, width: 7, cursor: "col-resize", touchAction: "none", userSelect: "none", zIndex: 2 }}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.preventDefault(); event.stopPropagation();
        drag.current = { x: event.clientX, width: event.currentTarget.parentElement!.getBoundingClientRect().width };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => { if (drag.current) onResize(Math.max(48, Math.min(1600, Math.round(drag.current.width + event.clientX - drag.current.x)))); }}
      onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onLostPointerCapture={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onDoubleClick={event => { event.stopPropagation(); onResetWidth?.(); }}
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          onResize(Math.max(48, Math.min(1600, (width ?? 100) + (event.key === "ArrowRight" ? 10 : -10))));
        } else if (event.key === "Home") { event.preventDefault(); onResetWidth?.(); }
      }} />}
    {open && createPortal(<div ref={menu} className="ac-column-filter-menu" style={{ position: "fixed", ...position, width: 280, maxHeight: "100vh", overflow: "auto" }} role="dialog" aria-label={`${label} sort and filter`}>
      <CustomerNameColumnMenu label={label} kind={kind} getValues={getValues} selected={selected} onFilter={onFilter} onSort={onSort} onResize={onResize} onHide={onHide} onUnhideColumns={onUnhideColumns} close={() => setOpen(false)} openWidth={() => { setWidthValue(String(width ?? 100)); setOpen(false); setWidthModalOpen(true); }} />
    </div>, document.body)}
    {widthModalOpen && onResize && createPortal(<div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", background: "rgba(0,0,0,.35)" }} onMouseDown={event => { if (event.target === event.currentTarget) setWidthModalOpen(false); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="ac-field-width-title" onSubmit={event => {
        event.preventDefault();
        const parsed = Number(widthValue);
        if (!Number.isInteger(parsed) || parsed < 48 || parsed > 1600) return;
        onResize(parsed);
        setWidthModalOpen(false);
      }} style={{ width: 360, maxWidth: "calc(100vw - 32px)", padding: 20, background: "white", borderRadius: 6, boxShadow: "0 12px 36px rgba(0,0,0,.28)" }}>
        <h2 id="ac-field-width-title" style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 600 }}>Field width</h2>
        <label style={{ display: "grid", gap: 6, fontSize: 14 }}>{label} column width (48–1600 px)
          <input autoFocus type="number" min={48} max={1600} step={1} value={widthValue} onChange={event => setWidthValue(event.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 8 }} />
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button type="button" onClick={() => setWidthModalOpen(false)}>Cancel</button>
          <button type="submit" disabled={!Number.isInteger(Number(widthValue)) || Number(widthValue) < 48 || Number(widthValue) > 1600}>Apply</button>
        </div>
      </form>
    </div>, document.body)}
  </div>;
}

function CustomerNameColumnMenu({ label, kind, getValues, selected, onFilter, onSort, onResize, onHide, onUnhideColumns, close, openWidth }: {
  onResize?: (width: number) => void; onHide?: () => void; onUnhideColumns?: () => void; openWidth: () => void;
  label: string; getValues: () => string[]; selected?: string[];
  kind: "text" | "date" | "number";
  onFilter: (values: string[] | undefined) => void; onSort: (direction: "asc" | "desc") => void; close: () => void;
}) {
  const [values, setValues] = useState<string[]>([]);
  const getValuesRef = useRef(getValues);
  getValuesRef.current = getValues;
  const [draft, setDraft] = useState(() => new Set(selected ?? []));
  const [search, setSearch] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Let the menu paint before collecting and sorting potentially thousands of rows.
    const timer = window.setTimeout(() => {
      const nextValues = [...new Set(getValuesRef.current())].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
      setValues(nextValues);
      setDraft(new Set(selected ?? nextValues));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const shown = useMemo(() => values.filter(value => (value || "(Blanks)").toLowerCase().includes(search.toLowerCase())), [values, search]);
  const first = Math.max(0, Math.floor(scrollTop / 26) - 3);
  const last = Math.min(shown.length, first + 16);
  const dates = kind === "date";
  return <>
    {onResize && <button type="button" className="ac-column-filter-action" onClick={openWidth}>Field width</button>}
    {onUnhideColumns && <button type="button" className="ac-column-filter-action" onClick={() => { close(); onUnhideColumns(); }}>Unhide columns</button>}
    {onHide && <button type="button" className="ac-column-filter-action" onClick={() => { close(); onHide(); }}>Hide column</button>}
    <button type="button" className="ac-column-filter-action" onClick={() => { onSort("asc"); close(); }}>{dates ? "Sort oldest to newest" : kind === "number" ? "Sort smallest to largest" : "Sort A to Z"}</button>
    <button type="button" className="ac-column-filter-action" onClick={() => { onSort("desc"); close(); }}>{dates ? "Sort newest to oldest" : kind === "number" ? "Sort largest to smallest" : "Sort Z to A"}</button>
    <button type="button" className="ac-column-filter-action" disabled={!selected} onClick={() => { onFilter(undefined); close(); }}>Clear filter from {label}</button>
    <input autoFocus className="ac-column-filter-search" type="search" placeholder="Search values" aria-label={`Search ${label} values`} value={search} onChange={event => { setSearch(event.target.value); setScrollTop(0); if (viewport.current) viewport.current.scrollTop = 0; }} />
    <label className="ac-column-filter-option"><input type="checkbox" checked={shown.length > 0 && shown.every(value => draft.has(value))} onChange={event => { const checked = event.target.checked; setDraft(current => { const next = new Set(current); shown.forEach(value => { if (checked) next.add(value); else next.delete(value); }); return next; }); }} /> Select all matching values</label>
    <div ref={viewport} style={{ height: 208, overflow: "auto" }} onScroll={event => setScrollTop(event.currentTarget.scrollTop)}>
      <div aria-hidden="true" style={{ height: first * 26 }} />
      {shown.slice(first, last).map(value => <label className="ac-column-filter-option" style={{ height: 26, boxSizing: "border-box" }} key={value} title={value || "(Blanks)"}>
        <input type="checkbox" checked={draft.has(value)} onChange={() => setDraft(current => { const next = new Set(current); if (next.has(value)) next.delete(value); else next.add(value); return next; })} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "(Blanks)"}</span>
      </label>)}
      <div aria-hidden="true" style={{ height: (shown.length - last) * 26 }} />
      {shown.length === 0 && <div className="ac-column-filter-none">No matching values</div>}
    </div>
    <div className="ac-column-filter-buttons"><button type="button" onClick={() => {
      const applied = (search.trim() ? shown : values).filter(value => draft.has(value));
      onFilter(applied.length === values.length ? undefined : applied);
      close();
    }}>OK</button><button type="button" onClick={close}>Cancel</button></div>
  </>;
}
