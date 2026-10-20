"use client";

import { useEffect, useRef, useState } from "react";

export interface TrackingGridColumn<T> {
  key: string;
  label: string;
  value: (row: T) => unknown;
}

export function filterTrackingValues<T>(rows: T[], columns: TrackingGridColumn<T>[], filters: Record<string, string[]>, sort: { key: string; direction: "asc" | "desc" } | null): T[] {
  let result = rows.filter(row => columns.every(column => {
    const selected = filters[column.key];
    if (!selected) return true;
    const value = normalizedValue(column.value(row));
    return selected.includes(value);
  }));
  if (sort) {
    const column = columns.find(item => item.key === sort.key);
    if (column) result = [...result].sort((a, b) => compareValues(column.value(a), column.value(b), sort.direction));
  }
  return result;
}

export function normalizedValue(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === "") return "";
  return String(value).trim();
}

function compareValues(leftValue: unknown, rightValue: unknown, direction: "asc" | "desc") {
  const left = normalizedValue(leftValue), right = normalizedValue(rightValue);
  if (!left) return right ? 1 : 0;
  if (!right) return -1;
  const leftDate = Date.parse(left), rightDate = Date.parse(right);
  const looksLikeDate = (value: string) => /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(value);
  if (looksLikeDate(left) && looksLikeDate(right) && Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
    const dateComparison = leftDate - rightDate;
    return direction === "asc" ? dateComparison : -dateComparison;
  }
  const leftNumber = left.replace(/[$,%\s]/g, ""), rightNumber = right.replace(/[$,%\s]/g, "");
  const leftIsNumber = leftNumber !== "" && Number.isFinite(Number(leftNumber));
  const rightIsNumber = rightNumber !== "" && Number.isFinite(Number(rightNumber));
  const comparison = leftIsNumber && rightIsNumber
    ? Number(leftNumber) - Number(rightNumber)
    : left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
  return direction === "asc" ? comparison : -comparison;
}

export function TrackingColumnFilter<T>({ column, rows, activeFilter, activeSort, onFilter, onSort }: {
  column: TrackingGridColumn<T>;
  rows: T[];
  activeFilter?: string[];
  activeSort?: "asc" | "desc";
  onFilter: (key: string, values: string[] | undefined) => void;
  onSort: (key: string, direction: "asc" | "desc") => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const values = Array.from(new Set(rows.map(row => normalizedValue(column.value(row))))).sort((a, b) => {
    if (!a) return -1;
    if (!b) return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
  const shown = values.filter(value => (value || "(Blanks)").toLocaleLowerCase().includes(search.toLocaleLowerCase()));

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", keydown); };
  }, [open]);

  function showMenu() {
    setDraft(activeFilter ? [...activeFilter] : [...values]);
    setSearch("");
    setOpen(value => !value);
  }

  return <div className="ac-column-filter" ref={root}>
    <button type="button" className={`ac-column-filter-trigger${activeFilter || activeSort ? " is-active" : ""}`} aria-label={`Filter ${column.label}`} aria-haspopup="dialog" aria-expanded={open} title={`Sort or filter ${column.label}`} onClick={showMenu}>
      <span className="ac-column-filter-label">{column.label}{activeSort ? (activeSort === "asc" ? " ▲" : " ▼") : ""}</span><span className="ac-column-filter-arrow" aria-hidden="true">▾</span>
    </button>
    {open && <div className="ac-column-filter-menu" role="dialog" aria-label={`${column.label} sort and filter`}>
      <button type="button" className="ac-column-filter-action" onClick={() => { onSort(column.key, "asc"); setOpen(false); }}>A↓ &nbsp; Sort A to Z</button>
      <button type="button" className="ac-column-filter-action" onClick={() => { onSort(column.key, "desc"); setOpen(false); }}>Z↓ &nbsp; Sort Z to A</button>
      <button type="button" className="ac-column-filter-action" disabled={!activeFilter && !activeSort} onClick={() => { onFilter(column.key, undefined); setOpen(false); }}>⌫ &nbsp; Clear filter from {column.label}</button>
      <input className="ac-column-filter-search" type="search" placeholder="Search values" aria-label={`Search ${column.label} values`} value={search} onChange={event => setSearch(event.target.value)} />
      <label className="ac-column-filter-option all"><input type="checkbox" checked={values.every(value => draft.includes(value))} onChange={event => setDraft(event.target.checked ? [...values] : [])} /> (Select All)</label>
      <div className="ac-column-filter-values">{shown.map(value => <label className="ac-column-filter-option" key={value || "__blank__"} title={value || "(Blanks)"}>
        <input type="checkbox" checked={draft.includes(value)} onChange={event => setDraft(current => event.target.checked ? [...current, value] : current.filter(item => item !== value))} />
        <span>{value || "(Blanks)"}</span>
      </label>)}{shown.length === 0 && <div className="ac-column-filter-none">No matching values</div>}</div>
      <div className="ac-column-filter-buttons"><button type="button" className="primary" onClick={() => { onFilter(column.key, draft.length === values.length ? undefined : draft); setOpen(false); }}>OK</button><button type="button" onClick={() => setOpen(false)}>Cancel</button></div>
    </div>}
  </div>;
}
