"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { compareTrackingRows, dailyTotal, filterTrackingRows, trackingCsv, trackingDays } from "@/lib/trackingGrid";
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
import { NewJobApplicationModal } from "@/components/tracking/NewJobApplicationModal";
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

const TRACKING_REPORT_OPTIONS = [
  { label: "Report Menu", href: "/reports" },
  { label: "Accounts Receivable Report", href: "/accounts-receivable" },
  { label: "Active Customers", href: "/active-customers" },
  { label: "Seamus QB", href: "/open-invoices" },
  { label: "Seamus Lien Summary", href: "/lien-summary" },
  { label: "Manpower Contact Report", href: "/manpower-report" },
  { label: "Invoices Contact Report", href: "/invoices-contact-report" },
  { label: "Verify Hours Contact Report", href: "/verify-hours-contact-report" },
  { label: "NOC", href: "/notice-of-contract-search" },
  { label: "NOI", href: "/notice-of-identification-search" },
  { label: "Check Weekly Rates", href: "/check-weekly-rates" },
  { label: "Employee Bonus Expense Report", href: "/employee-bonus-expense-report" },
  { label: "Attendance", href: "/attendance" },
  { label: "Sick Hours Report - All", href: "/sick-hours-report" },
  { label: "Job Orders Report", href: "/job-orders-report" },
  { label: "Copy to Per Diem", href: "/copy-to-per-diem" },
  ...[
    "Invoices by Week Report", "Margin by Week Report", "OSHA Link Sent Report",
    "Schooling Report", "Tools Report", "401(k) Report",
  ].map(label => ({ label, href: `pending:${label}` })),
  { label: "Insurance Certificate Request Report", href: "/insurance-certificate-request-search" },
  { label: "Employee Review Search", href: "pending:Employee Review Search" },
  { label: "Job Address and WCC Changes", href: "pending:Job Address and WCC Changes" },
  { label: "WCC On Site", href: "pending:WCC On Site" },
  { label: "Directions", href: "pending:Directions" },
  { label: "Multiple Jobs per Employee", href: "pending:Multiple Jobs per Employee" },
];
const TRACKING_REPORT_OPTIONS_2 = [
  { label: "Vacation Hours Report", href: "/vacation-hours-report" },
  { label: "Employee Advance Report", href: "/employee-advance-report" },
  { label: "Employee Health Insurance By Month", href: "/employee-health-insurance-by-month" },
  { label: "Full-Time Employees By Month", href: "/full-time-employees-by-month" },
  { label: "Payroll Exclusions", href: "/payroll-exclusions" },
  { label: "Contract Report", href: "/contract-report" },
  { label: "UI Report", href: "/ui-report" },
  { label: "Accident Report Search", href: "/accident-report-search" },

];

const LEGACY_SEARCH_OPTIONS = [
  { label: "All Contacts Search", href: "/customers" },
  { label: "Customer Search", href: "/customers" },
  { label: "[Main] Employee Search 3", href: "/employees" },
  { label: "[Main] Employee Search 3 NEW", href: "/employees" },
  { label: "Permits Search", href: "/customer-permits" },
  { label: "Employees in Tracking", href: "/employees-in-tracking" },
  { label: "Invoice Search", href: "/invoice-search" },
  { label: "Current Jobs", href: "/current-jobs" },
  { label: "Phone Number Search", href: "/phone-number-search" },
] as const;

const LEGACY_ADMIN_OPTIONS = [
  { label: "UI Report", href: "/ui-report" },
  { label: "Accident Report Search", href: "/accident-report-search" },
  { label: "Vacation Hours Report", href: "/vacation-hours-report" },
  { label: "Employee Hours By Week Report", href: "/employee-hours-by-week" },
  { label: "Employee Hours By Month Report", href: "/employee-hours-by-month" },
  { label: "Full-Time Employees by Month", href: "/full-time-employees-by-month" },
  { label: "Employee Health Ins By Month Report", href: "/employee-health-insurance-by-month" },
  { label: "Employee Advance Report", href: "/employee-advance-report" },
  { label: "Insurance Certificate Request Search", href: "/insurance-certificate-request-search" },
  { label: "Payroll Exclusions", href: "/payroll-exclusions" },
  { label: "Weekly Customer Margin Report", href: "/weekly-customer-margin-report" },
  { label: "Employee Research", href: "/employee-research" },
  { label: "Yearly Revenue", href: "/yearly-revenue" },
  { label: "Newsletter Search", href: "/newsletter-search" },
  { label: "Email Addresses", href: "/email-addresses" },
  { label: "Employee Licenses", href: "/employee-licenses" },
  { label: "Health Ins", href: "/employees" },
  { label: "ID Drivers License", href: "/employees" },
  { label: "Interview Questions", href: "/interview-questions" },
  { label: "OSHA", href: "/osha" },
  { label: "Resume or Work History", href: "/resume-work-history" },
  { label: "Smart Phone", href: "/smart-phone" },
  { label: "Face Meeting", href: "/face-meeting" },
  { label: "Tracking Search", href: "/tracking-search" },
  { label: "Compare Tracking Weeks", href: "/tracking" },
  { label: "Deleted Employees", href: "/employees" },
] as const;

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

function dateInputValue(usDate: string): string {
  const [month, day, year] = usDate.split("/");
  if (!month || !day || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

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
        <input
          type="text"
          className="ac-input ac-tracking-job-doc-value"
          defaultValue={value || ""}
          aria-label={label}
        />
      ) : (
        <span className="ac-tracking-job-doc-value-spacer" aria-hidden />
      )}
      <input
        type="text"
        className="ac-input ac-tracking-job-doc-flag"
        defaultValue={flag || ""}
        aria-label={`${label} flag`}
      />
      <AccessButton className="ac-tracking-job-doc-open">
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
            <AccessButton className="ac-tracking-hyperlinks-btn">
              Hyperlinks
            </AccessButton>
          </div>
        </div>
      </section>

      <section className="ac-tracking-job-info-section ac-tracking-job-info-map" aria-label="Site map and notes">
        <div className="ac-tracking-map-pane ac-tracking-map-pane--job-info">
          <strong>{jobInfo?.projectName || mapLabel}</strong>
          <span className="ac-tracking-map-placeholder">{jobInfo?.siteAddress || mapLabel}</span>
          {jobInfo?.projectNotes && <span title={jobInfo.projectNotes}>{jobInfo.projectNotes}</span>}
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
          <input
            type="number"
            min="1"
            className="ac-input ac-tracking-grade-record-input"
            defaultValue="1"
            aria-label="Record number"
          />
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
  const [reportMessage, setReportMessage] = useState("");
  const [jobInfoTab, setJobInfoTab] = useState("job-info");
  const [trackingTab, setTrackingTab] = useState("tracking");
  const [newJobApplicationOpen, setNewJobApplicationOpen] = useState(false);
  const [applicationVariant, setApplicationVariant] = useState<"employee" | "sub">("employee");

  const [query, setQuery] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sort, setSort] = useState<{ key: keyof TrackingPreviewRow; direction: "asc" | "desc" } | null>(null);
  const visible = useMemo(() => {
    const filtered = filterTrackingRows(preview?.rows ?? [], query, employeeFilter);
    return sort ? filtered.sort((a,b) => compareTrackingRows(a.row,b.row,sort.key,sort.direction)) : filtered;
  }, [preview, query, employeeFilter, sort]);
  const rows = visible.map(item => item.row);
  const position = Math.max(0, visible.findIndex(item => item.index === selectedIndex));
  const selected = visible[position]?.row;
  const selectedSourceIndex = visible[position]?.index;
  const summaryHours = rows.reduce((sum,row) => sum + dailyTotal(row),0);
  function selectRecord(index: number) {
    if (!visible[index]) return;
    setSelectedIndex(visible[index].index);
    const element = document.getElementById(`tracking-row-${visible[index].index}`);
    element?.scrollIntoView({ block:"nearest", inline:"nearest" });
    element?.focus({ preventScroll:true });
  }
  function columnKey(col: GridCol): keyof TrackingPreviewRow | null {
    return col.kind === "field" ? col.key : col.kind === "day" ? col.hoursKey : col.kind === "payroll" ? "payrollCo" : col.kind === "hl" ? "hlCv" : null;
  }
  function toggleSort(key: keyof TrackingPreviewRow) { setSort(v => ({ key, direction:v?.key === key && v.direction === "asc" ? "desc":"asc" })); }
  function exportRows() {
    const columns = GRID_COLUMNS.filter(col => col.kind !== "spacer");
    const csv = trackingCsv(columns.map(headerLabel),rows.map(row => columns.map(col => row[columnKey(col)!])));
    const url = URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
    const anchor=document.createElement("a"); anchor.href=url; anchor.download=`tracking-${week.assignYear}-${week.assignWeek}.csv`; anchor.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function openEmployee() { if (selected) router.push(`/employees/${encodeURIComponent(selected.employeeId)}`); }

  function navigateFilter(customerId: string, projectId: string) {
    setSelectedIndex(null);
    const q = new URLSearchParams({ date: dateInputValue(week.displayDate) });
    if (customerId) q.set("customerId", customerId);
    if (projectId) q.set("projectId", projectId);
    router.push(`/tracking?${q.toString()}`);
  }

  function navigateSearch(href: string) {
    if (href) router.push(href);
  }

  function navigateWorkWeek(date: string) {
    if (date) router.push(`/tracking?date=${encodeURIComponent(date)}`);
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
        <select
          className="ac-select"
          defaultValue=""
          aria-label="Search menu"
          onChange={(event) => navigateSearch(event.target.value)}
        >
          <option value="">&lt;Search&gt;</option>
          {LEGACY_SEARCH_OPTIONS.map((option) => (
            <option key={option.label} value={option.href}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="ac-select"
          defaultValue=""
          aria-label="Admin menu"
          onChange={(event) => navigateSearch(event.target.value)}
        >
          <option value="">&lt;Admin&gt;</option>
          {LEGACY_ADMIN_OPTIONS.map((option) => (
            <option key={option.label} value={option.href}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="ac-select"
          defaultValue=""
          aria-label="Reports menu"
          onChange={(event) => { const value = event.target.value; if (value.startsWith("pending:")) setReportMessage(`${value.slice(8)} is not connected yet.`); else { setReportMessage(""); navigateSearch(value); } event.target.value = ""; }}
        >
          <option value="">&lt;Reports&gt;</option>
          {TRACKING_REPORT_OPTIONS.map(option => <option key={option.href} value={option.href}>{option.label}</option>)}
        </select>
        <AccessButton onClick={() => router.push("/employee-health-insurance-by-month")}>Health Ins</AccessButton>
        <AccessButton className="ac-tracking-toolbar-alert" onClick={() => router.push("/employee-bonus-expense-report")}>Bonus Exp</AccessButton>
        <select
          className="ac-select"
          defaultValue=""
          aria-label="Job application menu"
          onChange={(event) => {
            if (["mls", "hsg", "datapay"].includes(event.target.value)) router.push(`/website-application?source=${event.target.value}`);
            if (["new", "sub"].includes(event.target.value)) { setApplicationVariant(event.target.value === "sub" ? "sub" : "employee"); setNewJobApplicationOpen(true); }
            event.target.value = "";
          }}
        >
          <option value="">&lt;Job Application&gt;</option>
          <option value="mls">Web App MLS</option><option value="new">New Employee MLS</option>
          <option value="sub">New SUB</option>
          <option value="hsg">Web App HSG</option>
          <option value="datapay">Datapay App</option>
        </select>
        {TOOLBAR_ALERT_ACTIONS.map((label) => (
          <AccessButton
            key={label}
            className="ac-tracking-toolbar-alert"
            onClick={() => {
              if (label === "Job App Problems") router.push("/job-app-problems");
              if (label === "Contracts") router.push("/contract-report");
              if (label === "Missing WC" || label === "Expired WC" || label === "Missing GL" || label === "Expired GL") router.push("/insurance-certificate-request-search");
            }}
          >
            {label}
          </AccessButton>
        ))}
        {TOOLBAR_ADMIN_ACTIONS.map((label) => (
          <AccessButton
            key={label}
            onClick={() => {
              if (label === "Office Staff Notes") router.push("/office-staff-notes");
              if (label === "New Job App") { setApplicationVariant("employee"); setNewJobApplicationOpen(true); }
            }}
          >
            {label}
          </AccessButton>
        ))}
        <AccessButton
          variant="go"
          className="shrink-0"
          onClick={() => window.open("/wcc-payroll", "_blank", "noopener,noreferrer")}
        >
          WCC Payroll / Sales Report by Customer
        </AccessButton>
      </AccessToolbar>

      {reportMessage && <p role="status" className="ac-report-menu-status">{reportMessage}</p>}
      {preview?.error && <p role="alert" className="ac-report-menu-status">{preview.error} Check the SQL Server connection in Admin.</p>}
      <div className="ac-panel ac-panel-elevated ac-tracking-filter-panel ac-tracking-filter-panel--tall shrink-0 overflow-hidden">
        <div className="ac-tracking-job-shell ac-tracking-job-shell--tall">
          <aside className="ac-tracking-col-assign">
            <div className="ac-tracking-top-row">
              <div className="ac-tracking-top-field ac-tracking-top-field--date">
                <div className="ac-flabel">Date</div>
                <input
                  type="date"
                  className="ac-input ac-tracking-field-box font-mono"
                  value={dateInputValue(week.displayDate)}
                  aria-label="Tracking work week date"
                  onChange={(event) => navigateWorkWeek(event.target.value)}
                />
              </div>
              <div className="ac-tracking-top-field ac-tracking-top-field--week">
                <div className="ac-flabel">Week</div>
                <div className="ac-readonly ac-tracking-field-box font-mono text-center">{week.assignWeek}</div>
              </div>
              <AccessButton xs className="ac-tracking-top-empl" onClick={() => router.push("/employee-quick-search")}>
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
                <AccessButton xs aria-label="Open customers" onClick={() => router.push("/customers")}>+</AccessButton>
                <AccessButton xs onClick={() => { setQuery(""); setEmployeeFilter(""); setSort(null); navigateFilter("", ""); }}>Reset</AccessButton>
      </div>
    </div>

            <div>
              <div className="ac-flabel">Assigned Job</div>
              <div className="flex items-center gap-1">
                <select
                  className="ac-select min-w-0 flex-1"
                  value={selectedProjectId}
                  onChange={(e) => navigateFilter(selectedCustomerId, e.target.value)}
                >
                  <option value="">Select job…</option>
                  {jobs.map((j) => (
                    <option key={j.projectId} value={j.projectId}>
                      {j.label}
                    </option>
                  ))}
                </select>
                <AccessButton xs aria-label="Open jobs" onClick={() => router.push(selectedCustomerId ? `/jobs?customerId=${encodeURIComponent(selectedCustomerId)}` : "/jobs")}>+</AccessButton>
                <span className="ac-btn ac-btn-primary ac-btn-xs shrink-0 cursor-default">OnSite</span>
              </div>
            </div>

            <div>
              <div className="ac-flabel">Assignment</div>
              <AccessButtonRow>
                <AccessButton onClick={() => router.push("/employee-quick-search")}>New</AccessButton>
                <AccessButton disabled={!selected} onClick={() => setReportMessage("Ending an assignment is unavailable until database writes are enabled.")}>End</AccessButton>
                <AccessButton disabled={!selected} onClick={() => setReportMessage("Transferring an assignment is unavailable until database writes are enabled.")}>Transfer</AccessButton>
              </AccessButtonRow>
              <AccessButtonRow>
                <AccessButton xs className="ac-tracking-assign-cell" onClick={() => router.push("/phone-number-search")}>
                  Cell # Search
                </AccessButton>
              </AccessButtonRow>
            </div>

            <AccessButtonRow>
              <AccessButton onClick={() => setTrackingTab("ts-history")}>T Sheets HL</AccessButton>
              <AccessButton onClick={() => router.push("/invoice-search")}>View Invoice</AccessButton>
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
              <select className="ac-select w-full" defaultValue="" aria-label="Reports 2 menu" onChange={(event) => { const value = event.target.value; if (value.startsWith("pending:")) setReportMessage(`${value.slice(8)} is not connected yet.`); else { setReportMessage(""); navigateSearch(value); } event.target.value = ""; }}>
                <option value="">&lt;Reports 2&gt;</option>
                {TRACKING_REPORT_OPTIONS_2.map(option => <option key={option.href} value={option.href}>{option.label}</option>)}
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

            <AccessButton className="self-start" onClick={() => setReportMessage("Clearing timesheet hyperlinks is unavailable until database writes are enabled.")}>
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
            <AccessButton disabled={!selected} onClick={() => setReportMessage("Automatic texts require the messaging service to be configured.")}>Hrs AutoText</AccessButton>
            <AccessButton disabled={!selected} onClick={openEmployee}>Payroll Change</AccessButton>
            <AccessToolbarDivider />
            <span className="ac-tracking-refresh-label">Refresh</span>
            <AccessButton onClick={() => { setQuery(""); setEmployeeFilter(""); navigateFilter("", ""); router.refresh(); }}>All</AccessButton>
            <AccessButton onClick={() => { setQuery(""); setEmployeeFilter(""); router.refresh(); }}>Job</AccessButton>
            <AccessButton disabled={!selected} onClick={() => { if (selected) setEmployeeFilter(selected.employeeId); router.refresh(); }}>Emp</AccessButton>
            <AccessButton disabled={!selected} onClick={() => setReportMessage("Deleting an assignment is unavailable until database writes are enabled.")}>Delete</AccessButton>
            <AccessToolbarDivider />
            <div className="ac-tracking-record-nav">
              <AccessButton xs aria-label="First record" disabled={!rows.length || position === 0} onClick={() => selectRecord(0)}>
                |◄
              </AccessButton>
              <AccessButton xs aria-label="Previous record" disabled={!rows.length || position === 0} onClick={() => selectRecord(position-1)}>
                ◄
              </AccessButton>
              <input
                type="text"
                className="ac-input ac-tracking-record-input"
                readOnly value={selected ? `${selected.firstName} ${selected.lastName}` : ""}
                title="Current customer filter"
              />
              <AccessButton xs aria-label="Next record" disabled={!rows.length || position >= rows.length-1} onClick={() => selectRecord(position+1)}>
                ►
              </AccessButton>
              <AccessButton xs aria-label="Last record" disabled={!rows.length || position >= rows.length-1} onClick={() => selectRecord(rows.length-1)}>
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
            <AccessButton onClick={() => setTrackingTab("ts-history")}>History Update</AccessButton>
            <AccessButton disabled={!selected} onClick={openEmployee}>Browse</AccessButton><AccessButton disabled={!rows.length} onClick={exportRows}>Export CSV</AccessButton>
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
                      aria-sort={sort?.key === columnKey(col) ? (sort.direction === "asc" ? "ascending" : "descending") : undefined} style={col.kind === "day" ? { textAlign: "center" } : undefined}
                    >
                      {columnKey(col) ? <button type="button" className="tracking-sort" onClick={() => toggleSort(columnKey(col)!)}>{headerLabel(col)}{sort?.key === columnKey(col) ? (sort.direction === "asc" ? " ▲" : " ▼") : ""}</button> : headerLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={COL_COUNT} className="ac-tracking-empty">
                      {query || employeeFilter ? "No assignments match your filters." : `No assignments for week ${week.assignWeek}/${week.assignYear}.`}
                      {selectedCustomerId ? " Try clearing the customer filter." : ""}
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr
                      key={`${r.employeeId}-${i}`}
                      id={`tracking-row-${visible[i].index}`} aria-selected={selectedSourceIndex === visible[i].index} tabIndex={0} onClick={() => setSelectedIndex(visible[i].index)} onDoubleClick={() => router.push(`/employees/${encodeURIComponent(r.employeeId)}`)} onKeyDown={event => { if(event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); selectRecord(i + (event.key === "ArrowDown" ? 1 : -1)); } if(event.key === "Enter") router.push(`/employees/${encodeURIComponent(r.employeeId)}`); }} className={`${r.placeholder ? "ac-tracking-row-placeholder" : ""} ${selectedSourceIndex === visible[i].index ? "tracking-selected-row" : ""}`}
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
              Record: {rows.length === 0 ? 0 : position+1} of {rows.length} · {summaryHours.toFixed(2)} daily hours
            </span>
            <span className="text-slate-500">
              {selectedCustomerId ? jobInfo?.customerName || "Filtered" : "Unfiltered"}
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="text-slate-500">Search</span>
              <input type="search" aria-label="Filter tracking rows" className="ac-input w-[130px]" placeholder="Filter rows…" value={query} onChange={event => setQuery(event.target.value)} />{(query || employeeFilter) && <AccessButton xs onClick={() => { setQuery(""); setEmployeeFilter(""); }}>Clear Filters</AccessButton>}
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
        <div className="ac-tracking-grid-shell flex min-h-0 flex-1 flex-col">
          <div className="ac-grid ac-grid-tracking min-h-0 flex-1 overflow-auto">
            <table><thead><tr><th>Employee</th><th>Job</th>
              {trackingTab === "hours" ? <>{["Sat","Sun","Mon","Tue","Wed","Thu","Fri"].map(day => <th key={day}>{day}</th>)}<th>Daily Total</th><th>Notes</th></> :
                trackingTab === "hours2" ? <><th>Daily Total</th><th>Recorded Total</th><th>Pay Rate</th><th>Bill Rate</th><th>Bill Rate OT</th><th>Margin</th><th>Notes</th></> :
                trackingTab === "benefits" ? <><th>Health</th><th>Per Diem</th><th>WCC State</th><th>WCC</th><th>Parking / Hr</th><th>Payroll Co</th></> :
                <><th>Week Ending</th><th>Assignment User</th><th>Assignment Timestamp</th><th>Hours AutoText User</th><th>Hours AutoText Timestamp</th><th>HL AutoText User</th><th>HL AutoText Timestamp</th></>}
            </tr></thead><tbody>{visible.map(({row,index}) => <tr key={index} id={`tracking-row-${index}`} className={selectedSourceIndex === index ? "tracking-selected-row" : ""} onClick={() => setSelectedIndex(index)} onDoubleClick={() => router.push(`/employees/${encodeURIComponent(row.employeeId)}`)}><td><Link href={`/employees/${encodeURIComponent(row.employeeId)}`}>{row.firstName} {row.lastName}</Link></td><td>{row.jobSite}</td>
              {(trackingTab === "hours" ? [...trackingDays.map(key => row[key]),dailyTotal(row).toFixed(2),row.hoursNote] :
                trackingTab === "hours2" ? [dailyTotal(row).toFixed(2),row.totalHours,row.payRate,row.billRate,row.billRateOT,row.trackMargin,row.hoursNote] :
                trackingTab === "benefits" ? [row.health,row.perDiem,row.wccState,row.wcc,row.parkingPerHr,row.payrollCo] :
                [row.weekEnding,row.assignmentUser,row.assignmentTimestamp,row.hrsAutoTextUser,row.hrsAutoTextTimestamp,row.hlAutoTextUser,row.hlAutoTextTimestamp]).map((value,i) => <td key={i}>{value}</td>)}
            </tr>)}{!rows.length && <tr><td colSpan={11}>No assignments match the current week and filters.</td></tr>}</tbody></table>
          </div>
          <div className="ac-recordbar"><span>{rows.length} records · {summaryHours.toFixed(2)} daily hours</span><input type="search" aria-label="Filter tracking rows" className="ac-input" value={query} placeholder="Filter rows…" onChange={e => setQuery(e.target.value)} /><AccessButton xs onClick={() => { setQuery(""); setEmployeeFilter(""); }}>Clear Filters</AccessButton></div>
          <p className="ac-tracking-status">{preview?.source ? `Live SQL · ${preview.source}` : "SQL unavailable"} · {trackingTab === "ts-history" ? "Assignment and message timestamps for the selected week." : "Values from the loaded tracking assignments."}</p>
        </div>
      )}
      <NewJobApplicationModal
        key={applicationVariant}
        variant={applicationVariant}
        open={newJobApplicationOpen}
        onClose={() => { setNewJobApplicationOpen(false); router.push("/employee-application"); }}
      />
    </div>
  );
}
