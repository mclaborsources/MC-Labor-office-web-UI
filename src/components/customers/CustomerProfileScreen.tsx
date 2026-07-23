"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Home, Search } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import { AccessDataTable, type AccessColumn } from "@/components/access/AccessDataTable";
import { AccessTabs } from "@/components/access/AccessTabs";
import { DataValue } from "@/components/access/DataValue";
import { Icon } from "@/components/ui/Icon";
import {
  CUSTOMER_PROFILE_LINK_ACTIONS,
  CUSTOMER_PROFILE_LINK_ENTITIES,
  CUSTOMER_PROFILE_TABS,
  CUSTOMER_PROFILE_TOOLBAR_BUTTONS,
} from "@/lib/customerProfileLayout";
import type { CustomerBillRate, CustomerDetail } from "@/types/customer";

interface CustomerProfileScreenProps {
  customer: CustomerDetail;
}

function ProfileField({
  label,
  value,
  wide,
  mono,
  className = "",
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
  mono?: boolean;
  className?: string;
}) {
  const normalizedLabel = label.toLowerCase();
  const inputType =
    normalizedLabel.includes("email") ? "email"
      : normalizedLabel.includes("phone") || normalizedLabel.includes("fax") || normalizedLabel.includes("cell") ? "tel"
        : normalizedLabel.includes("web") || normalizedLabel.includes("linkedin") ? "url"
          : normalizedLabel === "zip" ? "text"
            : normalizedLabel.includes("amount") || normalizedLabel.includes("revenue") || normalizedLabel.includes("employee size") || normalizedLabel.includes("jobs saved") ? "number"
              : "text";

  return (
    <label className={`ac-customer-profile-field ${wide ? "ac-customer-profile-field--wide" : ""} ${className}`}>
      <span className="ac-flabel">{label}</span>
      <input type={inputType} className={`ac-input ${mono ? "font-mono" : ""}`} defaultValue={value ?? ""} aria-label={label} />
    </label>
  );
}

function ProfileSelect({
  label,
  value,
  options,
  wide,
  className = "",
}: {
  label: string;
  value?: string | null;
  options: { value: string; label: string }[];
  wide?: boolean;
  className?: string;
}) {
  return (
    <label className={`ac-customer-profile-field ${wide ? "ac-customer-profile-field--wide" : ""} ${className} ${!label ? "ac-customer-profile-field--no-label" : ""}`}>
      {label ? <span className="ac-flabel">{label}</span> : null}
      <select className="ac-select" defaultValue={value ?? ""} aria-label={label || "Select"}>
        {options.map((opt) => (
          <option key={opt.value || opt.label} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CustomerProfileHeader({ customer }: { customer: CustomerDetail }) {
  return (
    <div className="ac-customer-profile-control-panel">
      <div className="ac-customer-profile-row ac-customer-profile-row-1">
        <div className="ac-customer-profile-row-1-left">
          <label className="ac-customer-profile-inline-field">
            <span className="ac-flabel">Status</span>
            <select className="ac-select" defaultValue="">
              <option value="">[Any]</option>
              {customer.status ? <option value={customer.status}>{customer.status}</option> : null}
            </select>
          </label>
          <label className="ac-customer-profile-inline-field ac-customer-profile-quick-search">
            <span className="ac-flabel">Customers Quick Search</span>
            <input className="ac-input" defaultValue={customer.customerName ?? ""} />
          </label>
          <div className="ac-customer-profile-search-match">
            <label className="ac-customer-profile-radio">
              <input type="radio" name="cust-search-match" defaultChecked />
              <span>Like</span>
            </label>
            <label className="ac-customer-profile-radio">
              <input type="radio" name="cust-search-match" />
              <span>=</span>
            </label>
          </div>
          <AccessButton xs icon={Search}>
            Search
          </AccessButton>
          <Link href={`/jobs?customerId=${customer.customerId}`}>
            <AccessButton xs className="ac-customer-profile-jobs-btn">
              Jobs
            </AccessButton>
          </Link>
        </div>

        <div className="ac-customer-profile-row-1-center">
          <div className="ac-customer-profile-mini-tabs">
            <button type="button" className="ac-customer-profile-mini-tab ac-customer-profile-mini-tab--active">
              Customer
            </button>
            <button type="button" className="ac-customer-profile-mini-tab">
              Credit History
            </button>
          </div>
          <ProfileField label="" value="" className="ac-customer-profile-credit-history-field" />
          <ProfileField label="Customer Since" value={customer.entryTimestamp} />
          <ProfileField label="Contract Date" value="" />
        </div>

        <div className="ac-customer-profile-row-1-right">
          <div className="ac-customer-profile-library-wrap">
            <span className="ac-flabel">Library Card #</span>
            <div className="ac-customer-profile-library-box" aria-hidden />
          </div>
          <AccessButton xs className="ac-customer-profile-research-btn">
            RE-SEARCH
          </AccessButton>
          <select size={3} className="ac-select ac-customer-profile-step-list" defaultValue="1">
            <option value="1">Step 1: Ma Board</option>
            <option value="2">Step 2: Corporate Lookup</option>
            <option value="3">Step 3: Google</option>
          </select>
          <div className="ac-customer-profile-step-nav">
            <AccessButton xs className="ac-customer-profile-step-arrow">
              ►
            </AccessButton>
            <button type="button" className="ac-customer-profile-util-icon" aria-label="Document" />
            <button type="button" className="ac-customer-profile-util-icon ac-customer-profile-util-icon--gear" aria-label="Settings" />
          </div>
          <span className="ac-customer-profile-delete-link">Delete | 037</span>
        </div>
      </div>

      <div className="ac-customer-profile-row ac-customer-profile-row-2">
        <AccessButton xs className="ac-customer-profile-spare-btn">
          Spare 2
        </AccessButton>
        {CUSTOMER_PROFILE_TOOLBAR_BUTTONS.map((label) => (
          <AccessButton key={label} xs className="ac-customer-profile-toolbar-btn">
            {label}
          </AccessButton>
        ))}
      </div>

      <div className="ac-customer-profile-row ac-customer-profile-row-3">
        <ProfileField label="Customer" value={customer.customerName} className="ac-customer-profile-customer-name" />
        <button type="button" className="ac-customer-profile-icon-btn ac-customer-profile-icon-btn--doc" aria-label="Copy" />
        <button type="button" className="ac-customer-profile-icon-btn" aria-label="Home">
          <Icon icon={Home} size="xs" />
        </button>
        <button type="button" className="ac-customer-profile-icon-btn ac-customer-profile-icon-btn--g" aria-label="Google">
          G
        </button>
        <ProfileField label="Status" value={customer.status} />
        <ProfileSelect
          label="Where Found"
          value="online"
          options={[
            { value: "", label: "" },
            { value: "online", label: "Online" },
          ]}
        />
        <ProfileSelect
          label="Cust Type"
          value={customer.customerType}
          options={[
            { value: "", label: "" },
            { value: customer.customerType ?? "", label: customer.customerType || "—" },
          ]}
        />
        <ProfileField label="License Number" value={customer.licenseNumber} />
        <ProfileField label="License Issue Date" value="" />
        <ProfileField label="License Expire Date" value="" />
      </div>

      <div className="ac-customer-profile-row ac-customer-profile-row-4">
        <ProfileSelect
          label="Assigned Type"
          value="sheet-metal"
          wide
          options={[
            { value: "", label: "" },
            { value: "sheet-metal", label: "SHEET METAL WORK-S" },
          ]}
        />
        <span className="ac-flabel ac-customer-profile-subtypes-label">Sub Types:</span>
        {[0, 1, 2, 3].map((i) => (
          <ProfileSelect
            key={i}
            label=""
            value={i === 0 ? "supervisor" : ""}
            className="ac-customer-profile-subtype-select"
            options={
              i === 0
                ? [
                    { value: "supervisor", label: "Supervisor 5606" },
                    { value: "", label: "" },
                  ]
                : [{ value: "", label: "" }]
            }
          />
        ))}
        <AccessButton xs className="ac-customer-profile-save-btn">
          Save | 037
        </AccessButton>
      </div>
    </div>
  );
}

const wccColumns: AccessColumn<CustomerBillRate>[] = [
  { header: "WC Code", cell: (r) => <DataValue value={r.grade} />, nowrap: true },
  { header: "User", cell: () => "—", nowrap: true },
  { header: "Timestamp", cell: () => "—", nowrap: true },
  {
    header: "Active",
    cell: (r) => (r.active ? "Yes" : "No"),
    nowrap: true,
  },
];

function CustomerProfileBasicTab({ customer }: { customer: CustomerDetail }) {
  const cityState =
    [customer.city, customer.state].filter(Boolean).join(", ") || "";

  return (
    <section id="01-basic" className="ac-customer-profile-basic">
      <div className="ac-customer-profile-basic-grid">
        <div className="ac-customer-profile-col">
          <ProfileField label="Sales Package Name" value="" />
          <ProfileField label="Street" value={customer.street} wide />
          <ProfileField label="City/State" value={cityState} />
          <ProfileField label="Zip" value={customer.zip} />
          <label className="ac-customer-profile-check">
            <input type="checkbox" />
            <span>Different Mailing Address</span>
          </label>
          <ProfileField label="Street" value={customer.mailStreet} wide />
          <ProfileField
            label="City/State"
            value={[customer.mailCity, customer.mailState].filter(Boolean).join(", ")}
          />
          <ProfileField label="Zip" value={customer.mailZip} />
        </div>

        <div className="ac-customer-profile-col">
          <ProfileField label="Phone" value={customer.phone} />
          <ProfileField label="Fax" value={customer.fax} />
          <ProfileField label="Invoice Email" value={customer.email} />
          <ProfileField label="Customer Web Site" value={customer.website} wide />
          <ProfileField label="Corp Web Site" value={customer.corpWebsite} wide />
          <ProfileField label="Linkedin Profile" value="" wide />
        </div>

        <div className="ac-customer-profile-col ac-customer-profile-col--meta">
          <ProfileField label="Entry User" value={customer.entryUserName} />
          <ProfileField label="Entry Date" value={customer.entryTimestamp} />
        </div>

        <div className="ac-customer-profile-communication">
          <label className="ac-customer-profile-check">
            <input type="checkbox" />
            <span>No Communication</span>
          </label>
          <div className="ac-customer-profile-meta-pair">
            <ProfileField label="User" value="" />
            <ProfileField label="Date" value="" />
          </div>
          <label className="ac-customer-profile-check">
            <input type="checkbox" />
            <span>Return to Sender</span>
          </label>
          <div className="ac-customer-profile-meta-pair">
            <ProfileField label="User" value="" />
            <ProfileField label="Date" value="" />
          </div>
        </div>

        <div className="ac-customer-profile-notes">
          <label className="ac-customer-profile-note">
            <span className="ac-flabel">Customer Note Shown in Tracking</span>
            <textarea className="ac-input ac-customer-profile-textarea" defaultValue={customer.customerNote ?? ""} />
          </label>
          <label className="ac-customer-profile-note ac-customer-profile-note--short">
            <span className="ac-flabel">Invoice Note Shown in Tracking</span>
            <textarea className="ac-input ac-customer-profile-textarea" defaultValue={customer.invoiceNote ?? ""} />
          </label>
        </div>
      </div>

      <div className="ac-customer-profile-bottom">
        <div className="ac-customer-profile-wcc">
          <div className="ac-customer-profile-wcc-title">Customer WC Codes (Active)</div>
          <div className="ac-customer-profile-wcc-table">
            <AccessDataTable
              columns={wccColumns}
              rows={customer.billRates.slice(0, 6)}
              rowKey={(r) => r.billRateId}
              emptyMessage="No WC codes on record."
              footer={`Record: |◄ ◄ ${customer.billRates.length === 0 ? 0 : 1} of ${customer.billRates.length} ► ►|`}
            />
          </div>
        </div>

        <div className="ac-customer-profile-links">
          <div className="ac-customer-profile-links-title">Hyperlinks</div>
          <div className="ac-customer-profile-links-grid">
            {CUSTOMER_PROFILE_LINK_ENTITIES.map((entity) => (
              <div key={entity} className="ac-customer-profile-links-col">
                <div className="ac-customer-profile-links-head">{entity}</div>
                {CUSTOMER_PROFILE_LINK_ACTIONS.map((action) => (
                  <AccessButton key={action} xs className="ac-customer-profile-link-btn">
                    {action}
                  </AccessButton>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ac-customer-profile-folder-row">
        <AccessButton xs>
          Open Company Folder
        </AccessButton>
        <ProfileField label="Folder" value="" wide className="ac-customer-profile-folder-field" />
        <AccessButton xs>
          Browse
        </AccessButton>
      </div>

      <div className="ac-customer-profile-footer-fields">
        <ProfileField label="Revenue/Yr" value="" />
        <ProfileField label="Employee Size" value="" />
        <ProfileField label="Import Note" value="" wide />
        <ProfileField label="Description" value="" wide />
        <ProfileField label="PPE Loan Amount" value="" />
        <ProfileField label="Jobs Saved" value={String(customer.jobs.length)} mono />
        <ProfileField label="Industry" value="" wide />
      </div>
    </section>
  );
}

type BillRateFilter = "active" | "inactive" | "all";

interface EditableBillRate extends CustomerBillRate {
  userName: string;
  timestamp: string;
  sortOrder: number;
}

function CustomerBillRatesTab({ customer }: { customer: CustomerDetail }) {
  const [filter, setFilter] = useState<BillRateFilter>("active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<EditableBillRate[]>(() =>
    customer.billRates.map((rate, index) => ({
      ...rate,
      userName: "",
      timestamp: "",
      sortOrder: index + 1,
    })),
  );

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesFilter = filter === "all" || row.active === (filter === "active");
      const matchesSearch = !term || [row.grade, row.billRate, row.note, row.userName].some((value) => String(value).toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [filter, rows, search]);

  function updateRow(id: string, field: keyof EditableBillRate, value: string | boolean | number) {
    setRows((current) => current.map((row) => (row.billRateId === id ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    const id = `new-${Date.now()}`;
    setRows((current) => [
      ...current,
      {
        billRateId: id,
        grade: "",
        billRate: "",
        note: "",
        active: true,
        userName: "",
        timestamp: new Date().toLocaleString(),
        sortOrder: current.length + 1,
      },
    ]);
    setFilter("all");
    setSelectedId(id);
  }

  function moveSelected(direction: -1 | 1) {
    if (!selectedId) return;
    setRows((current) => {
      const index = current.findIndex((row) => row.billRateId === selectedId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((row, rowIndex) => ({ ...row, sortOrder: rowIndex + 1 }));
    });
  }

  function deleteSelected() {
    if (!selectedId) return;
    setRows((current) => current.filter((row) => row.billRateId !== selectedId));
    setSelectedId(null);
  }

  return (
    <section id="03-billrates" className="ac-customer-bill-rates">
      <div className="ac-customer-bill-rate-actions" aria-label="Bill rate row actions">
        <button type="button" onClick={() => moveSelected(-1)} disabled={!selectedId} aria-label="Move selected rate up">↑</button>
        <button type="button" onClick={() => moveSelected(1)} disabled={!selectedId} aria-label="Move selected rate down">↓</button>
        <button type="button" onClick={deleteSelected} disabled={!selectedId} aria-label="Delete selected rate">×</button>
        <button type="button" onClick={addRow} className="ac-customer-bill-rate-add">+ Add Rate</button>
      </div>

      <div className="ac-customer-bill-rate-grid-wrap">
        <table className="ac-customer-bill-rate-grid">
          <thead>
            <tr>
              <th aria-label="Selected row" />
              <th>Grade</th>
              <th>Rate</th>
              <th>Note</th>
              <th>User Name</th>
              <th>Timestamp</th>
              <th>Sort Order</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.billRateId} className={selectedId === row.billRateId ? "is-selected" : ""}>
                <td>
                  <input type="radio" name="selected-bill-rate" checked={selectedId === row.billRateId} onChange={() => setSelectedId(row.billRateId)} aria-label={`Select ${row.grade || "new rate"}`} />
                </td>
                <td><input value={row.grade} onFocus={() => setSelectedId(row.billRateId)} onChange={(event) => updateRow(row.billRateId, "grade", event.target.value)} /></td>
                <td><input type="number" min="0" step="0.01" value={row.billRate} onFocus={() => setSelectedId(row.billRateId)} onChange={(event) => updateRow(row.billRateId, "billRate", event.target.value)} /></td>
                <td><input value={row.note} onFocus={() => setSelectedId(row.billRateId)} onChange={(event) => updateRow(row.billRateId, "note", event.target.value)} /></td>
                <td><input value={row.userName} onFocus={() => setSelectedId(row.billRateId)} onChange={(event) => updateRow(row.billRateId, "userName", event.target.value)} /></td>
                <td><input value={row.timestamp} onFocus={() => setSelectedId(row.billRateId)} onChange={(event) => updateRow(row.billRateId, "timestamp", event.target.value)} /></td>
                <td><input type="number" min="1" value={row.sortOrder} onFocus={() => setSelectedId(row.billRateId)} onChange={(event) => updateRow(row.billRateId, "sortOrder", Number(event.target.value))} /></td>
                <td><input type="checkbox" checked={row.active} onFocus={() => setSelectedId(row.billRateId)} onChange={(event) => updateRow(row.billRateId, "active", event.target.checked)} /></td>
              </tr>
            ))}
            {visibleRows.length === 0 ? <tr><td colSpan={8} className="ac-customer-bill-rate-empty">No rates match this filter.</td></tr> : null}
          </tbody>
        </table>
        <div className="ac-customer-bill-rate-recordbar">Record: {visibleRows.length ? `1 of ${visibleRows.length}` : "0 of 0"} <span>{filter === "all" && !search ? "No Filter" : "Filtered"}</span><input aria-label="Search bill rates" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>

      <fieldset className="ac-customer-bill-rate-filter">
        <legend>Filter</legend>
        {(["active", "inactive", "all"] as const).map((value) => (
          <label key={value}><input type="radio" name="bill-rate-filter" checked={filter === value} onChange={() => setFilter(value)} />{value[0].toUpperCase() + value.slice(1)}</label>
        ))}
      </fieldset>

      <p className="ac-customer-bill-rate-session-note">Edits on this screen are temporary and are not saved to the database.</p>
    </section>
  );
}

function CustomerProfileStub({ id, title }: { id: string; title: string }) {
  return (
    <section id={id} className="ac-customer-profile-stub">
      <div className="ac-customer-profile-stub-title">{title}</div>
      <p className="ac-customer-profile-stub-text">Read-only shell — full tab content coming later.</p>
    </section>
  );
}

const CUSTOMER_INSURANCE_CARRIERS = ["AMP", "GS", "HDE", "HSG", "IPG", "ISG", "MLS"] as const;

function CustomerInsuranceInfoTab() {
  return (
    <section id="04-insurance" className="ac-customer-insurance-info">
      <div className="ac-customer-insurance-grid">
        <div aria-hidden />
        {CUSTOMER_INSURANCE_CARRIERS.map((carrier) => (
          <div key={carrier} className="ac-customer-insurance-carrier">{carrier}</div>
        ))}

        <div className="ac-customer-insurance-row-label">WC x Date</div>
        {CUSTOMER_INSURANCE_CARRIERS.map((carrier) => (
          <input
            key={`${carrier}-wc`}
            type="date"
            className="ac-input ac-customer-insurance-date"
            defaultValue=""
            aria-label={`${carrier} WC expiration date`}
          />
        ))}

        <div className="ac-customer-insurance-row-label">GL x Date</div>
        {CUSTOMER_INSURANCE_CARRIERS.map((carrier) => (
          <input
            key={`${carrier}-gl`}
            type="date"
            className="ac-input ac-customer-insurance-date"
            defaultValue=""
            aria-label={`${carrier} GL expiration date`}
          />
        ))}
      </div>

      <label className="ac-customer-insurance-note">
        <span>Note</span>
        <textarea className="ac-input" defaultValue="" aria-label="Insurance note" />
      </label>
    </section>
  );
}

const CUSTOMER_SALES_COMPANIES = [
  "Industrial Power Group, Inc.",
  "Mechanical Contractors Association",
  "New England Labor Services",
  "Skilled Trades Partners",
] as const;

const CUSTOMER_SALES_PEOPLE = [
  "Maria Santos",
  "David Chen",
  "James Wilson",
  "Alicia Brown",
] as const;

const CUSTOMER_CONTRACT_VERBIAGE = [
  "Standard Contract Language",
  "Prevailing Wage Addendum",
  "Project-Specific Terms",
  "Union Labor Terms",
] as const;

function SalesSelect({
  label,
  options,
  defaultValue = "",
  className = "",
}: {
  label: string;
  options: readonly string[];
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`ac-customer-sales-field ${className}`}>
      <span>{label}</span>
      <select className="ac-select" defaultValue={defaultValue} aria-label={label}>
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function CustomerSalesFolderPanel({ future = false }: { future?: boolean }) {
  return (
    <section className="ac-customer-sales-folder-panel">
      <div className="ac-customer-sales-folder-title">
        00 Companies{future ? " - Future Sales" : ""}
      </div>
      <label className="ac-customer-sales-folder-field">
        <span>Folder</span>
        <textarea defaultValue="" aria-label={`${future ? "Future sales" : "Companies"} folder`} />
      </label>
      <AccessButton
        xs
        className={`ac-customer-sales-transfer ${future ? "ac-customer-sales-transfer--future" : ""}`}
      >
        Transfer Folders
        <br />
        {future ? "<<<<<<<<" : ">>>>>>>>"}
        <br />
        {future ? "Future Sales to COMPANIES" : "Companies to FUTURE SALES"}
      </AccessButton>
      <AccessButton xs className="ac-customer-sales-folder-action">
        Create Company Folder in 00 Companies{future ? " - Future Sales" : ""}
      </AccessButton>
      <AccessButton xs className="ac-customer-sales-folder-action ac-customer-sales-folder-open">
        Open Company Folder
      </AccessButton>
    </section>
  );
}

function CustomerSalesTab() {
  return (
    <section id="05-sales" className="ac-customer-sales">
      <div className="ac-customer-sales-contract-grid">
        <div className="ac-customer-sales-contract-left">
          <SalesSelect label="Contract With" options={CUSTOMER_SALES_COMPANIES} />
          <div className="ac-customer-sales-history-row">
            <SalesSelect label="Contract Salesman" options={CUSTOMER_SALES_PEOPLE} />
            <AccessButton xs>History</AccessButton>
          </div>
          <label className="ac-customer-sales-date-field">
            <span>Date on Contract</span>
            <input type="date" className="ac-input" defaultValue="" aria-label="Date on Contract" />
          </label>
        </div>

        <div className="ac-customer-sales-contract-right">
          <div className="ac-customer-sales-history-row">
            <SalesSelect label="Salesman (Admin)" options={CUSTOMER_SALES_PEOPLE} />
            <AccessButton xs>History</AccessButton>
          </div>
          <SalesSelect
            label="Extra Verbiage on Contract"
            options={CUSTOMER_CONTRACT_VERBIAGE}
            className="ac-customer-sales-verbiage"
          />
        </div>
      </div>

      <div className="ac-customer-sales-rates">
        <div aria-hidden />
        <div className="ac-customer-sales-rate-heading">From</div>
        <div className="ac-customer-sales-rate-heading">To</div>
        <div aria-hidden />
        {[
          ["Labor Rate A", "<<< $38.80  to  $47.00   goes Here"],
          ["Labor Rate B", "<<< $28.80  to  $34.00   goes Here"],
          ["Labor Rate C", "<<< $24.00  to  $26.00   goes Here"],
        ].map(([label, hint]) => (
          <div key={label} className="ac-customer-sales-rate-row">
            <span>{label}</span>
            <input type="number" min="0" step="0.01" className="ac-input" defaultValue="" aria-label={`${label} from`} />
            <input type="number" min="0" step="0.01" className="ac-input" defaultValue="" aria-label={`${label} to`} />
            <strong>{hint}</strong>
          </div>
        ))}
      </div>

      <div className="ac-customer-sales-folders">
        <CustomerSalesFolderPanel />
        <CustomerSalesFolderPanel future />
      </div>

      <div className="ac-customer-sales-footer">
        <SalesSelect
          label="Allow Contract With"
          options={CUSTOMER_SALES_COMPANIES}
          defaultValue="Industrial Power Group, Inc."
        />
        <div className="ac-customer-sales-contract-actions">
          <AccessButton xs>Copy IPG Sales Contract</AccessButton>
          <AccessButton xs>Populate IPG Sales Contract</AccessButton>
        </div>
        <label className="ac-customer-sales-small-field">
          <span>User</span>
          <input className="ac-input" defaultValue="" aria-label="Contract user" />
        </label>
        <label className="ac-customer-sales-small-field">
          <span>Date</span>
          <input type="date" className="ac-input" defaultValue="" aria-label="Contract update date" />
        </label>
        <label className="ac-customer-sales-updated">
          <span>Updated Contract</span>
          <input type="checkbox" />
        </label>
      </div>
    </section>
  );
}

type CollectionFilter = "active" | "inactive" | "all";

interface CollectionNoteRow {
  id: string;
  note: string;
  userName: string;
  timestamp: string;
  active: boolean;
}

function CustomerCollectionsTab() {
  const [filter, setFilter] = useState<CollectionFilter>("active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("collection-new");
  const [rows, setRows] = useState<CollectionNoteRow[]>([
    { id: "collection-new", note: "", userName: "", timestamp: "", active: true },
  ]);

  const visibleRows = rows.filter((row) => {
    const matchesFilter = filter === "all" || row.active === (filter === "active");
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [row.note, row.userName, row.timestamp].some((value) => value.toLowerCase().includes(term));
    return matchesFilter && matchesSearch;
  });

  function updateCollection(id: string, field: keyof CollectionNoteRow, value: string | boolean) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function deleteSelectedCollection() {
    setRows((current) => current.filter((row) => row.id !== selectedId));
    setSelectedId("");
  }

  return (
    <section id="06-collections" className="ac-customer-collections">
      <div className="ac-customer-collections-title">Collections Notes</div>
      <div className="ac-customer-collections-workspace">
        <button
          type="button"
          className="ac-customer-collections-delete"
          onClick={deleteSelectedCollection}
          disabled={!selectedId}
          aria-label="Delete selected collection note"
        >
          ×
        </button>

        <div className="ac-customer-collections-grid-wrap">
          <table className="ac-customer-collections-grid">
            <thead>
              <tr>
                <th aria-label="Record selector" />
                <th>Collection Note</th>
                <th>User Name</th>
                <th>Timestamp</th>
                <th>Active</th>
                <th aria-hidden />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className={selectedId === row.id ? "is-selected" : ""}>
                  <td>
                    <button type="button" onClick={() => setSelectedId(row.id)} aria-label="Select collection note">
                      {selectedId === row.id ? "*" : ""}
                    </button>
                  </td>
                  <td><input value={row.note} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateCollection(row.id, "note", event.target.value)} /></td>
                  <td><input value={row.userName} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateCollection(row.id, "userName", event.target.value)} /></td>
                  <td><input value={row.timestamp} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateCollection(row.id, "timestamp", event.target.value)} /></td>
                  <td><input type="checkbox" checked={row.active} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateCollection(row.id, "active", event.target.checked)} /></td>
                  <td />
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 7 - visibleRows.length) }, (_, index) => (
                <tr key={`blank-${index}`} aria-hidden>
                  <td />
                  <td /><td /><td /><td /><td />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ac-customer-collections-recordbar">
            <span>Record:</span>
            <span>|◄</span>
            <span>◄</span>
            <strong>{visibleRows.length ? `1 of ${visibleRows.length}` : "0 of 0"}</strong>
            <span>►</span>
            <span>►|</span>
            <span className="ac-customer-collections-filter-status">{filter === "all" && !search ? "No Filter" : "Filtered"}</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search collection notes" placeholder="Search" />
          </div>
        </div>

        <fieldset className="ac-customer-collections-filter">
          <legend>Filter</legend>
          {(["active", "inactive", "all"] as const).map((value) => (
            <label key={value}>
              <input type="radio" name="collection-filter" checked={filter === value} onChange={() => setFilter(value)} />
              <span>{value[0].toUpperCase() + value.slice(1)}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <AccessButton xs className="ac-customer-collections-folder-btn">
        Create Folders for Bad Debt and Small Claims
      </AccessButton>
    </section>
  );
}

const CUSTOMER_WC_CODE_OPTIONS = [
  "5022 — Masonry",
  "5183 — Plumbing",
  "5190 — Electrical Wiring",
  "5403 — Carpentry",
  "5537 — HVAC",
  "5645 — General Construction",
] as const;

interface CustomerWccRow {
  id: string;
  wcCode: string;
  user: string;
  timestamp: string;
  active: boolean;
}

function CustomerWccTab() {
  const [filter, setFilter] = useState<CollectionFilter>("active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("wcc-new");
  const [rows, setRows] = useState<CustomerWccRow[]>([
    { id: "wcc-new", wcCode: "", user: "", timestamp: "", active: true },
  ]);

  const visibleRows = rows.filter((row) => {
    const matchesFilter = filter === "all" || row.active === (filter === "active");
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [row.wcCode, row.user, row.timestamp].some((value) => value.toLowerCase().includes(term));
    return matchesFilter && matchesSearch;
  });

  function updateWcc(id: string, field: keyof CustomerWccRow, value: string | boolean) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function deleteSelectedWcc() {
    setRows((current) => current.filter((row) => row.id !== selectedId));
    setSelectedId("");
  }

  return (
    <section id="07-wcc" className="ac-customer-collections ac-customer-wcc">
      <div className="ac-customer-collections-title">Customer WC Codes</div>
      <div className="ac-customer-collections-workspace">
        <button
          type="button"
          className="ac-customer-collections-delete"
          onClick={deleteSelectedWcc}
          disabled={!selectedId}
          aria-label="Delete selected customer WC code"
        >
          ×
        </button>

        <div className="ac-customer-collections-grid-wrap">
          <table className="ac-customer-collections-grid ac-customer-wcc-grid">
            <thead>
              <tr>
                <th aria-label="Record selector" />
                <th>WC Code</th>
                <th>User</th>
                <th>Timestamp</th>
                <th>Active</th>
                <th aria-hidden />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className={selectedId === row.id ? "is-selected" : ""}>
                  <td>
                    <button type="button" onClick={() => setSelectedId(row.id)} aria-label="Select customer WC code">
                      {selectedId === row.id ? "*" : ""}
                    </button>
                  </td>
                  <td>
                    <select value={row.wcCode} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateWcc(row.id, "wcCode", event.target.value)} aria-label="WC Code">
                      <option value="">Select…</option>
                      {CUSTOMER_WC_CODE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                  <td><input value={row.user} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateWcc(row.id, "user", event.target.value)} /></td>
                  <td><input value={row.timestamp} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateWcc(row.id, "timestamp", event.target.value)} /></td>
                  <td><input type="checkbox" checked={row.active} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateWcc(row.id, "active", event.target.checked)} /></td>
                  <td />
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 7 - visibleRows.length) }, (_, index) => (
                <tr key={`wcc-blank-${index}`} aria-hidden>
                  <td /><td /><td /><td /><td /><td />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ac-customer-collections-recordbar">
            <span>Record:</span><span>|◄</span><span>◄</span>
            <strong>{visibleRows.length ? `1 of ${visibleRows.length}` : "0 of 0"}</strong>
            <span>►</span><span>►|</span>
            <span className="ac-customer-collections-filter-status">{filter === "all" && !search ? "No Filter" : "Filtered"}</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search customer WC codes" placeholder="Search" />
          </div>
        </div>

        <fieldset className="ac-customer-collections-filter">
          <legend>Filter</legend>
          {(["active", "inactive", "all"] as const).map((value) => (
            <label key={value}>
              <input type="radio" name="wcc-filter" checked={filter === value} onChange={() => setFilter(value)} />
              <span>{value[0].toUpperCase() + value.slice(1)}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </section>
  );
}

const INSURANCE_CERT_REQUEST_STATES = [
  "Pending",
  "Requested",
  "Received",
  "Expired",
  "Cancelled",
] as const;

interface InsuranceCertRequestRow {
  id: string;
  requestDate: string;
  state: string;
  requestedBy: string;
}

function CustomerInsuranceCertRequestsTab() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<InsuranceCertRequestRow[]>([]);

  const visibleRows = rows.filter((row) => {
    const term = search.trim().toLowerCase();
    return !term || [row.requestDate, row.state, row.requestedBy].some((value) => value.toLowerCase().includes(term));
  });

  function addInsuranceCertRequest() {
    setRows((current) => [
      ...current,
      {
        id: `insurance-cert-${Date.now()}`,
        requestDate: new Date().toISOString().slice(0, 10),
        state: "Pending",
        requestedBy: "",
      },
    ]);
  }

  function updateInsuranceCertRequest(id: string, field: keyof InsuranceCertRequestRow, value: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  return (
    <section id="08-inscert" className="ac-customer-inscert">
      <div className="ac-customer-inscert-heading">
        <span>Insurance Certificate Requests for this Customer:</span>
        <AccessButton xs onClick={addInsuranceCertRequest}>New Insurance Cert Req</AccessButton>
      </div>

      <div className="ac-customer-inscert-grid-wrap">
        <table className="ac-customer-inscert-grid">
          <thead>
            <tr>
              <th aria-label="Record selector" />
              <th>Cert Request Date</th>
              <th>Cert Request State</th>
              <th>Requested By</th>
              <th aria-hidden />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                <td aria-hidden />
                <td>
                  <input type="date" value={row.requestDate} onChange={(event) => updateInsuranceCertRequest(row.id, "requestDate", event.target.value)} aria-label="Certificate request date" />
                </td>
                <td>
                  <select value={row.state} onChange={(event) => updateInsuranceCertRequest(row.id, "state", event.target.value)} aria-label="Certificate request state">
                    {INSURANCE_CERT_REQUEST_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input value={row.requestedBy} onChange={(event) => updateInsuranceCertRequest(row.id, "requestedBy", event.target.value)} aria-label="Requested by" />
                </td>
                <td />
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 10 - visibleRows.length) }, (_, index) => (
              <tr key={`inscert-blank-${index}`} aria-hidden>
                <td /><td /><td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ac-customer-inscert-recordbar">
          <span>Record:</span>
          <span>|◄</span>
          <span>◄</span>
          <span className="ac-customer-inscert-record-number">{visibleRows.length ? `1 of ${visibleRows.length}` : ""}</span>
          <span>►</span>
          <span>►|</span>
          <span className="ac-customer-inscert-filter-status">{search ? "Filtered" : "No Filter"}</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search insurance certificate requests" placeholder="Search" />
        </div>
      </div>
    </section>
  );
}

function OptionCheck({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="ac-customer-options-check">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} />
    </label>
  );
}

function CustomerOptionsTab() {
  return (
    <section id="09-options" className="ac-customer-options">
      <div className="ac-customer-options-texts">
        <div className="ac-customer-options-section ac-customer-options-text-list">
          <h3>Texts</h3>
          <div>• Hours/timesheet texts from dropdown lists</div>
          <div>• Hours/timesheet autotext <input type="checkbox" defaultChecked aria-label="Hours timesheet autotext" /></div>
          <div>• Timesheet hyperlink color autotext</div>
        </div>
        <div className="ac-customer-options-help">
          <p>If this is NOT checkmarked, then none of the employees working on a job for this customer will receive<br />hours/timesheet-related texts for that job.</p>
          <p>These are the texts normally sent when:<br />
            1) The Send Hours/Timesheet Text button is used on the Tracking screen (on the Employees tab).<br />
            2) The Hrs AutoText button is used on the Tracking screen.<br />
            3) One of the hyperlink color buttons is used on the Tracking screen (next to the Browse button).<br />
            4) The Send as Text button is used on the T Sheets Linked screen after an Hours/Timesheet selection is made.
          </p>
        </div>
      </div>

      <div className="ac-customer-options-main">
        <div className="ac-customer-options-left">
          <div className="ac-customer-options-section">
            <h3>Payroll Company</h3>
            <label className="ac-customer-options-select-row">
              <span>Allow Contract With</span>
              <select defaultValue="Industrial Power Group, Inc.">
                {CUSTOMER_SALES_COMPANIES.map((company) => <option key={company}>{company}</option>)}
              </select>
            </label>
          </div>
          <div className="ac-customer-options-section">
            <h3>Verify</h3>
            <OptionCheck label="Send Timesheets with Verify" />
          </div>
          <div className="ac-customer-options-section">
            <h3>Invoices</h3>
            <OptionCheck label="Send Timesheets with Invoice" />
            <OptionCheck label="Total Invoices by Job" />
          </div>
          <div className="ac-customer-options-section">
            <h3>Tracking</h3>
            <OptionCheck label="Show Customer in Tracking" />
            <div className="ac-customer-options-history-line">
              <OptionCheck label="Cannot Make Assignments" />
              <AccessButton xs>History</AccessButton>
              <span className="ac-customer-options-arrow">◄</span>
            </div>
          </div>
          <div className="ac-customer-options-section">
            <h3>Segments</h3>
            <OptionCheck label="Allow Segments" />
            <OptionCheck label="Allow Multiple Jobs per Segment" />
            <div className="ac-customer-options-segment-help">Prevent Flagship from Making Assignments: <span>Use the Cannot Make Assignments option in the Tracking section.</span></div>
          </div>
        </div>

        <div className="ac-customer-options-right">
          <AccessButton xs className="ac-customer-options-associations">
            Edit &quot;Contract With&quot; and &quot;Payroll Company On Site&quot; Associations
          </AccessButton>

          <div className="ac-customer-options-section ac-customer-options-reports">
            <h3>Reports and Screens</h3>
            <div className="ac-customer-options-report-row">
              <OptionCheck label="Exclude from Margin Report" />
              <span>Weekly Customer Margin Report</span>
            </div>
            <div className="ac-customer-options-report-row">
              <OptionCheck label="Exclude from Directions" />
              <span>Directions screen</span>
            </div>
            <div className="ac-customer-options-report-row">
              <OptionCheck label="AR Report Show Due Date" />
              <span>Show Due Date on the AR Report emails</span>
            </div>
            <label className="ac-customer-options-note">
              <span>AR Report Note 1</span>
              <textarea defaultValue="" />
            </label>
            <label className="ac-customer-options-note">
              <span>AR Report Note 2</span>
              <textarea defaultValue="" />
              <em>Note 2 on the AR Report emails (below overdue Invoices)</em>
            </label>
          </div>

          <div className="ac-customer-options-section ac-customer-options-other">
            <h3>Other</h3>
            <div className="ac-customer-options-other-grid">
              <label><span>Status</span><select defaultValue="Salesman"><option>Salesman</option><option>Customer</option><option>Inactive</option><option>Prospect</option></select></label>
              <OptionCheck label="Customer is Set Up" />
              <label><span>Hunter</span><select defaultValue=""><option value="">Select…</option>{CUSTOMER_SALES_PEOPLE.map((person) => <option key={person}>{person}</option>)}</select></label>
              <label><span>Credit History</span><select defaultValue=""><option value="">Select…</option><option>Excellent</option><option>Good</option><option>Fair</option><option>Hold</option></select></label>
              <AccessButton xs>History</AccessButton>
              <label><span>Term Limit</span><select defaultValue=""><option value="">Select…</option><option>15</option><option>30</option><option>45</option><option>60</option><option>90</option></select><em>(Days)</em></label>
              <AccessButton xs>History</AccessButton>
              <label><span>Legal Status</span><select defaultValue="Non Legal"><option>Non Legal</option><option>Attorney Review</option><option>Collections</option><option>Judgment</option><option>Resolved</option></select></label>
              <AccessButton xs>History</AccessButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomerRateMultipliersTab() {
  return (
    <section id="10-mult" className="ac-customer-rate-multipliers">
      <label>
        <span>Bill Rate Overtime Multiplier</span>
        <input type="number" min="0" step="0.01" defaultValue="1.5" aria-label="Bill Rate Overtime Multiplier" />
      </label>
      <label>
        <span>Pay Rate to Bill Rate Multiplier - Grade X1</span>
        <input type="number" min="0" step="0.01" defaultValue="" aria-label="Pay Rate to Bill Rate Multiplier Grade X1" />
      </label>
      <label>
        <span>Pay Rate to Bill Rate Multiplier - Grade X2</span>
        <input type="number" min="0" step="0.01" defaultValue="" aria-label="Pay Rate to Bill Rate Multiplier Grade X2" />
      </label>
      <label>
        <span>Pay Rate to Bill Rate Multiplier - Grade X3</span>
        <input type="number" min="0" step="0.01" defaultValue="" aria-label="Pay Rate to Bill Rate Multiplier Grade X3" />
      </label>
    </section>
  );
}

const CUSTOMER_JOB_STATUS_OPTIONS = ["Active", "Inactive", "Closed"] as const;

function CustomerJobsTab({ customer }: { customer: CustomerDetail }) {
  const [nameSearch, setNameSearch] = useState("");
  const [streetSearch, setStreetSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive" | "Closed">("All");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [changeStatus, setChangeStatus] = useState("");
  const [jobGridSearch, setJobGridSearch] = useState("");
  const [foremanSearch, setForemanSearch] = useState("");

  const jobs = customer.jobs.filter((job) => {
    const matchesName = job.jobName.toLowerCase().includes(nameSearch.trim().toLowerCase());
    const matchesStreet = job.address.toLowerCase().includes(streetSearch.trim().toLowerCase());
    const matchesStatus = statusFilter === "All" || job.status.toLowerCase() === statusFilter.toLowerCase();
    const term = jobGridSearch.trim().toLowerCase();
    const matchesGridSearch = !term || [job.jobName, job.address, job.status].some((value) => value.toLowerCase().includes(term));
    return matchesName && matchesStreet && matchesStatus && matchesGridSearch;
  });

  const foremen = customer.foremen.filter((foreman) => {
    const term = foremanSearch.trim().toLowerCase();
    return !term || [foreman.foremanName, foreman.phone, foreman.email].some((value) => value.toLowerCase().includes(term));
  });

  function setAllJobs(selected: boolean) {
    setSelectedJobs(selected ? jobs.map((job) => job.jobId) : []);
  }

  return (
    <section id="11-jobs" className="ac-customer-jobs">
      <div className="ac-customer-jobs-left">
        <h2>Existing Jobs</h2>
        <div className="ac-customer-jobs-controls">
          <div className="ac-customer-jobs-searches">
            <label><span>Search in Name</span><input value={nameSearch} onChange={(event) => setNameSearch(event.target.value)} /></label>
            <label><span>Search in Street</span><input value={streetSearch} onChange={(event) => setStreetSearch(event.target.value)} /></label>
          </div>
          <fieldset className="ac-customer-jobs-status-filter">
            <legend>Job Status</legend>
            {(["All", "Active", "Inactive", "Closed"] as const).map((status) => (
              <button key={status} type="button" className={statusFilter === status ? "is-active" : ""} onClick={() => setStatusFilter(status)}>{status}</button>
            ))}
          </fieldset>
          <div className="ac-customer-jobs-actions">
            <AccessButton xs>New Job</AccessButton>
            <div><AccessButton xs>Copy Job</AccessButton><em>Select one job first</em></div>
            <div><AccessButton xs>Change Status</AccessButton><em>Select one or more jobs first</em></div>
          </div>
        </div>
        <div className="ac-customer-jobs-select-row">
          <span>Select:</span>
          <AccessButton xs onClick={() => setAllJobs(false)}>Clear</AccessButton>
          <AccessButton xs onClick={() => setAllJobs(true)}>All</AccessButton>
          <label><span>Change Job Status to:</span><select value={changeStatus} onChange={(event) => setChangeStatus(event.target.value)}><option value="">Select…</option>{CUSTOMER_JOB_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label>
        </div>
        <div className="ac-customer-jobs-grid-wrap">
          <table className="ac-customer-jobs-grid">
            <thead><tr><th aria-label="Row selector" /><th>Select</th><th>Job Name</th><th>Street</th><th>City</th><th>State</th><th>Start Date</th><th>Status</th><th aria-hidden /></tr></thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.jobId}>
                  <td /><td><input type="checkbox" checked={selectedJobs.includes(job.jobId)} onChange={(event) => setSelectedJobs((current) => event.target.checked ? [...current, job.jobId] : current.filter((id) => id !== job.jobId))} aria-label={`Select ${job.jobName}`} /></td>
                  <td>{job.jobName}</td><td>{job.address}</td><td /><td /><td /><td>{job.status}</td><td />
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 16 - jobs.length) }, (_, index) => <tr key={`job-blank-${index}`} aria-hidden><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>)}
            </tbody>
          </table>
          <div className="ac-customer-jobs-recordbar">Record:　|◄　◄　<span>{jobs.length ? `1 of ${jobs.length}` : ""}</span>　►　►|　<em>{jobGridSearch ? "Filtered" : "No Filter"}</em><input value={jobGridSearch} onChange={(event) => setJobGridSearch(event.target.value)} placeholder="Search" aria-label="Search jobs grid" /></div>
        </div>
      </div>

      <div className="ac-customer-jobs-foremen">
        <h2>Foremen Used by This Customer</h2>
        <div className="ac-customer-jobs-grid-wrap ac-customer-foremen-grid-wrap">
          <table className="ac-customer-jobs-grid ac-customer-foremen-grid">
            <thead><tr><th aria-label="Row selector" /><th>Foreman</th><th>Phone</th><th>Email</th><th aria-hidden /></tr></thead>
            <tbody>
              {foremen.map((foreman) => <tr key={foreman.foremanId}><td /><td>{foreman.foremanName}</td><td>{foreman.phone}</td><td>{foreman.email}</td><td /></tr>)}
              {Array.from({ length: Math.max(0, 18 - foremen.length) }, (_, index) => <tr key={`foreman-blank-${index}`} aria-hidden><td /><td /><td /><td /><td /></tr>)}
            </tbody>
          </table>
          <div className="ac-customer-jobs-recordbar">Record:　|◄　◄　<span>{foremen.length ? `1 of ${foremen.length}` : ""}</span>　►　►|　<em>{foremanSearch ? "Filtered" : "No Filter"}</em><input value={foremanSearch} onChange={(event) => setForemanSearch(event.target.value)} placeholder="Search" aria-label="Search foremen" /></div>
        </div>
      </div>
    </section>
  );
}

const SALES_HISTORY_ACTIONS = ["Profiles", "Sales Call", "Cold Call", "Outlook Email", "Custom Email", "Custom Text", "Custom Letter", "Custom Postcard", "Mailer", "Credit", "LinkedIn"] as const;

function CustomerSalesHistoryTab({ customer }: { customer: CustomerDetail }) {
  const [actionFilter, setActionFilter] = useState("All");
  const cityState = [customer.city, customer.state].filter(Boolean).join(", ");
  const historyRows = [
    ["Profiles", "EOH", "6/10/2026", "[Profiles]. EOH 6/10/2026"],
    ["Sales Call", "JR", "6/5/2026", "[Sales Call]. JR 6/5/2026"],
    ["Profiles", "EOH", "5/27/2026", "[Profiles]. EOH 5/27/2026"],
    ["Profiles", "EOH", "5/1/2026", "[Profiles]. EOH 5/1/2026"],
    ["Sales Call", "LR", "4/2/2026", "[Sales Call]. LR 4/2/2026"],
  ].filter((row) => actionFilter === "All" || row[0] === actionFilter);

  return (
    <section id="12-saleshist" className="ac-customer-sales-history">
      <div className="ac-customer-sales-verify">
        <div className="ac-customer-sales-vertical">VERIFY</div>
        <div className="ac-customer-sales-verify-group">
          {[
            ["Cust.", customer.customerName],
            ["Street", customer.street],
            ["City, St.", cityState],
            ["Zip", customer.zip],
          ].map(([label, value]) => <label key={label}><span>{label}</span><input defaultValue={value} /><input type="checkbox" aria-label={`Verify ${label}`} /></label>)}
        </div>
        <div className="ac-customer-sales-verify-group ac-customer-sales-mailing">
          <OptionCheck label="Different Mailing Address" />
          <label><span>Street</span><input defaultValue={customer.mailStreet} /><input type="checkbox" aria-label="Verify mailing street" /></label>
          <label><span>City, St.</span><input defaultValue={[customer.mailCity, customer.mailState].filter(Boolean).join(", ")} /><input type="checkbox" aria-label="Verify mailing city state" /></label>
          <label><span>Zip</span><input inputMode="numeric" defaultValue={customer.mailZip} /><input type="checkbox" aria-label="Verify mailing zip" /></label>
        </div>
        <div className="ac-customer-sales-verify-group">
          <label><span>Phone</span><input type="tel" defaultValue={customer.phone} /><input type="checkbox" aria-label="Verify phone" /></label>
          <label><span>Fax</span><input type="tel" defaultValue={customer.fax} /><input type="checkbox" aria-label="Verify fax" /></label>
          <label><span>Cust. Type</span><select defaultValue={customer.customerType}><option>{customer.customerType}</option><option>General Contractor</option><option>Electrical</option><option>Mechanical</option></select><input type="checkbox" aria-label="Verify customer type" /></label>
        </div>
        <div className="ac-customer-sales-verify-group ac-customer-sales-web">
          <label><span>Corp Web Site</span><input type="url" defaultValue={customer.corpWebsite} /><input type="checkbox" aria-label="Verify corporate website" /></label>
          <label><span>Cust. Web Site</span><input type="url" defaultValue={customer.website} /><input type="checkbox" aria-label="Verify customer website" /></label>
        </div>
      </div>

      <div className="ac-customer-sales-history-rowblock">
        <div className="ac-customer-sales-vertical">CONTACTS</div>
        <div className="ac-customer-sales-side-actions"><button>↑</button><button>↓</button><button>×</button></div>
        <div className="ac-customer-sales-history-table-wrap">
          <table><thead><tr><th /><th>FName</th><th>LName</th><th>Title</th><th>Email</th><th>Cell</th><th>Carrier</th><th>Text Msg Addr</th><th>Office Phone</th><th>LinkedIn Profile</th><th>Notes</th><th>Sort</th><th>User</th><th>Date</th><th>Select</th></tr></thead>
          <tbody>{customer.contacts.map((contact, index) => <tr key={contact.contactId}><td>{index ? "" : "*"}</td><td>{contact.firstName}</td><td>{contact.lastName}</td><td>{contact.title}</td><td>{contact.email}</td><td>{contact.cellPhone}</td><td /><td /><td>{contact.officePhone}</td><td /><td>{contact.notes}</td><td>{index + 1}</td><td>RMV</td><td>2/20/2026</td><td><input type="checkbox" /></td></tr>)}
          {Array.from({ length: Math.max(0, 4 - customer.contacts.length) }, (_, i) => <tr key={`contact-blank-${i}`}><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>)}</tbody></table>
          <div className="ac-customer-sales-history-recordbar">Record:　|◄　◄　1 of {Math.max(1, customer.contacts.length)}　►　►|　 No Filter　<input placeholder="Search" /></div>
          <strong>For all Info emails, please select &quot;Info&quot; for the contact&apos;s Title value.</strong>
        </div>
      </div>

      <div className="ac-customer-sales-history-rowblock">
        <div className="ac-customer-sales-vertical">HISTORY</div>
        <div className="ac-customer-sales-side-actions"><button>Add</button><button>×</button></div>
        <div className="ac-customer-sales-history-center">
          <div className="ac-customer-sales-history-filters"><span>Filter:</span>{[...SALES_HISTORY_ACTIONS, "All"].map((action) => <button key={action} className={actionFilter === action ? "is-active" : ""} onClick={() => setActionFilter(action)}>{action}</button>)}</div>
          <div className="ac-customer-sales-history-table-wrap ac-customer-sales-action-table"><table><thead><tr><th /><th>Action Type</th><th>User</th><th>Date</th><th /><th>To</th><th>Notes</th><th>Response HL</th><th>User</th><th>Date</th></tr></thead><tbody>{historyRows.map((row, i) => <tr key={`${row[0]}-${row[2]}`}><td>{i ? "" : "*"}</td><td>[{row[0]}]</td><td>{row[1]}</td><td>{row[2]}</td><td><a>View</a></td><td /><td>{row[3]}</td><td /><td /><td /></tr>)}</tbody></table><div className="ac-customer-sales-history-recordbar">Record:　|◄　◄　1 of {historyRows.length}　►　►|　 No Filter　<input placeholder="Search" /></div></div>
        </div>
        <aside className="ac-customer-sales-history-status">
          <label><span>Sales History Status</span><select><option>101 - 0106</option><option>Active Prospect</option><option>Current Customer</option><option>Dormant</option></select></label>
          <label><span>Internet Sales Ready</span><select><option>02 - Manpower</option><option>01 - Research</option><option>03 - Ready</option></select></label>
          <label><span>Fast Action</span><select><option value="">Select…</option>{SALES_HISTORY_ACTIONS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <OptionCheck label="Sales Package Sent" />
          <label><span>Future Call:</span><input /></label>
          <AccessButton xs>Clear</AccessButton><AccessButton xs>History</AccessButton>
        </aside>
      </div>

      <div className="ac-customer-sales-research">
        <div className="ac-customer-sales-vertical">SEARCH</div>
        <div className="ac-customer-sales-search-terms"><strong>Search Terms</strong><div>{customer.customerName}<br />{customer.customerName}, {customer.street}, {cityState}<br />{customer.contacts[0]?.firstName} {customer.contacts[0]?.lastName}, {customer.street}, {cityState}</div></div>
        <div className="ac-customer-sales-search-buttons">{["All", "Customer", "Contact", "City, State", "USA", "Card #", "True P", "Google", "LinkedIn", "Blue B", "Facebook", "BBB", "Corp Lk"].map((x) => <AccessButton key={x} xs>{x}</AccessButton>)}</div>
        <label className="ac-customer-sales-research-notes"><span>Customer Research Notes</span><textarea /></label>
        <AccessButton xs>Record</AccessButton><AccessButton xs>Customer Research History</AccessButton>
      </div>
    </section>
  );
}

const CUSTOMER_CONTACT_TITLES = ["Info", "Owner", "President", "Project Manager", "Estimator", "Office Manager", "Accounts Payable"] as const;

function CustomerContactsTab({ customer }: { customer: CustomerDetail }) {
  const [contactSearch, setContactSearch] = useState("");
  const [permitSearch, setPermitSearch] = useState("");
  const contacts = customer.contacts.filter((contact) => {
    const term = contactSearch.trim().toLowerCase();
    return !term || [contact.firstName, contact.lastName, contact.title, contact.email, contact.cellPhone, contact.officePhone, contact.notes].some((value) => value.toLowerCase().includes(term));
  });

  return (
    <section id="02-contacts" className="ac-customer-contacts-tab">
      <div className="ac-customer-contacts-grid-row">
        <div className="ac-customer-contacts-side-buttons"><button>↑</button><button>↓</button><button>×</button><button className="ac-customer-copy-icon">▧</button></div>
        <div className="ac-customer-contacts-table-wrap">
          <table className="ac-customer-contacts-table"><thead><tr><th /><th>FName</th><th>LName</th><th>Title</th><th>Email</th><th>Cell</th><th>Carrier</th><th>Text Msg Addr</th><th>Office Phone</th><th>LinkedIn Profile</th><th>Notes</th><th>Sort</th><th>User</th><th>Date</th><th aria-hidden /></tr></thead>
          <tbody>
            {contacts.map((contact, index) => <tr key={contact.contactId}><td>{index ? "" : "*"}</td><td>{contact.firstName}</td><td>{contact.lastName}</td><td><select defaultValue={contact.title}><option value={contact.title}>{contact.title}</option>{CUSTOMER_CONTACT_TITLES.filter((title) => title !== contact.title).map((title) => <option key={title}>{title}</option>)}</select></td><td>{contact.email}</td><td>{contact.cellPhone}</td><td /><td /><td>{contact.officePhone}</td><td /><td>{contact.notes}</td><td>{index + 1}</td><td>RMV</td><td>2/20/2026 8:48:23 PM</td><td /></tr>)}
            {Array.from({ length: Math.max(0, 8 - contacts.length) }, (_, i) => <tr key={`contacts-blank-${i}`}><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>)}
          </tbody></table>
          <div className="ac-customer-contacts-recordbar">Record:　|◄　◄　<span>{contacts.length ? `1 of ${contacts.length}` : ""}</span>　►　►|　<em>{contactSearch ? "Filtered" : "No Filter"}</em><input value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Search" aria-label="Search contacts" /></div>
        </div>
      </div>

      <div className="ac-customer-contacts-guidance">
        <strong>For all Info emails, please select &quot;Info&quot; for the contact&apos;s Title value.</strong>
        <p>To use one of these buttons, highlight one contact row first by clicking the gray bar at the left side of the row.</p>
        <div><AccessButton xs>▧　Copy Contact Email Address</AccessButton><AccessButton xs>▣　Send Email to Contact</AccessButton></div>
      </div>

      <div className="ac-customer-permits">
        <div className="ac-customer-permits-heading"><h2>Permits</h2><AccessButton xs>▧　Copy Street</AccessButton><span>Double-click on City, State to select the state and city.</span></div>
        <div className="ac-customer-permits-table-wrap">
          <table className="ac-customer-permits-table"><thead><tr><th /><th>Permit Date</th><th>Street</th><th>City, State</th><th>Fee</th><th>Value</th><th>Timestamp</th><th>Permit Search Link</th><th>Link</th><th aria-hidden /><th aria-hidden /></tr></thead>
          <tbody><tr className="is-selected"><td>*</td><td><input type="date" aria-label="Permit date" /></td><td><input defaultValue={customer.street} aria-label="Permit street" /></td><td><input defaultValue={[customer.city, customer.state].filter(Boolean).join(", ")} aria-label="Permit city and state" /></td><td><input aria-label="Permit fee" /></td><td><input aria-label="Permit value" /></td><td /><td /><td /><td /><td /></tr>
          {Array.from({ length: 7 }, (_, i) => <tr key={`permit-blank-${i}`}><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>)}</tbody></table>
          <div className="ac-customer-contacts-recordbar">Record:　|◄　◄　<span>1 of 1</span>　►　►|　<em>{permitSearch ? "Filtered" : "No Filter"}</em><input value={permitSearch} onChange={(event) => setPermitSearch(event.target.value)} placeholder="Search" aria-label="Search permits" /></div>
        </div>
      </div>
    </section>
  );
}

export function CustomerProfileScreen({ customer }: CustomerProfileScreenProps) {
  const [activeTab, setActiveTab] = useState("01-basic");

  return (
    <div className="ac-customer-search-page flex min-h-0 flex-1 flex-col">
      <div className="ac-customer-search ac-customer-profile ac-tracking--modern flex min-h-0 flex-1 flex-col">
        <div className="ac-customer-search-body min-h-0 flex-1 flex-col">
          <div className="ac-panel ac-panel-elevated ac-customer-profile-shell shrink-0">
            <CustomerProfileHeader customer={customer} />

            <AccessTabs
              tabs={[...CUSTOMER_PROFILE_TABS]}
              className="ac-customer-search-view-tabs shrink-0 overflow-x-auto"
              sticky={false}
              activeId={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          <div className="ac-panel ac-panel-elevated ac-customer-profile-content min-h-0 flex-1">
            <div className="ac-customer-profile-body min-h-0 flex-1 overflow-y-auto">
              {activeTab === "01-basic" ? <CustomerProfileBasicTab customer={customer} /> : null}
              {activeTab === "02-contacts" ? <CustomerContactsTab customer={customer} /> : null}
              {activeTab === "03-billrates" ? <CustomerBillRatesTab customer={customer} /> : null}
              {activeTab === "04-insurance" ? <CustomerInsuranceInfoTab /> : null}
              {activeTab === "05-sales" ? <CustomerSalesTab /> : null}
              {activeTab === "06-collections" ? <CustomerCollectionsTab /> : null}
              {activeTab === "07-wcc" ? <CustomerWccTab /> : null}
              {activeTab === "08-inscert" ? <CustomerInsuranceCertRequestsTab /> : null}
              {activeTab === "09-options" ? <CustomerOptionsTab /> : null}
              {activeTab === "10-mult" ? <CustomerRateMultipliersTab /> : null}
              {activeTab === "11-jobs" ? <CustomerJobsTab customer={customer} /> : null}
              {activeTab === "12-saleshist" ? <CustomerSalesHistoryTab customer={customer} /> : null}
              {activeTab !== "01-basic" && activeTab !== "02-contacts" && activeTab !== "03-billrates" && activeTab !== "04-insurance" && activeTab !== "05-sales" && activeTab !== "06-collections" && activeTab !== "07-wcc" && activeTab !== "08-inscert" && activeTab !== "09-options" && activeTab !== "10-mult" && activeTab !== "11-jobs" && activeTab !== "12-saleshist" ? (
                <CustomerProfileStub id={activeTab} title={CUSTOMER_PROFILE_TABS.find((tab) => tab.id === activeTab)?.label ?? activeTab} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
