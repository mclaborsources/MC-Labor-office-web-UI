"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import type {
  WeekContext,
  TrackingPreview,
  TrackingPreviewRow,
  TrackingCustomerOption,
  TrackingJobOption,
  TrackingJobInfo,
} from "@/types/tracking";
import { AccessButton } from "@/components/access/AccessButton";
import { AccessToolbar, AccessButtonRow, AccessToolbarDivider } from "@/components/access/AccessToolbar";
import { AccessTabStrip } from "@/components/access/AccessTabStrip";
import { TrackingJobTabBody } from "@/components/tracking/TrackingJobTabPanels";
import { DAY_FLAG_BG, HL_CV_COLORS } from "@/lib/trackingConstants";

interface TrackingScreenProps {
  week: WeekContext;
  preview?: TrackingPreview;
  customers?: TrackingCustomerOption[];
  jobs?: TrackingJobOption[];
  jobInfo?: TrackingJobInfo | null;
  selectedCustomerId?: string;
  selectedProjectId?: string;
  userDisplayName?: string;
}

const TOOLBAR_ALERT_ACTIONS = [
  "Job App Problems",
  "Missing WC",
  "Expired WC",
  "Contracts",
  "Missing GL",
  "Expired GL",
];

const TOOLBAR_ADMIN_ACTIONS = [
  "Office Staff Notes",
  "New Job App",
];

const STATUS_SWATCHES = ["#22a06b", "#ffffff", "#f4c20d", "#4a90e2"];
const PALETTE_SWATCHES = [
  "#9ca3af",
  "#ffffff",
  "#f4c20d",
  "#22a06b",
  "#4a90e2",
  "#7a5bd6",
  "#f08fb0",
  "#e8553e",
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
  { id: "hours2", label: "Hours 2" },
  { id: "benefits", label: "Benefits" },
  { id: "ts-history", label: "TS History" },
];

type GridCol =
  | { kind: "spacer" }
  | { kind: "day"; label: string; hoursKey: keyof TrackingPreviewRow; flagIndex: number }
  | { kind: "payroll" }
  | { kind: "hl" }
  | { kind: "field"; label: string; key: keyof TrackingPreviewRow; align?: "left" | "right" | "center"; mono?: boolean; note?: boolean };

const GRID_COLUMNS: GridCol[] = [
  { kind: "payroll" },
  { kind: "field", label: "Job", key: "jobSite" },
  { kind: "field", label: "Info", key: "infoSent", align: "center" },
  { kind: "field", label: "S", key: "semus", align: "center" },
  { kind: "field", label: "J App", key: "jobApp" },
  { kind: "field", label: "OSHA", key: "osha" },
  { kind: "field", label: "Health", key: "health" },
  { kind: "field", label: "First", key: "firstName" },
  { kind: "field", label: "MI", key: "middleInitial", align: "center" },
  { kind: "field", label: "Last", key: "lastName" },
  { kind: "field", label: "City", key: "city" },
  { kind: "field", label: "Cell #", key: "cell" },
  { kind: "field", label: "Grade Change", key: "gradeChange", align: "center" },
  { kind: "field", label: "WCC State", key: "wccState", align: "center" },
  { kind: "field", label: "WCC", key: "wcc" },
  { kind: "field", label: "Per Diem", key: "perDiem" },
  { kind: "field", label: "OH", key: "oh", align: "right" },
  { kind: "field", label: "E", key: "directionsEmail", align: "center" },
  { kind: "field", label: "T", key: "directionsText", align: "center" },
  { kind: "spacer" },
  { kind: "field", label: "DV", key: "dirVerified", align: "center" },
  { kind: "spacer" },
  { kind: "field", label: "%", key: "trackMargin", align: "right" },
  { kind: "spacer" },
  { kind: "day", label: "Sat S", hoursKey: "satHours", flagIndex: 0 },
  { kind: "day", label: "Sun S", hoursKey: "sunHours", flagIndex: 1 },
  { kind: "day", label: "Mon S", hoursKey: "monHours", flagIndex: 2 },
  { kind: "day", label: "Tue S", hoursKey: "tueHours", flagIndex: 3 },
  { kind: "day", label: "Wed S", hoursKey: "wedHours", flagIndex: 4 },
  { kind: "day", label: "Thu S", hoursKey: "thuHours", flagIndex: 5 },
  { kind: "day", label: "Fri S", hoursKey: "friHours", flagIndex: 6 },
  { kind: "spacer" },
  { kind: "field", label: "Pay Rate", key: "payRate", align: "right" },
  { kind: "spacer" },
  { kind: "field", label: "Bill Rate", key: "billRate", align: "right" },
  { kind: "spacer" },
  { kind: "field", label: "Bill Rate OT", key: "billRateOT", align: "right" },
  { kind: "spacer" },
  { kind: "field", label: "Emp Notes", key: "hoursNote", note: true },
  { kind: "field", label: "Assignment User Name", key: "assignmentUser" },
  { kind: "field", label: "Assignment Timestamp", key: "assignmentTimestamp", mono: true },
  { kind: "hl" },
  { kind: "field", label: "Send Auto Text", key: "sendAutoText", align: "center" },
  { kind: "field", label: "Hrs AutoText User", key: "hrsAutoTextUser" },
  { kind: "field", label: "Hrs AutoText Timestamp", key: "hrsAutoTextTimestamp", mono: true },
  { kind: "field", label: "HL AutoText User", key: "hlAutoTextUser" },
  { kind: "field", label: "HL AutoText Timestamp", key: "hlAutoTextTimestamp", mono: true },
  { kind: "field", label: "Parking Per Hr", key: "parkingPerHr", align: "right" },
];

const COL_COUNT = GRID_COLUMNS.length;

function dayCell(hours: string, flag: string) {
  const bg = flag && DAY_FLAG_BG[flag] ? DAY_FLAG_BG[flag] : undefined;
  return (
    <td className="ac-grid-day">
      <span
        className="ac-tracking-day-flag"
        style={{
          background: bg ?? "transparent",
          color: bg ? "#fff" : "#94a3b8",
        }}
      >
        {hours || (bg ? "●" : "")}
      </span>
    </td>
  );
}

function checkCell(val: string) {
  if (!val || val === "—") {
    return <td className="text-center text-[#cbd5e1]">—</td>;
  }
  return (
    <td className="text-center">
      <span className="ac-tracking-check">{val}</span>
    </td>
  );
}

function renderCell(col: GridCol, row: TrackingPreviewRow) {
  if (col.kind === "spacer") {
    return <td className="ac-grid-spacer" aria-hidden />;
  }
  if (col.kind === "payroll") {
    return (
      <td className="text-center">
        <span
          className="ac-tracking-payroll-badge"
          style={{ background: row.payrollCoColor }}
        >
          {row.payrollCo || "—"}
        </span>
      </td>
    );
  }
  if (col.kind === "hl") {
    const bg = row.hlCvColor ? HL_CV_COLORS[row.hlCvColor] : undefined;
    return (
      <td
        className="ac-tracking-hl-cell text-center"
        style={{ background: bg }}
      >
        {row.hlCv || "—"}
      </td>
    );
  }
  if (col.kind === "day") {
    const hours = String(row[col.hoursKey] ?? "");
    const flag = row.dayFlags[col.flagIndex] ?? "";
    return dayCell(hours, flag);
  }
  const val = String(row[col.key] ?? "");
  const display = val || "—";
  const isCheck =
    col.key === "infoSent" ||
    col.key === "directionsEmail" ||
    col.key === "directionsText" ||
    col.key === "dirVerified" ||
    col.key === "sendAutoText";
  if (isCheck) return checkCell(display);
  if (col.note && val) {
    return (
      <td className="max-w-[140px] truncate" title={val}>
        <span className="ac-tracking-note">{val}</span>
      </td>
    );
  }
  return (
    <td
      style={{ textAlign: col.align ?? "left" }}
      className={col.mono ? "font-mono text-[10px] text-slate-600" : undefined}
    >
      {display}
    </td>
  );
}

function headerLabel(col: GridCol): string {
  if (col.kind === "spacer") return "";
  if (col.kind === "payroll") return "Payroll Co";
  if (col.kind === "hl") return "HL CV";
  if (col.kind === "day") return col.label;
  return col.label;
}

function JobInfoField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="ac-tracking-job-summary-row">
      <span className="ac-tracking-job-summary-label">{label}</span>
      <div
        className={`ac-readonly ac-tracking-field-box${highlight ? " ac-tracking-field-box--highlight" : ""}`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function JobInfoDocRow({
  label,
  value,
  flag = "",
  openLabel,
  showValue = true,
}: {
  label: string;
  value?: string;
  flag?: string;
  openLabel: string;
  showValue?: boolean;
}) {
  return (
    <div className="ac-tracking-job-doc-row">
      <span className="ac-tracking-job-doc-label">{label}</span>
      {showValue ? (
        <input readOnly className="ac-input ac-tracking-job-doc-value" value={value || ""} aria-label={label} />
      ) : (
        <span className="ac-tracking-job-doc-value-spacer" aria-hidden />
      )}
      <input
        readOnly
        className="ac-input ac-tracking-job-doc-flag"
        value={flag || ""}
        aria-label={`${label} flag`}
      />
      <AccessButton disabled className="ac-tracking-job-doc-open">
        {openLabel}
      </AccessButton>
    </div>
  );
}

function JobInfoTabPanel({
  jobInfo,
  mapLabel,
}: {
  jobInfo?: TrackingJobInfo | null;
  mapLabel: string;
}) {
  const rates = jobInfo?.billRates ?? [];
  const gradeRows = [...rates];
  while (gradeRows.length < 4) {
    gradeRows.push({ grade: "", rate: "" });
  }

  return (
    <div className="ac-tracking-job-info">
      <section className="ac-tracking-job-info-section ac-tracking-job-info-left" aria-label="Customer summary">
        <JobInfoField label="Contract With" value={jobInfo?.contractWith ?? ""} highlight />
        <JobInfoField label="Salesman" value={jobInfo?.salesman ?? ""} />
        <JobInfoField label="Credit History" value={jobInfo?.creditHistory ?? ""} />
        <JobInfoField label="Oldest Invoice" value={jobInfo?.oldestInvoice ?? ""} compact />
        <JobInfoField label="Total Owed" value={jobInfo?.totalOwed ?? ""} compact />
      </section>

      <section className="ac-tracking-job-info-section ac-tracking-job-info-mid" aria-label="Documents">
        <div className="ac-tracking-job-info-doc-rows">
          <JobInfoDocRow label="Contract Date" value={jobInfo?.contractDate ?? ""} openLabel="Open Contract" />
          <JobInfoDocRow label="W-9" openLabel="Open W-9" showValue={false} flag={jobInfo?.w9OnFile ?? ""} />
          <JobInfoDocRow label="WC x Date" value={jobInfo?.wcDate ?? ""} openLabel="Open WC" />
          <JobInfoDocRow label="GL x Date" value={jobInfo?.glDate ?? ""} openLabel="Open GL" />
          <div className="ac-tracking-job-doc-hyperlinks">
            <AccessButton disabled className="ac-tracking-hyperlinks-btn">
              Hyperlinks
            </AccessButton>
          </div>
        </div>
      </section>

      <section className="ac-tracking-job-info-section ac-tracking-job-info-map" aria-label="Site map and notes">
        <div className="ac-tracking-map-pane ac-tracking-map-pane--job-info">
          <span className="ac-tracking-map-placeholder">{mapLabel}</span>
        </div>
      </section>

      <section className="ac-tracking-job-info-section ac-tracking-job-info-grade" aria-label="Bill rates">
        <div className="ac-tracking-grade-table ac-tracking-grade-table--job-info">
          <table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {gradeRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.grade || "—"}</td>
                  <td className="text-right">{r.rate || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ac-recordbar ac-tracking-grade-recordbar">
          <span className="ac-tracking-grade-record-label">Record:</span>
          <span className="ac-tracking-grade-record-nav" aria-hidden>
            |◀
          </span>
          <span className="ac-tracking-grade-record-nav" aria-hidden>
            ◀
          </span>
          <input readOnly className="ac-input ac-tracking-grade-record-input" value="1" aria-label="Record number" />
          <span className="ac-tracking-grade-record-nav" aria-hidden>
            ▶
          </span>
          <span className="ac-tracking-grade-record-nav" aria-hidden>
            ▶|
          </span>
        </div>
      </section>
    </div>
  );
}

export function TrackingScreen({
  week,
  preview,
  customers = [],
  jobs = [],
  jobInfo,
  selectedCustomerId = "",
  selectedProjectId = "",
  userDisplayName = "",
}: TrackingScreenProps) {
  const router = useRouter();
  const [jobInfoTab, setJobInfoTab] = useState("job-info");
  const [trackingTab, setTrackingTab] = useState("tracking");

  const rows = preview?.rows ?? [];

  function navigateFilter(customerId: string, projectId: string) {
    const q = new URLSearchParams({ week: String(week.assignWeek), year: String(week.assignYear) });
    if (customerId) q.set("customerId", customerId);
    if (projectId) q.set("projectId", projectId);
    router.push(`/tracking?${q.toString()}`);
  }

  const selectedJobLabel =
    jobs.find((j) => j.projectId === selectedProjectId)?.label ?? "";
  const userInitials = userDisplayName
    ? userDisplayName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 3)
        .toUpperCase()
    : "—";

  return (
    <div className="ac-tracking ac-tracking--modern flex min-h-0 flex-1 flex-col">
      <AccessToolbar className="ac-tracking-toolbar-band mc-scroll-smooth">
        <select disabled className="ac-select" defaultValue="">
          <option value="">&lt;Search&gt;</option>
        </select>
        <select disabled className="ac-select" defaultValue="">
          <option value="">&lt;Admin&gt;</option>
        </select>
        <select disabled className="ac-select" defaultValue="">
          <option value="">&lt;Reports&gt;</option>
        </select>
        <AccessButton disabled>Health Ins</AccessButton>
        <AccessButton disabled className="ac-tracking-toolbar-alert">Bonus Exp</AccessButton>
        <select disabled className="ac-select" defaultValue="">
          <option value="">&lt;Job Application&gt;</option>
        </select>
        {TOOLBAR_ALERT_ACTIONS.map((label) => (
          <AccessButton key={label} disabled title="Read-only preview" className="ac-tracking-toolbar-alert">
            {label}
          </AccessButton>
        ))}
        {TOOLBAR_ADMIN_ACTIONS.map((label) => (
          <AccessButton key={label} disabled title="Read-only preview">{label}</AccessButton>
        ))}
        <AccessButton variant="go" disabled title="Read-only preview" className="shrink-0">
          WCC Payroll / Sales Report by Customer
        </AccessButton>
      </AccessToolbar>

      <div className="ac-panel ac-panel-elevated ac-tracking-filter-panel ac-tracking-filter-panel--tall shrink-0 overflow-hidden">
        <div className="ac-tracking-job-shell ac-tracking-job-shell--tall">
          <aside className="ac-tracking-col-assign">
            <div className="ac-tracking-top-row">
              <div className="ac-tracking-top-field ac-tracking-top-field--date">
                <div className="ac-flabel">Date</div>
                <div className="ac-readonly ac-tracking-field-box font-mono">{week.displayDate}</div>
              </div>
              <div className="ac-tracking-top-field ac-tracking-top-field--week">
                <div className="ac-flabel">Week</div>
                <div className="ac-readonly ac-tracking-field-box font-mono text-center">{week.assignWeek}</div>
              </div>
              <AccessButton xs disabled className="ac-tracking-top-empl" title="Coming later">
                Empl Quick Search
              </AccessButton>
            </div>

            <div>
              <div className="ac-flabel">Assigned Cust</div>
              <div className="flex items-center gap-1">
                <select
                  className="ac-select ac-tracking-select--customer min-w-0 flex-1"
                  value={selectedCustomerId}
                  onChange={(e) => navigateFilter(e.target.value, "")}
                >
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.label} ({c.rowCount})
                    </option>
                  ))}
                </select>
                <AccessButton xs disabled>+</AccessButton>
                <AccessButton xs disabled>Reset</AccessButton>
              </div>
            </div>

            <div>
              <div className="ac-flabel">Assigned Job</div>
              <div className="flex items-center gap-1">
                <select
                  className="ac-select min-w-0 flex-1"
                  value={selectedProjectId}
                  disabled={!selectedCustomerId}
                  onChange={(e) => navigateFilter(selectedCustomerId, e.target.value)}
                >
                  <option value="">Select job…</option>
                  {jobs.map((j) => (
                    <option key={j.projectId} value={j.projectId}>
                      {j.label}
                    </option>
                  ))}
                </select>
                <AccessButton xs disabled>+</AccessButton>
                <span className="ac-btn ac-btn-primary ac-btn-xs shrink-0 cursor-default">OnSite</span>
              </div>
            </div>

            <div>
              <div className="ac-flabel">Assignment</div>
              <AccessButtonRow>
                <AccessButton disabled title="WRITES_ENABLED=false">New</AccessButton>
                <AccessButton disabled>End</AccessButton>
                <AccessButton disabled>Transfer</AccessButton>
              </AccessButtonRow>
              <AccessButtonRow>
                <AccessButton xs disabled className="ac-tracking-assign-cell" title="Coming later">
                  Cell # Search
                </AccessButton>
              </AccessButtonRow>
            </div>

            <AccessButtonRow>
              <AccessButton disabled>T Sheets HL</AccessButton>
              <AccessButton disabled>View Invoice</AccessButton>
            </AccessButtonRow>
          </aside>

          <div className="ac-tracking-col-detail">
            <AccessTabStrip tabs={JOB_INFO_TABS} active={jobInfoTab} onChange={setJobInfoTab} />

            {jobInfoTab === "job-info" ? (
              <div className="ac-tracking-detail-body ac-tracking-detail-body--job-info">
                <JobInfoTabPanel
                  jobInfo={jobInfo}
                  mapLabel={selectedJobLabel || jobInfo?.customerName || "Site map / notes"}
                />
              </div>
            ) : (
              <div className="ac-tracking-detail-body ac-tracking-detail-body--job-tab">
                <TrackingJobTabBody tabId={jobInfoTab} jobInfo={jobInfo} />
              </div>
            )}
          </div>

          <aside className="ac-tracking-summary-rail" aria-label="Summary and reports">
            <div className="ac-tracking-users">
              <span className="ac-flabel">Users</span>
              <span className="ac-tracking-users-value">{userInitials}</span>
            </div>

            <div>
              <div className="ac-flabel">Reports</div>
              <select disabled className="ac-select w-full" defaultValue="">
                <option value="">&lt;Reports 2&gt;</option>
              </select>
            </div>

            <div className="ac-tracking-summary-fields">
              <div>
                <div className="ac-flabel">TIA</div>
                <div className="ac-readonly ac-tracking-field-box text-right">
                  {jobInfo?.tia || "—"}
                </div>
              </div>
              <div>
                <div className="ac-flabel">CPM</div>
                <div className="ac-readonly ac-tracking-field-box text-right">
                  {jobInfo?.cpm || "—"}
                </div>
              </div>
            </div>

            <div className="ac-tracking-margin-table ac-grid">
              <table>
                <thead>
                  <tr>
                    <th>Total</th>
                    <th>Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {(jobInfo?.marginRows ?? Array.from({ length: 4 }, () => ({ total: "", margin: "" })))
                    .slice(0, 4)
                    .map((row, i) => (
                      <tr key={i}>
                        <td className="text-right">{row.total || "—"}</td>
                        <td className="text-right">{row.margin || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <AccessButton disabled className="self-start">
              Clear HL
            </AccessButton>
          </aside>
        </div>
      </div>

      <div className="ac-panel ac-tracking-actionbar shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <AccessTabStrip
            tabs={TRACKING_TABS}
            active={trackingTab}
            onChange={setTrackingTab}
            className="ac-tracking-action-tabs"
          />
          <AccessButtonRow className="ac-tracking-action-controls flex-1 justify-end">
            <AccessButton disabled>Hrs AutoText</AccessButton>
            <AccessButton disabled>Payroll Change</AccessButton>
            <AccessToolbarDivider />
            <span className="ac-tracking-refresh-label">Refresh</span>
            <AccessButton disabled>All</AccessButton>
            <AccessButton disabled>Job</AccessButton>
            <AccessButton disabled>Emp</AccessButton>
            <AccessButton disabled>Delete</AccessButton>
            <AccessToolbarDivider />
            <div className="ac-tracking-record-nav">
              <AccessButton disabled xs aria-label="First record">
                |◄
              </AccessButton>
              <AccessButton disabled xs aria-label="Previous record">
                ◄
              </AccessButton>
              <input
                readOnly
                className="ac-input ac-tracking-record-input"
                value={jobInfo?.customerName || (selectedCustomerId ? "Filtered customer" : "")}
                title="Current customer filter"
              />
              <AccessButton disabled xs aria-label="Next record">
                ►
              </AccessButton>
              <AccessButton disabled xs aria-label="Last record">
                ►|
              </AccessButton>
            </div>
            <Link href="/customer-menu">
              <AccessButton>Customer Menu</AccessButton>
            </Link>
            <span className="ac-swatches ac-tracking-status-swatches">
              {STATUS_SWATCHES.map((c) => (
                <span key={c} className="ac-swatch" style={{ background: c }} title="Status color" />
              ))}
            </span>
            <AccessButton disabled>History Update</AccessButton>
            <AccessButton disabled>Browse</AccessButton>
            <span className="ac-swatches ac-tracking-palette-swatches">
              {PALETTE_SWATCHES.map((c) => (
                <span key={c} className="ac-swatch" style={{ background: c }} title="Palette" />
              ))}
            </span>
          </AccessButtonRow>
        </div>
      </div>

      {trackingTab === "tracking" ? (
        <div className="ac-tracking-grid-shell flex min-h-0 flex-1 flex-col">
          <div className="ac-grid ac-grid-tracking mc-scroll-smooth min-h-0 flex-1">
            <table>
              <thead>
                <tr>
                  {GRID_COLUMNS.map((col, i) => (
                    <th
                      key={i}
                      className={col.kind === "spacer" ? "ac-grid-spacer" : undefined}
                      style={col.kind === "day" ? { textAlign: "center" } : undefined}
                    >
                      {headerLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={COL_COUNT} className="ac-tracking-empty">
                      No assignments for week {week.assignWeek}/{week.assignYear}.
                      {selectedCustomerId ? " Try clearing the customer filter." : ""}
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr
                      key={`${r.employeeId}-${i}`}
                      className={r.placeholder ? "ac-tracking-row-placeholder" : ""}
                    >
                      {GRID_COLUMNS.map((col, ci) => (
                        <Fragment key={ci}>{renderCell(col, r)}</Fragment>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="ac-recordbar shrink-0">
            <span className="font-mono text-slate-600">
              Record: |◄ ◄ {rows.length === 0 ? 0 : 1} of {rows.length} ► ►|
            </span>
            <span className="text-slate-500">
              {selectedCustomerId ? jobInfo?.customerName || "Filtered" : "Unfiltered"}
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="text-slate-500">Search</span>
              <input disabled className="ac-input w-[130px]" placeholder="Filter rows…" />
            </span>
          </div>
          <p className="ac-tracking-status">
            Read-only
            {preview?.source ? (
              <span className="ac-tracking-status-pill">{preview.source}</span>
            ) : null}
          </p>
        </div>
      ) : (
        <div className="ac-tracking-shell-empty flex-1">
          {TRACKING_TABS.find((t) => t.id === trackingTab)?.label} — read-only shell (SQL wiring pending).
        </div>
      )}
    </div>
  );
}
