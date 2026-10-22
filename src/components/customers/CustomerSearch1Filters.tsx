"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ClusterMultiSelect } from "./CustomerSearchViewsPanel";
import type { CustomerNameMatch } from "@/lib/customerNameSearchColumns";
import type { CustomerSearch1Filters as Filters } from "@/lib/customerSearch1Filters";

const exactFields = [
  ["customerType", "Customer Type"], ["custStatus", "Customer Status"], ["profileType", "Profile Type"],
  ["state", "State"], ["city", "City"], ["internetSalesReady", "Internet Sales Ready"],
] as const;

export function CustomerSearch1Filters({ rows, filters, onChange, onClear }: {
  rows: CustomerNameMatch[]; filters: Filters; onChange: (filters: Filters) => void; onClear: () => void;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const options = useMemo(() => Object.fromEntries(exactFields.map(([key]) => [key,
    [...new Set(rows.map(row => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  ])), [rows]);
  const update = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
  const selectedFilter = exactFields.find(([key]) => filters[key]);
  return <div className="ac-customer-search-filter-row ac-customer-search-access-filter-row" aria-label="Customer Search 1 filters">
    <select className="ac-select ac-customer-search-row-select" aria-label="In Tracking" value={filters.inTracking ?? ""} onChange={event => update("inTracking", event.target.value)}>
      <option value="">&lt;In Tracking?&gt;</option><option value="yes">In Tracking</option><option value="no">Not in Tracking</option>
    </select>
    <div className="ac-customer-search-date-range">
      <button type="button" className="ac-select" aria-expanded={dateOpen} aria-label="Date Range" onClick={() => setDateOpen(value => !value)}>{filters.fromDate || filters.toDate ? "Date Range selected" : "<Date Range>"}<span aria-hidden="true">▾</span></button>
      {dateOpen && <div className="ac-customer-search-date-popup">
        <label>From <input className="ac-input" type="date" aria-label="Last week ending from" value={filters.fromDate ?? ""} onChange={event => update("fromDate", event.target.value)} /></label>
        <label>To <input className="ac-input" type="date" aria-label="Last week ending to" value={filters.toDate ?? ""} onChange={event => update("toDate", event.target.value)} /></label>
        <button type="button" className="ac-btn" onClick={() => { onChange({ ...filters, fromDate: "", toDate: "" }); setDateOpen(false); }}>Clear</button><button type="button" className="ac-btn" onClick={() => setDateOpen(false)}>OK</button>
      </div>}
    </div>
    <ClusterMultiSelect />
    <input type="search" className="ac-input ac-customer-search-search-input" aria-label="Search all loaded customer fields" value={filters.search ?? ""} onChange={event => update("search", event.target.value)} />
    <button type="button" className="ac-btn ac-customer-search-search-icon-btn" aria-label="Search" onClick={() => onChange({ ...filters })}><Search size={18} /></button>
    <span className="ac-customer-search-filter-label">Filter:</span>
    <select className="ac-select ac-customer-search-filter-input" aria-label="Filter" value={selectedFilter ? JSON.stringify([selectedFilter[0], filters[selectedFilter[0]]]) : ""} onChange={event => {
      if (event.target.value === "clear") { onClear(); return; }
      const next = { ...filters };
      exactFields.forEach(([key]) => { delete next[key]; });
      if (event.target.value) { const [key, value] = JSON.parse(event.target.value) as [typeof exactFields[number][0], string]; next[key] = value; }
      onChange(next);
    }}>
      <option value="" /><option value="clear">Clear filters</option>
      {exactFields.map(([key, label]) => <optgroup key={key} label={label}>{(options[key] ?? []).map(value => <option key={value} value={JSON.stringify([key, value])}>{label}: {value}</option>)}</optgroup>)}
    </select>
    <select className="ac-select ac-customer-search-duplicates-select" aria-label="Find Duplicates" value={filters.duplicates ?? ""} onChange={event => update("duplicates", event.target.value)}>
      <option value="">&lt;Find Duplicates&gt;</option><option value="customerName">Customer name</option><option value="street">Street</option><option value="ctcEmail">Contact email</option><option value="ctcCell">Contact cell</option>
    </select>
  </div>;
}

