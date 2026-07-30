"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface EmployeeSearchColumnHeaderProps {
  label: string;
  values: string[];
}

const SAMPLE_VALUES = ["Betolinos", "Cardinal Medieros Pkwy", "Leland House Waltham", "Penrose ORLEANS"];

export function EmployeeSearchColumnHeader({
  label,
  values,
}: EmployeeSearchColumnHeaderProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => {
    const actual = [...new Set(values.filter(Boolean))].slice(0, 12);
    return ["(Blanks)", ...(actual.length > 0 ? actual : SAMPLE_VALUES)];
  }, [values]);
  const [selected, setSelected] = useState(() => new Set(options));

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const allSelected = options.every((option) => selected.has(option));

  function toggleOption(option: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(options));
  }

  return (
    <div ref={containerRef} className="ac-column-filter">
      <button
        type="button"
        className="ac-column-filter-trigger"
        aria-label={`Filter ${label || "column"}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{label}</span>
        <span className="ac-column-filter-arrow" aria-hidden />
      </button>

      {open ? (
        <div className="ac-column-filter-menu">
          <button type="button" className="ac-column-filter-command">
            <span className="ac-column-filter-sort-icon">A↓<small>Z</small></span>
            <span>Sort A to Z</span>
          </button>
          <button type="button" className="ac-column-filter-command">
            <span className="ac-column-filter-sort-icon">Z↓<small>A</small></span>
            <span>Sort Z to A</span>
          </button>
          <div className="ac-column-filter-separator" />
          <button type="button" className="ac-column-filter-command ac-column-filter-clear" disabled>
            <span className="ac-column-filter-funnel">▽</span>
            <span>Clear filter from {label || "column"}</span>
          </button>
          <button type="button" className="ac-column-filter-text-filters">
            <span>Text Filters</span>
            <span>›</span>
          </button>
          <div className="ac-column-filter-options">
            <label>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <span>(Select All)</span>
            </label>
            {options.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={selected.has(option)}
                  onChange={() => toggleOption(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <div className="ac-column-filter-actions">
            <button type="button" onClick={() => setOpen(false)}>OK</button>
            <button type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <span className="ac-column-filter-resize" aria-hidden>⋰</span>
        </div>
      ) : null}
    </div>
  );
}
