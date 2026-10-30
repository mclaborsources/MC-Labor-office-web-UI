"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { EMPLOYEE_SEARCH_COLUMNS } from "@/lib/employeeSearchColumns";
import { HelpCircle, Printer } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import { Icon } from "@/components/ui/Icon";
import {
  EMPLOYEE_SEARCH_PRESET_GRID,
  EMPLOYEE_SEARCH_VIEWS_2_GRID,
  EMPLOYEE_SEARCH_VIEW_TABS,
  employeeSearchPresetBtnClass,
  type EmployeeSearchPresetCell,
} from "@/lib/employeeSearchColumns";
import { employeeSearchBlankPresetLayout, employeeSearchPresetLayoutForSlot } from "@/lib/employeeSavedViews";
import {
  EMPLOYEE_ADMIN_INCLUDE_PROFILES,
  EMPLOYEE_CALL_LISTS_2_ADDITIONAL,
  EMPLOYEE_CALL_LISTS_LIST,
  EMPLOYEE_CALL_LISTS_TRADE,
  EMPLOYEE_INTERVIEW_DATE_OPTIONS,
  EMPLOYEE_MA_COPY_ROWS,
  EMPLOYEE_NH_TRADE_BUTTONS,
  EMPLOYEE_VIEWS_3_BUTTON_GRID,
  EMPLOYEE_VIEWS_4_IPG_STATUS,
  EMPLOYEE_VIEWS_4_PROFILE,
  EMPLOYEE_VIEWS_4_TIME_DURATION,
  EMPLOYEE_VIEWS_4_TIME_FOR,
  EMPLOYEE_VIEWS_4_TRADE,
  EMPLOYEE_VIEWS_COUNTY_OPTIONS,
  EMPLOYEE_VIEWS_STATE_OPTIONS,
  EMPLOYEE_VIEWS_TIME_FRAME,
  EMPLOYEE_VIEWS_TRADE_OPTIONS,
  employeeViews3BtnClass,
} from "@/lib/employeeSearchViewsLayout";
import type { FilterOption } from "@/types/search";
import type { EmployeeSummary } from "@/types/employee";
import { useEmployeeSavedViews } from "./EmployeeSavedViews";
import { employeeSearchCellValue } from "./EmployeeSearchTable";
import type { EmployeeSearchViews3Filters } from "@/lib/employeeSearchViews3Filters";
import type { EmployeeSearchViews4Filters } from "@/lib/employeeSearchViews4Filters";
import type { EmployeeSearchUtilityFilters } from "@/lib/employeeSearchUtilities";
import type { EmployeeCallNumberFilter } from "@/lib/employeeSearchUtilities";
import type { EmployeeSearchViews1Filters } from "@/lib/employeeSearchViews1Filters";
import type { EmployeeSearchCallListFilters } from "@/lib/employeeSearchCallListFilters";
import { getEmployeeCallLists2Options, callLists2MissingDataNotice, type EmployeeSearchCallLists2Filters } from "@/lib/employeeSearchCallLists2";

interface EmployeeSearchViewsPanelProps {
  onTradeChange?: (tradeId: string) => void;
  onSort?: () => void;
  trades: FilterOption[];
  statuses: FilterOption[];
  grades: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
  currentSearch: string;
  currentTradeId: string;
  currentStatusId: string;
  currentGradeId: string;
  currentCity: string;
  currentState: string;
  views3Filters?: EmployeeSearchViews3Filters;
  views1Filters?: EmployeeSearchViews1Filters;
  onViews1FiltersChange?: (filters: EmployeeSearchViews1Filters) => void;
  onViews3FiltersChange?: (filters: EmployeeSearchViews3Filters) => void;
  views4Filters?: EmployeeSearchViews4Filters;
  onViews4FiltersChange?: (filters: EmployeeSearchViews4Filters) => void;
  activeEmployee?: EmployeeSummary;
  employeeUserFlagOptions?: FilterOption[][];
  userSettingsSelectedCount?: number;
  onApplyUserFlag?: (slot: number, value: string, password: string) => Promise<void>;
  utilityFilters?: EmployeeSearchUtilityFilters;
  onUtilityFiltersChange?: (filters: EmployeeSearchUtilityFilters) => void;
  utilityEmployees?: EmployeeSummary[];
  employeeRows?: EmployeeSummary[];
  selectedEmployeeIds?: string[];
  onRefresh?: () => void;
  onZero?: () => void;
  adminIncludedProfiles?: string[];
  onAdminIncludedProfilesChange?: (profiles: string[]) => void;
  onSelectedEmployeeIdsChange?: (ids: string[]) => void;
  callNumberFilter?: EmployeeCallNumberFilter;
  onCallNumberFilterChange?: (filter: EmployeeCallNumberFilter) => void;
  callListFilters?: EmployeeSearchCallListFilters;
  onCallListFiltersChange?: (filters: EmployeeSearchCallListFilters) => void;
  callLists2Filters?: EmployeeSearchCallLists2Filters;
  onCallLists2FiltersChange?: (filters: EmployeeSearchCallLists2Filters) => void;
  onCallLists2SortChange?: (sort: "name" | "number") => void;
}

const LEGACY_DROPDOWN_OPTIONS = {
  dates: ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "Year-to-Date"],
  tracking: ["All", "In Tracking", "Not In Tracking", "Currently Assigned", "Not Assigned"],
  dateRange: ["All Dates", "Today", "Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"],
  clusters: ["All Clusters", "Maine", "New Hampshire", "Massachusetts", "Rhode Island", "Connecticut"],
  filters: ["Unfiltered", "Available Manpower", "New Applicants", "Get-Hired", "Interview", "Call List"],
  userSettings: [
    "Default",
    "Available Manpower",
    "Qualifications",
    "Sub Trades",
    "Age, License, Level",
    "Email / Text",
    "Last Action",
    "Call History",
  ],
  settingFields: ["Profile Type", "EE Status", "Trade", "State", "County", "Grade", "Recruiter", "Last Action"],
  settingValues: ["All", "Yes", "No", "Main", "Sub", "Active", "Inactive", "Not Blank"],
  licenseYears: ["All Years", "2026", "2025", "2024", "2023", "2022", "2021", "2020 and Earlier"],
  contactRanges: ["7 Days", "14 Days", "30 Days", "60 Days", "90 Days", "6 Months", "1 Year"],
  duplicateModes: [
    "Name", "Name, Backwards", "Street", "Street, Backwards", "Phone", "Phone, Backwards",
    "Name + Street", "Name + Street + City", "Name + Street + City + Phone", "Name + City", "Name + State", "Street + City",
  ],
  licenseBoards: ["Maine Electrician", "Maine Plumber", "NH Electrician", "NH Plumber", "Massachusetts"],
  viewMaps: ["View 01", "View 02", "View 03", "View 04", "View 05", "Default Map"],
} as const;

const CALL_LIST_DROPDOWN_OPTIONS: Record<string, readonly string[]> = {
  "<Cluster>": LEGACY_DROPDOWN_OPTIONS.clusters,
  "<Trade>": ["All Trades", "Electrician", "Plumber", "HVAC", "Carpenter", "Operator", "Laborer"],
  "<Qualification>": ["All Qualifications", "Licensed", "Apprentice", "Journeyman", "Master", "Unlicensed"],
  "<Last Action>": ["Any Last Action", "Today", "Last 7 Days", "Last 30 Days", "Over 30 Days", "No Last Action"],
  "<Last Call>": ["Any Last Call", "Today", "Last 7 Days", "Last 30 Days", "Over 30 Days", "Never Called"],
  "No SUBs": ["No SUBs", "Include SUBs", "SUB 1", "SUB 2", "SUB 3"],
};

function LegacyOptions({ options }: { options: readonly string[] }) {
  return options.map((label) => (
    <option key={label} value={label}>
      {label}
    </option>
  ));
}

function FilterRadioGroup({
  legend,
  name,
  options,
  defaultIndex = 0,
  value,
  onValueChange,
  className = "",
}: {
  legend: string;
  name: string;
  options: readonly string[];
  defaultIndex?: number;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <fieldset className={`ac-customer-search-filter-group ${className}`}>
      <legend>{legend}</legend>
      <div className="ac-customer-search-filter-group-options">
        {options.map((label, i) => (
          <label key={label} className="ac-customer-search-radio">
            <input
              type="radio"
              name={name}
              checked={value === undefined ? undefined : value === label}
              defaultChecked={value === undefined ? i === defaultIndex : undefined}
              onChange={() => onValueChange?.(label)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PresetGrid({
  grid = EMPLOYEE_SEARCH_PRESET_GRID,
  className = "",
  viewOffset = 0,
}: {
  grid?: readonly (readonly (EmployeeSearchPresetCell | null)[])[];
  className?: string;
  viewOffset?: number;
}) {
  const saved = useEmployeeSavedViews();
  return (
    <div className={`ac-employee-search-preset-grid ${className}`}>
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const slot = viewOffset + rowIndex * 10 + colIndex + 1;
          if (cell) {
            return (
              <AccessButton data-action-status="complete"
                key={`${rowIndex}-${colIndex}-${cell.label}`}
                id={viewOffset === 0 && rowIndex === 0 && colIndex === 9 ? "employee-search-combined-history-preset" : undefined}
                xs
                aria-pressed={saved?.slot === slot}
                className={`${employeeSearchPresetBtnClass(cell.style) ?? ""} ${saved?.slot === slot ? "ac-employee-search-preset-btn--active" : ""}`}
                onClick={() => saved?.selectPreset(slot, employeeSearchPresetLayoutForSlot(slot, cell.label))}
              >
                {saved?.views.find(view => view.slot === slot)?.name ?? cell.label}
              </AccessButton>
            );
          }
          if (viewOffset === 0 && rowIndex === 1 && colIndex === 8) {
            return (
              <AccessButton data-action-status="complete" key="employee-blank-home-preset" xs aria-label="Blank view: Home column" title="Blank view: Home column"
                aria-pressed={saved?.slot === 19}
                className={`ac-customer-search-preset-empty ${saved?.slot === 19 ? "ac-employee-search-preset-btn--active" : ""}`}
                onClick={() => saved?.selectPreset(19, employeeSearchBlankPresetLayout())}
              />
            );
          }
          if (viewOffset === 30) {
            return (
              <AccessButton data-action-status="complete"
                key={`${rowIndex}-${colIndex}-blank-view`}
                xs
                aria-label={`Blank view ${slot}`}
                title={`Blank view ${slot}`}
                aria-pressed={saved?.slot === slot}
                className={`ac-customer-search-preset-empty ${saved?.slot === slot ? "ac-employee-search-preset-btn--active" : ""}`}
                onClick={() => saved?.selectPreset(slot, employeeSearchPresetLayoutForSlot(slot, ""))}
              />
            );
          }
          return <div key={`${rowIndex}-${colIndex}-empty`} className="ac-customer-search-preset-empty" aria-hidden />;
        }),
      )}
    </div>
  );
}

function Views1Tab({ trades, currentTradeId, onTradeChange, onSort, callNumberFilter = "none", onCallNumberFilterChange, onRefresh, views1Filters = {}, onViews1FiltersChange, employeeRows = [], activeEmployee }: Pick<EmployeeSearchViewsPanelProps, "trades" | "currentTradeId" | "onTradeChange" | "onSort" | "callNumberFilter" | "onCallNumberFilterChange" | "onRefresh" | "views1Filters" | "onViews1FiltersChange" | "employeeRows" | "activeEmployee">) {
  const updateFilter = (key: keyof EmployeeSearchViews1Filters, value: string) => onViews1FiltersChange?.({ ...views1Filters, [key]: value });
  const clusterOptions = Array.from(new Set(employeeRows.map(row => row.accessFields.Cluster || row.accessFields.ClusterName || row.accessFields.ClusterID || "").filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const openLicenseSearch = () => {
    const query = [activeEmployee?.fullName, activeEmployee?.city, activeEmployee?.state, "Maine electrician license lookup"].filter(Boolean).join(" ");
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  };
  const openTruePeople = () => {
    if (!activeEmployee) return;
    const query = [activeEmployee.fullName, activeEmployee.city, activeEmployee.state, "True People Search"].filter(Boolean).join(" ");
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="ac-employee-search-views-1 ac-search-views-tab-pane">
      <div className="ac-employee-search-filter-row">
        <select className="ac-select ac-employee-search-row-select" value={views1Filters.datePreset ?? ""} onChange={event => updateFilter("datePreset", event.target.value)} aria-label="Dates">
          <option value="">&lt;Dates&gt;</option>
          <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.dates} />
        </select>
        <AccessButton data-action-status={onSort ? "complete" : "missing"} onClick={() => { updateFilter("dateField", "WeekEndingDate"); onSort?.(); }} xs className="ac-employee-search-date-btn">
          Wk End Dt
        </AccessButton>
        <button data-action-status="complete" type="button" className="ac-employee-search-entry-dt-link" onClick={() => updateFilter("dateField", "EmEntryDate")}>
          Entry Dt
        </button>
        <select className="ac-select ac-employee-search-row-select" value={views1Filters.tracking ?? ""} onChange={event => updateFilter("tracking", event.target.value)} aria-label="In Tracking">
          <option value="">&lt;In Tracking?&gt;</option>
          <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.tracking} />
        </select>
        <select className="ac-select ac-employee-search-row-select" value={views1Filters.dateRange ?? ""} onChange={event => updateFilter("dateRange", event.target.value)} aria-label="Date Range">
          <option value="">&lt;Date Range&gt;</option>
          <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.dateRange} />
        </select>
        <select
          className="ac-select ac-employee-search-row-select ac-employee-search-cluster-select"
          value={views1Filters.cluster ?? ""}
          onChange={event => updateFilter("cluster", event.target.value)}
          aria-label="Cluster"
        >
          <option value="">&lt;Cluster&gt;</option>
          {clusterOptions.length ? clusterOptions.map(cluster => <option key={cluster} value={cluster}>{cluster}</option>) : <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.clusters.slice(1)} />}
        </select>
        <select
          className="ac-select ac-employee-search-row-select ac-employee-search-trade-select"
          value={currentTradeId}
          onChange={event => onTradeChange?.(event.target.value)}
          aria-label="Trade"
        >
          <option value="">&lt;Trade&gt;</option>
          {trades.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
          {trades.length === 0 ? (
            <LegacyOptions options={["Electrician", "Plumber", "HVAC", "Carpenter", "Operator", "Laborer"]} />
          ) : null}
        </select>
        <span className="ac-customer-search-filter-label">Filter:</span>
        <select className="ac-select ac-employee-search-filter-input" value={views1Filters.filter ?? ""} onChange={event => updateFilter("filter", event.target.value)} aria-label="Filter">
          <option value="" />
          <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.filters} />
        </select>
      </div>

      <div className="ac-employee-search-action-row">
        <AccessButton data-action-status="complete" xs className="ac-employee-search-action-wide" onClick={() => updateFilter("filter", "Available Manpower")}>
          Available Manpower
        </AccessButton>
        <AccessButton data-action-status="complete" xs className="ac-employee-search-action-wide" onClick={() => updateFilter("filter", "UI")}>
          UI
        </AccessButton>
        <AccessButton data-action-status="missing" xs disabled title="The Access export does not include the Update All routine for this action." className="ac-employee-search-lic-flag-btn">
          Lic Exp Date Flag - Update All | 022
        </AccessButton>
        <div className="ac-employee-search-action-row-right">
          <AccessButton data-action-status={activeEmployee ? "linked" : "missing"} xs disabled={!activeEmployee} title={activeEmployee ? "Search this employee in True People Search" : "Select an employee row first"} onClick={openTruePeople}>
            True People
          </AccessButton>
          <AccessButton data-action-status={activeEmployee ? "linked" : "missing"} xs disabled={!activeEmployee} title={activeEmployee ? "Search Maine electrician license records for this employee" : "Select an employee row first"} onClick={openLicenseSearch} className="ac-employee-search-lic-search-btn">
            Lic Search for Maine - Electrician
          </AccessButton>
        </div>
      </div>

      <PresetGrid />

      <div className="ac-employee-search-call-filter-row">
        <fieldset className="ac-employee-search-call-filter-group">
          <legend>Call # Filter | 036 :</legend>
          {["None", "Available for Work", "Schedule an Interview"].map((label, i) => (
            <label key={label} className="ac-customer-search-radio">
              <input type="radio" name="emp-call-filter" checked={callNumberFilter === (["none", "available", "interview"] as const)[i]} onChange={() => onCallNumberFilterChange?.((["none", "available", "interview"] as const)[i])} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <AccessButton data-action-status="complete" xs disabled={!onRefresh} title="Refresh employee records and recalculate the visible Call # data" onClick={() => onRefresh?.()}>
          Update Column | 036
        </AccessButton>
        <AccessButton data-action-status="missing" xs className="ac-employee-search-v-btn">
          V-Name
        </AccessButton>
        <AccessButton data-action-status="missing" xs className="ac-employee-search-v-btn">
          V-Number
        </AccessButton>
      </div>
    </div>
  );
}

function Views2Tab() {
  return (
    <div className="ac-employee-search-views-2 ac-search-views-tab-pane">
      <PresetGrid grid={EMPLOYEE_SEARCH_VIEWS_2_GRID} className="ac-employee-views2-preset-grid" viewOffset={30} />
    </div>
  );
}

function Views3Tab({ filters = {}, onFiltersChange }: { filters?: EmployeeSearchViews3Filters; onFiltersChange?: (filters: EmployeeSearchViews3Filters) => void }) {
  const update = (key: keyof EmployeeSearchViews3Filters, value: string) => onFiltersChange?.({ ...filters, [key]: value });
  return (
    <div className="ac-employee-search-views-3 ac-search-views-tab-pane ac-search-views-tab-pane--row">
      <div className="ac-employee-views3-btn-grid">
        {EMPLOYEE_VIEWS_3_BUTTON_GRID.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            cell ? (
              <AccessButton
                key={`${rowIndex}-${colIndex}-${cell.label}`}
                xs
                className={employeeViews3BtnClass(cell.style)}
                aria-pressed={filters.preset === cell.label}
                onClick={() => update("preset", filters.preset === cell.label ? "" : cell.label)}
                style={{
                  backgroundColor: cell.style === "new-apps" ? "#fff" : "#fff500",
                  backgroundImage: "none",
                  color: cell.style === "new-apps" ? "#f00000" : cell.style === "orange" ? "#ff8500" : "#000",
                  fontWeight: cell.style === "new-apps" ? 700 : 400,
                  textDecoration: cell.style === "new-apps" ? "underline" : "none",
                  outline: filters.preset === cell.label ? "2px solid #165d9c" : undefined,
                  outlineOffset: filters.preset === cell.label ? "1px" : undefined,
                }}
              >
                {cell.label}
              </AccessButton>
            ) : (
              <div key={`${rowIndex}-${colIndex}-empty`} className="ac-customer-search-preset-empty ac-employee-views3-empty" aria-hidden />
            ),
          ),
        )}
      </div>
      <div className="ac-employee-views3-filters">
        <FilterRadioGroup legend="Time Frame:" name="emp-v3-time" options={EMPLOYEE_VIEWS_TIME_FRAME} value={filters.timeFrame ?? ""} onValueChange={value => update("timeFrame", value)} className="ac-customer-search-filter-group--wide" />
        <FilterRadioGroup legend="Trade:" name="emp-v3-trade" options={EMPLOYEE_VIEWS_TRADE_OPTIONS} value={filters.trade ?? ""} onValueChange={value => update("trade", value)} className="ac-customer-search-filter-group--wide" />
        <FilterRadioGroup legend="State:" name="emp-v3-state" options={EMPLOYEE_VIEWS_STATE_OPTIONS} value={filters.state ?? ""} onValueChange={value => update("state", value)} className="ac-customer-search-filter-group--wide" />
        <FilterRadioGroup
          legend="County:"
          name="emp-v3-county"
          options={EMPLOYEE_VIEWS_COUNTY_OPTIONS}
          value={filters.county ?? ""}
          onValueChange={value => update("county", value)}
          className="ac-customer-search-filter-group--wide"
        />
      </div>
    </div>
  );
}

function Views4Tab({ filters = {}, onFiltersChange }: { filters?: EmployeeSearchViews4Filters; onFiltersChange?: (filters: EmployeeSearchViews4Filters) => void }) {
  const update = (key: keyof EmployeeSearchViews4Filters, value: string) => onFiltersChange?.({ ...filters, [key]: value });
  const resetToAll = () => onFiltersChange?.({
    profile: "All",
    timeFor: EMPLOYEE_VIEWS_4_TIME_FOR[0],
    timeDuration: "All",
    trade: "All",
    state: "All",
    county: "All",
    ipgStatus: "All",
    settingField: "",
    settingValue: "",
  });
  return (
    <div className="ac-employee-search-views-filters ac-employee-search-views-4 ac-search-views-tab-pane">
      <div className="ac-customer-search-views-filter-row">
        <FilterRadioGroup legend="Profile:" name="emp-v4-profile" options={EMPLOYEE_VIEWS_4_PROFILE} value={filters.profile ?? ""} onValueChange={value => update("profile", value)} />
        <fieldset className="ac-customer-search-filter-group ac-customer-search-filter-group--user-setting ac-employee-views4-user-setting">
          <legend>User Setting</legend>
          <div className="ac-customer-search-user-setting-fields ac-employee-views4-user-setting-fields">
            <label className="ac-customer-search-inline-select-wrap ac-employee-views4-setting-select-field">
              <span className="ac-flabel sr-only">Select</span>
              <select className="ac-select" aria-label="Select user setting" value={filters.settingField ?? ""} onChange={event => onFiltersChange?.({ ...filters, settingField: event.target.value, settingValue: "" })}>
                <option value="" />
                <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.settingFields} />
              </select>
            </label>
            <label className="ac-customer-search-inline-select-wrap ac-employee-views4-setting-value-field">
              <span className="ac-flabel">Value</span>
              <select className="ac-select" value={filters.settingValue ?? ""} onChange={event => update("settingValue", event.target.value)} disabled={!filters.settingField}>
                <option value="" />
                <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.settingValues} />
              </select>
            </label>
          </div>
        </fieldset>
      </div>
      <FilterRadioGroup
        legend="Time Frame for:"
        name="emp-v4-time-for"
        options={EMPLOYEE_VIEWS_4_TIME_FOR}
        value={filters.timeFor ?? ""}
        onValueChange={value => update("timeFor", value)}
        className="ac-customer-search-filter-group--wide"
      />
      <FilterRadioGroup
        legend=""
        name="emp-v4-time-duration"
        options={EMPLOYEE_VIEWS_4_TIME_DURATION}
        value={filters.timeDuration ?? ""}
        onValueChange={value => update("timeDuration", value)}
        className="ac-customer-search-filter-group--wide ac-customer-search-filter-group--no-legend"
      />
      <div className="ac-customer-search-views-filter-row">
        <FilterRadioGroup legend="Trade:" name="emp-v4-trade" options={EMPLOYEE_VIEWS_4_TRADE} value={filters.trade ?? ""} onValueChange={value => update("trade", value)} />
        <FilterRadioGroup legend="State:" name="emp-v4-state" options={EMPLOYEE_VIEWS_STATE_OPTIONS} value={filters.state ?? ""} onValueChange={value => update("state", value)} />
      </div>
      <FilterRadioGroup
        legend="County:"
        name="emp-v4-county"
        options={EMPLOYEE_VIEWS_COUNTY_OPTIONS}
        value={filters.county ?? ""}
        onValueChange={value => update("county", value)}
        className="ac-customer-search-filter-group--wide"
      />
      <FilterRadioGroup
        legend="IPG Job App Status:"
        name="emp-v4-ipg"
        options={EMPLOYEE_VIEWS_4_IPG_STATUS}
        value={filters.ipgStatus ?? ""}
        onValueChange={value => update("ipgStatus", value)}
        className="ac-customer-search-filter-group--wide"
      />
      <div className="ac-customer-search-views-reset-row">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="ac-customer-search-preset-empty ac-customer-search-spare-btn" aria-hidden />
        ))}
        <AccessButton data-action-status="missing" xs className="ac-customer-search-reset-all-btn" onClick={resetToAll}>
          Reset to All
        </AccessButton>
      </div>
    </div>
  );
}

function CopySectionTab({ variant, employee }: { variant: "ma" | "nh"; employee?: EmployeeSummary }) {
  const [message, setMessage] = useState("");
  const fullName = [employee?.firstName, employee?.middleInitial, employee?.lastName].filter(Boolean).join(" ");
  const cityState = [employee?.city, employee?.state].filter(Boolean).join(", ");
  const nameCityState = [fullName, cityState].filter(Boolean).join(", ");
  async function copy(value: string, label: string) {
    if (!employee) { setMessage("Select an employee row first."); return; }
    if (!value) { setMessage(`${label} is blank for this employee.`); return; }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setMessage(`${label} copied.`);
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = value;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.select();
      const copied = document.execCommand("copy");
      fallback.remove();
      setMessage(copied ? `${label} copied.` : `Could not copy ${label.toLowerCase()}.`);
    }
  }
  function searchPerson(query: string) {
    if (!employee) { setMessage("Select an employee row first."); return; }
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
  function copyPrimary(label: string) {
    const value = label === "City + State" ? cityState
      : label.endsWith("Trade") ? [nameCityState, employee?.trade].filter(Boolean).join(", ")
        : label.includes("City + State") ? nameCityState
          : fullName;
    void copy(value, label);
  }
  function openLookup(label: string) {
    const query = label === "True People"
      ? `site:truepeoplesearch.com ${nameCityState}`
      : `${fullName} ${cityState} ${label}`;
    searchPerson(query.trim());
  }
  function openNhTradeLookup(label: string) {
    if (!employee) { setMessage("Select an employee row first."); return; }
    const query = [fullName, cityState, label, "New Hampshire"].filter(Boolean).join(" ");
    searchPerson(query);
  }
  function openDatapayGetHired() {
    if (!employee) { setMessage("Select an employee row first."); return; }
    window.open("/website-application?source=datapay", "_blank", "noopener,noreferrer");
    setMessage(`Opened the Datapay application for ${employee.fullName}.`);
  }
  return (
    <div className={`ac-employee-copy-tab ac-employee-copy-tab--${variant} ac-search-views-tab-pane`}>
      <div className="ac-employee-copy-bar" aria-hidden>
        COPY
      </div>
      <div className="ac-employee-copy-main">
        {EMPLOYEE_MA_COPY_ROWS.map((row) => (
          <div key={row.label} className="ac-employee-copy-row">
            <AccessButton data-action-status="complete" xs className="ac-employee-copy-primary-btn" onClick={() => copyPrimary(row.label)}>
              {row.label}
            </AccessButton>
            {row.google ? (
              <AccessButton data-action-status="linked" xs className="ac-employee-copy-side-btn" onClick={() => searchPerson([fullName, cityState, employee?.trade].filter(Boolean).join(" "))}>
                Google
              </AccessButton>
            ) : null}
            {"extraButtons" in row && row.extraButtons ? (
              <div className="ac-employee-copy-extra-btns">
                {(variant === "nh" ? row.extraButtons.slice(0, 1) : row.extraButtons).map((label) => (
                  <AccessButton data-action-status="linked" key={label} xs onClick={() => openLookup(label)}>
                    {label}
                  </AccessButton>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {variant === "nh" ? (
        <div className="ac-employee-nh-trades">
          {EMPLOYEE_NH_TRADE_BUTTONS.map((label) => (
            <AccessButton data-action-status="linked" key={label} xs className="ac-employee-nh-trade-btn" disabled={!employee} title={employee ? `Search ${employee.fullName} for ${label} in New Hampshire` : "Select an employee row first"} onClick={() => openNhTradeLookup(label)}>
              {label}
            </AccessButton>
          ))}
        </div>
      ) : null}
      <div className="ac-employee-copy-divider" aria-hidden />
      <div className="ac-employee-copy-contact">
        <AccessButton data-action-status="complete" xs className="ac-employee-copy-wide-btn" onClick={() => void copy(employee?.email ?? "", "Email address")}>
          Email Address
        </AccessButton>
        <AccessButton data-action-status="complete" xs className="ac-employee-copy-wide-btn" onClick={() => void copy(employee?.cellPhone ?? "", "Cell number")}>
          Cell #
        </AccessButton>
      </div>
      <div className="ac-employee-copy-divider" aria-hidden />
      <div className="ac-employee-copy-datapay">
        <AccessButton data-action-status="linked" xs disabled={!employee} title={employee ? "Open the Datapay application" : "Select an employee row first"} className="ac-employee-copy-wide-btn" onClick={openDatapayGetHired}>
          Datapay-Get-Hired
        </AccessButton>
        <AccessButton data-action-status="partial" xs className="ac-employee-copy-wide-btn" onClick={() => setMessage("The Access export does not include a Datapay Password action or a configured Datapay password URL.")}>
          Datapay Password
        </AccessButton>
      </div>
      <span className="ac-employee-copy-message" role="status" aria-live="polite">{message}</span>
    </div>
  );
}

function UserSettingsTab({ employeeUserFlagOptions = Array.from({ length: 8 }, () => []), employeeRows = [], userSettingsSelectedCount = 0, onApplyUserFlag, loadError = "" }: Pick<EmployeeSearchViewsPanelProps, "employeeUserFlagOptions" | "employeeRows" | "userSettingsSelectedCount" | "onApplyUserFlag"> & { loadError?: string } = {}) {
  const [selectedFlags, setSelectedFlags] = useState<string[]>(Array(8).fill(""));
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [pendingFlag, setPendingFlag] = useState<{ slot: number; value: string } | null>(null);
  const [passwordEntry, setPasswordEntry] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const optionsForSlot = (index: number) => {
    const field = `EmployeeUserFlag${index + 1}`;
    const options = new Map<string, FilterOption>();
    for (const option of employeeUserFlagOptions[index] ?? []) options.set(option.value.toLocaleLowerCase(), option);
    for (const row of employeeRows) {
      const value = row.accessFields[field]?.trim();
      if (value) options.set(value.toLocaleLowerCase(), { value, label: value });
    }
    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  };

  function requestFlag(slot: number, value: string) {
    if (!onApplyUserFlag || busySlot !== null) return;
    setStatus("");
    setPendingFlag({ slot, value });
    setPasswordEntry("");
    setPasswordError("");
  }

  async function confirmFlagPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingFlag || !onApplyUserFlag || busySlot !== null) return;
    if (passwordEntry !== "3360") { setPasswordError("Incorrect password."); setPasswordEntry(""); return; }
    const { slot, value } = pendingFlag;
    setPendingFlag(null);
    setBusySlot(slot);
    try {
      await onApplyUserFlag(slot, value, passwordEntry);
      setStatus(value === ""
        ? `Cleared User Flag ${slot} for ${userSettingsSelectedCount.toLocaleString()} selected employee${userSettingsSelectedCount === 1 ? "" : "s"}.`
        : `Set User Flag ${slot} for ${userSettingsSelectedCount.toLocaleString()} selected employee${userSettingsSelectedCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update the selected employees.");
    } finally { setBusySlot(null); }
  }

  return (
    <div className="ac-customer-search-user-settings-tab ac-employee-user-settings-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-user-settings-grid ac-employee-user-settings-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="ac-customer-search-user-setting-slot">
            <span className="ac-customer-search-user-setting-num">{i === 0 ? "User Settings 1:" : `${i + 1}:`}</span>
            <select className="ac-select ac-customer-search-user-setting-select" value={selectedFlags[i] ?? ""} onChange={event => setSelectedFlags(current => { const next = [...current]; next[i] = event.target.value; return next; })} aria-label={`Setting ${i + 1}`}>
              <option value=""></option>
              {optionsForSlot(i).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <div className="ac-customer-search-user-setting-btns">
              <AccessButton data-action-status="complete" xs disabled={!selectedFlags[i] || busySlot !== null} onClick={() => requestFlag(i + 1, selectedFlags[i])}>Set</AccessButton>
              <AccessButton data-action-status="complete" xs disabled={busySlot !== null} onClick={() => requestFlag(i + 1, "")}>Clear</AccessButton>
            </div>
          </div>
        ))}
      </div>
      <div className="ac-customer-search-user-settings-status" role="status" aria-live="polite">
        {status || loadError || (userSettingsSelectedCount ? `${userSettingsSelectedCount.toLocaleString()} employee${userSettingsSelectedCount === 1 ? "" : "s"} selected.` : "")}
      </div>
      {pendingFlag && typeof document !== "undefined" && createPortal(<div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingFlag(null); }} style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.35)" }}>
        <form role="dialog" aria-modal="true" aria-labelledby="employee-user-flag-password-title" onSubmit={confirmFlagPassword} style={{ width: "min(360px, 100%)", padding: 18, border: "1px solid #777", background: "#eee", boxShadow: "0 8px 28px rgba(0,0,0,.35)", color: "#111" }}>
          <strong id="employee-user-flag-password-title" style={{ display: "block", marginBottom: 12 }}>Password required</strong>
          <label htmlFor="employee-user-flag-password" style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Enter password to {pendingFlag.value === "" ? "clear" : "set"} User Flag {pendingFlag.slot} for {userSettingsSelectedCount} selected employee{userSettingsSelectedCount === 1 ? "" : "s"}.</label>
          <input id="employee-user-flag-password" type="password" inputMode="numeric" autoComplete="current-password" autoFocus required value={passwordEntry} onChange={event => { setPasswordEntry(event.target.value); setPasswordError(""); }} style={{ boxSizing: "border-box", width: "100%", height: 32, padding: "4px 7px", border: "1px solid #888", background: "#fff", color: "#111" }} />
          {passwordError && <div role="alert" style={{ marginTop: 7, color: "#b00020", fontSize: 12 }}>{passwordError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}><AccessButton data-action-status="complete" xs type="button" onClick={() => setPendingFlag(null)}>Cancel</AccessButton><AccessButton data-action-status="complete" xs type="submit">Continue</AccessButton></div>
        </form>
      </div>, document.body)}
    </div>
  );
}

function UtilitiesTab({ utilityFilters: filters = {}, onUtilityFiltersChange: onFiltersChange, utilityEmployees: employees = [], selectedEmployeeIds = [], onRefresh, onZero }: Pick<EmployeeSearchViewsPanelProps, "utilityFilters" | "onUtilityFiltersChange" | "utilityEmployees" | "selectedEmployeeIds" | "onRefresh" | "onZero"> = {}) {
  const saved = useEmployeeSavedViews();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const updateFilter = (key: keyof EmployeeSearchUtilityFilters, value: string) => onFiltersChange?.({ ...filters, [key]: value });
  const rows = selectedEmployeeIds.length ? employees.filter(employee => selectedEmployeeIds.includes(employee.employeeId)) : employees;
  const exportCsv = (name: string, headers: string[], values: string[][]) => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers, ...values].map(row => row.map(escape).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click(); URL.revokeObjectURL(link.href);
  };
  async function exportView() {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const layout = saved?.layout;
      const columns = (layout?.order ?? EMPLOYEE_SEARCH_COLUMNS.map(column => column.key))
        .filter(key => !layout?.hidden.includes(key))
        .map(key => EMPLOYEE_SEARCH_COLUMNS.find(column => column.key === key))
        .filter((column): column is (typeof EMPLOYEE_SEARCH_COLUMNS)[number] => Boolean(column));
      const XLSX = await import("xlsx");
      const values = rows.map(employee => columns.map(column => employeeSearchCellValue(employee, column.key)));
      const sheet = XLSX.utils.aoa_to_sheet([columns.map(column => column.label), ...values]);
      const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Employee View");
      XLSX.writeFile(book, `Employee-Search-View-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setMessage(`Exported ${rows.length.toLocaleString()} employee rows.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not export this view."); }
    finally { setBusy(false); }
  }
  async function clearFutureCall() {
    if (!selectedEmployeeIds.length) { setMessage("Select employees in the grid first."); return; }
    if (selectedEmployeeIds.length > 1000) { setMessage("Select no more than 1,000 employees at a time."); return; }
    if (!window.confirm(`Clear Future Call for the ${selectedEmployeeIds.length} selected employee(s)?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/employees/clear-future-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: selectedEmployeeIds }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Future Call could not be cleared.");
      setMessage(`Cleared Future Call for ${result.updated} employee(s).`);
      onRefresh?.();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Future Call could not be cleared."); }
    finally { setBusy(false); }
  }
  function printMailingLabels() {
    const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
    const labels = rows.map(employee => `<article><strong>${escape(employee.fullName)}</strong><br>${escape(employee.street)}<br>${escape([employee.city, employee.state, employee.accessFields.EmZip].filter(Boolean).join(", "))}</article>`).join("");
    const popup = window.open("", "employee-mailing-labels", "width=800,height=650");
    if (!popup) { setMessage("Allow pop-ups to print mailing labels."); return; }
    popup.document.write(`<!doctype html><html><head><title>Employee Mailing Labels</title><style>body{font:12pt Arial;margin:12mm}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12mm}article{height:35mm;break-inside:avoid}</style></head><body><div class="grid">${labels}</div><script>window.onload=()=>window.print()<\/script></body></html>`);
    popup.document.close();
    setMessage(`Opened ${rows.length.toLocaleString()} mailing labels for printing.`);
  }
  return (
    <div className="ac-customer-search-utilities-tab ac-employee-utilities-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <AccessButton data-action-status="complete" xs disabled={busy} onClick={() => void clearFutureCall()}>Clear Future Call</AccessButton>
        <AccessButton data-action-status="partial" xs className="ac-employee-utilities-black-btn" onClick={() => setMessage("Access RefreshEmployeeHL requires the resume, IPG application, and I-9 shared-folder paths. Those folder settings are not configured in this app.")}>
          Refresh Hyperlinks | 009
        </AccessButton>
        <AccessButton data-action-status="complete" xs onClick={printMailingLabels}>
          View/Print Mailing Labels
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <div className="ac-customer-search-utilities-btn-row">
          <AccessButton data-action-status="complete" xs disabled={!onRefresh || busy} onClick={() => { onRefresh?.(); setMessage("Employee results refreshed."); }}>
            Refresh
          </AccessButton>
          <AccessButton data-action-status="complete" xs disabled={!onZero || busy} onClick={() => { onZero?.(); onFiltersChange?.({}); setMessage("Employee filters and selections were reset."); }}>
            Zero
          </AccessButton>
        </div>
        <AccessButton data-action-status="complete" xs disabled={busy} onClick={() => void exportView()}>
          {busy ? "Exporting…" : "Export View"}
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <select className="ac-select" value={filters.licenseYear ?? ""} onChange={event => updateFilter("licenseYear", event.target.value)} aria-label="License issue year">
          <option value="">&lt;Lic Issue Year&gt;</option>
          <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.licenseYears} />
        </select>
        <select className="ac-select" value={filters.noContactRange ?? ""} onChange={event => updateFilter("noContactRange", event.target.value)} aria-label="Has not been contacted in">
          <option value="">&lt;Has Not Been Contacted In&gt;</option>
          <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.contactRanges} />
        </select>
        <label className="ac-employee-utilities-outside-action">
          <span>Outside Action | 041:</span>
          <select className="ac-select" aria-label="Outside Action" disabled title="Outside Action options are not available in the exported data.">
            <option value="" />
          </select>
        </label>
      </div>
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <AccessButton data-action-status="complete" xs onClick={() => { exportCsv("Employee-Salesman-Records", ["Employee", "Salesman"], rows.map(row => [row.fullName, row.accessFields.Salesman ?? ""])); setMessage(`Exported salesman record list for ${rows.length.toLocaleString()} employees.`); }}>
          Salesman Records - Emp | 010
        </AccessButton>
        <AccessButton data-action-status="complete" xs onClick={() => { exportCsv("Employee-Last-Contact", ["Employee", "Last Action", "Last Contact User", "Last Contact Date", "Note"], rows.map(row => [row.fullName, row.accessFields.EmployeeContactHistoryActionType ?? "", row.accessFields.EmployeeContactHistoryUserName ?? "", row.accessFields.EmployeeContactHistoryDate ?? "", row.accessFields.EmployeeContactHistoryNote ?? ""])); setMessage(`Exported last contact list for ${rows.length.toLocaleString()} employees.`); }}>
          Last Contact | 011
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <select className="ac-select" value={filters.duplicates ?? ""} onChange={event => updateFilter("duplicates", event.target.value)} aria-label="Find duplicates">
          <option value="">&lt;Find Duplicates&gt;</option>
          <LegacyOptions options={LEGACY_DROPDOWN_OPTIONS.duplicateModes} />
        </select>
        <AccessButton data-action-status="partial" xs onClick={() => setMessage("The employee profile comparison/update routine is not present in the available Access export. No employee records were changed.")}>
          Compare Profiles (Update All)
        </AccessButton>
        <AccessButton data-action-status="partial" xs onClick={() => setMessage(selectedEmployeeIds.length ? "The employee profile comparison/update routine is not present in the available Access export. No employee records were changed." : "Select employees in the grid first.")}>
          Compare Profiles (Update Selected)
        </AccessButton>
      </div>
      {message && <span role="status" aria-live="polite" className="ac-customer-search-user-settings-status">{message}</span>}
    </div>
  );
}

function AdminUtilitiesTab({ employees = [], selectedEmployeeIds = [], adminIncludedProfiles, onSelectedEmployeeIdsChange, onIncludedProfilesChange, onRefresh }: {
  employees?: EmployeeSummary[];
  selectedEmployeeIds?: string[];
  adminIncludedProfiles?: string[];
  onSelectedEmployeeIdsChange?: (ids: string[]) => void;
  onIncludedProfilesChange?: (profiles: string[]) => void;
  onRefresh?: () => void;
}) {
  const transferProfiles = [
    ["[Main] Employee Search 3", "ac-employee-admin-transfer-main"],
    ["[Sub Div 1] Recruit", "ac-employee-admin-transfer-recruit"],
    ["[Sub Div 2] Research", "ac-employee-admin-transfer-research"],
    ["[Sub Div 3] Hold", "ac-employee-admin-transfer-hold"],
    ["Health Care", "ac-employee-admin-transfer-health"],
    ["Profile 6", "ac-employee-admin-transfer-profile6"],
    ["Profile 7", "ac-employee-admin-transfer-profile7"],
    ["Profile 8", "ac-employee-admin-transfer-profile8"],
    ["Profile 9", "ac-employee-admin-transfer-profile9"],
    ["Profile 10", "ac-employee-admin-transfer-profile10"],
  ] as const;

  const [profiles, setProfiles] = useState<Array<{ id: number; name: string }>>([]);
  const [included, setIncluded] = useState<string[]>(adminIncludedProfiles ?? EMPLOYEE_ADMIN_INCLUDE_PROFILES.map(label => label.replace(/^Include\s+/, "")));
  const [recordKey, setRecordKey] = useState<"employee" | "cell">("employee");
  const [message, setMessage] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerIds, setPickerIds] = useState<string[]>(selectedEmployeeIds);
  const [busy, setBusy] = useState(false);
  const saved = useEmployeeSavedViews();
  useEffect(() => { if (adminIncludedProfiles) setIncluded(adminIncludedProfiles); }, [adminIncludedProfiles]);
  useEffect(() => {
    let active = true;
    fetch("/api/employees/profile-transfer", { cache: "no-store" }).then(async response => {
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "Employee profiles could not be loaded.");
      if (active) setProfiles(body.profiles);
    }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : "Employee profiles could not be loaded."); });
    return () => { active = false; };
  }, []);
  const changeIncluded = (name: string, checked: boolean) => {
    const next = checked ? [...new Set([...included, name])] : included.filter(value => value !== name);
    setIncluded(next);
    onIncludedProfilesChange?.(next);
  };
  async function transfer(profileIndex: number) {
    const profile = profiles[profileIndex];
    if (!profile) { setMessage("The profile list is unavailable; refresh the tab and try again."); return; }
    if (!selectedEmployeeIds.length) { setMessage("Select employee rows in the grid before transferring."); return; }
    if (selectedEmployeeIds.length > 1000) { setMessage("Select no more than 1,000 employees at a time."); return; }
    if (!window.confirm(`This will change ${selectedEmployeeIds.length} selected employee(s) to ${profile.name}. Continue?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/employees/profile-transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileTypeId: profile.id, employeeIds: selectedEmployeeIds }) });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "The transfer failed.");
      setMessage(`${body.updated} employee(s) transferred to ${body.profile}.`);
      onRefresh?.();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The transfer failed."); }
    finally { setBusy(false); }
  }
  async function exportView() {
    setBusy(true); setMessage("");
    try {
      const layout = saved?.layout;
      const columns = (layout?.order ?? EMPLOYEE_SEARCH_COLUMNS.map(column => column.key)).filter(key => !layout?.hidden.includes(key)).map(key => EMPLOYEE_SEARCH_COLUMNS.find(column => column.key === key)).filter((column): column is (typeof EMPLOYEE_SEARCH_COLUMNS)[number] => Boolean(column));
      let rows = selectedEmployeeIds.length ? employees.filter(row => selectedEmployeeIds.includes(row.employeeId)) : employees;
      if (recordKey === "employee") rows = [...new Map(rows.map(row => [row.employeeId, row])).values()];
      else rows = [...new Map(rows.map(row => [row.cellPhone.replace(/\\D/g, "") || row.employeeId, row])).values()];
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.aoa_to_sheet([columns.map(column => column.label), ...rows.map(row => columns.map(column => employeeSearchCellValue(row, column.key)))]);
      const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Employee Search");
      XLSX.writeFile(book, "Employee-Search-Admin-Export.xlsx");
      setMessage(`Exported ${rows.length.toLocaleString()} rows.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); }
    finally { setBusy(false); }
  }
  const visiblePickerRows = employees.filter(row => !pickerQuery || row.fullName.toLowerCase().includes(pickerQuery.toLowerCase()));

  return (
    <div className="ac-employee-admin-tab ac-search-views-tab-pane">
      <div className="ac-employee-admin-transfer-grid">
        {transferProfiles.map(([label, className]) => (
            <AccessButton data-action-status="complete" key={label} className={className} disabled={busy} onClick={() => void transfer(transferProfiles.findIndex(item => item[0] === label))}>
            Transfer to
            <br />
            {label}
          </AccessButton>
        ))}
      </div>
      <div className="ac-employee-admin-controls">
        <div className="ac-employee-admin-checks">
          {EMPLOYEE_ADMIN_INCLUDE_PROFILES.map((label) => (
            <label key={label} className="ac-customer-search-check">
              <input type="checkbox" checked={included.includes(label.replace(/^Include\s+/, ""))} onChange={event => changeIncluded(label.replace(/^Include\s+/, ""), event.target.checked)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <fieldset className="ac-employee-admin-record-group">
          <legend>1 Record per | 020</legend>
          <label className="ac-customer-search-radio">
            <input type="radio" name="emp-admin-record" checked={recordKey === "employee"} onChange={() => setRecordKey("employee")} />
            <span>Emp</span>
          </label>
          <label className="ac-customer-search-radio">
            <input type="radio" name="emp-admin-record" checked={recordKey === "cell"} onChange={() => setRecordKey("cell")} />
            <span>Cell #</span>
          </label>
        </fieldset>
        <AccessButton data-action-status="complete" xs disabled={busy} onClick={() => void exportView()}>
          {busy ? "Working…" : "Export View"}
        </AccessButton>
        <AccessButton data-action-status="complete" xs className="ac-employee-admin-multifilter-btn" onClick={() => { setPickerIds(selectedEmployeeIds); setPickerOpen(true); }}>
          Multi Filter Names and Selections
        </AccessButton>
      </div>
      {message && <span className="ac-employee-admin-status" role="status" aria-live="polite">{message}</span>}
      {pickerOpen && typeof document !== "undefined" && createPortal(<div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPickerOpen(false); }} className="ac-employee-admin-picker-backdrop">
        <section role="dialog" aria-modal="true" aria-label="Multi Filter Names and Selections" className="ac-employee-admin-picker">
          <h3>Multi Filter Names and Selections</h3>
          <input aria-label="Find employee" placeholder="Search names" value={pickerQuery} onChange={event => setPickerQuery(event.target.value)} />
          <div className="ac-employee-admin-picker-list">{visiblePickerRows.map(row => <label key={row.employeeId}><input type="checkbox" checked={pickerIds.includes(row.employeeId)} onChange={event => setPickerIds(current => event.target.checked ? [...new Set([...current, row.employeeId])] : current.filter(id => id !== row.employeeId))} />{row.fullName}</label>)}</div>
          <footer><span>{pickerIds.length} selected</span><AccessButton data-action-status="complete" xs onClick={() => setPickerIds([])}>Clear</AccessButton><AccessButton data-action-status="complete" xs onClick={() => setPickerOpen(false)}>Cancel</AccessButton><AccessButton data-action-status="complete" xs onClick={() => { onSelectedEmployeeIdsChange?.(pickerIds); setPickerOpen(false); }}>Apply</AccessButton></footer>
        </section>
      </div>, document.body)}
    </div>
  );
}

function RayTab({ employeeRows = [], selectedEmployeeIds = [], onRefresh }: Pick<EmployeeSearchViewsPanelProps, "employeeRows" | "selectedEmployeeIds" | "onRefresh">) {
  const [licenseBoards, setLicenseBoards] = useState<FilterOption[]>([]);
  const [licenseBoard, setLicenseBoard] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/employees/build-licenses", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error ?? "License boards could not be loaded.");
        if (active) {
          setLicenseBoards(result.boards as FilterOption[]);
          setLicenseBoard(current => current || String((result.boards as FilterOption[])[0]?.value ?? ""));
        }
      })
      .catch(error => { if (active) setMessage(error instanceof Error ? error.message : "License boards could not be loaded."); });
    return () => { active = false; };
  }, []);

  const buildLicenses = async () => {
    if (!licenseBoard || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const previewResponse = await fetch("/api/employees/build-licenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ howReferredId: Number(licenseBoard) }),
      });
      const preview = await previewResponse.json();
      if (!previewResponse.ok || !preview.ok) throw new Error(preview.error ?? "Could not preview license creation.");
      if (!preview.count) { setMessage(`No employees matched ${preview.board} with a trade and matching license qualification.`); return; }
      if (!window.confirm(`${preview.count} employees match ${preview.board}. Build their license records and update Licensed In values?`)) return;
      const response = await fetch("/api/employees/build-licenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ howReferredId: Number(licenseBoard), confirm: true }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "License records could not be built.");
      setMessage(`Build complete for ${result.board}: ${result.added} licenses added, ${result.updatedEmployees} Licensed In values updated, ${result.removedStateOnly} state-only licenses removed.`);
      onRefresh?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "License records could not be built.");
    } finally { setBusy(false); }
  };

  const exportPhoneNumbers = () => {
    const selected = employeeRows.filter(row => selectedEmployeeIds.includes(row.employeeId));
    if (!selected.length) { setMessage("Select employee rows in the grid before exporting phone numbers."); return; }
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const headers = ["Employee ID", "First Name", "Last Name", "Home Phone", "Cell # 1", "Cell # 2", "Cell # 3", "Cell # 4"];
    const lines = [headers, ...selected.map(row => [
      row.employeeId, row.firstName, row.lastName,
      row.accessFields.EmHomePhone ?? "", row.accessFields.EmMobilePhone ?? row.cellPhone,
      row.accessFields.EmMobilePhone2 ?? "", row.accessFields.EmMobilePhone3 ?? "", row.accessFields.EmMobilePhone4 ?? "",
    ])].map(line => line.map(quote).join(","));
    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "employee-phone-numbers.csv"; link.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported phone numbers for ${selected.length} selected employees.`);
  };

  return (
    <div className="ac-employee-ray-tab ac-search-views-tab-pane">
      <div className="ac-employee-ray-section">
        <div className="ac-employee-ray-heading">Auto-Merge Duplicates:</div>
        <AccessButton data-action-status="missing" xs disabled title="The Access auto-merge routine was not included in the exported Access source.">
          Electrician | 006
        </AccessButton>
        <AccessButton data-action-status="missing" xs disabled title="The Access auto-merge routine was not included in the exported Access source.">
          Plumber | 007
        </AccessButton>
      </div>
      <div className="ac-employee-ray-section">
        <select className="ac-select" value={licenseBoard} onChange={event => setLicenseBoard(event.target.value)} aria-label="License Board">
          <option value="">&lt;License Board&gt;</option>
          {licenseBoards.map(board => <option key={board.value} value={board.value}>{board.label}</option>)}
        </select>
        <AccessButton data-action-status="complete" xs disabled={busy || !licenseBoard} onClick={() => void buildLicenses()}>
          {busy ? "Building…" : "Build Licenses | 008"}
        </AccessButton>
      </div>
      <div className="ac-employee-ray-section ac-employee-ray-section--wide">
        <div className="ac-employee-ray-heading">Remove Apprentice from duplicates (Licensed / Apprentice) | 021</div>
        <AccessButton data-action-status="missing" xs disabled title="The Access duplicate-selection routine was not included in the exported Access source." className="ac-employee-ray-wide-btn">
          1) Select Licensed / Apprentice Duplicates
        </AccessButton>
        <AccessButton data-action-status="missing" xs disabled title="The Access duplicate merge routine was not included in the exported Access source." className="ac-employee-ray-wide-btn">
          2) Delete Selected Apprentice Duplicates and Merge Cell #s
        </AccessButton>
      </div>
      <div className="ac-employee-ray-section ac-employee-ray-section--wide">
        <div className="ac-employee-ray-heading-row">
          <span className="ac-employee-ray-heading">Validate Phone Numbers | 023</span>
          <span className="ac-employee-ray-warn">To Process, everyone else should be out of the system</span>
        </div>
        <div className="ac-employee-ray-phone-row">
          <ol className="ac-employee-ray-steps">
            <li>Update the Phone Needs Validation column.</li>
            <li>Filter employees and use Select All to select.</li>
            <li>Export file and send to vendor.</li>
            <li>Process validation file from vendor.</li>
          </ol>
          <div className="ac-employee-ray-phone-btns">
            <AccessButton data-action-status="complete" xs onClick={exportPhoneNumbers}>
              Export Phone Numbers
            </AccessButton>
            <AccessButton data-action-status="missing" xs disabled title="The Access vendor-file import and update routine was not included in the exported Access source.">
              Process Phone Numbers
            </AccessButton>
          </div>
        </div>
      </div>
      {message && <p role="status" aria-live="polite" className="ac-employee-ray-status">{message}</p>}
    </div>
  );
}

function Ray2Tab() {
  return (
    <div className="ac-employee-ray2-tab ac-search-views-tab-pane">
      <fieldset className="ac-employee-ray2-fieldset">
        <legend className="ac-employee-ray2-warn">These will remove the value, user, and date from the profile, and the history | 027
      </legend>
        <AccessButton data-action-status="missing" xs>
          Remove All Vax
        </AccessButton>
        <AccessButton data-action-status="missing" xs>
          Remove All S1
        </AccessButton>
        <AccessButton data-action-status="missing" xs>
          Remove All S2
        </AccessButton>
      </fieldset>
    </div>
  );
}

function InterviewTab() {
  return (
    <div className="ac-employee-interview-tab ac-search-views-tab-pane">
      <AccessButton data-action-status="missing" xs>
        Populate
      </AccessButton>
      <FilterRadioGroup
        legend="Interview Date:"
        name="emp-interview-date"
        options={EMPLOYEE_INTERVIEW_DATE_OPTIONS}
        className="ac-customer-search-filter-group--wide"
      />
    </div>
  );
}

function CallListsTab({ callListFilters: filters = {}, onCallListFiltersChange: onFiltersChange, employeeRows = [] }: Pick<EmployeeSearchViewsPanelProps, "callListFilters" | "onCallListFiltersChange" | "employeeRows">) {
  const update = (key: keyof EmployeeSearchCallListFilters, value: string) => onFiltersChange?.({ ...filters, [key]: value });
  const listFieldsPresent = useMemo(() => employeeRows.some(row => ["EmployeeCallList", "CallList", "CallListNumber", "CallListID", "EmployeeCallListID", "CallList1", "CallList2", "CallList3", "EmployeeCallList1", "EmployeeCallList2", "EmployeeCallList3"].some(key => Boolean(row.accessFields[key]?.trim()))), [employeeRows]);
  return (
    <div className="ac-employee-search-views-filters ac-employee-calllists-tab ac-search-views-tab-pane">
      <FilterRadioGroup legend="Trade:" name="emp-cl-trade" options={EMPLOYEE_CALL_LISTS_TRADE} value={filters.trade ?? "All"} onValueChange={value => update("trade", value)} className="ac-customer-search-filter-group--wide" />
      <FilterRadioGroup legend="State:" name="emp-cl-state" options={EMPLOYEE_VIEWS_STATE_OPTIONS} value={filters.state ?? "All"} onValueChange={value => update("state", value)} className="ac-customer-search-filter-group--wide" />
      <FilterRadioGroup legend="County:" name="emp-cl-county" options={EMPLOYEE_VIEWS_COUNTY_OPTIONS} value={filters.county ?? "All"} onValueChange={value => update("county", value)} className="ac-customer-search-filter-group--wide" />
      <FilterRadioGroup legend="List:" name="emp-cl-list" options={EMPLOYEE_CALL_LISTS_LIST} value={filters.list ?? "None"} onValueChange={value => update("list", value)} className="ac-customer-search-filter-group--wide" />
      {filters.list && filters.list !== "None" && !listFieldsPresent && <span role="status" className="ac-employee-calllists-status">The loaded employee data has no call-list membership field, so List {filters.list} cannot narrow the results.</span>}
    </div>
  );
}

function CallLists2Tab({ callLists2Filters: filters = {}, onCallLists2FiltersChange: onFiltersChange, employeeRows = [], onCallLists2SortChange }: Pick<EmployeeSearchViewsPanelProps, "callLists2Filters" | "onCallLists2FiltersChange" | "employeeRows" | "onCallLists2SortChange">) {
  const savedViews = useEmployeeSavedViews();
  const options = useMemo(() => getEmployeeCallLists2Options(employeeRows), [employeeRows]);
  const notice = useMemo(() => callLists2MissingDataNotice(employeeRows, filters), [employeeRows, filters]);
  const update = (key: keyof EmployeeSearchCallLists2Filters, value: string | string[]) => onFiltersChange?.({ ...filters, [key]: value } as EmployeeSearchCallLists2Filters);
  const toggleDays = (key: "newEntryDays" | "newUnassignedDays", day: string, checked: boolean) => {
    const current = filters[key] ?? [];
    update(key, checked ? [...new Set([...current, day])] : current.filter(value => value !== day));
  };
  const mapOptions = useMemo(() => {
    const mapped = new Map<number, string>(LEGACY_DROPDOWN_OPTIONS.viewMaps.slice(0, 5).map((label, index) => [index + 1, label]));
    for (const view of savedViews?.views ?? []) mapped.set(view.slot, `${view.name} (View ${String(view.slot).padStart(2, "0")})`);
    return [...mapped].map(([slot, label]) => ({ slot, label })).sort((a, b) => a.slot - b.slot);
  }, [savedViews?.views]);
  const mapValue = savedViews && mapOptions.some(option => option.slot === savedViews.slot) ? String(savedViews.slot) : "";
  return (
    <div className="ac-employee-calllists2-tab ac-search-views-tab-pane">
      <div className="ac-employee-calllists2-filters-row">
        <select className="ac-select ac-employee-search-row-select" value={filters.cluster ?? ""} onChange={event => update("cluster", event.target.value)} aria-label="Cluster"><option value="">&lt;Cluster&gt;</option>{options.clusters.map(value => <option key={value} value={value}>{value}</option>)}</select>
        <select className="ac-select ac-employee-search-row-select" value={filters.trade ?? ""} onChange={event => update("trade", event.target.value)} aria-label="Trade"><option value="">&lt;Trade&gt;</option>{options.trades.map(value => <option key={value} value={value}>{value}</option>)}</select>
        <select className="ac-select ac-employee-search-row-select" value={filters.qualification ?? ""} onChange={event => update("qualification", event.target.value)} aria-label="Qualification"><option value="">&lt;Qualification&gt;</option>{options.qualifications.map(value => <option key={value} value={value}>{value}</option>)}</select>
        <select className="ac-select ac-employee-search-row-select" value={filters.lastAction ?? ""} onChange={event => update("lastAction", event.target.value)} aria-label="Last Action"><option value="">&lt;Last Action&gt;</option>{options.lastActions.map(value => <option key={value} value={value}>{value}</option>)}</select>
        <select className="ac-select ac-employee-search-row-select" value={filters.lastCall ?? ""} onChange={event => update("lastCall", event.target.value)} aria-label="Last Call"><option value="">&lt;Last Call&gt;</option><LegacyOptions options={CALL_LIST_DROPDOWN_OPTIONS["<Last Call>"]} /></select>
        <select className="ac-select ac-employee-search-row-select" value={filters.noSubs ?? ""} onChange={event => update("noSubs", event.target.value)} aria-label="No SUBs"><option value="">&lt;No SUBs&gt;</option><LegacyOptions options={CALL_LIST_DROPDOWN_OPTIONS["No SUBs"]} /></select>
      </div>
      <div className="ac-employee-calllists2-body">
        <fieldset className="ac-employee-calllists2-additional">
          <legend>Additional Filters:</legend>
          <label className="ac-customer-search-radio">
            <input type="radio" name="emp-cl2-add" checked={!filters.additional || filters.additional === "All"} onChange={() => update("additional", "All")} />
            <span>All</span>
          </label>
          {EMPLOYEE_CALL_LISTS_2_ADDITIONAL.map((label) => (
            <label key={label} className="ac-customer-search-radio ac-employee-calllists2-option">
              <input type="radio" name="emp-cl2-add" checked={filters.additional === label} onChange={() => update("additional", label)} />
              <span>{label}</span>
            </label>
          ))}
          <label className="ac-customer-search-radio ac-employee-calllists2-option">
            <input type="radio" name="emp-cl2-add" checked={filters.additional?.startsWith("6.") ?? false} onChange={() => update("additional", "6. Show new entries for the past:")} />
            <span>6. Show new entries for the past:</span>
            {["10 Days", "20 Days", "30 Days"].map((d, i) => (
              <label key={d} className="ac-customer-search-check ac-employee-calllists2-check">
                <input type="checkbox" checked={(filters.newEntryDays ?? ["10"]).includes(String((i + 1) * 10))} onChange={event => toggleDays("newEntryDays", String((i + 1) * 10), event.target.checked)} />
                <span>{d}</span>
              </label>
            ))}
          </label>
          <label className="ac-customer-search-radio ac-employee-calllists2-option">
            <input type="radio" name="emp-cl2-add" checked={filters.additional?.startsWith("7.") ?? false} onChange={() => update("additional", "7. Show all new entries for the past, w/ only unassigned + No SUBs filters:")} />
            <span>7. Show all new entries for the past, w/ only unassigned + No SUBs filters:</span>
            {["10 Days", "20 Days", "30 Days"].map((d, i) => (
              <label key={d} className="ac-customer-search-check ac-employee-calllists2-check">
                <input type="checkbox" checked={(filters.newUnassignedDays ?? ["10"]).includes(String((i + 1) * 10))} onChange={event => toggleDays("newUnassignedDays", String((i + 1) * 10), event.target.checked)} />
                <span>{d}</span>
              </label>
            ))}
          </label>
        </fieldset>
        <div className="ac-employee-calllists2-right">
          <div className="ac-employee-calllists2-viewmap">
            <select className="ac-select" value={mapValue} onChange={event => { const slot = Number(event.target.value); if (slot) savedViews?.select(slot); }} aria-label="View Map">
              <option value="">&lt;View Map&gt;</option>
              {mapOptions.map(option => <option key={option.slot} value={option.slot}>{option.label}</option>)}
            </select>
            <AccessButton data-action-status={savedViews ? "complete" : "missing"} xs disabled={!savedViews} onClick={() => savedViews?.openRename()}>
              Edit
            </AccessButton>
          </div>
          <span className="ac-employee-calllists2-hint">(This is not a filter)</span>
          <AccessButton data-action-status="complete" xs className="ac-employee-search-v-btn" onClick={() => onCallLists2SortChange?.("name")}>
            V-Name
          </AccessButton>
          <AccessButton data-action-status="complete" xs className="ac-employee-search-v-btn" onClick={() => onCallLists2SortChange?.("number")}>
            V-Number
          </AccessButton>
        </div>
      </div>
      <div className="ac-employee-calllists2-footer">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="ac-customer-search-preset-empty ac-employee-calllists2-spare" aria-hidden />
        ))}
        <span className="ac-employee-search-btn-warn ac-employee-calllists2-recruiter">Recruiter. M Screen</span>
        <AccessButton data-action-status="missing" xs className="ac-employee-search-btn-warn ac-btn">
          EE SEARCH
        </AccessButton>
      </div>
      {notice && <p role="status" className="ac-employee-calllists2-hint">{notice}</p>}
    </div>
  );
}

const TAB_CONTENT: readonly (() => ReactNode)[] = [
  Views2Tab,
  () => <Views3Tab />,
  () => <Views4Tab />,
  () => <CopySectionTab variant="ma" />,
  () => <CopySectionTab variant="nh" />,
  () => <UserSettingsTab />,
  () => <UtilitiesTab />,
  () => <AdminUtilitiesTab />,
  () => <RayTab />,
  Ray2Tab,
  InterviewTab,
  () => <CallListsTab />,
  () => <CallLists2Tab />,
];

export function EmployeeSearchUtilityRail() {
  return (
    <div className="ac-customer-search-utility-rail ac-employee-search-utility-rail shrink-0">
      <button data-action-status="missing" type="button" className="ac-customer-search-rail-icon" aria-label="Print">
        <Icon icon={Printer} size="xs" />
      </button>
      <button data-action-status="missing" type="button" className="ac-customer-search-rail-icon ac-customer-search-rail-icon--help" aria-label="Help">
        <Icon icon={HelpCircle} size="xs" />
      </button>
      <div className="ac-customer-search-size-mb">
        <span>Size MB</span>
        <strong>535</strong>
      </div>
    </div>
  );
}

export function EmployeeSearchViewsPanel(props: EmployeeSearchViewsPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [employeeUserFlagOptions, setEmployeeUserFlagOptions] = useState(props.employeeUserFlagOptions ?? Array.from({ length: 8 }, () => []));
  const [userFlagsLoaded, setUserFlagsLoaded] = useState(Boolean(props.employeeUserFlagOptions?.some(options => options.length)));
  const [userFlagsLoadError, setUserFlagsLoadError] = useState("");

  useEffect(() => {
    if (activeTab !== 6 || userFlagsLoaded) return;
    let active = true;
    fetch("/api/employees/user-flags", { cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error("Employee user settings could not be loaded.");
        if (active) setEmployeeUserFlagOptions(result.options as FilterOption[][]);
      })
      .catch(error => { if (active) { setEmployeeUserFlagOptions(Array.from({ length: 8 }, () => [])); setUserFlagsLoadError(error instanceof Error ? error.message : "Employee user settings could not be loaded."); } })
      .finally(() => { if (active) setUserFlagsLoaded(true); });
    return () => { active = false; };
  }, [activeTab, userFlagsLoaded]);

  return (
    <div className="ac-customer-search-controls ac-employee-search-controls min-w-0 flex-1">
      <div className="ac-tabs ac-customer-search-view-tabs ac-employee-search-view-tabs shrink-0 overflow-x-auto">
        {EMPLOYEE_SEARCH_VIEW_TABS.map((label, i) => (
          <button data-action-status="complete"
            key={label}
            type="button"
            className={`ac-tab ${activeTab === i ? "ac-tab-active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ac-customer-search-control-panel ac-employee-search-control-panel min-h-0 flex-1">
        <div className="ac-customer-search-views-tab ac-employee-search-views-tab">
          <div className="ac-employee-search-views-body">
            {activeTab === 0 ? (
              <Views1Tab trades={props.trades} currentTradeId={props.currentTradeId} onTradeChange={props.onTradeChange} onSort={props.onSort} callNumberFilter={props.callNumberFilter} onCallNumberFilterChange={props.onCallNumberFilterChange} onRefresh={props.onRefresh} views1Filters={props.views1Filters} onViews1FiltersChange={props.onViews1FiltersChange} employeeRows={props.employeeRows} activeEmployee={props.activeEmployee} />
            ) : (
              activeTab === 2 ? <Views3Tab filters={props.views3Filters} onFiltersChange={props.onViews3FiltersChange} />
                : activeTab === 3 ? <Views4Tab filters={props.views4Filters} onFiltersChange={props.onViews4FiltersChange} />
                  : activeTab === 4 ? <CopySectionTab variant="ma" employee={props.activeEmployee} />
                    : activeTab === 5 ? <CopySectionTab variant="nh" employee={props.activeEmployee} />
                      : activeTab === 6 ? <UserSettingsTab employeeUserFlagOptions={employeeUserFlagOptions} employeeRows={props.employeeRows} userSettingsSelectedCount={props.userSettingsSelectedCount} onApplyUserFlag={props.onApplyUserFlag} loadError={userFlagsLoadError} />
                        : activeTab === 7 ? <UtilitiesTab utilityFilters={props.utilityFilters} onUtilityFiltersChange={props.onUtilityFiltersChange} utilityEmployees={props.utilityEmployees} selectedEmployeeIds={props.selectedEmployeeIds} onRefresh={props.onRefresh} onZero={props.onZero} />
                          : activeTab === 8 ? <AdminUtilitiesTab employees={props.utilityEmployees} selectedEmployeeIds={props.selectedEmployeeIds} adminIncludedProfiles={props.adminIncludedProfiles} onSelectedEmployeeIdsChange={props.onSelectedEmployeeIdsChange} onIncludedProfilesChange={props.onAdminIncludedProfilesChange} onRefresh={props.onRefresh} />
                            : activeTab === 9 ? <RayTab employeeRows={props.employeeRows} selectedEmployeeIds={props.selectedEmployeeIds} onRefresh={props.onRefresh} />
                            : activeTab === 12 ? <CallListsTab callListFilters={props.callListFilters} onCallListFiltersChange={props.onCallListFiltersChange} employeeRows={props.employeeRows} />
                              : activeTab === 13 ? <CallLists2Tab callLists2Filters={props.callLists2Filters} onCallLists2FiltersChange={props.onCallLists2FiltersChange} employeeRows={props.employeeRows} onCallLists2SortChange={props.onCallLists2SortChange} />
                              : TAB_CONTENT[activeTab - 1]()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
