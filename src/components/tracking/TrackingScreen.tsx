"use client";

import { useState } from "react";
import type { WeekContext, TrackingPreview } from "@/types/tracking";
import { AccessButton } from "@/components/access/AccessButton";
import { AccessToolbar, AccessButtonRow, AccessToolbarDivider } from "@/components/access/AccessToolbar";
import { AccessTabStrip } from "@/components/access/AccessTabStrip";
import { AccessFieldGrid } from "@/components/access/AccessFieldGrid";

interface TrackingScreenProps {
  week: WeekContext;
  preview?: TrackingPreview;
}

// Top toolbar warning / report buttons (match the Access ribbon)
const RIBBON = [
  { label: "Health Ins", variant: "default" as const },
  { label: "Bonus Exp", variant: "default" as const },
  { label: "Job App Problems", variant: "default" as const },
  { label: "Missing WC", variant: "warn" as const },
  { label: "Expired WC", variant: "warn" as const },
  { label: "Contracts", variant: "default" as const },
  { label: "Missing GL", variant: "warn" as const },
  { label: "Expired GL", variant: "warn" as const },
  { label: "Office Staff Notes", variant: "default" as const },
  { label: "New Job App", variant: "default" as const },
];

const JOB_INFO_TABS = [
  { id: "job-info", label: "Job Info" },
  { id: "co-contacts", label: "Co Contacts" },
  { id: "employees", label: "Employees" },
  { id: "salesmen", label: "Salesmen" },
  { id: "bill-rates", label: "Bill Rates" },
  { id: "s-admin", label: "S Admin" },
  { id: "admin", label: "Admin" },
  { id: "schedule", label: "Schedule/Timesheet" },
  { id: "verify-hours", label: "Verify Hours" },
  { id: "invoice", label: "Invoice" },
  { id: "seamus", label: "Seamus" },
  { id: "est-invoice", label: "Estimated Invoice" },
  { id: "referral", label: "Referral Agencies" },
];

const TRACKING_TABS = [
  { id: "tracking", label: "Tracking" },
  { id: "hours", label: "Hours" },
  { id: "hours2", label: "Hours2" },
  { id: "benefits", label: "Benefits" },
  { id: "ts-history", label: "TS History" },
];

// Wide assignment grid columns, matching the Access tracking grid order.
const GRID_COLUMNS = [
  "Emp ID",
  "First",
  "Last",
  "City",
  "Cell #",
  "Grade",
  "WCC",
  "Customer",
  "Job / Site",
  "Sat",
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Hrs",
  "Pay Rate",
  "Bill Rate",
  "Bill OT",
  "Wk Ending",
];

const SWATCHES = ["#22a06b", "#ffffff", "#f4c20d", "#e8553e", "#7a5bd6", "#f08fb0"];

export function TrackingScreen({ week, preview }: TrackingScreenProps) {
  const [jobInfoTab, setJobInfoTab] = useState("job-info");
  const [trackingTab, setTrackingTab] = useState("tracking");

  const rows = preview?.rows ?? [];

  return (
    <div className="flex flex-col gap-1.5">
      {/* ===== Top control ribbon ===== */}
      <AccessToolbar>
        <select disabled className="ac-select w-[110px]" defaultValue="">
          <option value="">&lt;Search&gt;</option>
        </select>
        <select disabled className="ac-select w-[100px]" defaultValue="">
          <option value="">&lt;Admin&gt;</option>
        </select>
        <select disabled className="ac-select w-[100px]" defaultValue="">
          <option value="">&lt;Reports&gt;</option>
        </select>
        <AccessToolbarDivider />
        <select disabled className="ac-select w-[130px]" defaultValue="">
          <option value="">&lt;Job Application&gt;</option>
        </select>
        {RIBBON.map((b) => (
          <AccessButton key={b.label} variant={b.variant} disabled title="Coming later">
            {b.label}
          </AccessButton>
        ))}
        <AccessToolbarDivider />
        <AccessButton variant="go" disabled title="Coming later">
          WCC Payroll / Sales Report
        </AccessButton>
      </AccessToolbar>

      {/* ===== Control band: date/week + Job Info tabs + field block ===== */}
      <div className="ac-panel">
        <div className="flex flex-wrap items-end gap-3 border-b border-[#c9c9c9] bg-[#f6f6f6] p-2">
          <div>
            <div className="ac-flabel">Date</div>
            <div className="ac-readonly w-[96px] text-center font-mono">{week.displayDate}</div>
          </div>
          <div>
            <div className="ac-flabel">Week</div>
            <div className="ac-readonly w-[44px] text-center font-mono">{week.assignWeek}</div>
          </div>
          <AccessButton disabled title="Coming later">Empl Quick Search</AccessButton>
          <span className="ml-auto text-[11px] text-[#6a6a6a]">
            Work week Sat {week.weekStartDate} – Fri {week.weekEndingDate} · {week.assignYear}
          </span>
        </div>

        <AccessTabStrip tabs={JOB_INFO_TABS} active={jobInfoTab} onChange={setJobInfoTab} />

        {jobInfoTab === "job-info" ? (
          <div className="grid grid-cols-1 gap-3 p-2 xl:grid-cols-12">
            {/* Assignment controls */}
            <div className="flex flex-col gap-2 xl:col-span-4">
              <div>
                <div className="ac-flabel">Assigned Customer</div>
                <div className="flex items-center gap-1">
                  <select disabled className="ac-select" defaultValue="">
                    <option value="">Select customer…</option>
                  </select>
                  <AccessButton xs disabled>+</AccessButton>
                  <AccessButton xs disabled>Reset</AccessButton>
                </div>
              </div>
              <div>
                <div className="ac-flabel">Assigned Job</div>
                <div className="flex items-center gap-1">
                  <select disabled className="ac-select" defaultValue="">
                    <option value="">Select job…</option>
                  </select>
                  <AccessButton xs disabled>+</AccessButton>
                  <span className="ac-btn ac-btn-primary ac-btn-xs cursor-default">OnSite</span>
                </div>
              </div>
              <div>
                <div className="ac-flabel">Assignment</div>
                <AccessButtonRow>
                  <AccessButton disabled title="Coming later">New</AccessButton>
                  <AccessButton disabled title="Coming later">End</AccessButton>
                  <AccessButton disabled title="Coming later">Transfer</AccessButton>
                </AccessButtonRow>
              </div>
              <AccessButtonRow>
                <AccessButton disabled title="Coming later">T Sheets HL</AccessButton>
                <AccessButton disabled title="Coming later">View Invoice</AccessButton>
                <AccessButton disabled title="Coming later">Cell # Search</AccessButton>
              </AccessButtonRow>
            </div>

            {/* Job info fields */}
            <div className="xl:col-span-5">
              <AccessFieldGrid
                columns={2}
                fields={[
                  { label: "Contract With", value: "" },
                  { label: "Contract Date", value: "", kind: "date" },
                  { label: "Salesman", value: "" },
                  { label: "W-9", value: "" },
                  { label: "Credit History", value: "" },
                  { label: "WC x Date", value: "", kind: "date" },
                  { label: "Oldest Invoice", value: "", kind: "date" },
                  { label: "GL x Date", value: "", kind: "date" },
                  { label: "Total Owed", value: "", kind: "money" },
                ]}
              />
              <AccessButtonRow className="mt-2">
                <AccessButton disabled>Open Contract</AccessButton>
                <AccessButton disabled>Open W-9</AccessButton>
                <AccessButton disabled>Open WC</AccessButton>
                <AccessButton disabled>Open GL</AccessButton>
                <AccessButton disabled>Hyperlinks</AccessButton>
              </AccessButtonRow>
            </div>

            {/* Totals / reports */}
            <div className="flex flex-col gap-2 xl:col-span-3">
              <div className="ac-grid">
                <table>
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <select disabled className="ac-select" defaultValue="">
                <option value="">&lt;Reports 2&gt;</option>
              </select>
              <AccessFieldGrid
                columns={2}
                fields={[
                  { label: "TIA", value: "" },
                  { label: "CPM", value: "" },
                  { label: "Total", value: "", kind: "money" },
                  { label: "Margin", value: "" },
                ]}
              />
              <AccessButton disabled className="self-start">Clear HL</AccessButton>
            </div>
          </div>
        ) : (
          <div className="p-3 text-[11px] italic text-[#6a6a6a]">
            {JOB_INFO_TABS.find((t) => t.id === jobInfoTab)?.label} — available in a later
            milestone.
          </div>
        )}
      </div>

      {/* ===== Tracking tab strip + action buttons ===== */}
      <div className="ac-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5">
          <AccessTabStrip
            tabs={TRACKING_TABS}
            active={trackingTab}
            onChange={setTrackingTab}
            className="border-b-0 bg-transparent"
          />
          <AccessButtonRow>
            <AccessButton disabled>Hrs AutoText</AccessButton>
            <AccessButton disabled>Payroll Change</AccessButton>
            <AccessToolbarDivider />
            <AccessButton disabled>All</AccessButton>
            <AccessButton disabled>Job</AccessButton>
            <AccessButton disabled>Emp</AccessButton>
            <AccessButton variant="warn" disabled>Delete</AccessButton>
            <AccessToolbarDivider />
            <AccessButton disabled>Customer Menu</AccessButton>
            <span className="ac-swatches">
              {SWATCHES.map((c) => (
                <span key={c} className="ac-swatch" style={{ background: c }} />
              ))}
            </span>
            <AccessButton disabled>History Update</AccessButton>
            <AccessButton disabled>Browse</AccessButton>
          </AccessButtonRow>
        </div>
      </div>

      {/* ===== Main assignment grid ===== */}
      {trackingTab === "tracking" ? (
        <div className="flex flex-col">
          <div className="ac-grid mc-scroll-smooth" style={{ maxHeight: "55vh" }}>
            <table>
              <thead>
                <tr>
                  {GRID_COLUMNS.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={GRID_COLUMNS.length} className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]">
                      No assignments loaded for week {week.assignWeek}. Connect tblTracking to
                      populate this grid.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={`${r.employeeId}-${i}`} className={r.placeholder ? "italic text-[#7a7a7a]" : ""}>
                      <td className="font-mono text-[#555]">{r.employeeId || "—"}</td>
                      <td>{r.firstName || (r.placeholder ? "(placeholder)" : "—")}</td>
                      <td>{r.lastName || "—"}</td>
                      <td>{r.city || "—"}</td>
                      <td>{r.cell || "—"}</td>
                      <td>{r.grade || "—"}</td>
                      <td>{r.wcc || "—"}</td>
                      <td>{r.customer || "—"}</td>
                      <td>{r.jobSite || "—"}</td>
                      <td style={{ textAlign: "right" }}>{r.satHours}</td>
                      <td style={{ textAlign: "right" }}>{r.sunHours}</td>
                      <td style={{ textAlign: "right" }}>{r.monHours}</td>
                      <td style={{ textAlign: "right" }}>{r.tueHours}</td>
                      <td style={{ textAlign: "right" }}>{r.wedHours}</td>
                      <td style={{ textAlign: "right" }}>{r.thuHours}</td>
                      <td style={{ textAlign: "right" }}>{r.friHours}</td>
                      <td style={{ textAlign: "right" }} className="font-semibold">{r.totalHours}</td>
                      <td style={{ textAlign: "right" }}>{r.payRate || "—"}</td>
                      <td style={{ textAlign: "right" }}>{r.billRate || "—"}</td>
                      <td style={{ textAlign: "right" }}>{r.billRateOT || "—"}</td>
                      <td>{r.weekEnding || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="ac-recordbar">
            <span className="font-mono">
              Record: |◄ ◄ {rows.length === 0 ? 0 : 1} of {rows.length} ► ►|
            </span>
            <span className="text-[#7a7a7a]">Unfiltered</span>
            <span className="ml-auto flex items-center gap-1">
              Search
              <input disabled className="ac-input w-[130px]" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6a6a6a]">
            Read-only{preview?.source ? ` · source: ${preview.source}` : ""}
            {preview?.fallback
              ? ` · showing most recent assignments (no rows for week ${week.assignWeek}/${week.assignYear})`
              : ""}
            . Hours entry, New / End / Transfer arrive in Milestone 4.
          </p>
        </div>
      ) : (
        <div className="ac-panel p-4 text-center text-[12px] italic text-[#6a6a6a]">
          {TRACKING_TABS.find((t) => t.id === trackingTab)?.label} view — available in a later
          milestone.
        </div>
      )}
    </div>
  );
}
