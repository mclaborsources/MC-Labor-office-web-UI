import type { TrackingJobContact, TrackingJobInfo, TrackingReferralAgency } from "@/types/tracking";
import { AccessButton } from "@/components/access/AccessButton";
import { AccessButtonRow } from "@/components/access/AccessToolbar";

const SUBFORM_ROWS_COMPACT = 5;
const SUBFORM_ROWS_FULL = 8;

function padRows<T>(rows: T[], empty: () => T, minRows = SUBFORM_ROWS_COMPACT): T[] {
  const out = [...rows];
  while (out.length < minRows) out.push(empty());
  return out;
}

function SubformRecordBar({ showSearch = true }: { showSearch?: boolean }) {
  return (
    <div className="ac-recordbar ac-tracking-subform-recordbar">
      <span className="font-mono text-[9px]">Record:</span>
      <span className="font-mono text-[9px]">|◄ ◄</span>
      <input readOnly className="ac-input ac-tracking-subform-record-input" value="1" aria-label="Record" />
      <span className="font-mono text-[9px]">► ►|</span>
      <span className="font-mono text-[9px]">*</span>
      <span className="ac-tracking-subform-filter font-mono text-[9px]">No Filter</span>
      {showSearch && (
        <>
          <span className="ac-tracking-subform-search-label font-mono text-[9px]">Search</span>
          <input readOnly className="ac-input ac-tracking-subform-search-input" aria-label="Search" />
        </>
      )}
    </div>
  );
}

function ContactPickerGrid({
  contacts,
  showSelect = true,
  fill = false,
  hideSelector = false,
  gridClassName = "",
}: {
  contacts: TrackingJobContact[];
  showSelect?: boolean;
  fill?: boolean;
  hideSelector?: boolean;
  gridClassName?: string;
}) {
  const rows = padRows(contacts, () => ({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    cell: "",
    officePhone: "",
    notes: "",
    sort: "",
  }));

  return (
    <div
      className={`ac-tracking-subform-grid${fill ? " ac-tracking-subform-grid--fill" : ""}${gridClassName ? ` ${gridClassName}` : ""}`}
    >
      <div className="ac-grid ac-tracking-subform-table">
        <table>
          <thead>
            <tr>
              {!hideSelector && <th className="w-6" aria-label="Selector" />}
              <th>Cust Contact</th>
              <th>Title</th>
              <th>Email</th>
              <th>Notes</th>
              {showSelect && <th className="ac-tracking-subform-select-head">Select</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i}>
                {!hideSelector && <td />}
                <td>{[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}</td>
                <td>{c.title || "—"}</td>
                <td className="truncate max-w-[6rem]">{c.email || "—"}</td>
                <td className="truncate max-w-[5rem]">{c.notes || "—"}</td>
                {showSelect && (
                  <td className="ac-tracking-subform-select-cell">
                    <input
                      readOnly
                      className="ac-input ac-tracking-subform-select-input"
                      value=""
                      aria-label={
                        [c.firstName, c.lastName].filter(Boolean).join(" ")
                          ? `Select ${[c.firstName, c.lastName].filter(Boolean).join(" ")}`
                          : "Select contact"
                      }
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SubformRecordBar />
    </div>
  );
}

function NotesTextarea({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`ac-tracking-notes-block ${className}`}>
      {label && <div className="ac-flabel">{label}</div>}
      <textarea readOnly className="ac-tracking-notes-area" aria-label={label ?? "Notes"} />
    </div>
  );
}

export function CoContactsTabPanel({ contacts }: { contacts: TrackingJobContact[] }) {
  const rows = padRows(
    contacts,
    () => ({
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      cell: "",
      officePhone: "",
      notes: "",
      sort: "",
    }),
    SUBFORM_ROWS_FULL,
  );

  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--full-grid">
      <div className="ac-tracking-subform-grid ac-tracking-subform-grid--fill">
        <div className="ac-grid ac-tracking-subform-table">
          <table>
            <thead>
              <tr>
                <th className="w-6" aria-label="Selector" />
                <th>FName</th>
                <th>LName</th>
                <th>Title</th>
                <th>Email</th>
                <th>Cell</th>
                <th>Office Phone</th>
                <th>Notes</th>
                <th className="w-10">Sort</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={i}>
                  <td />
                  <td>{c.firstName || "—"}</td>
                  <td>{c.lastName || "—"}</td>
                  <td>{c.title || "—"}</td>
                  <td className="truncate max-w-[5rem]">{c.email || "—"}</td>
                  <td>{c.cell || "—"}</td>
                  <td>{c.officePhone || "—"}</td>
                  <td className="truncate max-w-[4rem]">{c.notes || "—"}</td>
                  <td className="text-center">{c.sort || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SubformRecordBar />
      </div>
    </div>
  );
}

export function BillRatesTabPanel({ rates }: { rates: { grade: string; rate: string }[] }) {
  const rows = padRows(rates, () => ({ grade: "", rate: "" }));

  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--full-grid">
      <div className="ac-tracking-subform-grid ac-tracking-subform-grid--fill">
        <div className="ac-grid ac-tracking-subform-table">
          <table>
            <thead>
              <tr>
                <th className="w-6" aria-label="Selector" />
                <th>Grade</th>
                <th>Bill Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td />
                  <td>{r.grade || "—"}</td>
                  <td className="text-right">{r.rate || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SubformRecordBar />
      </div>
    </div>
  );
}

export function EmployeesTabPanel() {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--employees">
      <div className="ac-tracking-job-tab-col ac-tracking-job-tab-col--actions ac-tracking-job-tab-col--employees">
        <div className="ac-tracking-btn-grid ac-tracking-btn-grid--2">
          <AccessButton xs disabled>
            All &quot;Y&quot;
          </AccessButton>
          <AccessButton xs disabled>
            Clear &quot;Y&quot;
          </AccessButton>
        </div>
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          Select
        </AccessButton>
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide ac-tracking-job-tab-btn-bottom">
          Text Verify on Job
        </AccessButton>
      </div>

      <div className="ac-tracking-job-tab-col ac-tracking-job-tab-col--actions ac-tracking-job-tab-col--employees">
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          View Directions
        </AccessButton>
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          Print Directions
        </AccessButton>
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          Send Directions
        </AccessButton>
      </div>

      <div className="ac-tracking-message-pane ac-tracking-message-pane--employees">
        <div className="ac-flabel ac-tracking-message-label">Message</div>
        <textarea readOnly className="ac-tracking-notes-area ac-tracking-notes-area--fill" aria-label="Message" />
        <AccessButton disabled className="ac-tracking-job-tab-btn-center">
          Send as Text
        </AccessButton>
      </div>

      <div className="ac-tracking-message-pane ac-tracking-message-pane--employees">
        <div className="ac-flabel ac-tracking-message-label">Select Hours/Timesheet Text:</div>
        <textarea
          readOnly
          className="ac-tracking-notes-area ac-tracking-notes-area--fill"
          aria-label="Hours timesheet text"
        />
        <AccessButton disabled className="ac-tracking-job-tab-btn-center">
          Send Hours/Timesheet Text
        </AccessButton>
      </div>
    </div>
  );
}

export function SalesmenTabPanel({
  salesmen,
}: {
  salesmen: { id: string; name: string }[];
}) {
  const rows = padRows(salesmen, () => ({ id: "", name: "" }));

  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--salesmen">
      <div className="ac-tracking-salesmen-left-pane">
        <div className="ac-tracking-btn-grid ac-tracking-btn-grid--2">
          <AccessButton xs disabled>
            All &quot;Y&quot;
          </AccessButton>
          <AccessButton xs disabled>
            Email Directions
          </AccessButton>
          <AccessButton xs disabled>
            Clear &quot;Y&quot;
          </AccessButton>
          <AccessButton xs disabled>
            Text Directions
          </AccessButton>
        </div>
        <AccessButton disabled className="ac-tracking-job-tab-btn-center ac-tracking-salesmen-send-btn">
          Send as Text
        </AccessButton>
      </div>

      <div className="ac-tracking-salesmen-center">
        <div className="ac-tracking-salesmen-message">
          <textarea readOnly className="ac-tracking-notes-area ac-tracking-notes-area--fill" aria-label="Message" />
        </div>

        <div className="ac-tracking-subform-grid ac-tracking-subform-grid--fill ac-tracking-subform-grid--salesmen">
          <div className="ac-grid ac-tracking-subform-table ac-tracking-subform-table--salesmen">
            <table>
              <thead>
                <tr>
                  <th>Salesman</th>
                  <th className="ac-tracking-subform-select-head">Select</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.id || i}>
                    <td>{s.name || "—"}</td>
                    <td className="ac-tracking-subform-select-cell">
                      <input
                        readOnly
                        className="ac-input ac-tracking-subform-select-input"
                        value=""
                        aria-label={s.name ? `Select ${s.name}` : "Select salesman"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SubformRecordBar showSearch={false} />
        </div>
      </div>

      <div className="ac-tracking-salesmen-right-pane">
        <div className="ac-tracking-btn-grid ac-tracking-btn-grid--2 ac-tracking-salesmen-side-grid">
          <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
            Select All
          </AccessButton>
          <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
            View Future Calls
          </AccessButton>
          <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
            Clear All
          </AccessButton>
          <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
            Email Future Calls
          </AccessButton>
        </div>
      </div>
    </div>
  );
}

const S_ADMIN_BUTTONS: ({ label: string; warn?: boolean } | null)[][] = [
  [
    { label: "Update Unassigned to Available" },
    { label: "Copy Forward History" },
    { label: "MLS Job App Problems", warn: true },
  ],
  [
    { label: "Cust Contact Kickbacks" },
    { label: "Employee Email Kickbacks" },
    { label: "Employee Text Kickbacks" },
  ],
  [
    { label: "Import Employees" },
    { label: "Import Employee Carriers" },
    { label: "Import Employee New Addresses" },
    { label: "Import Customers - 3 Contacts [NR]" },
  ],
  [
    { label: "Import Customers" },
    { label: "Import Customers - 2 Contacts" },
    { label: "Import Customers - 3 Contacts" },
    { label: "Import to Update Hunter" },
  ],
  [
    { label: "Email/Text Templates" },
    null,
    { label: "Edit Salesman Report" },
    { label: "Wcc Rates" },
  ],
];

export function SAdminTabPanel() {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--s-admin">
      <div className="ac-tracking-s-admin-view-row">
        <span className="ac-flabel ac-tracking-s-admin-view-label">View:</span>
        <select disabled className="ac-select ac-tracking-s-admin-view-select" defaultValue="01">
          <option value="01">01 Tracking</option>
        </select>
        <AccessButton xs disabled>
          Save View
        </AccessButton>
        <AccessButton xs disabled>
          Delete View
        </AccessButton>
      </div>
      <div className="ac-tracking-s-admin-grid">
        {S_ADMIN_BUTTONS.map((col, ci) => (
          <div key={ci} className="ac-tracking-s-admin-col">
            {col.map((btn, bi) =>
              btn ? (
                <AccessButton
                  key={btn.label}
                  disabled
                  className={btn.warn ? "ac-tracking-s-admin-btn-warn" : undefined}
                >
                  {btn.label}
                </AccessButton>
              ) : (
                <div key={`spacer-${bi}`} className="ac-tracking-s-admin-spacer" aria-hidden />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleActionGroup({
  title,
  buttons,
  checks,
  reportLabel,
}: {
  title: string;
  buttons: string[];
  checks: string[];
  reportLabel?: string;
}) {
  return (
    <div className="ac-tracking-schedule-group">
      <div className="ac-tracking-schedule-group-title">{title}</div>
      {buttons.map((label) => (
        <AccessButton key={label} disabled className="ac-tracking-job-tab-btn-wide">
          {label}
        </AccessButton>
      ))}
      {checks.map((label) => (
        <label key={label} className="ac-tracking-schedule-check-row">
          <span>{label}</span>
          <input type="checkbox" disabled aria-label={label} />
        </label>
      ))}
      {reportLabel && (
        <AccessButton disabled className="ac-tracking-report-btn ac-tracking-schedule-report-btn">
          {reportLabel}
        </AccessButton>
      )}
    </div>
  );
}

export function ScheduleTimesheetTabPanel({ contacts }: { contacts: TrackingJobContact[] }) {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--schedule">
      <div className="ac-tracking-schedule-actions-pane">
        <ScheduleActionGroup
          title="Schedule"
          buttons={["View Schedule", "Email Schedule"]}
          checks={["Show Rates", "Show Cell"]}
          reportLabel="Schedule Report"
        />
        <ScheduleActionGroup
          title="Timesheet"
          buttons={["View Timesheet", "Email Timesheet"]}
          checks={["Show Hours"]}
        />
      </div>

      <ContactPickerGrid
        contacts={contacts}
        fill
        hideSelector
        gridClassName="ac-tracking-subform-grid--schedule"
      />

      <div className="ac-tracking-schedule-right-pane">
        <div className="ac-tracking-radio-row">
          <label className="ac-tracking-radio-label">
            <input type="radio" name="sched-audience" defaultChecked disabled />
            Customers/Employees
          </label>
          <label className="ac-tracking-radio-label">
            <input type="radio" name="sched-audience" disabled />
            Salesmen
          </label>
        </div>
        <div className="ac-tracking-schedule-notes-header">
          <span className="ac-flabel ac-tracking-schedule-notes-label">Additional Notes:</span>
          <AccessButton xs disabled>
            Select Employees
          </AccessButton>
        </div>
        <textarea readOnly className="ac-tracking-notes-area ac-tracking-notes-area--fill" aria-label="Additional notes" />
      </div>
    </div>
  );
}

export function VerifyHoursTabPanel({ contacts }: { contacts: TrackingJobContact[] }) {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--verify">
      <div className="ac-tracking-job-tab-col ac-tracking-job-tab-col--narrow">
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          View V Hours
        </AccessButton>
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          Select
        </AccessButton>
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          Email V Hours
        </AccessButton>
        <AccessButton disabled className="ac-tracking-report-btn ac-tracking-job-tab-btn-wide">
          Verify Report
        </AccessButton>
      </div>

      <ContactPickerGrid contacts={contacts} />

      <NotesTextarea label="Additional Notes:" className="ac-tracking-notes-block--fill" />
    </div>
  );
}

export function InvoiceTabPanel({ contacts }: { contacts: TrackingJobContact[] }) {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--invoice">
      <div className="ac-tracking-job-tab-col ac-tracking-job-tab-col--narrow">
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          View Invoice
        </AccessButton>
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          Email Invoice
        </AccessButton>
        <AccessButton disabled className="ac-tracking-report-btn ac-tracking-job-tab-btn-wide">
          Invoice Report
        </AccessButton>
        <label className="ac-tracking-check-row">
          <span>Total By Job</span>
          <input type="checkbox" disabled />
        </label>
        <label className="ac-tracking-check-row">
          <span>Send Timesheets</span>
          <input type="checkbox" disabled />
        </label>
      </div>

      <ContactPickerGrid contacts={contacts} />

      <div className="ac-tracking-invoice-right">
        <div className="ac-tracking-invoice-right-pane" />
        <div className="ac-tracking-invoice-right-pane" />
      </div>
    </div>
  );
}

export function SeamusTabPanel() {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--seamus">
      <AccessButtonRow>
        <AccessButton disabled>Copy Forward</AccessButton>
        <AccessButton disabled>Payroll Adjustments</AccessButton>
      </AccessButtonRow>
    </div>
  );
}

export function EstInvoiceTabPanel({ value = "" }: { value?: string }) {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--est-invoice">
      <div className="ac-tracking-est-invoice-field">
        <span className="ac-flabel ac-tracking-est-invoice-label">Estimated Invoice:</span>
        <input
          readOnly
          className="ac-input ac-tracking-est-invoice-input"
          value={value}
          aria-label="Estimated Invoice"
        />
      </div>
    </div>
  );
}

function ReferralAgencyGrid({ agencies }: { agencies: TrackingReferralAgency[] }) {
  const rows = padRows(agencies, () => ({ id: "", name: "" }));

  return (
    <div className="ac-tracking-subform-grid ac-tracking-subform-grid--fill ac-tracking-subform-grid--referral">
      <div className="ac-grid ac-tracking-subform-table">
        <table>
          <thead>
            <tr>
              <th>Referral Agency</th>
              <th className="w-12">Select</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={a.id || i}>
                <td>{a.name || "—"}</td>
                <td className="text-center">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SubformRecordBar showSearch={false} />
    </div>
  );
}

export function ReferralAgenciesTabPanel({
  agencies,
}: {
  agencies: TrackingReferralAgency[];
}) {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--referral">
      <div className="ac-tracking-referral-left-pane">
        <AccessButton disabled className="ac-tracking-report-btn ac-tracking-job-tab-btn-wide">
          Invoice Report
        </AccessButton>
        <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
          Text Directions
        </AccessButton>
      </div>

      <div className="ac-tracking-referral-message-pane">
        <textarea readOnly className="ac-tracking-notes-area ac-tracking-notes-area--fill" aria-label="Message" />
        <AccessButton disabled className="ac-tracking-referral-send-btn">
          Send as Text
        </AccessButton>
      </div>

      <ReferralAgencyGrid agencies={agencies} />

      <div className="ac-tracking-referral-right-pane">
        <div className="ac-tracking-btn-grid ac-tracking-referral-side-grid">
          <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
            Select All
          </AccessButton>
          <AccessButton disabled className="ac-tracking-job-tab-btn-wide">
            Clear All
          </AccessButton>
        </div>
      </div>
    </div>
  );
}

export function SimpleJobTabPlaceholder({ label }: { label: string }) {
  return (
    <div className="ac-tracking-job-tab ac-tracking-job-tab--placeholder">
      <span className="text-[10px] text-slate-500">{label} — read-only shell (SQL wiring pending).</span>
    </div>
  );
}

export function TrackingJobTabBody({
  tabId,
  jobInfo,
}: {
  tabId: string;
  jobInfo?: TrackingJobInfo | null;
}) {
  const contacts = jobInfo?.contacts ?? [];
  const salesmen = jobInfo?.salesmen ?? [];
  const billRates = jobInfo?.billRates ?? [];
  const referralAgencies = jobInfo?.referralAgencies ?? [];

  switch (tabId) {
    case "co-contacts":
      return <CoContactsTabPanel contacts={contacts} />;
    case "employees":
      return <EmployeesTabPanel />;
    case "salesmen":
      return <SalesmenTabPanel salesmen={salesmen} />;
    case "bill-rates":
      return <BillRatesTabPanel rates={billRates} />;
    case "s-admin":
      return <SAdminTabPanel />;
    case "schedule":
      return <ScheduleTimesheetTabPanel contacts={contacts} />;
    case "verify-hours":
      return <VerifyHoursTabPanel contacts={contacts} />;
    case "invoice":
      return <InvoiceTabPanel contacts={contacts} />;
    case "admin":
      return <SimpleJobTabPlaceholder label="Admin" />;
    case "seamus":
      return <SeamusTabPanel />;
    case "est-invoice":
      return <EstInvoiceTabPanel value={jobInfo?.estimatedInvoice} />;
    case "referral":
      return <ReferralAgenciesTabPanel agencies={referralAgencies} />;
    default:
      return null;
  }
}
