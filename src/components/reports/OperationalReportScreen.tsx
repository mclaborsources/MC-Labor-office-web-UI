"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OperationalReportRow } from "@/lib/operationalReports";
import { trackingCsv } from "@/lib/trackingGrid";

const PAYROLL_COMPANIES = ["GS", "HSG", "IPG", "ISG", "MLS", "T&R", "AMP"];

function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T12:00:00`);
  shifted.setDate(shifted.getDate() + days);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}

function toFriday(date: string) {
  const selected = new Date(`${date}T12:00:00`);
  const daysUntilFriday = (5 - selected.getDay() + 7) % 7;
  selected.setDate(selected.getDate() + daysUntilFriday);
  return `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;
}

function readableDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function noiOptionValue(key: string, label: string) {
  if (label === "All") return "all";
  if (label === "Non Legal") return "__nonlegal__";
  if (label === "Legal") return "__legal__";
  if (label === "All Except A Plus") return "__not_aplus__";
  if (label === "Yes") return "__is_yes__";
  if (label === "No") return "__is_no__";
  if (key === "Oldest Invoice") {
    if (label.startsWith(">")) return label.replace(/\s*Days$/, "").replace(/\s+/g, "");
    const range = label.match(/^(\d+)\s*-\s*(\d+)$/);
    return range ? `range:${range[1]}:${range[2]}` : label;
  }
  if (key === "Customer Since") return ({ "1 Week": "within:7", "2 Weeks": "within:14", "3 Weeks": "within:21", "1 Month": "within:31", "2 Months": "within:62", "3 Months": "within:93" } as Record<string, string>)[label] ?? label;
  if (key === "Age of Job (days)") return label.startsWith(">") ? label.replace(/\s*Days$/, "").replace(/\s+/g, "") : label;
  if (key === "Job Unpaid" || key === "Total Open") return ({ "1K to 7K": "range:1000:7000", "7K to 20K": "range:7001:20000", "20K to 30K": "range:20001:30000", "30K to 40K": "range:30001:40000", "40K to 50K": "range:40001:50000", "50K to 100K": "range:50001:100000", "100K to 500K": "range:100001:500000", ">30K": ">30000", ">40K": ">40000" } as Record<string, string>)[label] ?? label;
  return label;
}

export function OperationalReportScreen({
  title,
  rows: initialRows,
  error: initialError = "",
  variant,
  initialWeekEnding = "",
}: {
  title: string;
  rows: OperationalReportRow[];
  error?: string;
  variant: "noc" | "noi" | "rates" | "bonus" | "sick" | "attendance" | "job-orders" | "invoices-week" | "margin-week" | "osha" | "schooling" | "tools" | "401k" | "insurance" | "employee-review" | "job-address-wcc" | "wcc-site" | "directions" | "multiple-jobs";
  initialWeekEnding?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("View 01");
  const [viewFilters, setViewFilters] = useState<Record<string, string>>({});
  const [noiJobSearch, setNoiJobSearch] = useState("");
  const [noiAgeFilter, setNoiAgeFilter] = useState("all");
  const [noiRevenueFilter, setNoiRevenueFilter] = useState("all");
  const [noiTrackingFilter, setNoiTrackingFilter] = useState("all");
  const [noiHas01Filter, setNoiHas01Filter] = useState("all");
  const [noiLegalFilter, setNoiLegalFilter] = useState("all");
  const [noiAdvancedFilters, setNoiAdvancedFilters] = useState<Record<string, string>>({});
  const [noiFilterNumber, setNoiFilterNumber] = useState("");
  const [noiEmailMode, setNoiEmailMode] = useState("freehand");
  const [noiEmailText, setNoiEmailText] = useState("");
  const [noiSalesmanSearch, setNoiSalesmanSearch] = useState("");
  const [noiSelectedSalesmen, setNoiSelectedSalesmen] = useState<Set<string>>(new Set());
  const [noiIncludeInfo, setNoiIncludeInfo] = useState(false);
  const [noiTerminated, setNoiTerminated] = useState("No");
  const [noiActiveTab, setNoiActiveTab] = useState("Views, Additional Updates");
  const [noiGoTo, setNoiGoTo] = useState("");
  const [noiSpacerCount, setNoiSpacerCount] = useState(0);
  const [noiSelectedRows, setNoiSelectedRows] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState(initialError);
  const [weekEnding, setWeekEnding] = useState(initialWeekEnding);
  const [payrollCompany, setPayrollCompany] = useState("IPG");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRows(initialRows);
    setError(initialError);
  }, [initialRows, initialError]);

  useEffect(() => {
    if (variant !== "noc") return;
    const saved = localStorage.getItem(`${variant}-report-view-${view}`);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { query?: string; filters?: Record<string, string> };
      setQuery(parsed.query ?? "");
      setViewFilters(parsed.filters ?? {});
    } catch {
      setQuery("");
      setViewFilters({});
    }
  }, [variant, view]);

  const columns = useMemo(() => Array.from(new Set(rows.flatMap(Object.keys))).filter((key) => key !== "id" && !(variant === "noi" && ["Customer Color", "NOI Sent", "NOI CMT Back", "NOC Sent", "NOC CMT Back"].includes(key))), [rows, variant]);
  const visible = useMemo(() => rows.filter((row) => {
    if (variant === "noi") {
      if (query && !String(row.Customer ?? "").toLowerCase().includes(query.toLowerCase())) return false;
      if (noiJobSearch && !String(row.Job ?? "").toLowerCase().includes(noiJobSearch.toLowerCase())) return false;
      const age = Number(row["Oldest Invoice"] ?? 0);
      const ageRanges: Record<string, [number, number]> = { "7-14": [7, 14], "15-21": [15, 21], "22-29": [22, 29], "30-39": [30, 39], "40-46": [40, 46], "47-53": [47, 53], ">32": [33, Number.POSITIVE_INFINITY], ">39": [40, Number.POSITIVE_INFINITY], ">46": [47, Number.POSITIVE_INFINITY], ">53": [54, Number.POSITIVE_INFINITY] };
      if (noiAgeFilter !== "all" && (age < ageRanges[noiAgeFilter][0] || age > ageRanges[noiAgeFilter][1])) return false;
      const revenue = Number(row["Last Week Revenue"] ?? 0);
      const revenueRanges: Record<string, [number, number]> = { "0-5000": [0, 5000], "5001-10000": [5001, 10000], "10001-20000": [10001, 20000], "20001-30000": [20001, 30000], "30001-40000": [30001, 40000], ">40000": [40001, Number.POSITIVE_INFINITY] };
      if (noiRevenueFilter !== "all" && (revenue < revenueRanges[noiRevenueFilter][0] || revenue > revenueRanges[noiRevenueFilter][1])) return false;
      if (noiTrackingFilter !== "all" && String(row["In Tracking This Week"] ?? "No") !== noiTrackingFilter) return false;
      if (noiHas01Filter !== "all" && String(row["Has 01 Invoice"] ?? "No") !== noiHas01Filter) return false;
      const isLegal = String(row["Legal Status"] ?? "").toLowerCase().includes("legal") && !String(row["Legal Status"] ?? "").toLowerCase().includes("non");
      if ((noiAgeFilter !== "all" || noiLegalFilter === "nonlegal") && isLegal) return false;
      if (noiLegalFilter === "legal" && !isLegal) return false;
      for (const [key, value] of Object.entries(noiAdvancedFilters)) {
        if (!value || value === "all") continue;
        const text = String(row[key] ?? "");
        if (value.startsWith("exact:")) {
          const expected = Number(value.slice(6));
          const actual = Number(text.replace(/[$,]/g, ""));
          if (!Number.isFinite(actual) || actual !== expected) return false;
          continue;
        }
        if (value.startsWith("exact-text:")) {
          if (text.toLowerCase() !== value.slice(11).toLowerCase()) return false;
          continue;
        }
        if (key === "Customer Since" && value.startsWith("days:")) {
          const since = new Date(text);
          const days = Number.isNaN(since.valueOf()) ? Number.POSITIVE_INFINITY : Math.floor((Date.now() - since.valueOf()) / 86_400_000);
          const [, min, max] = value.split(":").map(Number);
          if (days < min || (Number.isFinite(max) && days > max)) return false;
          continue;
        }
        if (key === "Customer Since" && value.startsWith("within:")) {
          const since = new Date(text);
          const days = Number.isNaN(since.valueOf()) ? Number.POSITIVE_INFINITY : Math.floor((Date.now() - since.valueOf()) / 86_400_000);
          if (days < 0 || days > Number(value.slice(8))) return false;
          continue;
        }
        if (value === "__has_value__" && !text.trim()) return false;
        if (value === "__missing__" && text.trim()) return false;
        if (value === "__is_yes__" && text.toLowerCase() !== "yes") return false;
        if (value === "__is_no__" && text.toLowerCase() !== "no") return false;
        if (value === "__not_aplus__" && text.toLowerCase().includes("a plus")) return false;
        if (value === "__nonlegal__" && !text.toLowerCase().includes("non legal")) return false;
        if (value === "__legal__" && (!text.toLowerCase().includes("legal") || text.toLowerCase().includes("non legal"))) return false;
        if (["__has_value__", "__missing__", "__is_yes__", "__is_no__", "__not_aplus__", "__nonlegal__", "__legal__"].includes(value)) continue;
        const number = Number(text.replace(/[$,]/g, ""));
        const rangeMatch = value.match(/^range:(\d+):(\d+)$/);
        if (rangeMatch && Number.isFinite(number)) { if (number < Number(rangeMatch[1]) || number > Number(rangeMatch[2])) return false; continue; }
        const parsed = value.startsWith(">") ? Number(value.slice(1)) : Number.NaN;
        if (!Number.isNaN(parsed) && Number.isFinite(number)) { if (number <= parsed) return false; }
        else if (text.toLowerCase() !== value.toLowerCase()) return false;
      }
      if (noiFilterNumber) {
        const creditHistory = String(row["Credit History"] ?? "").toLowerCase();
        const notGood = !["a plus", "good"].includes(creditHistory);
        if (noiFilterNumber === "not-good" && !notGood) return false;
        if (noiFilterNumber !== "not-good" && !String(row["NOI Flag"] ?? "").includes(noiFilterNumber)) return false;
      }
      return true;
    }
    if (query) {
      const haystack = variant === "rates" ? String(row.Customer ?? "") : Object.values(row).join(" ");
      if (!haystack.toLowerCase().includes(query.toLowerCase())) return false;
    }
    return Object.entries(viewFilters).every(([column, value]) => !value || String(row[column] ?? "") === (value === "__blank__" ? "" : value));
  }), [rows, query, variant, viewFilters, noiJobSearch, noiAgeFilter, noiRevenueFilter, noiTrackingFilter, noiHas01Filter, noiLegalFilter, noiAdvancedFilters, noiFilterNumber]);
  const [page, setPage] = useState(1);
  const pageSize = 250;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const shown = visible.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [query, rows, viewFilters, noiJobSearch, noiAgeFilter, noiRevenueFilter, noiTrackingFilter, noiHas01Filter, noiLegalFilter, noiAdvancedFilters, noiFilterNumber]);

  async function loadWeeklyRates(date = weekEnding, company = payrollCompany) {
    if (!date) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ weekEnding: date, payrollCompany: company === "all" ? "" : company });
      const response = await fetch(`/api/reports/weekly-rates?${params}`, { cache: "no-store" });
      const payload = await response.json() as { ok?: boolean; rows?: OperationalReportRow[]; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Weekly rates could not be loaded.");
      setRows(payload.rows ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Weekly rates could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (variant === "noc") localStorage.setItem(`${variant}-report-view-${view}`, JSON.stringify({ query, filters: viewFilters }));
    else localStorage.setItem(`${variant}-report-view`, JSON.stringify({ view, query }));
    setMessage("View saved on this computer.");
  }

  function openView(nextView: string) {
    setView(nextView);
    setMessage("");
    if (variant !== "noc") return;
    const saved = localStorage.getItem(`${variant}-report-view-${nextView}`);
    if (!saved) {
      setQuery("");
      setViewFilters({});
      return;
    }
    try {
      const parsed = JSON.parse(saved) as { query?: string; filters?: Record<string, string> };
      setQuery(parsed.query ?? "");
      setViewFilters(parsed.filters ?? {});
    } catch {
      setQuery("");
      setViewFilters({});
      setMessage("That saved view could not be read. Its filters were cleared.");
    }
  }

  function deleteView() {
    if (variant === "noc") {
      localStorage.removeItem(`${variant}-report-view-${view}`);
      setQuery("");
      setViewFilters({});
      setMessage(`${view} filters deleted.`);
      return;
    }
    localStorage.removeItem(`${variant}-report-view`);
    setMessage("Saved view deleted.");
  }

  function exportRows() {
    const csv = trackingCsv(columns, visible.map((row) => columns.map((column) => row[column] ?? "")));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${variant}-report.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function chooseDate(value: string) {
    const friday = toFriday(value);
    setWeekEnding(friday);
    void loadWeeklyRates(friday, payrollCompany);
  }

  function changePayroll(value: string) {
    setPayrollCompany(value);
    void loadWeeklyRates(weekEnding, value);
  }

  function navigateNoiGoTo(value: string) {
    setNoiGoTo(value);
    const routes: Record<string, string> = {
      "Health Ins": "/health-ins",
      "Bonus Exp": "/employee-bonus-expense-report",
      "Job App Problems": "/job-app-problems",
      "Missing WC": "/wcc-on-site",
      Contracts: "/contract-report",
      "Office Staff Notes": "/office-staff-notes",
      "New Job App": "/employee-application",
      Reports: "/reports",
    };
    if (routes[value]) router.push(routes[value]);
  }

  const weekStart = weekEnding ? shiftDate(weekEnding, -6) : "";
  const checkDay = weekEnding ? shiftDate(weekEnding, 6) : "";

  return <section className={`access-report-screen operational-report operational-report-${variant}`}>
    <header>
      <h1>{title}</h1>
      {variant === "noi" && <>
        <label>View: <select value={view} onChange={(event) => setView(event.target.value)}>{Array.from({ length: 17 }, (_, index) => <option key={index} value={`View ${String(index + 1).padStart(2, "0")}`}>{index === 0 ? "View 01" : `View ${String(index + 1).padStart(2, "0")}`}</option>)}</select></label>
        <button data-action-status="complete" onClick={save}>Save View</button>
        <button data-action-status="complete" onClick={deleteView}>Delete View</button>
        <label>Go To: <select aria-label="Go To" value={noiGoTo} onChange={(event) => navigateNoiGoTo(event.target.value)}><option value="" /><option>Reports</option><option>Health Ins</option><option>Bonus Exp</option><option>Job App Problems</option><option>Missing WC</option><option>Contracts</option><option>Office Staff Notes</option><option>New Job App</option></select></label>
        <button data-action-status="complete" onClick={() => router.refresh()}>Refresh</button>
        <button data-action-status="complete" onClick={() => { setQuery(""); setNoiJobSearch(""); setNoiAgeFilter("all"); setNoiRevenueFilter("all"); setNoiTrackingFilter("all"); setNoiHas01Filter("all"); setNoiLegalFilter("all"); setNoiAdvancedFilters({}); setNoiFilterNumber(""); }}>Zero</button>
        <button data-action-status="complete" disabled={!visible.length} onClick={exportRows}>Export View</button>
        <span className="operational-noi-refresh-status"><b>Chk:</b> Last Open Inv Refresh: <output>—</output></span>
        <span className="operational-noi-user">RMV</span>
        <button data-action-status="linked" className="operational-noi-open-refresh" onClick={() => router.push("/open-invoices")}>Open Invoice<br />Refresh</button>
        <button data-action-status="complete" onClick={() => window.print()}>Report</button>
        <button data-action-status="linked" onClick={() => router.push("/reports")}>Cancel</button>
        <button data-action-status="complete" aria-label="Print report" title="Print report" onClick={() => window.print()}>▣</button>
        <button data-action-status="missing" aria-label="Help" title="Help">?</button>
      </>}
      {variant === "rates" && <>
        <label>View: <select value={view} onChange={(event) => setView(event.target.value)}>{Array.from({ length: 8 }, (_, index) => <option key={index}>{index === 0 ? "01 Default Check" : `View ${String(index + 1).padStart(2, "0")}`}</option>)}</select></label>
        <button data-action-status="complete" onClick={save}>Save View</button>
        <button data-action-status="complete" onClick={() => { localStorage.removeItem(`${variant}-report-view`); setMessage("Saved view deleted."); }}>Delete View</button>
        <button data-action-status="complete" onClick={() => void loadWeeklyRates()}>Refresh</button>
        <button data-action-status="complete" onClick={() => { setQuery(""); changePayroll("all"); }}>Zero</button>
        <button data-action-status="complete" disabled={!visible.length} onClick={exportRows}>Export View</button>
        <select aria-label="Payroll company" value={payrollCompany} onChange={(event) => changePayroll(event.target.value)}>
          <option value="IPG">IPG</option><option value="all">All</option>
          {PAYROLL_COMPANIES.filter((company) => company !== "IPG").map((company) => <option key={company} value={company}>{company}</option>)}
        </select>
        <button data-action-status="linked" onClick={() => router.push("/tracking")}>Cancel</button>
      </>}
      {variant !== "rates" && variant !== "noi" && <>
        <label>View: <select value={view} onChange={(event) => variant === "noc" ? openView(event.target.value) : setView(event.target.value)}>{Array.from({ length: variant === "noc" ? 17 : 8 }, (_, index) => {
          const option = `View ${String(index + 1).padStart(2, "0")}`;
          return <option key={option} value={option}>{index === 0 ? "01 Default" : option}</option>;
        })}</select></label>
        <button data-action-status="complete" onClick={save}>Save View</button>
        <button data-action-status="complete" onClick={deleteView}>Delete View</button>
        <button data-action-status="complete" onClick={() => router.refresh()}>Refresh</button>
        {variant !== "noc" && <><button data-action-status="complete" onClick={() => setQuery("")}>Zero</button><button data-action-status="complete" disabled={!visible.length} onClick={exportRows}>Export View</button></>}
        <button data-action-status="linked" onClick={() => router.push("/tracking")}>Cancel</button>
      </>}
    </header>

    {variant === "noi" ? <div className="operational-noi-tools">
      <section className="operational-noi-search"><strong>SEARCH</strong>
        <label>Customer:<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label>Job:<input value={noiJobSearch} onChange={(event) => setNoiJobSearch(event.target.value)} /></label>
        <div className="operational-noi-spacer-actions"><button data-action-status="complete" onClick={() => setNoiSpacerCount((count) => Math.min(8, count + 1))}>Add Spacers</button><button data-action-status="complete" onClick={() => setNoiSpacerCount(0)}>Clear Spacers</button><button data-action-status="complete" onClick={() => { setQuery(""); setNoiJobSearch(""); setNoiAgeFilter("all"); setNoiRevenueFilter("all"); setNoiTrackingFilter("all"); setNoiHas01Filter("all"); setNoiLegalFilter("all"); setNoiAdvancedFilters({}); setNoiFilterNumber(""); }}>Clear Filters</button></div>
        <div className="operational-noi-job-state" aria-hidden="true" />
        <div className="operational-noi-select-actions"><span>Select</span><button data-action-status="complete" onClick={() => setNoiSelectedRows(new Set())}>Clear</button><button data-action-status="complete" onClick={() => setNoiSelectedRows(new Set(visible.map((row) => String(row.id ?? ""))))}>All</button><span>Cust<br />Color</span><div className="operational-noi-color-swatches" aria-label="Customer color legend"><span className="noi-color-white" /><span className="noi-color-pink" /><span className="noi-color-yellow" /><span className="noi-color-green" /></div></div>
      </section>
      <section className="operational-noi-controls"><nav aria-label="Notice of Identification report tabs">
        {['Views, Additional Updates', 'Filters', 'Email Salesmen', 'Utilities', 'Red Zone', 'Users'].map((tab) => <button data-action-status={tab === 'Views, Additional Updates' || tab === 'Filters' ? 'complete' : 'incomplete'} className={noiActiveTab === tab ? 'is-active' : undefined} aria-pressed={noiActiveTab === tab} key={tab} type="button" onClick={() => setNoiActiveTab(tab)}>{tab}</button>)}
      </nav>
        {noiActiveTab === 'Views, Additional Updates' && <div className="operational-noi-views-panel">
          <div className="operational-noi-view-presets">
          <div className="operational-noi-view-buttons">{['Default', 'Default X. Info', 'Customer Revenue', 'NOI & NOC', 'GC Info', 'View 07', 'View 08'].map((label, index) => <button data-action-status={index === 0 ? "complete" : "incomplete"} className={index === 0 && view === 'View 01' ? 'is-active' : undefined} key={label} onClick={() => { setView(index === 0 ? 'View 01' : `View ${String(index + 1).padStart(2, '0')}`); if (index === 0) { setQuery(''); setNoiJobSearch(''); setNoiAgeFilter('all'); setNoiRevenueFilter('all'); setNoiTrackingFilter('all'); setNoiHas01Filter('all'); setNoiLegalFilter('all'); setNoiAdvancedFilters({}); } }}>{label}</button>)}</div>
          <select data-action-status="incomplete" aria-label="Additional updates" defaultValue=""><option value="">&lt;Additional Updates&gt;</option><option>NOI Flag History</option><option>GC Information</option></select>
          <button data-action-status="complete" onClick={() => { setNoiAgeFilter(">39"); setNoiLegalFilter("nonlegal"); }}>Age of Oldest Invoice &gt;39 Days</button>
          </div>
          <div className="operational-noi-small-filters"><fieldset><legend>Customer in Tracking This Week</legend>{['all', 'Yes', 'No'].map((value) => <label key={value}><input type="radio" name="noi-tracking" value={value} checked={noiTrackingFilter === value} onChange={() => setNoiTrackingFilter(value)} />{value === 'all' ? 'All' : value}</label>)}</fieldset><fieldset><legend>Has 01 Invoice</legend>{['all', 'Yes', 'No'].map((value) => <label key={value}><input type="radio" name="noi-has01" value={value} checked={noiHas01Filter === value} onChange={() => setNoiHas01Filter(value)} />{value === 'all' ? 'All' : value}</label>)}</fieldset></div>
          <fieldset className="operational-noi-age-filter"><legend>Oldest Invoice in Days</legend><p>All (Default) <span>If not All, then Legal Status will also be set to Non Legal.</span></p><div className="operational-noi-age-options">{[
            ['all', 'All (Default)', ''], ['7-14', '7 to 14', 'Early Watch'], ['15-21', '15 to 21', 'Prep for NOI. We decide on NOI Flag, add Notes as to why/why not.'], ['22-29', '22 to 29', 'Send NOI'], ['30-39', '30 to 39', 'Late'], ['40-46', '40 to 46', 'Way Late'], ['47-53', '47 to 53', ''], ['>53', '>53', ''],
          ].map(([value, label, note]) => <label key={value}><input type="radio" name="noi-age" value={value} checked={noiAgeFilter === value} onChange={() => setNoiAgeFilter(value)} />{label}<span>{note}</span></label>)}</div></fieldset>
          <fieldset className="operational-noi-revenue-filter"><legend>Last Week Revenue</legend><div>{[['all', 'All'], ['0-5000', '0 to 5K'], ['5001-10000', '5001 to 10K'], ['10001-20000', '10001 to 20K'], ['20001-30000', '20001 to 30K'], ['30001-40000', '30001 to 40K'], ['>40000', '>40K']].map(([value, label]) => <label key={value}><input type="radio" name="noi-revenue" value={value} checked={noiRevenueFilter === value} onChange={() => setNoiRevenueFilter(value)} />{label}</label>)}</div></fieldset>
        </div>}
        {noiActiveTab === 'Filters' && <div className="operational-noi-filter-screen">
          <div className="operational-noi-filter-columns">{[
            [['Legal Status', 'Legal Status', ['All']], ['Credit History', 'Credit History', ['All Except A Plus', 'All']], ['Age of Oldest Invoice', 'Oldest Invoice', ['All', '> 10 Days', '> 15 Days', '> 20 Days', '> 30 Days', '> 32 Days', '> 39 Days', '> 46 Days', '> 53 Days', '7 - 14', '14 - 21', '21 - 28', '28 - 35']], ['Customer Since (days)', 'Customer Since', ['All', '1 Week', '2 Weeks', '3 Weeks', '1 Month', '2 Months', '3 Months']]],
            [['Age of Job (days)', 'Age of Job (days)', ['All', '> 30 Days', '> 60 Days', '> 90 Days', '> 120 Days']], ['Amount Owed on the Job', 'Job Unpaid', ['All', '1K to 7K', '7K to 20K', '20K to 30K', '> 30K', '> 40K']], ['Amount Owed by Customer', 'Total Open', ['All', '1K to 7K', '7K to 20K', '20K to 30K', '30K to 40K', '40K to 50K', '50K to 100K', '100K to 500K']]],
            [['NOI Sent', 'NOI Sent', ['All', 'Yes', 'No']], ['NOI Sent, CMT is Back', 'NOI CMT Back', ['All', 'Yes', 'No']], ['NOC Sent', 'NOC Sent', ['All', 'Yes', 'No']], ['NOC Sent, CMT is Back', 'NOC CMT Back', ['All', 'Yes', 'No']]],
          ].map((group, groupIndex) => <div key={groupIndex}>{group.map(([label, key, options]) => {
            const filterKey = key as string;
            const configuredOptions = (options as string[]).filter((option) => option !== "All");
            const availableValues = Array.from(new Set(rows.map((row) => row[filterKey]).filter((value): value is string | number => value !== null && value !== undefined && String(value).trim() !== "").map(String)));
            availableValues.sort((left, right) => /^-?\d+(\.\d+)?$/.test(left) && /^-?\d+(\.\d+)?$/.test(right) ? Number(left) - Number(right) : left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));
            const dynamicOptions = availableValues.filter((value) => ["Credit History", "Legal Status"].includes(filterKey) && !configuredOptions.includes(value)).map((value) => ({
              label: value,
              value: `exact-text:${value}`,
            }));
            const selectedValue = noiAdvancedFilters[filterKey] ?? "all";
            return <label key={label as string}>{label as string}<select value={selectedValue} onChange={(event) => { const value = event.target.value; setNoiAdvancedFilters((current) => ({ ...current, [filterKey]: value })); if (filterKey === "Oldest Invoice" && value !== "all") setNoiLegalFilter("nonlegal"); }}><option value="all">All</option>{configuredOptions.map((option) => <option key={option} value={noiOptionValue(filterKey, option)}>{option}</option>)}{dynamicOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
          })}</div>)}
          </div><aside className="operational-noi-number-filter"><strong>FILTER</strong><div><button data-action-status="complete" className="noi-filter-heading" onClick={() => setNoiFilterNumber('')}>All</button><button data-action-status="complete" className="noi-filter-heading" onClick={() => setNoiFilterNumber('not-good')}>Not A+ or Good</button>{[1, 2, 3, 4].map((number) => <Fragment key={number}><button data-action-status="complete" onClick={() => setNoiFilterNumber(noiFilterNumber === String(number) ? '' : String(number))} className={noiFilterNumber === String(number) ? 'is-active' : undefined}>{number}</button><button data-action-status="complete" onClick={() => setNoiFilterNumber(noiFilterNumber === `not-good` ? '' : 'not-good')} className={noiFilterNumber === 'not-good' ? 'is-active' : undefined}>{number}</button></Fragment>)}</div></aside>
        </div>}
        {noiActiveTab === 'Email Salesmen' && <div className="operational-noi-email-screen"><div className="operational-noi-vertical-label">SALESMEN</div><div className="operational-noi-email-compose"><div>Email: <label><input type="radio" name="noi-email-mode" checked={noiEmailMode === 'freehand'} onChange={() => setNoiEmailMode('freehand')} />Freehand</label><label><input type="radio" name="noi-email-mode" checked={noiEmailMode === 'list'} onChange={() => setNoiEmailMode('list')} />Select from List</label></div><textarea value={noiEmailText} onChange={(event) => setNoiEmailText(event.target.value)} aria-label="Email addresses" /><label>Subject:<input /></label></div><div className="operational-noi-salesmen"><strong>Salesman</strong><input placeholder="Search" value={noiSalesmanSearch} onChange={(event) => setNoiSalesmanSearch(event.target.value)} /><div>{Array.from(new Set(rows.map((row) => String(row.Salesman ?? '')).filter(Boolean))).filter((name) => name.toLowerCase().includes(noiSalesmanSearch.toLowerCase())).sort().map((name) => <label key={name}><input type="checkbox" checked={noiSelectedSalesmen.has(name)} onChange={(event) => setNoiSelectedSalesmen((current) => { const next = new Set(current); if (event.target.checked) next.add(name); else next.delete(name); return next; })} />{name}</label>)}</div></div><div className="operational-noi-email-actions"><span>Salesmen</span><button data-action-status="complete" onClick={() => setNoiSelectedSalesmen(new Set(rows.map((row) => String(row.Salesman ?? '')).filter(Boolean)))}>Select All</button><button data-action-status="complete" onClick={() => setNoiSelectedSalesmen(new Set())}>Clear All</button></div><fieldset><legend>Include in the Email</legend><label><input type="checkbox" checked={noiIncludeInfo} onChange={(event) => setNoiIncludeInfo(event.target.checked)} />NOI Info</label><div><button data-action-status="missing">View Emails</button><button data-action-status="missing">Send Emails</button></div></fieldset><p className="operational-noi-unavailable">Email sending is not connected.</p></div>}
        {noiActiveTab === 'Utilities' && <div className="operational-noi-utilities-screen"><fieldset><legend>Include Terminated?</legend>{['No', 'Yes'].map((value) => <label key={value}><input type="radio" name="noi-terminated" value={value} checked={noiTerminated === value} onChange={() => { setNoiTerminated(value); router.refresh(); }} />{value}</label>)}</fieldset><span>Changing this value will force a Refresh.</span></div>}
        {noiActiveTab === 'Red Zone' && <div className="operational-noi-redzone-screen"><fieldset><legend>Legal Status</legend>{['All', 'Non Legal', 'Legal'].map((value) => <label key={value}><input type="radio" name="noi-redzone-legal" checked={noiLegalFilter === value.toLowerCase().replace(' ', '') || (value === 'All' && noiLegalFilter === 'all')} onChange={() => setNoiLegalFilter(value === 'All' ? 'all' : value === 'Legal' ? 'legal' : 'nonlegal')} />{value}</label>)}</fieldset><fieldset><legend>Age of Oldest Invoice</legend>{[['all','All'],['7-14','7 to 14'],['15-21','15 to 21'],['22-29','22 to 28'],['30-39','29 to 35'],['>39','>39'],['>46','>46'],['>53','>53']].map(([value,label]) => <label key={value}><input type="radio" name="noi-redzone-age" checked={noiAgeFilter === value} onChange={() => { setNoiAgeFilter(value); if(value !== 'all') setNoiLegalFilter('nonlegal'); }} />{label}</label>)}</fieldset><fieldset><legend>Amount Owed by Customer</legend>{[['all','All'],['range:1000:7000','1K to 7K'],['range:7000:20000','7K to 20K'],['range:20000:30000','20K to 30K'],['range:30000:40000','30K to 40K'],['range:40000:50000','40K to 50K'],['range:50000:100000','50K to 100K'],['range:100000:500000','100K to 500K']].map(([value,label]) => <label key={value}><input type="radio" name="noi-redzone-amount" checked={(noiAdvancedFilters['Total Open'] ?? 'all') === value} onChange={() => setNoiAdvancedFilters((current) => ({...current,'Total Open':value}))} />{label}</label>)}</fieldset><fieldset><legend>NOI Sent</legend>{['All','Yes','No'].map((value) => <label key={value}><input type="radio" name="noi-redzone-sent" checked={(noiAdvancedFilters['Sent on Date'] ?? 'all') === (value === 'All' ? 'all' : value === 'Yes' ? '__has_value__' : '__missing__')} onChange={() => setNoiAdvancedFilters((current) => ({...current,'Sent on Date':value === 'All'?'all':value === 'Yes'?'__has_value__':'__missing__'}))} />{value}</label>)}</fieldset></div>}
        {noiActiveTab === 'Users' && <div className="operational-noi-users-screen"><table><thead><tr><th>User</th><th>Date</th><th>Time</th><th>Sec</th></tr></thead><tbody><tr><td colSpan={4}>User activity history is not connected.</td></tr></tbody></table></div>}
      </section>
    </div> : variant === "rates" ? <div className="operational-rate-tools">
      <label>Search in Customer:<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Customer name" /></label>
      <label>Week Ending Friday:<input aria-label="Week Ending Friday" type="date" value={weekEnding} onChange={(event) => event.target.value && chooseDate(event.target.value)} /></label>
      <button data-action-status="complete" aria-label="Previous week" title="Previous week" onClick={() => chooseDate(shiftDate(weekEnding, -7))}>‹</button>
      <button data-action-status="complete" aria-label="Next week" title="Next week" onClick={() => chooseDate(shiftDate(weekEnding, 7))}>›</button>
      <div className="operational-rate-period"><span>Start and End Days of Report</span><span>{readableDate(weekStart)}</span><span>{readableDate(weekEnding)}</span></div>
      <div className="operational-rate-checkday"><span>Payroll Chk Day</span><span>{readableDate(checkDay)}</span></div>
      <button data-action-status="complete" onClick={() => { setQuery(""); setPayrollCompany("IPG"); void loadWeeklyRates(weekEnding, "IPG"); }}>Clear Filters</button>
      {loading && <span role="status">Loading week…</span>}
    </div> : <div className="operational-tools">
      <label>{variant === "bonus" ? "Name:" : "Search in Name:"}<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div>{Array.from({ length: variant === "noc" ? 17 : 5 }, (_, index) => {
        const slot = `View ${String(index + 1).padStart(2, "0")}`;
        return <button data-action-status="complete" key={slot} className={view === slot ? "is-active" : undefined} aria-pressed={view === slot} onClick={() => variant === "noc" ? openView(slot) : setView(slot)}>{index === 0 ? "Default" : slot}</button>;
      })}</div>
      <button data-action-status="complete" onClick={() => { setQuery(""); if (variant === "noc") setViewFilters({}); }}>Clear Filters</button>
    </div>}

    {variant === "rates" && <p className="operational-note">Showing {payrollCompany === "all" ? "all payroll companies" : payrollCompany} for week ending {weekEnding ? new Date(`${weekEnding}T12:00:00`).toLocaleDateString("en-US") : "—"}.</p>}
    {variant === "bonus" && <p className="operational-note">Bonus totals use the current $1-per-tracked-hour rule shown in the Access report. Referral-specific fields require their source column to be confirmed.</p>}
    {(error || message) && <p className="report-data-error" role={error ? "alert" : "status"}>{error || message}</p>}

    <div className="operational-grid"><table><thead><tr><th />{variant === "noi" && Array.from({ length: noiSpacerCount }, (_, index) => <th className="operational-noi-spacer" key={`spacer-${index}`} />)}{columns.map((column) => {
      const values = variant === "noc" ? Array.from(new Set(rows.map((row) => String(row[column] ?? "")))) : [];
      const hasBlank = values.includes("");
      return <th key={column}>{column}{variant === "noc" && <select aria-label={`Filter ${column}`} value={viewFilters[column] ?? ""} onChange={(event) => setViewFilters((current) => ({ ...current, [column]: event.target.value }))}>
        <option value="">All</option>
        {hasBlank && <option value="__blank__">[Blank]</option>}
        {values.filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })).map((value) => <option key={value} value={value}>{value}</option>)}
      </select>}</th>;
    })}</tr></thead><tbody>
      {shown.map((row, index) => <tr key={String(row.id ?? index)} className={index === 0 ? "is-current" : undefined} onDoubleClick={() => variant === "bonus" && router.push(`/employees/${row.id}`)}>
        <td>{variant === "noi" && <input aria-label={`Select ${row.Customer ?? row.id}`} type="checkbox" checked={noiSelectedRows.has(String(row.id ?? ""))} onChange={(event) => setNoiSelectedRows((current) => { const next = new Set(current); if (event.target.checked) next.add(String(row.id ?? "")); else next.delete(String(row.id ?? "")); return next; })} />}</td>
        {variant === "noi" && Array.from({ length: noiSpacerCount }, (_, spacerIndex) => <td className="operational-noi-spacer" key={`spacer-${spacerIndex}`} />)}
        {columns.map((column) => <td key={column} className={variant === "noi" ? `noi-cell--${({ "Customer Since": "customer-since", "Credit History": "credit-history", Co: "company", "NOI Flag": "noi-flag", "Job Unpaid": "job-unpaid", "Age of Job (days)": "age-job", "Total Open": "total-open", "Oldest Invoice": "oldest-invoice", "Last Week Revenue": "revenue", History: "history", "Sent on Date": "sent-date", "GC-NOI": "gc-flag", "GC-NOC": "gc-flag", "OW-NOI": "owner-flag", "OW-NOC": "owner-flag" } as Record<string, string>)[column] ?? "plain"}` : undefined}>{typeof row[column] === "number" && (column.includes("Amount") || column.includes("Payment") || column.includes("Balance") || column.includes("Rate") || column.includes("Owed") || column.includes("Bonus") || column === "Margin $") ? Number(row[column]).toLocaleString("en-US", { style: "currency", currency: "USD" }) : row[column]}</td>)}
      </tr>)}
      {!visible.length && <tr><td colSpan={columns.length + 1}>No records match the current filters.</td></tr>}
    </tbody></table></div>
    <footer>Records {visible.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, visible.length)} of {visible.length}<span className="operational-page-controls"><button data-action-status="complete" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page {page} of {pageCount}</span><button data-action-status="complete" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button></span></footer>
  </section>;
}
