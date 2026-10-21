"use client";

import { useMemo } from "react";
import type { CustomerNameMatch } from "@/lib/customerNameSearchColumns";
import type { CustomerSearch1Filters as Filters } from "@/lib/customerSearch1Filters";

const exactFields = [
  ["customerType", "Customer Type"], ["custStatus", "Customer Status"], ["profileType", "Profile Type"],
  ["state", "State"], ["city", "City"], ["internetSalesReady", "Internet Sales Ready"],
] as const;

export function CustomerSearch1Filters({ rows, filters, onChange, onClear }: {
  rows: CustomerNameMatch[]; filters: Filters; onChange: (filters: Filters) => void; onClear: () => void;
}) {
  const options = useMemo(() => Object.fromEntries(exactFields.map(([key]) => [key,
    [...new Set(rows.map(row => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  ])), [rows]);
  const update = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
  return <div className="ac-customer-search-filter-row ac-customer-search-1-filters" aria-label="Customer Search 1 filters">
    <input type="search" className="ac-input" aria-label="Search all loaded customer fields" placeholder="Search all loaded fields…"
      value={filters.search ?? ""} onChange={event => update("search", event.target.value)} />
    {exactFields.map(([key, label]) => <select key={key} className="ac-select" aria-label={label} value={filters[key] ?? ""} onChange={event => update(key, event.target.value)}>
      <option value="">All {label.toLowerCase()}</option>
      {(options[key] ?? []).map(value => <option key={value} value={value}>{value}</option>)}
    </select>)}
    <select className="ac-select" aria-label="In Tracking" value={filters.inTracking ?? ""} onChange={event => update("inTracking", event.target.value)}>
      <option value="">In Tracking: All</option><option value="yes">In Tracking</option><option value="no">Not in Tracking</option>
    </select>
    <label>Last week from <input className="ac-input" type="date" aria-label="Last week ending from" value={filters.fromDate ?? ""} onChange={event => update("fromDate", event.target.value)} /></label>
    <label>to <input className="ac-input" type="date" aria-label="Last week ending to" value={filters.toDate ?? ""} onChange={event => update("toDate", event.target.value)} /></label>
    <select className="ac-select" aria-label="Find Duplicates" value={filters.duplicates ?? ""} onChange={event => update("duplicates", event.target.value)}>
      <option value="">Find Duplicates: Off</option><option value="customerName">Customer name</option><option value="street">Street</option>
      <option value="ctcEmail">Contact email</option><option value="ctcCell">Contact cell</option>
    </select>
    <button type="button" className="ac-btn ac-btn-xs" onClick={onClear}>Clear filters</button>
  </div>;
}
