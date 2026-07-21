"use client";

import { Suspense, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import {
  CUSTOMER_SEARCH_PRESET_GRID,
  CUSTOMER_SEARCH_VIEW_TABS,
  customerSearchPresetBtnClass,
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

interface CustomerSearchViewsPanelProps {
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
  currentSearch: string;
  currentSalesmanId: string;
  currentCustomerTypeId: string;
  currentStatusId: string;
  currentCity: string;
  currentState: string;
}

function FilterRadioGroup({
  legend,
  name,
  options,
  defaultIndex = 0,
  className = "",
}: {
  legend: string;
  name: string;
  options: readonly string[];
  defaultIndex?: number;
  className?: string;
}) {
  return (
    <fieldset className={`ac-customer-search-filter-group ${className}`}>
      <legend>{legend}</legend>
      <div className="ac-customer-search-filter-group-options">
        {options.map((label, i) => (
          <label key={label} className="ac-customer-search-radio">
            <input type="radio" name={name} disabled defaultChecked={i === defaultIndex} />
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
      <select
        disabled
        className="ac-select ac-customer-search-row-select ac-customer-search-cluster-select"
        defaultValue=""
        aria-label="Cluster"
      >
        <option value="">&lt;Cluster&gt;</option>
      </select>
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
      <input readOnly className="ac-input ac-customer-search-filter-input" placeholder="" aria-label="Filter" />
      <select disabled className="ac-select ac-customer-search-duplicates-select" defaultValue="" aria-label="Find Duplicates">
        <option value="">&lt;Find Duplicates&gt;</option>
      </select>
    </div>
  );
}

function DuplicatesPanel() {
  return (
    <aside className="ac-customer-search-duplicates-panel">
      <div className="ac-customer-search-duplicates-head">
        <span>Duplicate Group Filters</span>
        <AccessButton xs disabled>
          Reset
        </AccessButton>
      </div>
      <div className="ac-customer-search-duplicates-grid">
        <fieldset className="ac-customer-search-duplicates-group">
          <legend>Profile Type:</legend>
          <label className="ac-customer-search-radio">
            <input type="radio" name="dup-profile" disabled defaultChecked />
            <span>All</span>
          </label>
          <label className="ac-customer-search-radio">
            <input type="radio" name="dup-profile" disabled />
            <span>One or more Spare 2</span>
          </label>
        </fieldset>
        <fieldset className="ac-customer-search-duplicates-group">
          <legend>Time Frame for:</legend>
          <label className="ac-customer-search-radio">
            <input type="radio" name="dup-timeframe" disabled defaultChecked />
            <span>Last Action Date</span>
          </label>
          <label className="ac-customer-search-radio">
            <input type="radio" name="dup-timeframe" disabled />
            <span>Last Sales H Status Date</span>
          </label>
        </fieldset>
        <fieldset className="ac-customer-search-duplicates-group ac-customer-search-duplicates-group--wide">
          <legend>Time Range Grid:</legend>
          <div className="ac-customer-search-duplicates-range-grid">
            {["All", "None", "14 - 28 Days ago", "28 - 56 Days ago", "> 56 Days ago"].map((label, i) => (
              <label key={label} className="ac-customer-search-radio">
                <input type="radio" name="dup-range" disabled defaultChecked={i === 0} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="ac-customer-search-merge-row">
        <span>Merge Duplicate Groups | 029 #</span>
        <input readOnly className="ac-input ac-customer-search-merge-input" aria-label="Merge group number" />
        <AccessButton xs disabled>
          Merge
        </AccessButton>
      </div>
    </aside>
  );
}

function PresetGrid({
  grid,
  rows = 4,
  cols = 8,
}: {
  grid: readonly (readonly (CustomerSearchPresetCell | "textured" | null)[])[];
  rows?: number;
  cols?: number;
}) {
  const firstPreset = grid
    .flat()
    .find((cell): cell is CustomerSearchPresetCell => Boolean(cell && typeof cell === "object" && "label" in cell));
  const [selectedPreset, setSelectedPreset] = useState(firstPreset?.label ?? "");

  return (
    <div className="ac-customer-search-preset-grid">
      {Array.from({ length: rows }, (_, rowIndex) =>
        Array.from({ length: cols }, (_, colIndex) => {
          const cell = grid[rowIndex]?.[colIndex];
          if (cell && typeof cell === "object" && "label" in cell) {
            return (
              <AccessButton
                key={`${rowIndex}-${colIndex}-${cell.label}`}
                xs
                aria-pressed={selectedPreset === cell.label}
                onClick={() => setSelectedPreset(cell.label)}
                className={`${customerSearchPresetBtnClass(cell.style)} ${
                  selectedPreset === cell.label ? "ac-customer-search-preset-btn--active" : ""
                }`}
              >
                {cell.label}
              </AccessButton>
            );
          }
          if (cell === "textured") {
            return (
              <div
                key={`${rowIndex}-${colIndex}-textured`}
                className="ac-customer-search-preset-empty ac-customer-search-preset-textured"
                aria-hidden
              />
            );
          }
          return <div key={`${rowIndex}-${colIndex}-empty`} className="ac-customer-search-preset-empty" aria-hidden />;
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
              <input type="checkbox" disabled defaultChecked={i === 0 || i === 1} />
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
            <AccessButton xs disabled>
              Update All
            </AccessButton>
            <AccessButton xs disabled>
              Update Selected
            </AccessButton>
          </div>
          <div className="ac-customer-search-view-controls-group ac-customer-search-view-controls-group--end">
            <span className="ac-flabel">View:</span>
            <select disabled className="ac-select ac-customer-search-view-select-wide" defaultValue="01" aria-label="View">
              <option value="01">View 01</option>
            </select>
            <AccessButton xs disabled>
              Save View
            </AccessButton>
            <AccessButton xs disabled>
              Delete View
            </AccessButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Views2Tab() {
  return (
    <div className="ac-customer-search-views-preset ac-search-views-tab-pane">
      <PresetGrid grid={CUSTOMER_SEARCH_VIEWS_2_GRID} />
      <div className="ac-customer-search-views-footer shrink-0">
        <div className="ac-customer-search-view-controls">
          <div className="ac-customer-search-view-controls-group">
            <span className="ac-customer-search-compare-label">Compare Profiles | 028</span>
            <AccessButton xs disabled>
              Update All
            </AccessButton>
            <AccessButton xs disabled>
              Update Selected
            </AccessButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Views3Tab() {
  return (
    <div className="ac-customer-search-views-filters ac-search-views-tab-pane">
      <div className="ac-customer-search-views-filter-row">
        <FilterRadioGroup legend="Progress:" name="views3-progress" options={CUSTOMER_VIEWS_PROGRESS_OPTIONS} />
        <FilterRadioGroup legend="Profile:" name="views3-profile" options={CUSTOMER_VIEWS_PROFILE_OPTIONS} />
      </div>
      <FilterRadioGroup
        legend="Time Frame for:"
        name="views3-time-for"
        options={CUSTOMER_VIEWS_TIME_FRAME_FOR_OPTIONS}
        className="ac-customer-search-filter-group--wide"
      />
      <FilterRadioGroup
        legend=""
        name="views3-time-duration"
        options={CUSTOMER_VIEWS_TIME_DURATION_OPTIONS}
        defaultIndex={0}
        className="ac-customer-search-filter-group--wide ac-customer-search-filter-group--no-legend"
      />
      <div className="ac-customer-search-views-filter-row">
        <FilterRadioGroup legend="Trade:" name="views3-trade" options={CUSTOMER_VIEWS_TRADE_OPTIONS} />
        <FilterRadioGroup legend="State:" name="views3-state" options={CUSTOMER_VIEWS_STATE_OPTIONS} />
        <fieldset className="ac-customer-search-filter-group ac-customer-search-filter-group--user-setting">
          <legend>User Setting</legend>
          <div className="ac-customer-search-user-setting-fields">
            <label className="ac-customer-search-inline-select-wrap">
              <span className="ac-flabel">Select</span>
              <select disabled className="ac-select" defaultValue="">
                <option value="" />
              </select>
            </label>
            <label className="ac-customer-search-inline-select-wrap">
              <span className="ac-flabel">Value</span>
              <select disabled className="ac-select" defaultValue="">
                <option value="" />
              </select>
            </label>
          </div>
        </fieldset>
      </div>
      <FilterRadioGroup
        legend="County:"
        name="views3-county"
        options={CUSTOMER_VIEWS_COUNTY_OPTIONS}
        className="ac-customer-search-filter-group--wide"
      />
      <div className="ac-customer-search-views-reset-row">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="ac-customer-search-preset-empty ac-customer-search-spare-btn" aria-hidden />
        ))}
        <AccessButton xs disabled className="ac-customer-search-reset-all-btn">
          Reset to All
        </AccessButton>
      </div>
    </div>
  );
}

function InternetSearchTab() {
  return (
    <div className="ac-customer-search-internet-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-internet-top">
        <select disabled className="ac-select ac-customer-search-internet-county" defaultValue="" aria-label="County">
          <option value="">&lt;County&gt;</option>
        </select>
      </div>
      <div className="ac-customer-search-internet-actions">
        <AccessButton xs disabled>
          USA
        </AccessButton>
        <AccessButton xs disabled className="ac-customer-search-card-btn">
          Card #
        </AccessButton>
      </div>
    </div>
  );
}

function UserSettingsTab() {
  return (
    <div className="ac-customer-search-user-settings-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-user-settings-title">User Settings</div>
      <div className="ac-customer-search-user-settings-body">
        <div className="ac-customer-search-user-settings-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="ac-customer-search-user-setting-slot">
              <span className="ac-customer-search-user-setting-num">{i + 1}:</span>
              <select disabled className="ac-select ac-customer-search-user-setting-select" defaultValue="" aria-label={`Setting ${i + 1}`}>
                <option value="" />
              </select>
              <div className="ac-customer-search-user-setting-btns">
                <AccessButton xs disabled>
                  Set
                </AccessButton>
                <AccessButton xs disabled>
                  Clear
                </AccessButton>
              </div>
            </div>
          ))}
        </div>
        <div className="ac-customer-search-last-action-user">
          <span className="ac-flabel">Last Action User | 030</span>
          <select disabled className="ac-select" defaultValue="all" aria-label="Last Action User">
            <option value="all">&lt;ALL&gt;</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function UtilitiesTab() {
  return (
    <div className="ac-customer-search-utilities-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-utilities-section">
        <AccessButton xs disabled>
          Letter
        </AccessButton>
        <AccessButton xs disabled>
          Postcard
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section">
        <label className="ac-customer-search-utilities-field">
          <span className="ac-flabel">Go To:</span>
          <select disabled className="ac-select" defaultValue="">
            <option value="" />
          </select>
        </label>
        <AccessButton xs disabled>
          Export View
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section">
        <label className="ac-customer-search-utilities-field">
          <span className="ac-flabel">Action | 005:</span>
          <select disabled className="ac-select" defaultValue="">
            <option value="" />
          </select>
        </label>
        <AccessButton xs disabled>
          Clear Future Call
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section ac-customer-search-utilities-section--stack">
        <div className="ac-customer-search-utilities-btn-row">
          <AccessButton xs disabled>
            Refresh
          </AccessButton>
          <AccessButton xs disabled>
            Zero
          </AccessButton>
        </div>
        <AccessButton xs disabled>
          Cancel
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section">
        <AccessButton xs disabled className="ac-customer-search-multifilter-btn">
          Multi Filter
          <br />
          Names and
          <br />
          Selections
        </AccessButton>
      </div>
    </div>
  );
}

function AdminUtilitiesTab() {
  return (
    <div className="ac-customer-search-admin-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-admin-section">
        <div className="ac-customer-search-admin-heading">Transfer to:</div>
        <div className="ac-customer-search-admin-transfer-grid">
          {CUSTOMER_ADMIN_TRANSFER_BUTTONS.flatMap((row, rowIndex) =>
            row.map((cell, colIndex) =>
              cell ? (
                <AccessButton
                  key={`${rowIndex}-${colIndex}-${cell.label}`}
                  xs
                  disabled
                  className="ac-customer-search-transfer-btn"
                  style={{ backgroundColor: cell.color }}
                >
                  {cell.label}
                </AccessButton>
              ) : (
                <div key={`${rowIndex}-${colIndex}-empty`} className="ac-customer-search-preset-empty" aria-hidden />
              ),
            ),
          )}
        </div>
      </div>
      <div className="ac-customer-search-admin-section">
        <div className="ac-customer-search-admin-heading">Include profiles:</div>
        <div className="ac-customer-search-admin-check-grid">
          {CUSTOMER_ADMIN_INCLUDE_PROFILES.map((row, rowIndex) =>
            row.map((label, colIndex) =>
              label ? (
                <label key={`${rowIndex}-${colIndex}-${label}`} className="ac-customer-search-check">
                  <input type="checkbox" disabled defaultChecked />
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
    </div>
  );
}

function RayTab() {
  return (
    <div className="ac-customer-search-ray-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-ray-section">
        <div className="ac-customer-search-ray-label">Select contacts with titles to change</div>
        <label className="ac-customer-search-ray-field">
          <span className="ac-flabel">Change To:</span>
          <select disabled className="ac-select" defaultValue="">
            <option value="" />
          </select>
        </label>
        <AccessButton xs disabled>
          Change Titles | 003
        </AccessButton>
        <AccessButton xs disabled className="ac-customer-search-ray-bottom-btn">
          Salesman Records - Cust | 004
        </AccessButton>
      </div>
      <div className="ac-customer-search-ray-section">
        <AccessButton xs disabled className="ac-customer-search-ray-large-btn">
          Set User Flag 4 to &apos;Do Not Email&apos; for Street + City Duplicates w/ Last Week Ending + Specific Salesman in the Group 002
        </AccessButton>
      </div>
      <div className="ac-customer-search-ray-section ac-customer-search-ray-section--stack">
        <AccessButton xs disabled>
          Select Lesser ISR for Transfer to Deleted 001
        </AccessButton>
        <div className="ac-customer-search-ray-btn-row">
          <AccessButton xs disabled>
            Counts
          </AccessButton>
          <AccessButton xs disabled>
            Fix Zip | 012
          </AccessButton>
        </div>
      </div>
      <div className="ac-customer-search-ray-section">
        <div className="ac-customer-search-ray-label">Select customers with Cust Type to change</div>
        <label className="ac-customer-search-ray-field">
          <span className="ac-flabel">Change To:</span>
          <select disabled className="ac-select" defaultValue="">
            <option value="" />
          </select>
        </label>
        <AccessButton xs disabled>
          Change Cust Type | 013
        </AccessButton>
        <div className="ac-customer-search-ray-delete-row">
          <span className="ac-customer-search-ray-label">Select customers</span>
          <AccessButton xs disabled className="ac-customer-search-ray-delete-btn">
            Delete Customer
          </AccessButton>
        </div>
      </div>
      <div className="ac-customer-search-ray-section ac-customer-search-ray-section--stack">
        <AccessButton xs disabled>
          Populate Primary Contacts | 034
        </AccessButton>
        <div className="ac-customer-search-ray-delete-row">
          <span className="ac-customer-search-ray-label">Select customers</span>
          <AccessButton xs disabled className="ac-customer-search-ray-delete-btn">
            Delete Contacts | 035
          </AccessButton>
        </div>
      </div>
    </div>
  );
}

const TAB_CONTENT = [
  ViewsTab,
  Views2Tab,
  Views3Tab,
  InternetSearchTab,
  UserSettingsTab,
  UtilitiesTab,
  AdminUtilitiesTab,
  RayTab,
] as const;

export function CustomerSearchViewsPanel(props: CustomerSearchViewsPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const showCompactFilter = activeTab <= 2;
  const showDuplicates = activeTab <= 2;
  const TabContent = TAB_CONTENT[activeTab];

  return (
    <div className="ac-customer-search-controls min-w-0 flex-1">
      <div className="ac-tabs ac-customer-search-view-tabs shrink-0 overflow-x-auto">
        {CUSTOMER_SEARCH_VIEW_TABS.map((label, i) => (
          <button
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
          {showCompactFilter ? <CompactFilterRow {...props} /> : null}

          <div className={`ac-customer-search-views-body ${showDuplicates ? "" : "ac-customer-search-views-body--full"}`}>
            <div className="ac-customer-search-views-left">
              <TabContent />
            </div>
            {showDuplicates ? <DuplicatesPanel /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
