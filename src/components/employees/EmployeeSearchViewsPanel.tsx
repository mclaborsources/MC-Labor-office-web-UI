"use client";

import { useState, type ReactNode } from "react";
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

interface EmployeeSearchViewsPanelProps {
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

function PresetGrid({
  grid = EMPLOYEE_SEARCH_PRESET_GRID,
  className = "",
}: {
  grid?: readonly (readonly (EmployeeSearchPresetCell | null)[])[];
  className?: string;
}) {
  return (
    <div className={`ac-employee-search-preset-grid ${className}`}>
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          cell ? (
            <AccessButton
              key={`${rowIndex}-${colIndex}-${cell.label}`}
              xs
              disabled
              className={employeeSearchPresetBtnClass(cell.style)}
            >
              {cell.label}
            </AccessButton>
          ) : (
            <div key={`${rowIndex}-${colIndex}-empty`} className="ac-customer-search-preset-empty" aria-hidden />
          ),
        ),
      )}
    </div>
  );
}

function Views1Tab({ trades, currentTradeId }: Pick<EmployeeSearchViewsPanelProps, "trades" | "currentTradeId">) {
  return (
    <div className="ac-employee-search-views-1 ac-search-views-tab-pane">
      <div className="ac-employee-search-filter-row">
        <select disabled className="ac-select ac-employee-search-row-select" defaultValue="" aria-label="Dates">
          <option value="">&lt;Dates&gt;</option>
        </select>
        <AccessButton xs disabled className="ac-employee-search-date-btn">
          Wk End Dt
        </AccessButton>
        <button type="button" disabled className="ac-employee-search-entry-dt-link">
          Entry Dt
        </button>
        <select disabled className="ac-select ac-employee-search-row-select" defaultValue="" aria-label="In Tracking">
          <option value="">&lt;In Tracking?&gt;</option>
        </select>
        <select disabled className="ac-select ac-employee-search-row-select" defaultValue="" aria-label="Date Range">
          <option value="">&lt;Date Range&gt;</option>
        </select>
        <select
          disabled
          className="ac-select ac-employee-search-row-select ac-employee-search-cluster-select"
          defaultValue=""
          aria-label="Cluster"
        >
          <option value="">&lt;Cluster&gt;</option>
        </select>
        <select
          disabled
          className="ac-select ac-employee-search-row-select ac-employee-search-trade-select"
          defaultValue={currentTradeId}
          aria-label="Trade"
        >
          <option value="">&lt;Trade&gt;</option>
          {trades.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="ac-customer-search-filter-label">Filter:</span>
        <select disabled className="ac-select ac-employee-search-filter-input" defaultValue="" aria-label="Filter">
          <option value="" />
        </select>
      </div>

      <div className="ac-employee-search-action-row">
        <AccessButton xs disabled className="ac-employee-search-action-wide">
          Available Manpower
        </AccessButton>
        <AccessButton xs disabled className="ac-employee-search-action-wide">
          UI
        </AccessButton>
        <AccessButton xs disabled className="ac-employee-search-lic-flag-btn">
          Lic Exp Date Flag - Update All | 022
        </AccessButton>
        <div className="ac-employee-search-action-row-right">
          <AccessButton xs disabled>
            True People
          </AccessButton>
          <AccessButton xs disabled className="ac-employee-search-lic-search-btn">
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
              <input type="radio" name="emp-call-filter" disabled defaultChecked={i === 0} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <AccessButton xs disabled>
          Update Column | 036
        </AccessButton>
        <AccessButton xs disabled className="ac-employee-search-v-btn">
          V-Name
        </AccessButton>
        <AccessButton xs disabled className="ac-employee-search-v-btn">
          V-Number
        </AccessButton>
      </div>
    </div>
  );
}

function Views2Tab() {
  return (
    <div className="ac-employee-search-views-2 ac-search-views-tab-pane">
      <PresetGrid grid={EMPLOYEE_SEARCH_VIEWS_2_GRID} className="ac-employee-views2-preset-grid" />
    </div>
  );
}

function Views3Tab() {
  return (
    <div className="ac-employee-search-views-3 ac-search-views-tab-pane ac-search-views-tab-pane--row">
      <div className="ac-employee-views3-btn-grid">
        {EMPLOYEE_VIEWS_3_BUTTON_GRID.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            cell ? (
              <AccessButton
                key={`${rowIndex}-${colIndex}-${cell.label}`}
                xs
                disabled
                className={employeeViews3BtnClass(cell.style)}
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
        <FilterRadioGroup legend="Time Frame:" name="emp-v3-time" options={EMPLOYEE_VIEWS_TIME_FRAME} className="ac-customer-search-filter-group--wide" />
        <FilterRadioGroup legend="Trade:" name="emp-v3-trade" options={EMPLOYEE_VIEWS_TRADE_OPTIONS} className="ac-customer-search-filter-group--wide" />
        <FilterRadioGroup legend="State:" name="emp-v3-state" options={EMPLOYEE_VIEWS_STATE_OPTIONS} className="ac-customer-search-filter-group--wide" />
        <FilterRadioGroup
          legend="County:"
          name="emp-v3-county"
          options={EMPLOYEE_VIEWS_COUNTY_OPTIONS}
          className="ac-customer-search-filter-group--wide"
        />
      </div>
    </div>
  );
}

function Views4Tab() {
  return (
    <div className="ac-employee-search-views-filters ac-search-views-tab-pane">
      <div className="ac-customer-search-views-filter-row">
        <FilterRadioGroup legend="Profile:" name="emp-v4-profile" options={EMPLOYEE_VIEWS_4_PROFILE} />
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
        legend="Time Frame for:"
        name="emp-v4-time-for"
        options={EMPLOYEE_VIEWS_4_TIME_FOR}
        className="ac-customer-search-filter-group--wide"
      />
      <FilterRadioGroup
        legend=""
        name="emp-v4-time-duration"
        options={EMPLOYEE_VIEWS_4_TIME_DURATION}
        className="ac-customer-search-filter-group--wide ac-customer-search-filter-group--no-legend"
      />
      <div className="ac-customer-search-views-filter-row">
        <FilterRadioGroup legend="Trade:" name="emp-v4-trade" options={EMPLOYEE_VIEWS_4_TRADE} />
        <FilterRadioGroup legend="State:" name="emp-v4-state" options={EMPLOYEE_VIEWS_STATE_OPTIONS} />
      </div>
      <FilterRadioGroup
        legend="County:"
        name="emp-v4-county"
        options={EMPLOYEE_VIEWS_COUNTY_OPTIONS}
        className="ac-customer-search-filter-group--wide"
      />
      <FilterRadioGroup
        legend="IPG Job App Status:"
        name="emp-v4-ipg"
        options={EMPLOYEE_VIEWS_4_IPG_STATUS}
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

function CopySectionTab({ variant }: { variant: "ma" | "nh" }) {
  return (
    <div className="ac-employee-copy-tab ac-search-views-tab-pane">
      <div className="ac-employee-copy-bar" aria-hidden>
        COPY
      </div>
      <div className="ac-employee-copy-main">
        {EMPLOYEE_MA_COPY_ROWS.map((row) => (
          <div key={row.label} className="ac-employee-copy-row">
            <AccessButton xs disabled className="ac-employee-copy-primary-btn">
              {row.label}
            </AccessButton>
            {row.google ? (
              <AccessButton xs disabled className="ac-employee-copy-side-btn">
                Google
              </AccessButton>
            ) : null}
            {"extraButtons" in row && row.extraButtons ? (
              <div className="ac-employee-copy-extra-btns">
                {row.extraButtons.map((label) => (
                  <AccessButton key={label} xs disabled>
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
            <AccessButton key={label} xs disabled className="ac-employee-nh-trade-btn">
              {label}
            </AccessButton>
          ))}
        </div>
      ) : null}
      <div className="ac-employee-copy-divider" aria-hidden />
      <div className="ac-employee-copy-contact">
        <AccessButton xs disabled className="ac-employee-copy-wide-btn">
          Email Address
        </AccessButton>
        <AccessButton xs disabled className="ac-employee-copy-wide-btn">
          Cell #
        </AccessButton>
      </div>
      <div className="ac-employee-copy-divider" aria-hidden />
      <div className="ac-employee-copy-datapay">
        <AccessButton xs disabled className="ac-employee-copy-wide-btn">
          Datapay-Get-Hired
        </AccessButton>
        <AccessButton xs disabled className="ac-employee-copy-wide-btn">
          Datapay Password
        </AccessButton>
      </div>
    </div>
  );
}

function UserSettingsTab() {
  return (
    <div className="ac-customer-search-user-settings-tab ac-employee-user-settings-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-user-settings-grid ac-employee-user-settings-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="ac-customer-search-user-setting-slot">
            <span className="ac-customer-search-user-setting-num">User Settings {i + 1}:</span>
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
    </div>
  );
}

function UtilitiesTab() {
  return (
    <div className="ac-customer-search-utilities-tab ac-employee-utilities-tab ac-search-views-tab-pane">
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <AccessButton xs disabled className="ac-employee-utilities-black-btn">
          Refresh Hyperlinks | 009
        </AccessButton>
        <AccessButton xs disabled>
          View/Print Mailing Labels
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <div className="ac-customer-search-utilities-btn-row">
          <AccessButton xs disabled>
            Refresh
          </AccessButton>
          <AccessButton xs disabled>
            Zero
          </AccessButton>
        </div>
        <AccessButton xs disabled>
          Export View
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section ac-employee-utilities-spare" aria-hidden />
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <AccessButton xs disabled>
          Salesman Records - Emp | 010
        </AccessButton>
        <AccessButton xs disabled>
          Last Contact | 011
        </AccessButton>
      </div>
      <div className="ac-customer-search-utilities-section ac-employee-utilities-section--stack">
        <AccessButton xs disabled>
          Compare Profiles (Update All)
        </AccessButton>
        <AccessButton xs disabled>
          Compare Profiles (Update Selected)
        </AccessButton>
      </div>
    </div>
  );
}

function AdminUtilitiesTab() {
  return (
    <div className="ac-employee-admin-tab ac-search-views-tab-pane">
      <div className="ac-employee-admin-spare" aria-hidden />
      <div className="ac-employee-admin-controls">
        <div className="ac-employee-admin-checks">
          {EMPLOYEE_ADMIN_INCLUDE_PROFILES.map((label) => (
            <label key={label} className="ac-customer-search-check">
              <input type="checkbox" disabled defaultChecked />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <fieldset className="ac-employee-admin-record-group">
          <legend>1 Record per | 020</legend>
          <label className="ac-customer-search-radio">
            <input type="radio" name="emp-admin-record" disabled defaultChecked />
            <span>Emp</span>
          </label>
          <label className="ac-customer-search-radio">
            <input type="radio" name="emp-admin-record" disabled />
            <span>Cell #</span>
          </label>
        </fieldset>
        <AccessButton xs disabled>
          Export View
        </AccessButton>
        <AccessButton xs disabled className="ac-employee-admin-multifilter-btn">
          Multi Filter Names and Selections
        </AccessButton>
      </div>
    </div>
  );
}

function RayTab() {
  return (
    <div className="ac-employee-ray-tab ac-search-views-tab-pane">
      <div className="ac-employee-ray-section">
        <div className="ac-employee-ray-heading">Auto-Merge Duplicates:</div>
        <AccessButton xs disabled>
          Electrician | 006
        </AccessButton>
        <AccessButton xs disabled>
          Plumber | 007
        </AccessButton>
      </div>
      <div className="ac-employee-ray-section">
        <select disabled className="ac-select" defaultValue="" aria-label="License Board">
          <option value="">&lt;License Board&gt;</option>
        </select>
        <AccessButton xs disabled>
          Build Licenses | 008
        </AccessButton>
      </div>
      <div className="ac-employee-ray-section ac-employee-ray-section--wide">
        <div className="ac-employee-ray-heading">Remove Apprentice from duplicates (Licensed / Apprentice) | 021</div>
        <AccessButton xs disabled className="ac-employee-ray-wide-btn">
          1) Select Licensed / Apprentice Duplicates
        </AccessButton>
        <AccessButton xs disabled className="ac-employee-ray-wide-btn">
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
            <AccessButton xs disabled>
              Export Phone Numbers
            </AccessButton>
            <AccessButton xs disabled>
              Process Phone Numbers
            </AccessButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ray2Tab() {
  return (
    <div className="ac-employee-ray2-tab ac-search-views-tab-pane">
      <p className="ac-employee-ray2-warn">
        These will remove the value, user, and date from the profile, and the history | 027
      </p>
      <fieldset className="ac-employee-ray2-fieldset">
        <AccessButton xs disabled>
          Remove All Vax
        </AccessButton>
        <AccessButton xs disabled>
          Remove All S1
        </AccessButton>
        <AccessButton xs disabled>
          Remove All S2
        </AccessButton>
      </fieldset>
    </div>
  );
}

function InterviewTab() {
  return (
    <div className="ac-employee-interview-tab ac-search-views-tab-pane">
      <AccessButton xs disabled>
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

function CallListsTab() {
  return (
    <div className="ac-employee-search-views-filters ac-search-views-tab-pane">
      <FilterRadioGroup legend="Trade:" name="emp-cl-trade" options={EMPLOYEE_CALL_LISTS_TRADE} className="ac-customer-search-filter-group--wide" />
      <FilterRadioGroup legend="State:" name="emp-cl-state" options={EMPLOYEE_VIEWS_STATE_OPTIONS} className="ac-customer-search-filter-group--wide" />
      <FilterRadioGroup legend="County:" name="emp-cl-county" options={EMPLOYEE_VIEWS_COUNTY_OPTIONS} className="ac-customer-search-filter-group--wide" />
      <FilterRadioGroup legend="List:" name="emp-cl-list" options={EMPLOYEE_CALL_LISTS_LIST} className="ac-customer-search-filter-group--wide" />
    </div>
  );
}

function CallLists2Tab() {
  return (
    <div className="ac-employee-calllists2-tab ac-search-views-tab-pane">
      <div className="ac-employee-calllists2-filters-row">
        {["<Cluster>", "<Trade>", "<Qualification>", "<Last Action>", "<Last Call>", "No SUBs"].map((label) => (
          <select key={label} disabled className="ac-select ac-employee-search-row-select" defaultValue="" aria-label={label}>
            <option value="">{label}</option>
          </select>
        ))}
      </div>
      <div className="ac-employee-calllists2-body">
        <fieldset className="ac-employee-calllists2-additional">
          <legend>Additional Filters:</legend>
          <label className="ac-customer-search-radio">
            <input type="radio" name="emp-cl2-add" disabled defaultChecked />
            <span>All</span>
          </label>
          {EMPLOYEE_CALL_LISTS_2_ADDITIONAL.map((label) => (
            <label key={label} className="ac-customer-search-radio ac-employee-calllists2-option">
              <input type="radio" name="emp-cl2-add" disabled />
              <span>{label}</span>
            </label>
          ))}
          <label className="ac-customer-search-radio ac-employee-calllists2-option">
            <input type="radio" name="emp-cl2-add" disabled />
            <span>6. Show new entries for the past:</span>
            {["10 Days", "20 Days", "30 Days"].map((d, i) => (
              <label key={d} className="ac-customer-search-check ac-employee-calllists2-check">
                <input type="checkbox" disabled defaultChecked={i === 0} />
                <span>{d}</span>
              </label>
            ))}
          </label>
          <label className="ac-customer-search-radio ac-employee-calllists2-option">
            <input type="radio" name="emp-cl2-add" disabled />
            <span>7. Show all new entries for the past, w/ only unassigned + No SUBs filters:</span>
            {["10 Days", "20 Days", "30 Days"].map((d, i) => (
              <label key={d} className="ac-customer-search-check ac-employee-calllists2-check">
                <input type="checkbox" disabled defaultChecked={i === 0} />
                <span>{d}</span>
              </label>
            ))}
          </label>
        </fieldset>
        <div className="ac-employee-calllists2-right">
          <div className="ac-employee-calllists2-viewmap">
            <select disabled className="ac-select" defaultValue="" aria-label="View Map">
              <option value="">&lt;View Map&gt;</option>
            </select>
            <AccessButton xs disabled>
              Edit
            </AccessButton>
          </div>
          <span className="ac-employee-calllists2-hint">(This is not a filter)</span>
          <AccessButton xs disabled className="ac-employee-search-v-btn">
            V-Name
          </AccessButton>
          <AccessButton xs disabled className="ac-employee-search-v-btn">
            V-Number
          </AccessButton>
        </div>
      </div>
      <div className="ac-employee-calllists2-footer">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="ac-customer-search-preset-empty ac-employee-calllists2-spare" aria-hidden />
        ))}
        <span className="ac-employee-search-btn-warn ac-employee-calllists2-recruiter">Recruiter. M Screen</span>
        <AccessButton xs disabled className="ac-employee-search-btn-warn ac-btn">
          EE SEARCH
        </AccessButton>
      </div>
    </div>
  );
}

const TAB_CONTENT: readonly (() => ReactNode)[] = [
  Views2Tab,
  Views3Tab,
  Views4Tab,
  () => <CopySectionTab variant="ma" />,
  () => <CopySectionTab variant="nh" />,
  UserSettingsTab,
  UtilitiesTab,
  AdminUtilitiesTab,
  RayTab,
  Ray2Tab,
  InterviewTab,
  CallListsTab,
  CallLists2Tab,
];

export function EmployeeSearchUtilityRail() {
  return (
    <div className="ac-customer-search-utility-rail ac-employee-search-utility-rail shrink-0">
      <button type="button" className="ac-customer-search-rail-icon" disabled aria-label="Print">
        <Icon icon={Printer} size="xs" />
      </button>
      <button type="button" className="ac-customer-search-rail-icon ac-customer-search-rail-icon--help" disabled aria-label="Help">
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

  return (
    <div className="ac-customer-search-controls ac-employee-search-controls min-w-0 flex-1">
      <div className="ac-tabs ac-customer-search-view-tabs ac-employee-search-view-tabs shrink-0 overflow-x-auto">
        {EMPLOYEE_SEARCH_VIEW_TABS.map((label, i) => (
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

      <div className="ac-customer-search-control-panel ac-employee-search-control-panel min-h-0 flex-1">
        <div className="ac-customer-search-views-tab ac-employee-search-views-tab">
          <div className="ac-employee-search-views-body">
            {activeTab === 0 ? (
              <Views1Tab trades={props.trades} currentTradeId={props.currentTradeId} />
            ) : (
              TAB_CONTENT[activeTab - 1]()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
