"use client";

import { Suspense, createContext, useContext, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AccessButton } from "@/components/access/AccessButton";
import { CustomerSavedViewActions, useCustomerSavedViews } from "./CustomerSavedViews";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import {
  CUSTOMER_SEARCH_PRESET_GRID,
  CUSTOMER_SEARCH_VIEW_TABS,
  customerSearchPresetBtnClass,
  customerSearchPresetView,
  type CustomerSearchPresetCell,
} from "@/lib/customerSearchColumns";
import {
  CUSTOMER_ADMIN_INCLUDE_PROFILES,
  CUSTOMER_ADMIN_TRANSFER_BUTTONS,
  CUSTOMER_SEARCH_VIEWS_2_GRID,
  CUSTOMER_VIEWS_COUNTY_OPTIONS,
  CUSTOMER_VIEWS_PROFILE_OPTIONS,
  CUSTOMER_VIEWS_PROGRESS_OPTIONS,
  CUSTOMER_VIEWS_STATE_OPTIONS,
  CUSTOMER_VIEWS_TIME_DURATION_OPTIONS,
  CUSTOMER_VIEWS_TIME_FRAME_FOR_OPTIONS,
  CUSTOMER_VIEWS_TRADE_OPTIONS,
} from "@/lib/customerSearchViewsLayout";
import type { FilterOption } from "@/types/search";
import type { CustomerSearchViews3Filters } from "@/lib/customerSearch1Filters";
import { CUSTOMER_NAME_SEARCH_COLUMNS } from "@/lib/customerNameSearchColumns";

interface CustomerSearchViewsPanelProps {
  filterRow?: ReactNode;
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
  customerUserFlagOptions: FilterOption[][];
  lastActionUsers: FilterOption[];
  currentSearch: string;
  currentSalesmanId: string;
  currentCustomerTypeId: string;
  currentStatusId: string;
  currentCity: string;
  currentState: string;
  views3Filters?: CustomerSearchViews3Filters;
  onViews3FiltersChange?: (filters: CustomerSearchViews3Filters) => void;
  adminSelectedCount?: number;
  adminIncludeProfiles?: string[];
  onAdminIncludeProfilesChange?: (profiles: string[]) => void;
  onAdminTransfer?: (profile: string) => Promise<void> | void;
  userSettingsSelectedCount?: number;
  onApplyUserFlag?: (slot: number, value: string, password: string) => Promise<void> | void;
  onGoToColumn?: (key: string) => void;
  visibleCustomerColumns?: string[];
  onExportView?: () => Promise<void> | void;
  onRefresh?: () => void;
  onZero?: () => void;
  onCancel?: () => void;
  selectedCustomerNames?: string[];
  onApplyMultiFilter?: () => void;
  onClearMultiFilter?: () => void;
  multiFilterActive?: boolean;
  selectedCustomerIds?: string[];
  onCreateCustomerAction?: (actionType: number) => Promise<void> | void;
  onClearFutureCall?: (choice: "set" | "clear" | "ignore", statusId?: number) => Promise<void> | void;
  onRayAction?: (action: "change-customer-type" | "fix-zips" | "change-contact-title" | "delete-contacts" | "set-flag4-do-not-email", payload?: { customerTypeId?: number; titleId?: number }) => Promise<number | void>;
}

const CUSTOMER_SAVED_FILTER_OPTIONS = Array.from({ length: 40 }, (_, index) => {
  const number = index + 1;
  if (number === 3) return { value: "filter-3", label: "Siobhan" };
  if (number === 5) return { value: "filter-5", label: "Dee" };
  return { value: `filter-${number}`, label: `Filter ${number}` };
});

const CUSTOMER_SAVED_VIEW_OPTIONS = [
  "01 Default",
  "01 Default Contract Report",
  "02 Jake",
  "03 Michelle",
  "View 01",
  "View 01 a",
  "View 01 New Default",
  "View 01 New Default Blast E M",
  "View 01 New Default Blast Text",
  "View 02",
  "View 03",
  "View 05",
  "View 06",
  "View 07",
  "View 08",
  "View 09",
] as const;

type SearchCluster = { id: number; name: string; active: boolean };
type SearchClusterCity = { clusterId: number; city: string; state: string; active: boolean };

export function ClusterMultiSelect({ value = "", onChange }: { value?: string; onChange?: (value: string) => void }) {
  const [clusters, setClusters] = useState<SearchCluster[]>([]);
  const [clusterCities, setClusterCities] = useState<SearchClusterCity[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [filter, setFilter] = useState("");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const selectedCities = useMemo(() => {
    try { return new Set(JSON.parse(value || "[]") as string[]); } catch { return new Set<string>(); }
  }, [value]);
  useEffect(() => {
    let active = true;
    fetch("/api/clusters", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("Cluster list unavailable");
      return await response.json() as { clusters: SearchCluster[]; cities: SearchClusterCity[] };
    }).then(data => {
      if (!active) return;
      setClusters(data.clusters.filter(cluster => cluster.active));
      setClusterCities(data.cities.filter(city => city.active));
      setLoadState("ready");
    }).catch(() => { if (active) setLoadState("error"); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!selectedCities.size) { setSelected([]); return; }
    setSelected(clusters.filter(cluster => clusterCities.some(city => city.clusterId === cluster.id && selectedCities.has(`${city.city}\u001f${city.state}`))).map(cluster => cluster.id));
  }, [clusters, clusterCities, selectedCities]);
  const visibleOptions = clusters.filter(cluster => cluster.name.toLowerCase().includes(filter.trim().toLowerCase()));

  function commitSelection(next: number[]) {
    setSelected(next);
    const cityKeys = [...new Set(clusterCities.filter(city => next.includes(city.clusterId)).map(city => `${city.city}\u001f${city.state}`))];
    onChange?.(cityKeys.length ? JSON.stringify(cityKeys) : "");
  }

  function toggleOption(id: number) {
    commitSelection(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);
  }

  return (
    <details className="ac-customer-cluster-select">
      <summary className="ac-select ac-customer-search-row-select ac-customer-search-cluster-select">
        {selected.length === 0 ? "<Cluster>" : `${selected.length} selected`}
      </summary>
      <div className="ac-customer-cluster-popup">
        <p>You can click on more than one.</p>
        <div className="ac-customer-cluster-actions">
          <button data-action-status="complete" type="button" onClick={() => commitSelection(clusters.map(cluster => cluster.id))}>All</button>
          <button data-action-status="complete" type="button" onClick={() => commitSelection([])}>Clear</button>
          <span aria-label="Help">?</span>
        </div>
        <label className="ac-customer-cluster-filter">
          <strong>Filter:</strong>
          <input value={filter} onChange={(event) => setFilter(event.target.value)} />
        </label>
        <div className="ac-customer-cluster-list" role="listbox" aria-multiselectable="true">
          {loadState === "loading" && <span role="status">Loading clusters…</span>}
          {loadState === "error" && <span role="status">Cluster list could not be loaded.</span>}
          {loadState === "ready" && visibleOptions.map((option) => (
            <button data-action-status="complete"
              key={option.id}
              type="button"
              role="option"
              aria-selected={selected.includes(option.id)}
              className={selected.includes(option.id) ? "is-selected" : ""}
              onClick={() => toggleOption(option.id)}
            >
              {option.name}
            </button>
          ))}
        </div>
        <div className="ac-customer-cluster-footer">
          <button data-action-status="complete" type="button" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>OK</button>
          <button data-action-status="complete" type="button" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Cancel</button>
        </div>
      </div>
    </details>
  );
}

function FilterRadioGroup({
  legend,
  name,
  options,
  value = "",
  onValueChange,
  className = "",
}: {
  legend: string;
  name: string;
  options: readonly string[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <fieldset className={`ac-customer-search-filter-group ${className}`}>
      <legend>{legend}</legend>
      <div className="ac-customer-search-filter-group-options">
        {options.map((label) => (
          <label key={label} className="ac-customer-search-radio">
            <input type="radio" name={name} checked={value === label} onChange={() => onValueChange?.(label)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CompactFilterRow(props: CustomerSearchViewsPanelProps) {
  const {
    salesmen,
    customerTypes,
    statuses,
    cities,
    states,
    currentSearch,
    currentSalesmanId,
    currentCustomerTypeId,
    currentStatusId,
    currentCity,
    currentState,
  } = props;

  return (
    <div className="ac-customer-search-filter-row">
      <select className="ac-select ac-customer-search-row-select" defaultValue="" aria-label="In Tracking">
        <option value="">&lt;In Tracking?&gt;</option>
        <option value="in-tracking">In Tracking</option>
        <option value="not-in-tracking">Not in Tracking</option>
      </select>
      <select className="ac-select ac-customer-search-row-select" defaultValue="" aria-label="Date Range">
        <option value="">&lt;Date Range&gt;</option>
        <option value="present-week">Present Week</option>
        <option value="last-2-weeks">In Last 2 Weeks</option>
        <option value="last-month">In Last 1 Month</option>
        <option value="last-3-months">In Last 3 Months</option>
        <option value="last-6-months">In Last 6 Months</option>
        <option value="last-12-months">In Last 12 Months</option>
        <option value="custom-range">Custom Range</option>
      </select>
      <ClusterMultiSelect />
      <Suspense fallback={null}>
        <CustomerFilters
          compact
          salesmen={salesmen}
          customerTypes={customerTypes}
          statuses={statuses}
          cities={cities}
          states={states}
          currentSearch={currentSearch}
          currentSalesmanId={currentSalesmanId}
          currentCustomerTypeId={currentCustomerTypeId}
          currentStatusId={currentStatusId}
          currentCity={currentCity}
          currentState={currentState}
        />
      </Suspense>
      <span className="ac-customer-search-filter-label">Filter:</span>
      <select className="ac-select ac-customer-search-filter-input" defaultValue="" aria-label="Filter">
        <option value="" />
        {CUSTOMER_SAVED_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select className="ac-select ac-customer-search-duplicates-select" defaultValue="" aria-label="Find Duplicates">
        <option value="">&lt;Find Duplicates&gt;</option>
        <option value="name">Name</option>
        <option value="name-backwards">Name, Backwards</option>
        <option value="street">Street</option>
        <option value="street-backwards">Street, Backwards</option>
        <option value="phone">Phone</option>
        <option value="phone-backwards">Phone, Backwards</option>
        <option value="contact-first-last">Ctc First + Ctc Last</option>
        <option value="contact-first-last-backwards">Ctc First + Ctc Last, Backwards</option>
        <option value="contact-email">Ctc Email</option>
        <option value="contact-email-backwards">Ctc Email, Backwards</option>
        <option value="contact-cell">Ctc Cell</option>
        <option value="contact-cell-backwards">Ctc Cell, Backwards</option>
        <option value="name-street">Name + Street</option>
        <option value="name-street-backwards">Name + Street, Backwards</option>
        <option value="name-street-city">Name + Street + City</option>
        <option value="name-street-city-backwards">Name + Street + City, Backwards</option>
        <option value="name-street-city-phone">Name + Street + City + Phone</option>
        <option value="name-street-city-phone-backwards">Name + Street + City + Phone, Backwards</option>
        <option value="name-city">Name + City</option>
        <option value="name-state">Name + State</option>
        <option value="street-city">Street + City</option>
        <option value="name-city-last-week-ending">Name + City;w/ Last Week Ending</option>
        <option value="name-state-last-week-ending">Name + State;w/ Last Week Ending</option>
        <option value="street-city-last-week-ending">Street + City;w/ Last Week Ending</option>
      </select>
    </div>
  );
}

const CustomerViewSelectionContext = createContext<{
  selectedView: string;
  setSelectedView: (view: string) => void;
} | null>(null);

function useCustomerViewSelection() {
  const selection = useContext(CustomerViewSelectionContext);
  const saved = useCustomerSavedViews();
  if (!selection) throw new Error("Customer view controls require a view selection provider.");
  return saved ? {selectedView:customerSearchPresetView(0,saved.slot-1),setSelectedView:(view:string)=>{const slot=Number(view.replace("View ",""));if(Number.isInteger(slot) && slot>=1 && slot<=64)saved.select(slot);}} : selection;
}

function CustomerViewSelect() {
  const saved = useCustomerSavedViews();
  const { selectedView, setSelectedView } = useCustomerViewSelection();
  const options = [...new Set([
    ...Array.from({ length: 64 }, (_, index) => customerSearchPresetView(0, index)),
    ...(saved ? [] : CUSTOMER_SAVED_VIEW_OPTIONS),
  ])];
  return <select className="ac-select ac-customer-search-view-select-wide" value={selectedView} onChange={event => setSelectedView(event.target.value)} aria-label="View">
    {options.map(view => {
      const slot = Number(view.replace("View ", ""));
      const savedName = saved?.views.find(item => item.slot === slot)?.name;
      return <option key={view} value={view}>{savedName ? `${savedName} (${view})` : view}</option>;
    })}
  </select>;
}

function PresetGrid({
  grid,
  rows = 4,
  cols = 8,
  viewOffset = 0,
  className = "",
}: {
  grid: readonly (readonly (CustomerSearchPresetCell | "textured" | null)[])[];
  rows?: number;
  cols?: number;
  viewOffset?: number;
  className?: string;
}) {
  const { selectedView, setSelectedView } = useCustomerViewSelection();
  const saved = useCustomerSavedViews();

  return (
    <div className={`ac-customer-search-preset-grid ${className}`.trim()}>
      {Array.from({ length: rows }, (_, rowIndex) =>
        Array.from({ length: cols }, (_, colIndex) => {
          const cell = grid[rowIndex]?.[colIndex];
          if (cell && typeof cell === "object" && "label" in cell) {
            return (
              <AccessButton data-action-status="complete"
                key={`${rowIndex}-${colIndex}-${cell.label}`}
                xs
                aria-pressed={selectedView === customerSearchPresetView(rowIndex, colIndex, cols, viewOffset)}
                onClick={() => setSelectedView(customerSearchPresetView(rowIndex, colIndex, cols, viewOffset))}
                className={`${customerSearchPresetBtnClass(cell.style)} ${
                  selectedView === customerSearchPresetView(rowIndex, colIndex, cols, viewOffset) ? "ac-customer-search-preset-btn--active" : ""
                }`}
              >
                {saved?.views.find(item => customerSearchPresetView(0,item.slot-1)===customerSearchPresetView(rowIndex,colIndex,cols,viewOffset))?.name || cell.label}
              </AccessButton>
            );
          }
          const view = customerSearchPresetView(rowIndex, colIndex, cols, viewOffset);
          const savedName = saved?.views.find(item=>customerSearchPresetView(0,item.slot-1)===view)?.name;
          return <AccessButton
            data-action-status="complete"
            key={`${rowIndex}-${colIndex}-empty`}
            xs
            aria-label={view}
            title={view}
            aria-pressed={selectedView === view}
            onClick={() => setSelectedView(view)}
            className={`ac-customer-search-preset-empty ${cell === "textured" ? "ac-customer-search-preset-textured" : ""} ${selectedView === view ? "ac-customer-search-preset-btn--active" : ""}`}
          >{savedName || ""}</AccessButton>;
        }),
      )}
    </div>
  );
}

function ViewsTab() {
  return (
    <div className="ac-customer-search-views-preset ac-search-views-tab-pane">
      <PresetGrid grid={CUSTOMER_SEARCH_PRESET_GRID} />
      <div className="ac-customer-search-views-footer shrink-0">
        <div className="ac-customer-search-profile-type">
          <span className="ac-flabel">Profile Type:</span>
          {["All", "Customer Search", "Spare 1", "Spare 2", "Spare 3"].map((label, i) => (
            <label key={label} className="ac-customer-search-check">
              <input type="checkbox" disabled defaultChecked={i === 0} />
              <span>{label}</span>
            </label>
          ))}
          <span className="ac-flabel ac-customer-search-list-label">List:</span>
          {["None", "1", "2", "3", "4", "5", "6"].map((label, i) => (
            <label key={label} className="ac-customer-search-radio">
              <input type="radio" name="cust-list" disabled defaultChecked={i === 0} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="ac-customer-search-view-controls">
          <div className="ac-customer-search-view-controls-group">
            <span className="ac-customer-search-compare-label">Compare Profiles | 028</span>
            <AccessButton data-action-status="missing" xs disabled>
              Update All
            </AccessButton>
            <AccessButton data-action-status="missing" xs disabled>
              Update Selected
            </AccessButton>
          </div>
          <div className="ac-customer-search-view-controls-group ac-customer-search-view-controls-group--end">
            <span className="ac-flabel">View:</span>
            <CustomerViewSelect />
            <CustomerSavedViewActions />
          </div>
        </div>
      </div>
    </div>
  );
}

function Views2Tab() {
  return (
    <div className="ac-customer-search-views-preset ac-customer-search-views-2 ac-search-views-tab-pane">
      <PresetGrid grid={CUSTOMER_SEARCH_VIEWS_2_GRID} viewOffset={32} className="ac-customer-search-views-2-grid" />
      <div className="ac-customer-search-views-footer ac-customer-search-views-2-footer shrink-0">
        <div className="ac-customer-search-view-controls">
          <div className="ac-customer-search-view-controls-group">
            <span className="ac-customer-search-compare-label">Compare Profiles | 028</span>
            <AccessButton data-action-status="missing" xs disabled>
              Update All
            </AccessButton>
            <AccessButton data-action-status="missing" xs disabled>
              Update Selected
            </AccessButton>
          </div>
        </div>
      </div>
    </div>
  );
}

type Views3TabProps = Pick<CustomerSearchViewsPanelProps, "customerUserFlagOptions" | "views3Filters" | "onViews3FiltersChange">;

function Views3Tab({ customerUserFlagOptions, views3Filters = {}, onViews3FiltersChange }: Views3TabProps) {
  const update = (key: keyof CustomerSearchViews3Filters, value: string) => onViews3FiltersChange?.({ ...views3Filters, [key]: value });
  const flagIndex = Number(views3Filters.userFlag);
  const flagOptions = flagIndex >= 1 && flagIndex <= 8 ? customerUserFlagOptions[flagIndex - 1] ?? [] : [];
  return (
    <div className="ac-customer-search-views-filters ac-customer-search-views-3 ac-search-views-tab-pane">
      <div className="ac-customer-search-views-filter-row">
        <FilterRadioGroup legend="Progress:" name="views3-progress" options={CUSTOMER_VIEWS_PROGRESS_OPTIONS} value={views3Filters.progress} onValueChange={value => update("progress", value)} />
        <FilterRadioGroup legend="Profile:" name="views3-profile" options={CUSTOMER_VIEWS_PROFILE_OPTIONS} value={views3Filters.profile} onValueChange={value => update("profile", value)} />
      </div>
      <FilterRadioGroup
        legend="Time Frame for:"
        name="views3-time-for"
        options={CUSTOMER_VIEWS_TIME_FRAME_FOR_OPTIONS}
        value={views3Filters.timeFrame}
        onValueChange={value => update("timeFrame", value)}
        className="ac-customer-search-filter-group--wide"
      />
      <FilterRadioGroup
        legend=""
        name="views3-time-duration"
        options={CUSTOMER_VIEWS_TIME_DURATION_OPTIONS}
        value={views3Filters.timeDuration}
        onValueChange={value => update("timeDuration", value)}
        className="ac-customer-search-filter-group--wide ac-customer-search-filter-group--no-legend"
      />
      <div className="ac-customer-search-views-filter-row">
        <FilterRadioGroup legend="Trade:" name="views3-trade" options={CUSTOMER_VIEWS_TRADE_OPTIONS} value={views3Filters.trade} onValueChange={value => update("trade", value)} />
        <FilterRadioGroup legend="State:" name="views3-state" options={CUSTOMER_VIEWS_STATE_OPTIONS} value={views3Filters.state} onValueChange={value => update("state", value)} />
        <fieldset className="ac-customer-search-filter-group ac-customer-search-filter-group--user-setting">
          <legend>User Setting</legend>
          <div className="ac-customer-search-user-setting-fields">
            <label className="ac-customer-search-inline-select-wrap">
              <span className="ac-flabel">Select</span>
              <select className="ac-select" value={views3Filters.userFlag ?? "Select"} onChange={event => {
                const userFlag = event.target.value;
                onViews3FiltersChange?.({ ...views3Filters, userFlag, userValue: userFlag === "Select" ? "" : "All" });
              }}>
                <option value="Select">Select</option>
                {Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{index + 1}</option>)}
              </select>
            </label>
            <label className="ac-customer-search-inline-select-wrap">
              <span className="ac-flabel">Value</span>
              <select className="ac-select" value={views3Filters.userValue ?? ""} onChange={event => update("userValue", event.target.value)} disabled={!flagIndex}>
                <option value="">Value</option>
                {flagIndex >= 1 && flagIndex <= 8 && <option value="All">All</option>}
                <option value="[BLANK]">[BLANK]</option>
                {flagOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        </fieldset>
      </div>
      <FilterRadioGroup
        legend="County:"
        name="views3-county"
        options={CUSTOMER_VIEWS_COUNTY_OPTIONS}
        value={views3Filters.county}
        onValueChange={value => update("county", value)}
        className="ac-customer-search-filter-group--wide"
      />
      <div className="ac-customer-search-views-reset-row">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="ac-customer-search-preset-empty ac-customer-search-spare-btn" aria-hidden />
        ))}
        <AccessButton data-action-status="complete" xs disabled={!onViews3FiltersChange} onClick={() => onViews3FiltersChange?.({})} className="ac-customer-search-reset-all-btn">
          Reset to All
        </AccessButton>
      </div>
    </div>
  );
}

function InternetSearchTab() {
  const [countyClusters, setCountyClusters] = useState<SearchCluster[]>([]);
  const [countyLoadState, setCountyLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [cardCopyStatus, setCardCopyStatus] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/clusters", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("County list unavailable");
        return await response.json() as { clusters: SearchCluster[] };
      })
      .then(data => {
        if (!active) return;
        // Access's Internet Search combo is sourced from clusters whose names start with "Z County".
        setCountyClusters(data.clusters.filter(cluster => /^Z County/i.test(cluster.name)));
        setCountyLoadState("ready");
      })
      .catch(() => { if (active) setCountyLoadState("error"); });
    return () => { active = false; };
  }, []);

  return (
    <div className="ac-customer-search-internet-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-internet-top">
        <select className="ac-select ac-customer-search-internet-county" defaultValue="" aria-label="County" disabled={countyLoadState !== "ready"}>
          <option value="">&lt;County&gt;</option>
          {countyClusters.map(cluster => (
            <option key={cluster.id} value={cluster.id}>{cluster.name}</option>
          ))}
        </select>
        {countyLoadState === "error" && <span className="sr-only" role="status">County list could not be loaded.</span>}
      </div>
      <div className="ac-customer-search-internet-actions">
        <AccessButton data-action-status="linked" xs onClick={() => window.open("https://www.londonderrynh.gov", "_blank", "noopener,noreferrer")}>
          USA
        </AccessButton>
        <AccessButton data-action-status="complete" xs className="ac-customer-search-card-btn" onClick={async () => {
          try {
            await navigator.clipboard.writeText("1007563");
            setCardCopyStatus("Card number copied.");
          } catch {
            setCardCopyStatus("Could not copy the card number.");
          }
        }}>
          Card #
        </AccessButton>
        {cardCopyStatus && <span className="sr-only" role="status">{cardCopyStatus}</span>}
      </div>
    </div>
  );
}

type UserSettingsTabProps = Pick<
  CustomerSearchViewsPanelProps,
  "customerUserFlagOptions" | "lastActionUsers" | "views3Filters" | "onViews3FiltersChange" | "userSettingsSelectedCount" | "onApplyUserFlag" | "onGoToColumn" | "visibleCustomerColumns" | "onExportView"
>;

function UserSettingsTab({ customerUserFlagOptions, lastActionUsers, userSettingsSelectedCount = 0, onApplyUserFlag }: UserSettingsTabProps) {
  const [selectedFlags, setSelectedFlags] = useState<string[]>(Array(8).fill(""));
  const [lastActionUser, setLastActionUser] = useState("all");
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [pendingFlag, setPendingFlag] = useState<{ slot: number; value: string } | null>(null);
  const [passwordEntry, setPasswordEntry] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function requestFlag(slot: number, value: string) {
    if (!onApplyUserFlag || busySlot !== null) return;
    setPendingFlag({ slot, value });
    setPasswordEntry("");
    setPasswordError("");
  }

  async function confirmFlagPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingFlag || !onApplyUserFlag || busySlot !== null) return;
    if (passwordEntry !== "3360") {
      setPasswordError("Incorrect password.");
      setPasswordEntry("");
      return;
    }
    const { slot, value } = pendingFlag;
    const password = passwordEntry;
    const customerCount = userSettingsSelectedCount;
    setPendingFlag(null);
    setBusySlot(slot);
    setStatus("");
    try {
      await onApplyUserFlag(slot, value, password);
      setStatus(value === ""
        ? `Cleared User Flag ${slot} for ${customerCount.toLocaleString()} selected customer${customerCount === 1 ? "" : "s"}.`
        : `Set User Flag ${slot} for ${customerCount.toLocaleString()} selected customer${customerCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update the selected customers.");
    } finally {
      setBusySlot(null);
    }
  }

  return (
    <div className="ac-customer-search-user-settings-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-user-settings-title">User Settings</div>
      <div className="ac-customer-search-user-settings-body">
        <div className="ac-customer-search-user-settings-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="ac-customer-search-user-setting-slot">
              <span className="ac-customer-search-user-setting-num">{i + 1}:</span>
              <select
                className="ac-select ac-customer-search-user-setting-select"
                value={selectedFlags[i] ?? ""}
                onChange={(event) => setSelectedFlags((current) => {
                  const next = [...current];
                  next[i] = event.target.value;
                  return next;
                })}
                aria-label={`Setting ${i + 1}`}
              >
                <option value=""></option>
                {(customerUserFlagOptions[i] ?? []).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="ac-customer-search-user-setting-btns">
                <AccessButton data-action-status="complete" xs disabled={!selectedFlags[i] || busySlot !== null} onClick={() => requestFlag(i + 1, selectedFlags[i])}>
                  Set
                </AccessButton>
                <AccessButton data-action-status="complete" xs disabled={busySlot !== null} onClick={() => requestFlag(i + 1, "")}>
                  Clear
                </AccessButton>
              </div>
            </div>
          ))}
        </div>
        <div className="ac-customer-search-last-action-user">
          <span className="ac-flabel">Last Action User | 030</span>
          <select
            className="ac-select"
            value={lastActionUser}
            onChange={(event) => setLastActionUser(event.target.value)}
            aria-label="Last Action User"
          >
            <option value="all">&lt;ALL&gt;</option>
            {lastActionUsers.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="ac-customer-search-user-settings-status" role="status" aria-live="polite">
          {status || (userSettingsSelectedCount ? `${userSettingsSelectedCount.toLocaleString()} customer${userSettingsSelectedCount === 1 ? "" : "s"} selected.` : "Select one or more customer rows in the table, then choose a value and click Set or Clear.")}
        </div>
      </div>
      {pendingFlag && typeof document !== "undefined" && createPortal(<div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingFlag(null); }}
        style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.35)" }}>
        <form role="dialog" aria-modal="true" aria-labelledby="customer-user-flag-password-title" onSubmit={confirmFlagPassword}
          style={{ width: "min(360px, 100%)", padding: 18, border: "1px solid #777", background: "#eee", boxShadow: "0 8px 28px rgba(0,0,0,.35)", color: "#111" }}>
          <strong id="customer-user-flag-password-title" style={{ display: "block", marginBottom: 12 }}>Password required</strong>
          <label htmlFor="customer-user-flag-password" style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
            Enter password to {pendingFlag.value === "" ? "clear" : "set"} User Flag {pendingFlag.slot} for {userSettingsSelectedCount} selected customer{userSettingsSelectedCount === 1 ? "" : "s"}.
          </label>
          <input id="customer-user-flag-password" type="password" inputMode="numeric" autoComplete="current-password" autoFocus required
            value={passwordEntry} onChange={event => { setPasswordEntry(event.target.value); setPasswordError(""); }}
            style={{ boxSizing: "border-box", width: "100%", height: 32, padding: "4px 7px", border: "1px solid #888", background: "#fff", color: "#111" }} />
          {passwordError && <div role="alert" style={{ marginTop: 7, color: "#b00020", fontSize: 12 }}>{passwordError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <AccessButton data-action-status="complete" xs type="button" onClick={() => setPendingFlag(null)}>Cancel</AccessButton>
            <AccessButton data-action-status="complete" xs type="submit">Continue</AccessButton>
          </div>
        </form>
      </div>, document.body)}
    </div>
  );
}

type UtilityLookup = { id: number; description: string };

function UtilitiesTab({ onGoToColumn, visibleCustomerColumns = [], onExportView, onRefresh, onZero, onCancel, selectedCustomerNames = [], selectedCustomerIds = [], onApplyMultiFilter, onClearMultiFilter, multiFilterActive = false, onCreateCustomerAction, onClearFutureCall }: Pick<CustomerSearchViewsPanelProps, "onGoToColumn" | "visibleCustomerColumns" | "onExportView" | "onRefresh" | "onZero" | "onCancel" | "selectedCustomerNames" | "selectedCustomerIds" | "onApplyMultiFilter" | "onClearMultiFilter" | "multiFilterActive" | "onCreateCustomerAction" | "onClearFutureCall">) {
  const [goToOpen, setGoToOpen] = useState(false);
  const [goToColumn, setGoToColumn] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [multiFilterOpen, setMultiFilterOpen] = useState(false);
  const [actionOptions, setActionOptions] = useState<UtilityLookup[]>([]);
  const [statusOptions, setStatusOptions] = useState<UtilityLookup[]>([]);
  const [selectedAction, setSelectedAction] = useState("");
  const [actionConfirmOpen, setActionConfirmOpen] = useState(false);
  const [clearFutureOpen, setClearFutureOpen] = useState(false);
  const [clearStatusId, setClearStatusId] = useState("");
  const [utilityBusy, setUtilityBusy] = useState(false);
  const [utilityMessage, setUtilityMessage] = useState("");
  useEffect(() => {
    let active = true;
    void fetch("/api/customers/utilities", { cache: "no-store" }).then(async response => {
      const result = await response.json() as { ok?: boolean; actions?: UtilityLookup[]; statuses?: UtilityLookup[] };
      if (active && response.ok && result.ok) { setActionOptions(result.actions ?? []); setStatusOptions(result.statuses ?? []); }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  async function createAction(actionType = selectedAction) {
    if (!actionType || !onCreateCustomerAction || utilityBusy) return;
    if (!selectedCustomerIds.length) { setUtilityMessage("Select one or more customer rows first."); return; }
    setUtilityBusy(true); setUtilityMessage("");
    try { await onCreateCustomerAction(Number(actionType)); setSelectedAction(""); setActionConfirmOpen(false); setUtilityMessage("Action was added to the selected customers."); }
    catch (error) { setUtilityMessage(error instanceof Error ? error.message : "The action could not be saved."); }
    finally { setUtilityBusy(false); }
  }
  async function clearFutureCall(choice: "set" | "clear" | "ignore") {
    if (!onClearFutureCall || utilityBusy) return;
    if (!selectedCustomerIds.length) { setUtilityMessage("Select one or more customer rows first."); setClearFutureOpen(false); return; }
    if (choice === "set" && !clearStatusId) { setUtilityMessage("Choose a Sales History Status first."); return; }
    setUtilityBusy(true); setUtilityMessage("");
    try { await onClearFutureCall(choice, choice === "set" ? Number(clearStatusId) : undefined); setClearFutureOpen(false); setClearStatusId(""); setUtilityMessage("Future Call was cleared for the selected customers."); }
    catch (error) { setUtilityMessage(error instanceof Error ? error.message : "Future Call could not be cleared."); }
    finally { setUtilityBusy(false); }
  }
  async function exportView() {
    if (!onExportView || exporting) return;
    setExporting(true);
    setExportMessage("");
    try {
      await onExportView();
      setExportMessage("Excel export is ready.");
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "Could not export this view.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="ac-customer-search-utilities-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-utilities-section ac-customer-search-utilities-section--mail">
        <AccessButton data-action-status="missing" xs disabled>
          Letter
        </AccessButton>
        <AccessButton data-action-status="missing" xs disabled>
          Postcard
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section">
        <div className="ac-customer-search-utilities-field ac-customer-search-goto-field">
          <span className="ac-flabel">Go To:</span>
          <div className="ac-customer-search-goto-control">
            <button type="button" className="ac-select ac-customer-search-goto-trigger" aria-label="Go To" aria-expanded={goToOpen} onClick={() => setGoToOpen(open => !open)}>
              <span>{goToColumn ? CUSTOMER_NAME_SEARCH_COLUMNS.find(column => column.key === goToColumn)?.label : ""}</span><span aria-hidden="true">▾</span>
            </button>
            {goToOpen && <div className="ac-customer-search-goto-menu" role="listbox" aria-label="Customer columns">
              <div className="ac-customer-search-goto-head"><span>Column Name</span><span>Visible</span></div>
              <div className="ac-customer-search-goto-options">
                {CUSTOMER_NAME_SEARCH_COLUMNS.filter(column => column.key !== "select").map(column => {
                  const visible = visibleCustomerColumns.includes(column.key);
                  return <button type="button" role="option" aria-selected={goToColumn === column.key} key={column.key} onClick={() => {
                    setGoToColumn(column.key);
                    setGoToOpen(false);
                    onGoToColumn?.(column.key);
                  }}><span>{column.label}</span><span>{visible ? "Yes" : "No"}</span></button>;
                })}
              </div>
            </div>}
          </div>
        </div>
        <AccessButton data-action-status={onExportView ? "complete" : "missing"} xs disabled={!onExportView || exporting} onClick={() => void exportView()}>
          Export View
        </AccessButton>
        {(exporting || exportMessage) && <span role="status" aria-live="polite" style={{ fontSize: 11 }}>{exporting ? "Creating Excel file…" : exportMessage}</span>}
      </div>
      <div className="ac-customer-search-utilities-section">
        <label className="ac-customer-search-utilities-field">
          <span className="ac-flabel">Action | 005:</span>
          <select className="ac-select" value={selectedAction} aria-label="Action 005" disabled={!onCreateCustomerAction || utilityBusy} onChange={event => { setSelectedAction(event.target.value); setUtilityMessage(""); if (event.target.value) { if (!selectedCustomerIds.length) setUtilityMessage("Select one or more customer rows first."); else setActionConfirmOpen(true); } }}>
            <option value="">Select…</option>
            {actionOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.description}</option>
            ))}
          </select>
        </label>
        <AccessButton data-action-status={onClearFutureCall ? "complete" : "missing"} xs disabled={!onClearFutureCall || utilityBusy} onClick={() => { setUtilityMessage(""); setClearFutureOpen(true); }}>
          Clear Future Call
        </AccessButton>
        {utilityBusy && <span role="status">Saving…</span>}{utilityMessage && <span role="status" aria-live="polite">{utilityMessage}</span>}
      </div>
      <div className="ac-customer-search-utilities-section ac-customer-search-utilities-section--stack">
        <div className="ac-customer-search-utilities-btn-row">
          <AccessButton data-action-status={onRefresh ? "complete" : "missing"} xs disabled={!onRefresh} onClick={onRefresh} title="Reload the customer records using the current search criteria">
            Refresh
          </AccessButton>
          <AccessButton data-action-status={onZero ? "complete" : "missing"} xs disabled={!onZero} onClick={onZero} title="Reset customer filters and selections">
            Zero
          </AccessButton>
        </div>
        <AccessButton data-action-status={onCancel ? "complete" : "missing"} xs disabled={!onCancel} onClick={onCancel} title="Close this customer search page">
          Cancel
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section">
        <AccessButton data-action-status={onApplyMultiFilter ? "complete" : "missing"} xs disabled={!onApplyMultiFilter} className="ac-customer-search-multifilter-btn" onClick={() => setMultiFilterOpen(true)}>
          Multi Filter
          <br />
          Names and
          <br />
          Selections
        </AccessButton>
      </div>
      {multiFilterOpen && typeof document !== "undefined" && createPortal(
        <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setMultiFilterOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.35)" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="customer-multifilter-title" style={{ width: "min(520px, 100%)", maxHeight: "min(75vh, 620px)", display: "flex", flexDirection: "column", padding: 20, border: "1px solid #777", background: "#eee", color: "#111", boxShadow: "0 8px 28px rgba(0,0,0,.35)", font: "14px Arial, sans-serif" }}>
            <strong id="customer-multifilter-title" style={{ fontSize: 18, marginBottom: 8 }}>Multi Filter Names and Selections</strong>
            <p style={{ margin: "0 0 12px", lineHeight: 1.45 }}>Use the selected customer rows as a multi filter, or clear the active multi filter. Select rows in the table before applying.</p>
            <div style={{ overflow: "auto", flex: 1, minHeight: 70, maxHeight: 300, border: "1px solid #bbb", background: "white" }}>
              {selectedCustomerNames.length ? selectedCustomerNames.map((name, index) => <div key={`${index}-${name}`} style={{ padding: "5px 8px", borderBottom: "1px solid #ddd" }}>{name}</div>) : <div style={{ padding: 10, color: "#555" }}>No customer rows selected.</div>}
            </div>
            {multiFilterActive && <div role="status" style={{ marginTop: 9 }}>A multi filter is active.</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              {multiFilterActive && <AccessButton data-action-status="complete" xs onClick={() => { onClearMultiFilter?.(); setMultiFilterOpen(false); }}>Clear Filter</AccessButton>}
              <AccessButton data-action-status="complete" xs onClick={() => setMultiFilterOpen(false)}>Cancel</AccessButton>
              <AccessButton data-action-status={selectedCustomerNames.length ? "complete" : "missing"} xs disabled={!selectedCustomerNames.length} onClick={() => { onApplyMultiFilter?.(); setMultiFilterOpen(false); }}>Apply Selected Rows</AccessButton>
            </div>
          </section>
        </div>, document.body,
      )}
      {clearFutureOpen && typeof document !== "undefined" && createPortal(
        <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setClearFutureOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.35)" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="clear-future-title" style={{ width: "min(520px, 100%)", padding: 20, border: "1px solid #777", background: "#eee", color: "#111", boxShadow: "0 8px 28px rgba(0,0,0,.35)", font: "14px Arial, sans-serif" }}>
            <strong id="clear-future-title" style={{ fontSize: 18 }}>Clear Future Call</strong>
            <p>This will clear Future Call for {selectedCustomerIds.length} selected customer(s). Choose how to handle Sales History Status.</p>
            <label style={{ display: "block", margin: "12px 0" }}>Sales History Status <select className="ac-select" value={clearStatusId} onChange={event => setClearStatusId(event.target.value)}><option value="">Select status…</option>{statusOptions.map(option => <option key={option.id} value={option.id}>{option.description}</option>)}</select></label>
            {utilityMessage && <p role="alert">{utilityMessage}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <AccessButton data-action-status="complete" xs disabled={utilityBusy} onClick={() => setClearFutureOpen(false)}>Cancel</AccessButton>
              <AccessButton data-action-status="complete" xs disabled={utilityBusy || !selectedCustomerIds.length} onClick={() => void clearFutureCall("ignore")}>Clear, keep status</AccessButton>
              <AccessButton data-action-status="complete" xs disabled={utilityBusy || !selectedCustomerIds.length} onClick={() => void clearFutureCall("clear")}>Clear status too</AccessButton>
              <AccessButton data-action-status="complete" xs disabled={utilityBusy || !selectedCustomerIds.length || !clearStatusId} onClick={() => void clearFutureCall("set")}>Clear and set status</AccessButton>
            </div>
          </section>
        </div>, document.body,
      )}
      {actionConfirmOpen && typeof document !== "undefined" && createPortal(
        <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) { setActionConfirmOpen(false); setSelectedAction(""); } }} style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.35)" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="customer-action-title" style={{ width: "min(460px, 100%)", padding: 20, border: "1px solid #777", background: "#eee", color: "#111", boxShadow: "0 8px 28px rgba(0,0,0,.35)", font: "14px Arial, sans-serif" }}>
            <strong id="customer-action-title" style={{ fontSize: 18 }}>Create customer action?</strong>
            <p>This will create “{actionOptions.find(option => String(option.id) === selectedAction)?.description}” for {selectedCustomerIds.length} selected customer(s).</p>
            {utilityMessage && <p role="alert">{utilityMessage}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <AccessButton data-action-status="complete" xs disabled={utilityBusy} onClick={() => { setActionConfirmOpen(false); setSelectedAction(""); }}>Cancel</AccessButton>
              <AccessButton data-action-status="complete" xs disabled={utilityBusy} onClick={() => void createAction()}>{utilityBusy ? "Saving…" : "Create Action"}</AccessButton>
            </div>
          </section>
        </div>, document.body,
      )}
    </div>
  );
}

function AdminUtilitiesTab({ adminSelectedCount = 0, adminIncludeProfiles, onAdminIncludeProfilesChange, onAdminTransfer }: Pick<CustomerSearchViewsPanelProps, "adminSelectedCount" | "adminIncludeProfiles" | "onAdminIncludeProfilesChange" | "onAdminTransfer">) {
  const [transferMessage, setTransferMessage] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<string | null>(null);
  async function transfer(profile: string) {
    if (!onAdminTransfer || transferring) return;
    setPendingTransfer(profile);
    setTransferMessage("");
  }
  async function confirmTransfer() {
    if (!onAdminTransfer || !pendingTransfer || transferring) return;
    const profile = pendingTransfer;
    setPendingTransfer(null);
    setTransferring(true);
    setTransferMessage("");
    try {
      await onAdminTransfer(profile);
      setTransferMessage(`Transfer to ${profile} completed.`);
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : "The transfer failed.");
    } finally {
      setTransferring(false);
    }
  }
  return (
    <div className="ac-customer-search-admin-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-admin-section">
        <div className="ac-customer-search-admin-heading">Transfer to:</div>
        <div className="ac-customer-search-admin-transfer-grid">
          {CUSTOMER_ADMIN_TRANSFER_BUTTONS.flatMap((row, rowIndex) =>
            row.map((cell, colIndex) =>
              cell ? (
                <AccessButton data-action-status={onAdminTransfer ? "complete" : "missing"}
                  key={`${rowIndex}-${colIndex}-${cell.label}`}
                  xs
                  disabled={!onAdminTransfer || adminSelectedCount === 0 || transferring}
                  onClick={() => void transfer(cell.label)}
                  className="ac-customer-search-transfer-btn"
                  style={{ "--customer-admin-transfer-color": cell.color } as React.CSSProperties}
                  title={adminSelectedCount ? `Transfer ${adminSelectedCount} selected customer${adminSelectedCount === 1 ? "" : "s"} to ${cell.label}` : "Select customer rows first"}
                >
                  {cell.label}
                </AccessButton>
              ) : (
                <div key={`${rowIndex}-${colIndex}-empty`} className="ac-customer-search-preset-empty" aria-hidden />
              ),
            ),
          )}
        </div>
        {onAdminTransfer && (transferring || transferMessage) && <div className="ac-customer-search-admin-status" role="status" aria-live="polite">
          {transferring ? "Transferring selected customers…" : transferMessage}
        </div>}
      </div>
      <div className="ac-customer-search-admin-section">
        <div className="ac-customer-search-admin-heading">Include profiles:</div>
        <div className="ac-customer-search-admin-check-grid">
          {CUSTOMER_ADMIN_INCLUDE_PROFILES.map((row, rowIndex) =>
            row.map((label, colIndex) =>
              label ? (
                <label key={`${rowIndex}-${colIndex}-${label}`} className="ac-customer-search-check">
                  <input type="checkbox" checked={adminIncludeProfiles?.includes(label) ?? true} disabled={!onAdminIncludeProfilesChange}
                    onChange={event => {
                      const current = adminIncludeProfiles ?? CUSTOMER_ADMIN_INCLUDE_PROFILES.flat().filter(Boolean) as string[];
                      onAdminIncludeProfilesChange?.(event.target.checked
                        ? [...new Set([...current, label])]
                        : current.filter(item => item !== label));
                    }} />
                  <span>{label}</span>
                </label>
              ) : (
                <span key={`${rowIndex}-${colIndex}-empty`} aria-hidden />
              ),
            ),
          )}
        </div>
      </div>
      <div className="ac-customer-search-admin-section ac-customer-search-admin-section--spare" aria-hidden />
      {pendingTransfer && typeof document !== "undefined" && createPortal(
        <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingTransfer(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.35)" }}>
          <div role="dialog" aria-modal="true" aria-labelledby="customer-profile-transfer-title"
            style={{ width: "min(460px, 100%)", padding: 24, border: "1px solid #777", background: "#eee", color: "#111", boxShadow: "0 8px 28px rgba(0,0,0,.35)", font: "15px Arial, sans-serif" }}>
            <strong id="customer-profile-transfer-title" style={{ display: "block", marginBottom: 16, fontSize: 18 }}>Confirm customer transfer</strong>
            <p style={{ margin: "0 0 22px", lineHeight: 1.5 }}>Move {adminSelectedCount.toLocaleString()} selected customer{adminSelectedCount === 1 ? "" : "s"} to {pendingTransfer}?</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="ac-btn" style={{ minWidth: 90, minHeight: 34, fontSize: 14 }} onClick={() => setPendingTransfer(null)}>Cancel</button>
              <button type="button" className="ac-btn" style={{ minWidth: 120, minHeight: 34, fontSize: 14 }} onClick={() => void confirmTransfer()}>Transfer</button>
            </div>
          </div>
        </div>, document.body,
      )}
    </div>
  );
}

function RayTab({ selectedCustomerIds = [], onRayAction }: Pick<CustomerSearchViewsPanelProps, "selectedCustomerIds" | "onRayAction">) {
  const [customerTypes, setCustomerTypes] = useState<{ id: number; label: string }[]>([]);
  const [contactTitles, setContactTitles] = useState<{ id: number; label: string }[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<null | { action: "change-customer-type" | "fix-zips" | "change-contact-title" | "delete-contacts" | "set-flag4-do-not-email"; customerTypeId?: number; titleId?: number }>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/customers/ray-utilities", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not load customer types.");
      if (active) { setCustomerTypes(result.types ?? []); setContactTitles(result.titles ?? []); }
    }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : "Could not load customer types."); });
    return () => { active = false; };
  }, []);
  const runRayAction = (action: "change-customer-type" | "fix-zips" | "change-contact-title" | "delete-contacts" | "set-flag4-do-not-email", payload?: { customerTypeId?: number; titleId?: number }) => {
    if (!onRayAction || busyAction) return;
    if (["change-customer-type", "change-contact-title", "delete-contacts"].includes(action) && !selectedCustomerIds.length) { setMessage("Select one or more customer rows first."); return; }
    if (action === "change-customer-type" && !payload?.customerTypeId) { setMessage("Choose a customer type first."); return; }
    if (action === "change-contact-title" && !payload?.titleId) { setMessage("Choose a contact title first."); return; }
    setPendingAction({ action, customerTypeId: payload?.customerTypeId, titleId: payload?.titleId });
    setMessage("");
  };
  const confirmRayAction = async () => {
    if (!pendingAction || !onRayAction || busyAction) return;
    const { action, customerTypeId, titleId } = pendingAction;
    setPendingAction(null); setBusyAction(action); setMessage("");
    try {
      const affected = await onRayAction(action, { customerTypeId, titleId });
      const label = action === "fix-zips" ? "ZIP cleanup" : action === "change-customer-type" ? "Customer type update" : action === "change-contact-title" ? "Contact title update" : action === "delete-contacts" ? "Contact deletion" : "Do Not Email flag update";
      setMessage(`${label} finished${typeof affected === "number" ? ` (${affected} record${affected === 1 ? "" : "s"}).` : "."}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The action could not be completed."); }
    finally { setBusyAction(""); }
  };
  return (
    <div className="ac-customer-search-ray-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-ray-section">
        <div className="ac-customer-search-ray-label">Select contacts with titles to change</div>
        <label className="ac-customer-search-ray-field">
          <span className="ac-flabel">Change To:</span>
          <select className="ac-select" value={selectedTitle} onChange={event => setSelectedTitle(event.target.value)} aria-label="Change contact title to">
            <option value="">Select…</option>
            {contactTitles.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <AccessButton data-action-status={onRayAction ? "complete" : "missing"} className="ac-customer-search-ray-implemented-btn" xs disabled={!onRayAction || Boolean(busyAction)} onClick={() => void runRayAction("change-contact-title", { titleId: Number(selectedTitle) })}>
          Change Titles | 003
        </AccessButton>
        <AccessButton data-action-status="missing" xs disabled className="ac-customer-search-ray-bottom-btn">
          Salesman Records - Cust | 004
        </AccessButton>
      </div>
      <div className="ac-customer-search-ray-section">
        <AccessButton data-action-status={onRayAction ? "complete" : "missing"} className={`ac-customer-search-ray-large-btn ${onRayAction ? "ac-customer-search-ray-implemented-btn" : ""}`} xs disabled={!onRayAction || Boolean(busyAction)} onClick={() => void runRayAction("set-flag4-do-not-email")}>
          Set User Flag 4 to &apos;Do Not Email&apos; for Street + City Duplicates w/ Last Week Ending + Specific Salesman in the Group 002
        </AccessButton>
      </div>
      <div className="ac-customer-search-ray-section ac-customer-search-ray-section--stack">
        <AccessButton data-action-status="missing" xs disabled>
          Select Lesser ISR for Transfer to Deleted 001
        </AccessButton>
        <div className="ac-customer-search-ray-btn-row">
          <AccessButton data-action-status="complete" className="ac-customer-search-ray-implemented-btn" xs onClick={() => setMessage(`Selected rows: ${selectedCustomerIds.length.toLocaleString()}.`)}>
            Counts
          </AccessButton>
          <AccessButton data-action-status={onRayAction ? "complete" : "missing"} className="ac-customer-search-ray-implemented-btn" xs disabled={!onRayAction || Boolean(busyAction)} onClick={() => void runRayAction("fix-zips")}>
            Fix Zip | 012
          </AccessButton>
        </div>
      </div>
      <div className="ac-customer-search-ray-section">
        <div className="ac-customer-search-ray-label">Select customers with Cust Type to change</div>
        <label className="ac-customer-search-ray-field">
          <span className="ac-flabel">Change To:</span>
          <select className="ac-select" value={selectedType} onChange={event => setSelectedType(event.target.value)} aria-label="Change customer type to">
            <option value="">Select…</option>
            {customerTypes.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <AccessButton data-action-status={onRayAction ? "complete" : "missing"} className="ac-customer-search-ray-implemented-btn" xs disabled={!onRayAction || Boolean(busyAction)} onClick={() => void runRayAction("change-customer-type", { customerTypeId: Number(selectedType) })}>
          Change Cust Type | 013
        </AccessButton>
        <div className="ac-customer-search-ray-delete-row">
          <span className="ac-customer-search-ray-label">Select customers</span>
          <AccessButton data-action-status="missing" xs disabled className="ac-customer-search-ray-delete-btn">
            Delete Customer
          </AccessButton>
        </div>
      </div>
      <div className="ac-customer-search-ray-section ac-customer-search-ray-section--stack">
        <AccessButton data-action-status="missing" xs disabled>
          Populate Primary Contacts | 034
        </AccessButton>
        <div className="ac-customer-search-ray-delete-row">
          <span className="ac-customer-search-ray-label">Select customers</span>
          <AccessButton data-action-status={onRayAction ? "complete" : "missing"} className={`ac-customer-search-ray-delete-btn ${onRayAction ? "ac-customer-search-ray-implemented-btn" : ""}`} xs disabled={!onRayAction || Boolean(busyAction)} onClick={() => void runRayAction("delete-contacts")}>
            Delete Contacts | 035
          </AccessButton>
        </div>
      </div>
      {message && <div className="ac-customer-search-ray-message" role="status" aria-live="polite">{message}</div>}
      {pendingAction && typeof document !== "undefined" && createPortal(
        <div className="ac-customer-ray-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setPendingAction(null); }}>
          <section className="ac-customer-ray-dialog" role="dialog" aria-modal="true" aria-labelledby="ray-action-dialog-title">
            <h2 id="ray-action-dialog-title">{pendingAction.action === "fix-zips" ? "Fix ZIP Codes" : pendingAction.action === "change-customer-type" ? "Change Customer Type" : pendingAction.action === "change-contact-title" ? "Change Contact Titles" : pendingAction.action === "delete-contacts" ? "Delete Primary Contacts" : "Set Do Not Email Flag"}</h2>
            <p>{pendingAction.action === "fix-zips"
              ? "Pad ZIP and Mail ZIP values shorter than five characters with leading zeros for all customer records."
              : pendingAction.action === "change-customer-type"
                ? `Change the customer type for ${selectedCustomerIds.length} selected customer(s). The Union type also turns on No Communication, as in Access.`
                : pendingAction.action === "change-contact-title"
                  ? `Change the title for the primary contact on ${selectedCustomerIds.length} selected customer(s), matching the contact rows shown in this grid.`
                  : pendingAction.action === "delete-contacts"
                    ? `Permanently delete the primary contact on ${selectedCustomerIds.length} selected customer(s) and renumber remaining contacts, as Access does. This cannot be undone.`
                    : "Set User Flag 4 to ‘Do not Email’ for duplicate street and city groups that have a last week ending date and include one of the Access specified salesmen."}</p>
            <div className="ac-customer-ray-dialog-actions">
              <AccessButton type="button" xs disabled={Boolean(busyAction)} onClick={() => setPendingAction(null)}>Cancel</AccessButton>
              <AccessButton type="button" xs disabled={Boolean(busyAction)} onClick={() => void confirmRayAction()}>{busyAction ? "Working…" : "Continue"}</AccessButton>
            </div>
          </section>
        </div>, document.body,
      )}
    </div>
  );
}

const TAB_CONTENT: readonly (ComponentType<UserSettingsTabProps> | null)[] = [
  ViewsTab,
  Views2Tab,
  Views3Tab,
  InternetSearchTab,
  UserSettingsTab,
  UtilitiesTab,
  null,
  null,
] as const;

export function CustomerSearchViewsPanel(props: CustomerSearchViewsPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedView, setSelectedView] = useState("View 01");
  const [customerUserFlagOptions, setCustomerUserFlagOptions] = useState(props.customerUserFlagOptions);
  const [userFlagsLoaded, setUserFlagsLoaded] = useState(props.customerUserFlagOptions.some((options) => options.length > 0));
  const showCompactFilter = activeTab === 0;
  const TabContent = TAB_CONTENT[activeTab];

  useEffect(() => {
    if ((activeTab !== 2 && activeTab !== 4) || userFlagsLoaded) return;
    let active = true;
    fetch("/api/customers/user-flags", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error("Customer user settings could not be loaded.");
        if (active) setCustomerUserFlagOptions(result.options as FilterOption[][]);
      })
      .catch(() => {
        if (active) setCustomerUserFlagOptions(Array.from({ length: 8 }, () => []));
      })
      .finally(() => { if (active) setUserFlagsLoaded(true); });
    return () => { active = false; };
  }, [activeTab, userFlagsLoaded]);

  return (
    <CustomerViewSelectionContext.Provider value={{ selectedView, setSelectedView }}>
    <div className="ac-customer-search-controls min-w-0 flex-1">
      <div className="ac-tabs ac-customer-search-view-tabs shrink-0 overflow-x-auto">
        {CUSTOMER_SEARCH_VIEW_TABS.map((label, i) => (
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

      <div className="ac-customer-search-control-panel min-h-0 flex-1">
        <div className="ac-customer-search-views-tab">
          {showCompactFilter ? props.filterRow ?? <CompactFilterRow {...props} /> : null}

          <div className="ac-customer-search-views-body ac-customer-search-views-body--full">
            <div className="ac-customer-search-views-left">
              {activeTab === 5 ? <UtilitiesTab
                onGoToColumn={props.onGoToColumn}
                visibleCustomerColumns={props.visibleCustomerColumns}
                onExportView={props.onExportView}
                onRefresh={props.onRefresh}
                onZero={props.onZero}
                onCancel={props.onCancel}
                selectedCustomerNames={props.selectedCustomerNames}
                onApplyMultiFilter={props.onApplyMultiFilter}
                onClearMultiFilter={props.onClearMultiFilter}
                multiFilterActive={props.multiFilterActive}
                selectedCustomerIds={props.selectedCustomerIds}
                onCreateCustomerAction={props.onCreateCustomerAction}
                onClearFutureCall={props.onClearFutureCall}
              /> : activeTab === 6 ? <AdminUtilitiesTab
                adminSelectedCount={props.adminSelectedCount}
                adminIncludeProfiles={props.adminIncludeProfiles}
                onAdminIncludeProfilesChange={props.onAdminIncludeProfilesChange}
                onAdminTransfer={props.onAdminTransfer}
              /> : activeTab === 7 ? <RayTab selectedCustomerIds={props.selectedCustomerIds} onRayAction={props.onRayAction} /> : TabContent && <TabContent
                customerUserFlagOptions={customerUserFlagOptions}
                lastActionUsers={props.lastActionUsers}
                views3Filters={props.views3Filters}
                onViews3FiltersChange={props.onViews3FiltersChange}
                userSettingsSelectedCount={props.userSettingsSelectedCount}
                onApplyUserFlag={props.onApplyUserFlag}
                onGoToColumn={props.onGoToColumn}
                visibleCustomerColumns={props.visibleCustomerColumns}
                onExportView={props.onExportView}
              />}
            </div>
          </div>
        </div>
      </div>
    </div>
    </CustomerViewSelectionContext.Provider>
  );
}
