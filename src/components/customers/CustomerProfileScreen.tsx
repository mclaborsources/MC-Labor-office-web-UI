"use client";

import Link from "next/link";
import type { ProfileRecord } from "@/lib/customerProfileFields";
import { CustomerProfileRuntime, useCustomerProfile, useProfileRows } from "./CustomerProfileRuntime";
import { CustomerLegacyIcon } from "./CustomerLegacyIcon";
import { useMemo, useState } from "react";
import { Search, FileText, CircleHelp } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import { AccessTabs } from "@/components/access/AccessTabs";
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
  action,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
  mono?: boolean;
  className?: string;
  action?: "copy" | "open";
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
    <label data-label={label} className={`ac-customer-profile-field ${wide ? "ac-customer-profile-field--wide" : ""} ${action ? "ac-customer-profile-field--action" : ""} ${className}`}>
      <span className="ac-flabel">{label}</span>
      <input type={inputType} className={`ac-input ${mono ? "font-mono" : ""}`} defaultValue={value ?? ""} aria-label={label} />
      {action && <button type="button" className="ac-customer-profile-field-action" aria-label={`${action === "copy" ? "Copy" : "Open"} ${label}`} disabled={!value} onClick={event => {
        event.preventDefault();
        if (!value) return;
        if (action === "copy") void navigator.clipboard.writeText(value);
        else { try { const url = new URL(value.includes("://") ? value : `https://${value}`); if (["http:", "https:"].includes(url.protocol)) window.open(url.href, "_blank", "noopener,noreferrer"); } catch { /* Invalid URL. */ } }
      }}>{action === "copy" ? <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="M1.5 1.5h5l3 3v7h-8z" fill="white" stroke="black"/><path d="M6.5 1.5v3h3M3 4h2M3 6h4M3 8h4M3 10h4" stroke="black"/><path d="M6.5 5.5h5l3 3v6h-8z" fill="white" stroke="#000080"/><path d="M11.5 5.5v3h3M8 8h2M8 10h5M8 12h5" stroke="#000080"/></svg> : <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 5.5h5l1.5 2h6v6H1.5z" fill="#ffff91" stroke="#000"/><path d="m1.5 13.5 3-6h11l-3 6z" fill="#ffff00" stroke="#000"/><path d="M8 5V2.5h4M10.5 1 12 2.5 10.5 4" stroke="#000" strokeWidth="1"/></svg>}</button>}
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
              <input type="radio" name="cust-search-match" />
              <span>Like</span>
            </label>
            <label className="ac-customer-profile-radio">
              <input type="radio" name="cust-search-match" defaultChecked />
              <span>=</span>
            </label>
          </div>
          <AccessButton data-action-status="missing" xs icon={Search}>
            Search
          </AccessButton>
          <Link href={`/jobs?customerId=${customer.customerId}`}>
            <AccessButton data-action-status="linked" xs className="ac-customer-profile-jobs-btn">
              Jobs
            </AccessButton>
          </Link>
        </div>

        <div className="ac-customer-profile-row-1-center">
          <div className="ac-customer-profile-mini-tabs">
            <button data-action-status="missing" type="button" className="ac-customer-profile-mini-tab ac-customer-profile-mini-tab--active">
              Customer
            </button>
            <button data-action-status="missing" type="button" className="ac-customer-profile-mini-tab">
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
          <AccessButton data-action-status="missing" xs className="ac-customer-profile-research-btn">
            RE-SEARCH
          </AccessButton>
          <div className="ac-customer-profile-step-list ac-customer-profile-step-grid" aria-label="Research steps">
            <span>Step 1</span><span>Ma Board</span>
            <span>Step 2</span><span>Corporate Lookup</span>
            <span>Step 3</span><span>Google</span>
          </div>
          <div className="ac-customer-profile-step-nav">
            <AccessButton data-action-status="missing" xs className="ac-customer-profile-step-arrow">
              ►
            </AccessButton>
            <button data-action-status="missing" type="button" className="ac-customer-profile-util-icon" aria-label="Document"><FileText size={17} /></button>
            <button data-action-status="missing" type="button" className="ac-customer-profile-util-icon ac-customer-profile-util-icon--gear" aria-label="Settings"><CircleHelp size={17} /></button>
          </div>
          <span className="ac-customer-profile-delete-link">Delete | 036</span>
        </div>
      </div>

      <div className="ac-customer-profile-row ac-customer-profile-row-2">
        {CUSTOMER_PROFILE_TOOLBAR_BUTTONS.map((label) => (
          <AccessButton data-action-status="missing" key={label} xs className="ac-customer-profile-toolbar-btn">
            {label}
          </AccessButton>
        ))}
      </div>

      <div className="ac-customer-profile-row ac-customer-profile-row-3">
        <ProfileField label="Customer" value={customer.customerName} className="ac-customer-profile-customer-name" />
        <button data-action-status="missing" type="button" className="ac-customer-profile-icon-btn ac-customer-profile-icon-btn--doc" aria-label="Copy"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="M1.5 1.5h5l3 3v7h-8z" fill="white" stroke="black"/><path d="M6.5 1.5v3h3M3 4h2M3 6h4M3 8h4M3 10h4" stroke="black"/><path d="M6.5 5.5h5l3 3v6h-8z" fill="white" stroke="#000080"/><path d="M11.5 5.5v3h3M8 8h2M8 10h5M8 12h5" stroke="#000080"/></svg></button>
        <button data-action-status="missing" type="button" className="ac-customer-profile-icon-btn" aria-label="Home">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="m1 7 7-6 7 6" stroke="#000"/><path d="M3.5 6v8.5h9V6L8 2z" fill="#ffffb5" stroke="#000"/><path d="M6.5 9.5h3v5h-3z" fill="#fff" stroke="#000"/><path d="M11 2h2v3" stroke="#000"/></svg>
        </button>
        <button data-action-status="missing" type="button" className="ac-customer-profile-icon-btn ac-customer-profile-icon-btn--g" aria-label="Google">
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
          value=""
          wide
          options={[
            { value: "", label: "" },
          ]}
        />
        <span className="ac-flabel ac-customer-profile-subtypes-label">Sub Types:</span>
        {[0, 1, 2, 3].map((i) => (
          <ProfileSelect
            key={i}
            label=""
            value=""
            className="ac-customer-profile-subtype-select"
            options={
              i === 0
                ? [
                    { value: "", label: "" },
                  ]
                : [{ value: "", label: "" }]
            }
          />
        ))}
        <AccessButton data-action-status="missing" xs className="ac-customer-profile-save-btn">
          Save | 037
        </AccessButton>
      </div>
    </div>
  );
}

function CustomerProfileBasicTab({ customer }: { customer: CustomerDetail }) {
  const {data}=useCustomerProfile();
  const activeWcc=(data.related.wcc??[]).filter(row=>["true","1"].includes(row.CustomerWCCActive));
  const cityState =
    [customer.city, customer.state].filter(Boolean).join(", ") || "";

  return (
    <section id="01-basic" className="ac-customer-profile-basic">
      <div className="ac-customer-profile-basic-grid">
        <div className="ac-customer-profile-col">
          <ProfileField label="Sales Package Name" value="" />
          <ProfileField label="Street" value={customer.street} wide action="copy" />
          <ProfileField label="City, State" value={cityState} action="copy" />
          <ProfileField label="Zip" value={customer.zip} />
          <label className="ac-customer-profile-check">
            <input type="checkbox" />
            <span>Different Mailing Address</span>
          </label>
          <ProfileField label="Street" value={customer.mailStreet} wide action="copy" />
          <ProfileField
            label="City, State"
            action="copy"
            value={[customer.mailCity, customer.mailState].filter(Boolean).join(", ")}
          />
          <ProfileField label="Zip" value={customer.mailZip} />
        </div>

        <div className="ac-customer-profile-col">
          <ProfileField label="Phone" value={customer.phone} action="copy" />
          <ProfileField label="Fax" value={customer.fax} action="copy" />
          <label className="ac-customer-profile-invoice-email"><span>Invoice Email</span><textarea className="ac-input" aria-label="Invoice Email" defaultValue={customer.email} /><button type="button" className="ac-customer-profile-field-action" aria-label="Copy Invoice Email" onClick={() => { if (customer.email) void navigator.clipboard.writeText(customer.email); }}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="M1.5 1.5h5l3 3v7h-8z" fill="white" stroke="black"/><path d="M6.5 1.5v3h3M3 4h2M3 6h4M3 8h4M3 10h4" stroke="black"/><path d="M6.5 5.5h5l3 3v6h-8z" fill="white" stroke="#000080"/><path d="M11.5 5.5v3h3M8 8h2M8 10h5M8 12h5" stroke="#000080"/></svg></button></label>
          <ProfileField label="Customer Web Site" value={customer.website} wide action="open" />
          <ProfileField label="Corp Web Site" value={customer.corpWebsite} wide action="open" />
          <ProfileField label="LinkedIn Profile" value="" wide action="open" />
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
            <div className="customer-wcc-scroll" style={{height:130,overflow:"hidden",background:"repeating-linear-gradient(#fff 0px,#fff 19px,#f3f3f3 19px,#f3f3f3 20px)"}}><table className="customer-wcc-grid" style={{width:599,tableLayout:"fixed",borderCollapse:"collapse",font:"13px Calibri, Arial, sans-serif"}}><colgroup>{[18,234,98,150,67,32].map((width,index)=><col key={index} style={{width}}/>)}</colgroup><thead><tr>{["","WC Code","User","Timestamp","Active",""].map((label,index)=><th key={index} style={{height:20,padding:"0 4px",border:"1px solid #c5cbd1",background:"#e2e6ec",fontWeight:400,textAlign:"center",position:"relative",paddingRight:label ? 14 : 4}}>{label}{label && <span aria-hidden="true" style={{position:"absolute",right:4,top:8,width:0,height:0,borderLeft:"3px solid transparent",borderRight:"3px solid transparent",borderTop:"4px solid #59626b"}}/>}</th>)}</tr></thead><tbody>{activeWcc.slice(0,6).map(row=><tr key={row.CustomerWCCID}><td/><td>{data.lookups.WCCID?.find(option=>option.value===row.WCCID)?.label??row.WCCID}</td><td>{row.CustomerWCCUserName}</td><td>{row.CustomerWCCTimestamp}</td><td>Yes</td><td/></tr>)}{Array.from({length:Math.max(0,6-activeWcc.length)},(_,index)=><tr key={`blank-${index}`}><td/><td/><td/><td/><td/><td/></tr>)}</tbody></table></div><div className="customer-wcc-footer" style={{display:"flex",alignItems:"center",gap:3,height:17,font:"11px Calibri, Arial, sans-serif",background:"#e8e8ec",borderTop:"1px solid #aaa"}}><span>Record:</span><span>◂| ◂</span><input readOnly style={{width:49,height:16,minHeight:16,padding:"0 2px",border:"1px solid #aaa",flex:"0 0 49px"}} aria-label="WC record position" value={activeWcc.length ? `1 of ${activeWcc.length}` : ""}/><span>▸ ▸| ▸*</span><span className="customer-wcc-filter">▽ No Filter</span><input style={{width:69,height:16,minHeight:16,padding:"0 2px",border:"1px solid #aaa",flex:"0 0 69px"}} placeholder="Search" aria-label="Search WC codes"/></div>
          </div>
        </div>

        <div className="ac-customer-profile-links">
          <div className="ac-customer-profile-links-title"><span>Hyperlinks</span></div>
          <div className="ac-customer-profile-links-grid">
            {CUSTOMER_PROFILE_LINK_ENTITIES.map((entity) => (
              <div key={entity} className="ac-customer-profile-links-col">
                <div className="ac-customer-profile-links-head">{entity}</div>
                {CUSTOMER_PROFILE_LINK_ACTIONS.map((action) => (
                  <div key={action} className="ac-customer-profile-link-row"><input aria-label={`${entity} ${action} file`} readOnly value="" /><AccessButton data-action-status="missing" xs className="ac-customer-profile-link-btn">
                    {action}
                  </AccessButton></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ac-customer-profile-folder-row">
        <AccessButton data-action-status="missing" xs>
          Open Company Folder
        </AccessButton>
        <ProfileField label="Folder" value="" wide className="ac-customer-profile-folder-field" />
        <AccessButton data-action-status="missing" xs>
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
  const [selectedId, setSelectedId] = useState<string | null>(customer.billRates[0]?.billRateId ?? null);
  const [rows,setRows]=useProfileRows<EditableBillRate>("billRates",row=>({billRateId:row.CustomerBillRateID,grade:row.BillRateGrade,billRate:row.BillRate,note:row.BillRateNote,active:row.BillRateActive === "true" || row.BillRateActive === "1",userName:row.BillRateUserName,timestamp:row.BillRateTimestamp,sortOrder:Number(row.BillRateSort)||0}),row=>({id:row.billRateId,changes:{BillRateGrade:row.grade,BillRate:row.billRate,BillRateNote:row.note,BillRateActive:row.active,BillRateSort:row.sortOrder}}));

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
        <button data-action-status="complete" type="button" onClick={() => moveSelected(-1)} disabled={!selectedId} aria-label="Move selected rate up">↑</button>
        <button data-action-status="complete" type="button" onClick={() => moveSelected(1)} disabled={!selectedId} aria-label="Move selected rate down">↓</button>
        <button data-action-status="complete" type="button" onClick={deleteSelected} disabled={!selectedId} aria-label="Delete selected rate">×</button>
      </div>

      <div className="ac-customer-bill-rate-grid-wrap">
        <div className="ac-customer-bill-rate-scroll"><table className="ac-customer-bill-rate-grid">
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
            <tr className={visibleRows.length === 0 ? "is-selected ac-bill-rate-new-row" : "ac-bill-rate-new-row"}><td><button type="button" onClick={addRow} aria-label="Add bill rate">*</button></td><td onDoubleClick={addRow} /><td /><td /><td /><td /><td /><td><input type="checkbox" checked readOnly aria-label="New rate active" /></td></tr>
            {Array.from({length:Math.max(0,14-visibleRows.length)},(_,index)=><tr key={`blank-rate-${index}`} aria-hidden="true">{Array.from({length:8},(_,cell)=><td key={cell} />)}</tr>)}
          </tbody>
        </table></div>
        <div className="ac-customer-bill-rate-recordbar">Record:　|◂　◂　{visibleRows.length ? `1 of ${visibleRows.length}` : "1 of 1"}　▸　▸| <span>{filter === "all" && !search ? "No Filter" : "Filtered"}</span><input aria-label="Search bill rates" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
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
            type="text"
            onFocus={event => { event.currentTarget.type = "date"; }}
            onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = "text"; }}
            className="ac-input ac-customer-insurance-date"
            defaultValue=""
            aria-label={`${carrier} WC expiration date`}
          />
        ))}

        <div className="ac-customer-insurance-row-label">GL x Date</div>
        {CUSTOMER_INSURANCE_CARRIERS.map((carrier) => (
          <input
            key={`${carrier}-gl`}
            type="text"
            onFocus={event => { event.currentTarget.type = "date"; }}
            onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = "text"; }}
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
        <option value="" />
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
      <AccessButton data-action-status="missing"
        xs
        className={`ac-customer-sales-transfer ${future ? "ac-customer-sales-transfer--future" : ""}`}
      >
        Transfer Folders
        <br />
        {future ? "<<<<<<<<" : ">>>>>>>>"}
        <br />
        {future ? "Future Sales to COMPANIES" : "Companies to FUTURE SALES"}
      </AccessButton>
      <AccessButton data-action-status="missing" xs className="ac-customer-sales-folder-action">
        Create Company Folder in 00 Companies{future ? " - Future Sales" : ""}
      </AccessButton>
      <AccessButton data-action-status="missing" xs className="ac-customer-sales-folder-action ac-customer-sales-folder-open">
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
            <AccessButton data-action-status="missing" xs>History</AccessButton>
          </div>
          <label className="ac-customer-sales-date-field">
            <span>Date on Contract</span>
            <input type="text" onFocus={event => { event.currentTarget.type = "date"; }} onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = "text"; }} className="ac-input" defaultValue="" aria-label="Date on Contract" />
          </label>
        </div>

        <div className="ac-customer-sales-contract-right">
          <div className="ac-customer-sales-history-row">
            <SalesSelect label="Salesman (Admin)" options={CUSTOMER_SALES_PEOPLE} />
            <AccessButton data-action-status="missing" xs>History</AccessButton>
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
        />
        <div className="ac-customer-sales-contract-actions">
          <AccessButton data-action-status="missing" xs>Copy IPG Sales Contract</AccessButton>
          <AccessButton data-action-status="missing" xs>Populate IPG Sales Contract</AccessButton>
        </div>

        <label className="ac-customer-sales-small-field">
          <span>User</span>
          <input className="ac-input" defaultValue="" aria-label="Contract user" />
        </label>
        <label className="ac-customer-sales-small-field">
          <span>Date</span>
          <input type="text" onFocus={event => { event.currentTarget.type = "date"; }} onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = "text"; }} className="ac-input" defaultValue="" aria-label="Contract update date" />
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
  const [rows, setRows] = useProfileRows<CollectionNoteRow>("collections", row=>({id:row.CustomerNoteID,note:row.CustomerNote,userName:row.CustomerNoteUserName,timestamp:row.CustomerNoteTimestamp,active:row.CustomerNoteActive === "true" || row.CustomerNoteActive === "1"}),row=>({id:row.id,changes:{CustomerNote:row.note,CustomerNoteActive:row.active}}),[{ id:"collection-new",note:"",userName:"",timestamp:"",active:true }]);

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
        <button data-action-status="complete"
          type="button"
          className="ac-customer-collections-delete"
          onClick={deleteSelectedCollection}
          disabled={!selectedId}
          aria-label="Delete selected collection note"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="m3 3 10 10M13 3 3 13M2 3h3M11 3h3M2 13h3M11 13h3" stroke="#000" /></svg>
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
                    <button data-action-status="complete" type="button" onClick={() => setSelectedId(row.id)} aria-label="Select collection note">
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

      <AccessButton data-action-status="missing" xs className="ac-customer-collections-folder-btn">
        Create Folders for Bad Debt and Small Claims
      </AccessButton>
    </section>
  );
}


interface CustomerWccRow {
  id: string;
  wcCode: string;
  user: string;
  timestamp: string;
  active: boolean;
}

function CustomerWccTab() {
  const {data}=useCustomerProfile();
  const [filter, setFilter] = useState<CollectionFilter>("active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("wcc-new");
  const [rows, setRows] = useProfileRows<CustomerWccRow>("wcc",row=>({id:row.CustomerWCCID,wcCode:row.WCCID,user:row.CustomerWCCUserName,timestamp:row.CustomerWCCTimestamp,active:row.CustomerWCCActive === "true" || row.CustomerWCCActive === "1"}),row=>({id:row.id,changes:{WCCID:row.wcCode,CustomerWCCActive:row.active}}),[{id:"wcc-new",wcCode:"",user:"",timestamp:"",active:true}]);

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
        <button data-action-status="complete"
          type="button"
          className="ac-customer-collections-delete"
          onClick={deleteSelectedWcc}
          disabled={!selectedId}
          aria-label="Delete selected customer WC code"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="m3 3 10 10M13 3 3 13M2 3h3M11 3h3M2 13h3M11 13h3" stroke="#000" /></svg>
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
                    <button data-action-status="complete" type="button" onClick={() => setSelectedId(row.id)} aria-label="Select customer WC code">
                      {selectedId === row.id ? "*" : ""}
                    </button>
                  </td>
                  <td>
                    <select value={row.wcCode} onFocus={() => setSelectedId(row.id)} onChange={(event) => updateWcc(row.id, "wcCode", event.target.value)} aria-label="WC Code">
                      <option value="">Select…</option>
                      {(data.lookups.WCCID??[]).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
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


interface InsuranceCertRequestRow {
  id: string;
  requestDate: string;
  state: string;
  requestedBy: string;
}

function CustomerInsuranceCertRequestsTab() {
  const [search, setSearch] = useState("");
  const {data}=useCustomerProfile();
  const [rows,setRows]=useProfileRows<InsuranceCertRequestRow>("certificates",row=>({id:row.CustomerInsuranceCertReqID,requestDate:row.CustomerInsuranceCertReqTimestamp.slice(0,10),state:row.CustomerInsuranceCertReqStateID,requestedBy:row.CustomerInsuranceCertReqRequestedBy}),row=>({id:row.id,changes:{CustomerInsuranceCertReqRequestedBy:row.requestedBy,CustomerInsuranceCertReqStateID:row.state,CustomerInsuranceCertReqTimestamp:row.requestDate}}));

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
        state: "",
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
        <AccessButton data-action-status="complete" xs onClick={addInsuranceCertRequest}>New Insurance Cert Req</AccessButton>
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
                  <input type={row.requestDate ? "date" : "text"} onFocus={event => { event.currentTarget.type = "date"; }} onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = "text"; }} value={row.requestDate} onChange={(event) => updateInsuranceCertRequest(row.id, "requestDate", event.target.value)} aria-label="Certificate request date" />
                </td>
                <td>
                  <select value={row.state} onChange={(event) => updateInsuranceCertRequest(row.id, "state", event.target.value)} aria-label="Certificate request state">
                    {(data.lookups.CustomerInsuranceCertReqStateID??[]).map((state) => (
                      <option key={state.value} value={state.value}>{state.label}</option>
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
          <div>• Hours/timesheet autotext <input type="checkbox" aria-label="Hours timesheet autotext" /></div>
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
              <select defaultValue=""><option value="" />
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
              <AccessButton data-action-status="missing" xs>History</AccessButton>
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
          <AccessButton data-action-status="missing" xs className="ac-customer-options-associations">
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
              <label><span>Status</span><select defaultValue=""><option value="" /><option>Salesman</option><option>Customer</option><option>Inactive</option><option>Prospect</option></select></label>
              <OptionCheck label="Customer is Set Up" />
              <label><span>Hunter</span><select defaultValue=""><option value="" />{CUSTOMER_SALES_PEOPLE.map((person) => <option key={person}>{person}</option>)}</select></label>
              <label><span>Credit History</span><select defaultValue=""><option value="" /><option>Excellent</option><option>Good</option><option>Fair</option><option>Hold</option></select></label>
              <AccessButton data-action-status="missing" xs>History</AccessButton>
              <label><span>Term Limit</span><select defaultValue=""><option value="" /><option>15</option><option>30</option><option>45</option><option>60</option><option>90</option></select><em>(Days)</em></label>
              <AccessButton data-action-status="missing" xs>History</AccessButton>
              <label><span>Legal Status</span><select defaultValue="Non Legal"><option>Non Legal</option><option>Attorney Review</option><option>Collections</option><option>Judgment</option><option>Resolved</option></select></label>
              <AccessButton data-action-status="missing" xs>History</AccessButton>
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
              <button data-action-status="complete" key={status} type="button" className={statusFilter === status ? "is-active" : ""} onClick={() => setStatusFilter(status)}>{status}</button>
            ))}
          </fieldset>
          <div className="ac-customer-jobs-actions">
            <AccessButton data-action-status="missing" xs>New Job</AccessButton>
            <div><AccessButton data-action-status="missing" xs>Copy Job</AccessButton><em>Select one job first</em></div>
            <div><AccessButton data-action-status="missing" xs>Change Status</AccessButton><em>Select one or more jobs first</em></div>
          </div>
        </div>
        <div className="ac-customer-jobs-select-row">
          <span>Select:</span>
          <AccessButton data-action-status="complete" xs onClick={() => setAllJobs(false)}>Clear</AccessButton>
          <AccessButton data-action-status="complete" xs onClick={() => setAllJobs(true)}>All</AccessButton>
          <label><span>Change Job Status to:</span><select value={changeStatus} onChange={(event) => setChangeStatus(event.target.value)}><option value="" />{CUSTOMER_JOB_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label>
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
              {Array.from({ length: Math.max(0, 23 - jobs.length) }, (_, index) => <tr key={`job-blank-${index}`} aria-hidden><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>)}
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
              {Array.from({ length: Math.max(0, 28 - foremen.length) }, (_, index) => <tr key={`foreman-blank-${index}`} aria-hidden><td /><td /><td /><td /><td /></tr>)}
            </tbody>
          </table>
          <div className="ac-customer-jobs-recordbar">Record:　|◄　◄　<span>{foremen.length ? `1 of ${foremen.length}` : ""}</span>　►　►|　<em>{foremanSearch ? "Filtered" : "No Filter"}</em><input value={foremanSearch} onChange={(event) => setForemanSearch(event.target.value)} placeholder="Search" aria-label="Search foremen" /></div>
        </div>
      </div>
    </section>
  );
}

const SALES_HISTORY_ACTIONS = ["Note", "Cold Call", "Sales Call", "Dormant Call", "Outlook Email", "Custom Email", "Custom Text", "Custom Letter", "Custom Postcard", "Mailer", "Credit", "LinkedIn"] as const;

function CustomerSalesHistoryTab({ customer }: { customer: CustomerDetail }) {
  const [selectedContact, setSelectedContact] = useState(0);
  const [contactQuery, setContactQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [selectedHistory, setSelectedHistory] = useState(0);
  const cityState = [customer.city, customer.state].filter(Boolean).join(", ");
  const {data}=useCustomerProfile();
  const historyRows=(data.related.history??[]).map(row=>[row.actionLabel||row.CustomerSalesHistoryActionTypeID,row.CustomerSalesHistoryUserName,row.CustomerSalesHistoryTimestamp,row.CustomerSalesHistoryNote,row.CustomerSalesHistoryResponseHLink,row.CustomerSalesHistoryResponseUserName,row.CustomerSalesHistoryResponseTimestamp,row.CustomerSalesHistoryID]).filter(row=>actionFilter === "All" || row[0].replace(/[\[\]]/g,"").toLowerCase() === actionFilter.toLowerCase());

  const verificationAudit = (label:string) => <><input className="ac-sales-verify-audit" aria-label={`${label} verification user`} readOnly value="" /><input className="ac-sales-verify-audit ac-sales-verify-audit-date" aria-label={`${label} verification date`} readOnly value="" /></>;

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
          ].map(([label, value]) => <label key={label}><span>{label}</span><input defaultValue={value} /><input type="checkbox" aria-label={`Verify ${label}`} /><input className="ac-sales-verify-audit" aria-label={`Verification user for ${label}`} readOnly value="" /><input className="ac-sales-verify-audit ac-sales-verify-audit-date" aria-label={`Verification date for ${label}`} readOnly value="" /></label>)}
        </div>
        <div className="ac-customer-sales-verify-group ac-customer-sales-mailing">
          <OptionCheck label="Different Mailing Address" />
          <label><span>Street</span><input defaultValue={customer.mailStreet} /><input type="checkbox" aria-label="Verify mailing street" />{verificationAudit("mailing street")}</label>
          <label><span>City, St.</span><input defaultValue={[customer.mailCity, customer.mailState].filter(Boolean).join(", ")} /><input type="checkbox" aria-label="Verify mailing city state" />{verificationAudit("mailing city state")}</label>
          <label><span>Zip</span><input inputMode="numeric" defaultValue={customer.mailZip} /><input type="checkbox" aria-label="Verify mailing zip" />{verificationAudit("mailing zip")}</label>
        </div>
        <div className="ac-customer-sales-verify-group">
          <label><span>Phone</span><input type="tel" defaultValue={customer.phone} /><input type="checkbox" aria-label="Verify phone" />{verificationAudit("phone")}</label>
          <label><span>Fax</span><input type="tel" defaultValue={customer.fax} /><input type="checkbox" aria-label="Verify fax" />{verificationAudit("fax")}</label>
          <label><span>Cust. Type</span><select defaultValue={customer.customerType}><option>{customer.customerType}</option><option>General Contractor</option><option>Electrical</option><option>Mechanical</option></select><input type="checkbox" aria-label="Verify customer type" />{verificationAudit("customer type")}</label>
        </div>
        <div className="ac-customer-sales-verify-group ac-customer-sales-web">
          <label><span>Corp Web Site</span><input type="url" defaultValue={customer.corpWebsite} /><input type="checkbox" aria-label="Verify corporate website" />{verificationAudit("corporate website")}<span className="ac-sales-web-tools"><button type="button" data-action-status="missing" aria-label="Open corporate website"><CustomerLegacyIcon kind="folder" /></button><button type="button" data-action-status="missing" aria-label="Search corporate website"><CustomerLegacyIcon kind="search" /></button></span></label>
          <label><span>Cust. Web Site</span><input type="url" defaultValue={customer.website} /><input type="checkbox" aria-label="Verify customer website" />{verificationAudit("customer website")}<span className="ac-sales-web-tools"><button type="button" data-action-status="missing" aria-label="Open customer website"><CustomerLegacyIcon kind="folder" /></button><button type="button" data-action-status="missing" aria-label="Search customer website"><CustomerLegacyIcon kind="search" /></button><button type="button" className="ac-sales-web-copy" data-action-status="missing" aria-label="Copy customer website"><CustomerLegacyIcon kind="copy" /></button></span></label>
        </div>
      </div>

      <div className="ac-customer-sales-history-rowblock">
        <div className="ac-customer-sales-vertical">CONTACTS</div>
        <div className="ac-customer-sales-side-actions"><button data-action-status="missing" aria-label="Move contact up"><CustomerLegacyIcon kind="up" /></button><button data-action-status="missing" aria-label="Move contact down"><CustomerLegacyIcon kind="down" /></button><button data-action-status="missing" aria-label="Delete selected row"><CustomerLegacyIcon kind="delete" /></button></div>
        <div className="ac-customer-sales-history-table-wrap ac-sales-contacts-datasheet"><div className="ac-sales-contacts-scroll">
          <table><colgroup>{[18,72,87,168,233,102,96,202,109,126,122,53,56,170,66].map((width,index)=><col key={index} style={{width}} />)}</colgroup><thead><tr><th /><th>FName</th><th>LName</th><th>Title</th><th>Email</th><th>Cell</th><th>Carrier</th><th>Text Msg Addr</th><th>Office Phone</th><th>LinkedIn Profile</th><th>Notes</th><th>Sort</th><th>User</th><th>Date</th><th>Select</th></tr></thead>
          <tbody>{customer.contacts.filter(contact => !contactQuery || [contact.firstName,contact.lastName,contact.email,contact.title].join(" ").toLowerCase().includes(contactQuery.toLowerCase())).map((contact, index) => <tr className={selectedContact === index ? "is-selected" : undefined} onClick={() => setSelectedContact(index)} key={contact.contactId}><td>{selectedContact === index ? "▸" : ""}</td><td>{contact.firstName}</td><td>{contact.lastName}</td><td>{contact.title}</td><td>{contact.email}</td><td>{contact.cellPhone}</td><td /><td /><td>{contact.officePhone}</td><td /><td>{contact.notes}</td><td>{index + 1}</td><td /><td /><td /></tr>)}
          {Array.from({ length: Math.max(0, 5 - customer.contacts.length) }, (_, i) => <tr key={`contact-blank-${i}`}><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>)}</tbody></table></div>
          <div className="ac-customer-sales-history-recordbar ac-sales-contacts-nav"><span>Record:</span><button type="button" aria-label="First contact" disabled={!customer.contacts.length} onClick={() => setSelectedContact(0)}>|◂</button><button type="button" aria-label="Previous contact" disabled={!customer.contacts.length} onClick={() => setSelectedContact(index => Math.max(0,index-1))}>◂</button><input aria-label="Contact record position" readOnly value={customer.contacts.length ? `${selectedContact+1} of ${customer.contacts.length}` : ""} /><button type="button" aria-label="Next contact" disabled={!customer.contacts.length} onClick={() => setSelectedContact(index => Math.min(customer.contacts.length-1,index+1))}>▸</button><button type="button" aria-label="Last contact" disabled={!customer.contacts.length} onClick={() => setSelectedContact(customer.contacts.length-1)}>▸|</button><span className="ac-sales-contacts-no-filter">▽ No Filter</span><input aria-label="Search sales history contacts" placeholder="Search" value={contactQuery} onChange={event => {setContactQuery(event.target.value);setSelectedContact(0);}} /></div>
          <strong>For all Info emails, please select &quot;Info&quot; for the contact&apos;s Title value.</strong>
        </div>
      </div>

      <div className="ac-customer-sales-history-rowblock">
        <div className="ac-customer-sales-vertical">HISTORY</div>
        <div className="ac-customer-sales-side-actions"><button data-action-status="missing">Add</button><button data-action-status="missing" aria-label="Delete selected row"><CustomerLegacyIcon kind="delete" /></button></div>
        <div className="ac-customer-sales-history-center"><div className="ac-sales-response-actions"><AccessButton data-action-status="missing" xs>Browse for Response File</AccessButton><AccessButton data-action-status="missing" xs>Open Response Folder</AccessButton></div>
          <div className="ac-customer-sales-history-filters"><span>Filter:</span>{[...SALES_HISTORY_ACTIONS, "All"].map((action) => <button data-action-status="complete" key={action} className={actionFilter === action ? "is-active" : ""} onClick={() => { setActionFilter(action); setSelectedHistory(0); }}>{action}</button>)}</div>
          <div className="ac-customer-sales-history-table-wrap ac-customer-sales-action-table"><div className="ac-sales-history-scroll"><table><colgroup>{[18,175,56,95,56,145,415,244,56,96].map((width,index)=><col key={index} style={{width}} />)}</colgroup><thead><tr><th /><th>Action Type</th><th>User</th><th>Date</th><th /><th>To</th><th>Notes</th><th>Response HL</th><th>User</th><th>Date</th></tr></thead><tbody>{historyRows.map((row, i) => <tr className={selectedHistory === i ? "is-selected" : undefined} onClick={() => setSelectedHistory(i)} key={row[7]}><td>{selectedHistory === i ? "▸" : ""}</td><td>[{row[0]}]</td><td>{row[1]}</td><td>{row[2]}</td><td><a>View</a></td><td /><td>{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td><td>{row[6]}</td></tr>)}</tbody></table></div><div className="ac-customer-sales-history-recordbar ac-sales-contacts-nav"><span>Record:</span><button type="button" aria-label="First history record" disabled={!historyRows.length} onClick={() => setSelectedHistory(0)}>|◂</button><button type="button" aria-label="Previous history record" disabled={!historyRows.length} onClick={() => setSelectedHistory(i => Math.max(0,i-1))}>◂</button><input aria-label="History record position" readOnly value={historyRows.length ? `${selectedHistory+1} of ${historyRows.length}` : ""} /><button type="button" aria-label="Next history record" disabled={!historyRows.length} onClick={() => setSelectedHistory(i => Math.min(historyRows.length-1,i+1))}>▸</button><button type="button" aria-label="Last history record" disabled={!historyRows.length} onClick={() => setSelectedHistory(historyRows.length-1)}>▸|</button><span className="ac-sales-contacts-no-filter">▽ No Filter</span><input aria-label="Search history" placeholder="Search" readOnly /></div></div>
        </div>
        <aside className="ac-customer-sales-history-status">
          <label><span>Sales History Status</span><select><option value="" /><option>Active Prospect</option><option>Current Customer</option><option>Dormant</option></select></label>
          <label><span>Internet Sales Ready</span><select><option value="" /><option>01 - Research</option><option>03 - Ready</option></select></label>
          <label className="ac-sales-audit"><span>User and Date</span><input readOnly value="" /><input readOnly value="" /></label><label><span>Fast Action</span><select><option value="" />{SALES_HISTORY_ACTIONS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <OptionCheck label="Sales Package Sent" />
          <label><span>Future Call:</span><input /></label>
          <AccessButton data-action-status="missing" xs>Clear</AccessButton><AccessButton data-action-status="missing" xs>History</AccessButton><label className="ac-sales-audit"><span>User and Date</span><input readOnly value="" /><input readOnly value="" /></label>
        </aside>
      </div>

      <div className="ac-customer-sales-research">
        <div className="ac-customer-sales-vertical">SEARCH</div>
        <div className="ac-customer-sales-search-terms"><strong>Search Terms</strong><div>{customer.customerName}<br />{customer.customerName}, {customer.street}, {cityState}<br />{customer.contacts[0]?.firstName} {customer.contacts[0]?.lastName}, {customer.street}, {cityState}</div></div>
        <div className="ac-customer-sales-search-buttons">{["All", "Customer", "Contact", "City, State", "USA", "Card #", "True P", "Google", "LinkedIn", "Blue B", "Facebook", "BBB", "Corp Lk"].map((x) => <AccessButton data-action-status="missing" key={x} xs>{["All", "Customer", "Contact", "City, State", "Card #"].includes(x) && <CustomerLegacyIcon kind="copy" />}{x}</AccessButton>)}</div>
        <label className="ac-customer-sales-research-notes"><span>Customer Research Notes</span><textarea /></label>
        <div className="ac-sales-research-actions"><AccessButton data-action-status="missing" xs>Record</AccessButton><AccessButton data-action-status="missing" xs>Customer Research History</AccessButton><label>Entry User and Date <input readOnly value="" /><input readOnly value="" /></label></div>
        <div className="ac-sales-research-flags">{["Corp Search, Found", "Corp Search, Not Found", "Lic Search, Found", "Lic Search, Not Found"].map(label=><label key={label}><span>{label}</span><input type="checkbox" /><input readOnly value="" /><input readOnly value="" /></label>)}</div>
        <div className="ac-sales-permit"><div className="ac-customer-sales-vertical">PERMIT</div><div>{["Street", "City, State", "Date", "Fee", "Value"].map(label=><label key={label}><span>{label}</span><input readOnly value="" /></label>)}</div></div>
      </div>
    </section>
  );
}


function CustomerContactsTab({ customer }: { customer: CustomerDetail }) {
  const {data}=useCustomerProfile();
  const [contactRows,setContactRows]=useProfileRows<ProfileRecord>("contacts",row=>row,row=>({id:row.CustomerContactID,changes:Object.fromEntries(["CustomerContactFName","CustomerContactLName","CustomerContactTitleID","CustomerContactEmail","CustomerContactCell","CustomerContactOfficePhone","CustomerContactNotes","CustomerContactSort","CustomerContactLinkedInProfile"].map(key=>[key,row[key]]))}));
  const editContact=(id:string,field:string,value:string)=>setContactRows(rows=>rows.map(row=>row.CustomerContactID===id?{...row,[field]:value}:row));
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState(customer.contacts[0]?.contactId);
  const selected = customer.contacts.find(contact => contact.contactId === selectedContact);
  const [permits,setPermits]=useProfileRows<ProfileRecord>("permits",row=>row,row=>({id:row.CustomerPermitID,changes:Object.fromEntries(["CustomerPermitStreet","CustomerPermitCity","CustomerPermitState","CustomerPermitDate","CustomerPermitFee","CustomerPermitValue"].map(key=>[key,row[key]]))}));
  const editPermit=(id:string,field:string,value:string)=>setPermits(rows=>rows.map(row=>row.CustomerPermitID===id?{...row,[field]:value}:row));
  const [permitSearch, setPermitSearch] = useState("");
  const contacts = contactRows.map(row=>({contactId:row.CustomerContactID,firstName:row.CustomerContactFName??"",lastName:row.CustomerContactLName??"",title:row.CustomerContactTitleID??"",email:row.CustomerContactEmail??"",cellPhone:row.CustomerContactCell??"",officePhone:row.CustomerContactOfficePhone??"",notes:row.CustomerContactNotes??"",sort:row.CustomerContactSort??"",user:row.CustomerContactUserName??"",date:row.CustomerContactTimestamp??"",textAddress:row.CustomerContactTextMsgAddress??"",linkedIn:row.CustomerContactLinkedInProfile??"",carrier:row.CustomerContactCellCarrierID??""})).sort((a,b)=>Number(a.sort)-Number(b.sort)).filter((contact) => {
    const term = contactSearch.trim().toLowerCase();
    return !term || [contact.firstName, contact.lastName, contact.title, contact.email, contact.cellPhone, contact.officePhone, contact.notes].some((value) => value.toLowerCase().includes(term));
  });

  return (
    <section id="02-contacts" className="ac-customer-contacts-tab">
      <div className="ac-customer-contacts-grid-row">
        <div className="ac-customer-contacts-side-buttons">
          <button data-action-status="missing" aria-label="Move contact up"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges"><path d="M3.5 7.5 8 3l4.5 4.5h-3v5h-3v-5z" fill="#008080" stroke="#000" strokeWidth="1" /></svg></button>
          <button data-action-status="missing" aria-label="Move contact down"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges"><path d="M3.5 8.5 8 13l4.5-4.5h-3v-5h-3v5z" fill="#008080" stroke="#000" strokeWidth="1" /></svg></button>
          <button data-action-status="missing" aria-label="Delete contact" onClick={() => {if(selectedContact)setContactRows(rows=>rows.filter(row=>row.CustomerContactID!==selectedContact));}}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="m3 3 10 10M13 3 3 13M2 3h3M11 3h3M2 13h3M11 13h3" stroke="#000" /></svg></button>
          <button data-action-status="missing" className="ac-customer-copy-icon" aria-label="Copy contact" onClick={() => {if(selected)void navigator.clipboard.writeText([selected.fullName,selected.email,selected.cellPhone].filter(Boolean).join("\n"));}}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="M1.5 1.5h5l3 3v7h-8z" fill="white" stroke="black"/><path d="M6.5 1.5v3h3M3 4h2M3 6h4M3 8h4M3 10h4" stroke="black"/><path d="M6.5 5.5h5l3 3v6h-8z" fill="white" stroke="#000080"/><path d="M11.5 5.5v3h3M8 8h2M8 10h5M8 12h5" stroke="#000080"/></svg></button>
        </div>
        <div className="ac-customer-contacts-table-wrap">
          <table className="ac-customer-contacts-table"><colgroup>{[18,72,87,168,242,102,107,183,109,126,217,53,56,151,20].map((width,index) => <col key={index} style={{width}} />)}</colgroup><thead><tr><th /><th>FName</th><th>LName</th><th>Title</th><th>Email</th><th>Cell</th><th>Carrier</th><th>Text Msg Addr</th><th>Office Phone</th><th>LinkedIn Profile</th><th>Notes</th><th>Sort</th><th>User</th><th>Date</th><th aria-hidden /></tr></thead>
          <tbody>
            {contacts.map((contact, index) => <tr key={contact.contactId} className={selectedContact === contact.contactId ? "is-selected" : undefined} onClick={() => setSelectedContact(contact.contactId)}><td aria-label="Select contact">{selectedContact === contact.contactId ? "▸" : ""}</td><td><input aria-label="Contact firstName" value={contact.firstName} onChange={event=>editContact(contact.contactId,"CustomerContactFName",event.target.value)} /></td><td><input aria-label="Contact lastName" value={contact.lastName} onChange={event=>editContact(contact.contactId,"CustomerContactLName",event.target.value)} /></td><td><select aria-label="Contact title" value={contact.title} onChange={event=>editContact(contact.contactId,"CustomerContactTitleID",event.target.value)}><option value="" />{(data.lookups.CustomerContactTitleID??[]).map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></td><td><input aria-label="Contact email" value={contact.email} onChange={event=>editContact(contact.contactId,"CustomerContactEmail",event.target.value)} /></td><td><input aria-label="Contact cellPhone" value={contact.cellPhone} onChange={event=>editContact(contact.contactId,"CustomerContactCell",event.target.value)} /></td><td /><td /><td><input aria-label="Contact officePhone" value={contact.officePhone} onChange={event=>editContact(contact.contactId,"CustomerContactOfficePhone",event.target.value)} /></td><td /><td><input aria-label="Contact notes" value={contact.notes} onChange={event=>editContact(contact.contactId,"CustomerContactNotes",event.target.value)} /></td><td>{contact.sort||index+1}</td><td>{contact.user}</td><td>{contact.date}</td><td /></tr>)}
            {Array.from({ length: Math.max(0, 10 - contacts.length) }, (_, i) => <tr key={`contacts-blank-${i}`}><td>{i === 0 ? <button aria-label="Add contact" onClick={()=>{const id=`new-${Date.now()}`;setContactRows(rows=>[...rows,{CustomerContactID:id,CustomerContactSort:String(rows.length+1)}]);setSelectedContact(id);}}>*</button> : ""}</td><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>)}
          </tbody></table>
          <div className="ac-customer-contacts-recordbar">Record:　|◄　◄　<span>{contacts.length ? `1 of ${contacts.length}` : ""}</span>　►　►|　<em>{contactSearch ? "Filtered" : "No Filter"}</em><input value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Search" aria-label="Search contacts" /></div>
        </div>
      </div>

      <div className="ac-customer-contacts-guidance">
        <strong>For all Info emails, please select &quot;Info&quot; for the contact&apos;s Title value.</strong>
        <p>To use one of these buttons, highlight one contact row first by clicking the gray bar at the left side of the row.</p>
        <div><AccessButton data-action-status="complete" disabled={!selected?.email} onClick={() => { if (selected?.email) void navigator.clipboard.writeText(selected.email); }} xs><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="M1.5 1.5h5l3 3v7h-8z" fill="white" stroke="black"/><path d="M6.5 1.5v3h3M3 4h2M3 6h4M3 8h4M3 10h4" stroke="black"/><path d="M6.5 5.5h5l3 3v6h-8z" fill="white" stroke="#000080"/><path d="M11.5 5.5v3h3M8 8h2M8 10h5M8 12h5" stroke="#000080"/></svg> Copy Contact Email Address</AccessButton><AccessButton data-action-status="complete" disabled={!selected?.email} onClick={() => { if (selected?.email) window.location.href = `mailto:${selected.email}`; }} xs>▣　Send Email to Contact</AccessButton></div>
      </div>

      <div className="ac-customer-permits">
        <div className="ac-customer-permits-heading"><h2>Permits</h2><AccessButton data-action-status="complete" onClick={() => void navigator.clipboard.writeText(customer.street ?? "")} xs><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges"><path d="M1.5 1.5h5l3 3v7h-8z" fill="white" stroke="black"/><path d="M6.5 1.5v3h3M3 4h2M3 6h4M3 8h4M3 10h4" stroke="black"/><path d="M6.5 5.5h5l3 3v6h-8z" fill="white" stroke="#000080"/><path d="M11.5 5.5v3h3M8 8h2M8 10h5M8 12h5" stroke="#000080"/></svg> Copy Street</AccessButton><span>Double-click on City, State to select the state and city.</span></div>
        <div className="ac-customer-permits-table-wrap">
          <table className="ac-customer-permits-table"><thead><tr><th /><th>Permit Date</th><th>Street</th><th>City, State</th><th>Fee</th><th>Value</th><th>Timestamp</th><th>Permit Search Link</th><th>Link</th><th aria-hidden /><th aria-hidden /></tr></thead>
          <tbody>{permits.filter(row=>!permitSearch || Object.values(row).join(" ").toLowerCase().includes(permitSearch.toLowerCase())).map(row=><tr key={row.CustomerPermitID}><td /><td><input type="date" aria-label="Permit date" value={(row.CustomerPermitDate??"").slice(0,10)} onChange={event=>editPermit(row.CustomerPermitID,"CustomerPermitDate",event.target.value)} /></td>{["CustomerPermitStreet","CustomerPermitCity","CustomerPermitFee","CustomerPermitValue"].map(field=><td key={field}><input aria-label={field} value={row[field]??""} onChange={event=>editPermit(row.CustomerPermitID,field,event.target.value)} /></td>)}<td>{row.CustomerPermitTimestamp}</td><td /><td /><td /><td /></tr>)}<tr><td><button aria-label="Add permit" onClick={()=>setPermits(rows=>[...rows,{CustomerPermitID:`new-${Date.now()}`,CustomerPermitStreet:customer.street,CustomerPermitCity:customer.city,CustomerPermitState:customer.state}])}>*</button></td>{Array.from({length:10},(_,i)=><td key={i}/>)}</tr>
          {Array.from({ length: 8 }, (_, i) => <tr key={`permit-blank-${i}`}><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>)}</tbody></table>
          <div className="ac-customer-contacts-recordbar">Record:　|◄　◄　<span>1 of 1</span>　►　►|　<em>{permitSearch ? "Filtered" : "No Filter"}</em><input value={permitSearch} onChange={(event) => setPermitSearch(event.target.value)} placeholder="Search" aria-label="Search permits" /></div>
        </div>
      </div>
    </section>
  );
}

export function CustomerProfileScreen({customer}:CustomerProfileScreenProps) {
  const [customerPanel,setCustomerPanel]=useState("00-blank");
  return <CustomerProfileRuntime customerId={customer.customerId} tab={customerPanel}><CustomerProfileContent customer={customer} customerPanel={customerPanel} setCustomerPanel={setCustomerPanel} /></CustomerProfileRuntime>;
}
function CustomerProfileContent({customer:base,customerPanel,setCustomerPanel}:CustomerProfileScreenProps & {customerPanel:string;setCustomerPanel:(tab:string)=>void}) {
  const {data}=useCustomerProfile();
  const f=data.fields;
  const lookup=(key:string)=>data.lookups[key]?.find(option=>option.value===f[key])?.label??"";
  const customer:CustomerDetail={...base,customerName:f.CustBusName,street:f.Street,city:f.City,state:f.State,zip:f.Zip,phone:f.Phone,email:f.CustEmail,fax:f.CustFaxNum,mailStreet:f.MailStreet,mailCity:f.MailCity,mailState:f.MailState,mailZip:f.MailZip,website:f.CustWebSiteHLink,corpWebsite:f.CustCorpWebSiteHLink,customerNote:f.CustomerNote,invoiceNote:f.InvoiceNote,customerType:lookup("CustomerTypeID"),status:lookup("CustStatusID"),contacts:(data.related.contacts??[]).map(row=>({contactId:row.CustomerContactID,firstName:row.CustomerContactFName,lastName:row.CustomerContactLName,fullName:[row.CustomerContactFName,row.CustomerContactLName].filter(Boolean).join(" "),title:data.lookups.CustomerContactTitleID?.find(option=>option.value===row.CustomerContactTitleID)?.label??"",email:row.CustomerContactEmail,cellPhone:row.CustomerContactCell,officePhone:row.CustomerContactOfficePhone,notes:row.CustomerContactNotes}))};
  const activeTab=customerPanel;

  return (
    <div className="ac-customer-search-page ac-customer-profile-page flex min-h-0 flex-1 flex-col">
      <div className="ac-customer-search ac-customer-profile ac-tracking--modern flex min-h-0 flex-1 flex-col">
        <div className="ac-customer-search-body min-h-0 flex-1 flex-col">
          <div className="ac-customer-profile-record-selector" aria-hidden="true"><span /></div>
          <div className="ac-panel ac-panel-elevated ac-customer-profile-shell shrink-0">
            <CustomerProfileHeader customer={customer} />

            <AccessTabs
              tabs={[...CUSTOMER_PROFILE_TABS]}
              className="ac-customer-search-view-tabs shrink-0 overflow-x-auto"
              sticky={false}
              activeId={customerPanel}
              onTabChange={setCustomerPanel}
            />
          </div>

          <div className="ac-panel ac-panel-elevated ac-customer-profile-content min-h-0 flex-1">
            <div className="ac-customer-profile-body min-h-0 flex-1 overflow-y-auto">
              {activeTab === "00-blank" ? <div className="ac-customer-profile-blank" aria-label="Blank customer panel" style={{ minHeight: 648 }} /> : <>
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
              </>}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
