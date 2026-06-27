"use client";

import Link from "next/link";
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
  return (
    <label className={`ac-customer-profile-field ${wide ? "ac-customer-profile-field--wide" : ""} ${className}`}>
      <span className="ac-flabel">{label}</span>
      <input readOnly className={`ac-input ${mono ? "font-mono" : ""}`} value={value ?? ""} aria-label={label} />
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
      <select disabled className="ac-select" value={value ?? ""} aria-label={label || "Select"}>
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
            <select disabled className="ac-select" defaultValue="">
              <option value="">[Any]</option>
              {customer.status ? <option value={customer.status}>{customer.status}</option> : null}
            </select>
          </label>
          <label className="ac-customer-profile-inline-field ac-customer-profile-quick-search">
            <span className="ac-flabel">Customers Quick Search</span>
            <input readOnly className="ac-input" value={customer.customerName ?? ""} />
          </label>
          <div className="ac-customer-profile-search-match">
            <label className="ac-customer-profile-radio">
              <input type="radio" name="cust-search-match" defaultChecked disabled />
              <span>Like</span>
            </label>
            <label className="ac-customer-profile-radio">
              <input type="radio" name="cust-search-match" disabled />
              <span>=</span>
            </label>
          </div>
          <AccessButton xs disabled icon={Search}>
            Search
          </AccessButton>
          <Link href={`/jobs?customerId=${customer.customerId}`}>
            <AccessButton xs disabled className="ac-customer-profile-jobs-btn">
              Jobs
            </AccessButton>
          </Link>
        </div>

        <div className="ac-customer-profile-row-1-center">
          <span className="ac-customer-profile-flagship">Flagship</span>
          <div className="ac-customer-profile-mini-tabs">
            <button type="button" className="ac-customer-profile-mini-tab ac-customer-profile-mini-tab--active" disabled>
              Customer
            </button>
            <button type="button" className="ac-customer-profile-mini-tab" disabled>
              Credit History
            </button>
          </div>
          <ProfileField label="Customer Since" value={customer.entryTimestamp} />
          <ProfileField label="Contract Date" value="" />
        </div>

        <div className="ac-customer-profile-row-1-right">
          <div className="ac-customer-profile-library-wrap">
            <span className="ac-flabel">Library Card #</span>
            <div className="ac-customer-profile-library-box" aria-hidden />
          </div>
          <AccessButton xs disabled className="ac-customer-profile-research-btn">
            RE-SEARCH
          </AccessButton>
          <select disabled size={3} className="ac-select ac-customer-profile-step-list" defaultValue="1">
            <option value="1">Step 1: Ma Board</option>
            <option value="2">Step 2: Corporate Lookup</option>
            <option value="3">Step 3: Google</option>
          </select>
          <div className="ac-customer-profile-step-nav">
            <AccessButton xs disabled className="ac-customer-profile-step-arrow">
              ►
            </AccessButton>
            <button type="button" className="ac-customer-profile-util-icon" disabled aria-label="Document" />
            <button type="button" className="ac-customer-profile-util-icon ac-customer-profile-util-icon--gear" disabled aria-label="Settings" />
          </div>
          <span className="ac-customer-profile-delete-link">Delete | 037</span>
        </div>
      </div>

      <div className="ac-customer-profile-row ac-customer-profile-row-2">
        {CUSTOMER_PROFILE_TOOLBAR_BUTTONS.map((label) => (
          <AccessButton key={label} xs disabled className="ac-customer-profile-toolbar-btn">
            {label}
          </AccessButton>
        ))}
      </div>

      <div className="ac-customer-profile-row ac-customer-profile-row-3">
        <ProfileField label="Customer" value={customer.customerName} className="ac-customer-profile-customer-name" />
        <button type="button" className="ac-customer-profile-icon-btn ac-customer-profile-icon-btn--doc" disabled aria-label="Copy" />
        <button type="button" className="ac-customer-profile-icon-btn" disabled aria-label="Home">
          <Icon icon={Home} size="xs" />
        </button>
        <button type="button" className="ac-customer-profile-icon-btn ac-customer-profile-icon-btn--g" disabled aria-label="Google">
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
        <AccessButton xs disabled className="ac-customer-profile-save-btn">
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
            <input type="checkbox" disabled />
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
          <label className="ac-customer-profile-check">
            <input type="checkbox" disabled />
            <span>No Communication</span>
          </label>
          <div className="ac-customer-profile-meta-pair">
            <ProfileField label="User" value="" />
            <ProfileField label="Date" value="" />
          </div>
          <label className="ac-customer-profile-check">
            <input type="checkbox" disabled />
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
            <textarea readOnly className="ac-input ac-customer-profile-textarea" value={customer.customerNote ?? ""} />
          </label>
          <label className="ac-customer-profile-note ac-customer-profile-note--short">
            <span className="ac-flabel">Invoice Note Shown in Tracking</span>
            <textarea readOnly className="ac-input ac-customer-profile-textarea" value={customer.invoiceNote ?? ""} />
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
          <div className="ac-customer-profile-links-grid">
            {CUSTOMER_PROFILE_LINK_ENTITIES.map((entity) => (
              <div key={entity} className="ac-customer-profile-links-col">
                <div className="ac-customer-profile-links-head">{entity}</div>
                {CUSTOMER_PROFILE_LINK_ACTIONS.map((action) => (
                  <AccessButton key={action} xs disabled className="ac-customer-profile-link-btn">
                    {action}
                  </AccessButton>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ac-customer-profile-folder-row">
        <AccessButton xs disabled>
          Open Company Folder
        </AccessButton>
        <ProfileField label="Folder" value="" wide className="ac-customer-profile-folder-field" />
        <AccessButton xs disabled>
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

function CustomerProfileStub({ id, title }: { id: string; title: string }) {
  return (
    <section id={id} className="ac-customer-profile-stub">
      <div className="ac-customer-profile-stub-title">{title}</div>
      <p className="ac-customer-profile-stub-text">Read-only shell — full tab content coming later.</p>
    </section>
  );
}

export function CustomerProfileScreen({ customer }: CustomerProfileScreenProps) {
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
            />
          </div>

          <div className="ac-panel ac-panel-elevated ac-customer-profile-content min-h-0 flex-1">
            <div className="ac-customer-profile-body min-h-0 flex-1 overflow-y-auto">
              <CustomerProfileBasicTab customer={customer} />
              <CustomerProfileStub id="02-contacts" title="02 Contacts" />
              <CustomerProfileStub id="03-billrates" title="03 Bill Rates" />
              <CustomerProfileStub id="04-insurance" title="04 Insurance Info" />
              <CustomerProfileStub id="05-sales" title="05 Sales" />
              <CustomerProfileStub id="06-collections" title="06 Collections" />
              <CustomerProfileStub id="07-wcc" title="07 Customer WCCs" />
              <CustomerProfileStub id="08-inscert" title="08 Insurance Cert Req" />
              <CustomerProfileStub id="09-options" title="09 Options" />
              <CustomerProfileStub id="10-mult" title="10 Rate Multipliers" />
              <CustomerProfileStub id="11-jobs" title="11 Jobs" />
              <CustomerProfileStub id="12-saleshist" title="12 Sales History" />
              <CustomerProfileStub id="13-segments" title="13 Segments" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
