"use client";

import { useMemo } from "react";
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
  const options = useMemo(() => Object.fromEntries(exactFields.map(([key]) => [key,
    [...new Set(rows.map(row => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  ])), [rows]);
  const update = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
  const selectedFilter = exactFields.find(([key]) => filters[key]);
  const chooseDateRange = (range: string) => {
    if (!range) { onChange({ ...filters, dateRange: "", fromDate: "", toDate: "" }); return; }
    if (range === "custom-range") { onChange({ ...filters, dateRange: range }); return; }
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (range === "present-week") start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    else if (range === "last-2-weeks") start.setDate(start.getDate() - 14);
    else if (range === "last-month") start.setMonth(start.getMonth() - 1);
    else if (range === "last-3-months") start.setMonth(start.getMonth() - 3);
    else if (range === "last-6-months") start.setMonth(start.getMonth() - 6);
    else if (range === "last-12-months") start.setMonth(start.getMonth() - 12);
    const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    onChange({ ...filters, dateRange: range, fromDate: format(start), toDate: format(end) });
  };
  return <div className="ac-customer-search-filter-row ac-customer-search-access-filter-row" aria-label="Customer Search 1 filters">
    <select className="ac-select ac-customer-search-row-select" aria-label="In Tracking" value={filters.inTracking ?? ""} onChange={event => update("inTracking", event.target.value)}>
      <option value="">&lt;In Tracking?&gt;</option><option value="yes">In Tracking</option><option value="no">Not in Tracking</option>
    </select>
    <select className="ac-select ac-customer-search-row-select" aria-label="Date Range" value={filters.dateRange ?? ""} onChange={event => chooseDateRange(event.target.value)}>
      <option value="">&lt;Date Range&gt;</option><option value="present-week">Present Week</option><option value="last-2-weeks">In Last 2 Weeks</option><option value="last-month">In Last 1 Month</option><option value="last-3-months">In Last 3 Months</option><option value="last-6-months">In Last 6 Months</option><option value="last-12-months">In Last 12 Months</option><option value="custom-range">Custom Range</option>
    </select>
    <ClusterMultiSelect value={filters.clusterCities} onChange={value => update("clusterCities", value)} />
    {filters.dateRange === "custom-range" && <div className="ac-customer-search-custom-range"><input className="ac-input" type="date" aria-label="Last week ending from" value={filters.fromDate ?? ""} onChange={event => update("fromDate", event.target.value)} /><input className="ac-input" type="date" aria-label="Last week ending to" value={filters.toDate ?? ""} onChange={event => update("toDate", event.target.value)} /></div>}
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

