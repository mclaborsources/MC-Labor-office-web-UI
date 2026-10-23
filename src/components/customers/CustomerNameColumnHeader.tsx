"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function CustomerNameColumnHeader({ label, columnKey, kind = "text", getValues, selected, sort, onFilter, onSort, width, onResize, onResetWidth, onMoveLeft, onMoveRight, onHide }: {
  label: string;
  columnKey?: string;
  kind?: "text" | "date" | "number";
  getValues: () => string[];
  selected?: string[];
  sort?: "asc" | "desc";
  onFilter: (values: string[] | undefined) => void;
  onSort: (direction: "asc" | "desc") => void;
  onHide?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  width?: number;
  onResize?: (width: number) => void;
  onResetWidth?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const drag = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    const reposition = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (rect) setPosition({ left: Math.max(0, Math.min(rect.left, window.innerWidth - 290)), top: Math.max(0, Math.min(rect.bottom + 2, window.innerHeight - 380)) });
    };
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

  return <div className="ac-column-filter" data-column={columnKey} style={{ position: "relative", minWidth: 0 }}>
    <button ref={trigger} type="button" title={label} className={`ac-column-filter-trigger${selected || sort ? " is-active" : ""}`} aria-label={`Sort or filter ${label}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>
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
      <CustomerNameColumnMenu label={label} kind={kind} getValues={getValues} selected={selected} onFilter={onFilter} onSort={onSort} onMoveLeft={onMoveLeft} onMoveRight={onMoveRight} onHide={onHide} close={() => setOpen(false)} />
    </div>, document.body)}
  </div>;
}

function CustomerNameColumnMenu({ label, kind, getValues, selected, onFilter, onSort, onMoveLeft, onMoveRight, onHide, close }: {
  onMoveLeft?: () => void; onMoveRight?: () => void; onHide?: () => void;
  label: string; getValues: () => string[]; selected?: string[];
  kind: "text" | "date" | "number";
  onFilter: (values: string[] | undefined) => void; onSort: (direction: "asc" | "desc") => void; close: () => void;
}) {
  const [values] = useState(() => [...new Set(getValues())].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })));
  const [draft, setDraft] = useState(() => new Set(selected ?? values));
  const [search, setSearch] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const shown = useMemo(() => values.filter(value => (value || "(Blanks)").toLowerCase().includes(search.toLowerCase())), [values, search]);
  const first = Math.max(0, Math.floor(scrollTop / 26) - 3);
  const last = Math.min(shown.length, first + 16);
  const dates = kind === "date";
  return <>
    {(onMoveLeft || onMoveRight) && <>
      <button type="button" className="ac-column-filter-action" disabled={!onMoveLeft} onClick={() => { onMoveLeft?.(); close(); }}>Move column left</button>
      <button type="button" className="ac-column-filter-action" disabled={!onMoveRight} onClick={() => { onMoveRight?.(); close(); }}>Move column right</button>
    </>}
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
