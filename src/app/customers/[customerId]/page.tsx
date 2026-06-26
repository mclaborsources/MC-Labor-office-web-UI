import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  DollarSign,
  HardHat,
  MapPin,
  StickyNote,
  Users,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessWindowTabs } from "@/components/access/AccessWindowTabs";
import { AccessButton } from "@/components/access/AccessButton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Icon } from "@/components/ui/Icon";
import { AccessTabs } from "@/components/access/AccessTabs";
import { AccessFieldSection } from "@/components/access/AccessFieldSection";
import { AccessDataTable, type AccessColumn } from "@/components/access/AccessDataTable";
import { DataValue } from "@/components/access/DataValue";
import { statusPillClass } from "@/lib/statusStyles";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomerById } from "@/lib/customers";
import type {
  CustomerDetail,
  CustomerContact,
  CustomerForeman,
  CustomerJobPreview,
  CustomerBillRate,
  CustomerWeek,
} from "@/types/customer";

interface PageProps {
  params: Promise<{ customerId: string }>;
}

const TABS = [
  { id: "main", label: "Main Info" },
  { id: "address", label: "Address" },
  { id: "sales", label: "Sales / Billing" },
  { id: "billrates", label: "Bill Rates" },
  { id: "contacts", label: "Contacts" },
  { id: "foremen", label: "Foremen" },
  { id: "jobs", label: "Jobs" },
  { id: "weeks", label: "Weeks" },
  { id: "notes", label: "Notes" },
  { id: "system", label: "System" },
];

const billRateColumns: AccessColumn<CustomerBillRate>[] = [
  { header: "Grade", cell: (r) => r.grade, nowrap: true },
  { header: "Bill Rate", cell: (r) => <DataValue value={r.billRate} kind="money" />, align: "right", nowrap: true },
  {
    header: "Active",
    cell: (r) =>
      r.active ? (
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
          Active
        </span>
      ) : (
        <span className="text-slate-400">Inactive</span>
      ),
    nowrap: true,
  },
  { header: "Note", cell: (r) => <DataValue value={r.note} /> },
];

const weekColumns: AccessColumn<CustomerWeek>[] = [
  { header: "Wk Ending", cell: (w) => <DataValue value={w.weekEnding} />, nowrap: true },
  { header: "Yr/Wk", cell: (w) => `${w.assignYear || "—"} / ${w.assignWeek || "—"}`, nowrap: true },
  { header: "Invoice #", cell: (w) => <DataValue value={w.invoiceNum} mono />, nowrap: true },
  { header: "Invoice Total", cell: (w) => <DataValue value={w.invoiceTotal} kind="money" />, align: "right", nowrap: true },
  { header: "Open Balance", cell: (w) => <DataValue value={w.openBalance} kind="money" />, align: "right", nowrap: true },
  {
    header: "Status",
    cell: (w) => (
      <span className="flex flex-wrap gap-1">
        {w.paid && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">Paid</span>}
        {w.invoiceSent && !w.paid && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">Invoiced</span>}
        {w.locked && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-300">Locked</span>}
        {!w.paid && !w.invoiceSent && !w.locked && <span className="text-slate-300">—</span>}
      </span>
    ),
    nowrap: true,
  },
];

const contactColumns: AccessColumn<CustomerContact>[] = [
  { header: "Name", cell: (c) => c.fullName, nowrap: true },
  { header: "Cell", cell: (c) => <DataValue value={c.cellPhone} kind="phone" />, nowrap: true },
  { header: "Office", cell: (c) => <DataValue value={c.officePhone} kind="phone" />, nowrap: true },
  { header: "Email", cell: (c) => <DataValue value={c.email} kind="email" />, nowrap: true },
  { header: "Notes", cell: (c) => <DataValue value={c.notes} /> },
];

const foremanColumns: AccessColumn<CustomerForeman>[] = [
  { header: "Foreman", cell: (f) => f.foremanName, nowrap: true },
  { header: "Phone", cell: (f) => <DataValue value={f.phone} kind="phone" />, nowrap: true },
  {
    header: "Default",
    cell: (f) =>
      f.notes === "Default" ? (
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
          Default
        </span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
    nowrap: true,
  },
];

function jobColumns(): AccessColumn<CustomerJobPreview>[] {
  return [
    { header: "Job ID", cell: (j) => <DataValue value={j.jobId} mono />, nowrap: true },
    {
      header: "Job / Site",
      cell: (j) => (
        <Link href={`/jobs/${j.jobId}`} className="font-medium text-blue-700 hover:underline">
          {j.jobName || "—"}
        </Link>
      ),
      nowrap: true,
    },
    {
      header: "Status",
      cell: (j) =>
        j.status ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusPillClass(j.status)}`}>
            {j.status}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
      nowrap: true,
    },
    { header: "Address", cell: (j) => <DataValue value={j.address} /> },
  ];
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;
  const session = await getSessionOrDefault();

  let customer: CustomerDetail | null = null;
  let loadError: string | undefined;

  try {
    customer = await getCustomerById(customerId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load customer.";
  }

  if (!loadError && !customer) {
    notFound();
  }

  const title = customer?.customerName ?? `Customer #${customerId}`;

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="-mx-2 -mt-2 mb-1.5 sm:-mx-3">
        <AccessWindowTabs
          tabs={[
            { label: "Menu", href: "/dashboard" },
            { label: "Customer Search", href: "/customers" },
            { label: "Customer Profile", active: true },
          ]}
        />
      </div>

      <div className="mb-1.5">
        <Link href="/customers">
          <AccessButton icon={ArrowLeft}>Back to Customer Search</AccessButton>
        </Link>
      </div>

      <PageHeader title={title} icon={Building2} subtitle={`Customer ID: ${customerId}`} />

      {loadError && <ErrorAlert title="Could not load customer" message={loadError} />}

      {customer && (
        <div className="flex flex-col gap-3">
          <AccessTabs tabs={TABS} />

          <AccessFieldSection
            id="main"
            title="Main Info"
            icon={Building2}
            fields={[
              { label: "Customer ID", value: customer.customerId, mono: true },
              { label: "Customer Name", value: customer.customerName },
              { label: "Customer Type", value: customer.customerType },
              { label: "Salesman", value: customer.salesman },
              { label: "Status", value: customer.status },
              { label: "Phone", value: customer.phone, kind: "phone" },
              { label: "Fax", value: customer.fax, kind: "phone" },
              { label: "Email", value: customer.email, kind: "email" },
              { label: "Website", value: customer.website },
              { label: "Corporate Website", value: customer.corpWebsite },
            ]}
          />

          <AccessFieldSection
            id="address"
            title="Address"
            icon={MapPin}
            fields={[
              { label: "Street", value: customer.street, wide: true },
              { label: "City", value: customer.city },
              { label: "State", value: customer.state },
              { label: "Zip", value: customer.zip },
              { label: "Full Address", value: customer.fullAddress, wide: true },
              { label: "Mailing Street", value: customer.mailStreet, wide: true },
              { label: "Mailing City", value: customer.mailCity },
              { label: "Mailing State", value: customer.mailState },
              { label: "Mailing Zip", value: customer.mailZip },
            ]}
          />

          <AccessFieldSection
            id="sales"
            title="Sales / Billing"
            icon={CreditCard}
            fields={[
              { label: "Salesman", value: customer.salesman },
              { label: "Customer Type", value: customer.customerType },
              { label: "Credit Limit", value: customer.creditLimit, kind: "money" },
              { label: "QuickBooks ID", value: customer.qbCustomerId, mono: true },
              { label: "License #", value: customer.licenseNumber },
            ]}
          />

          <section id="billrates">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={DollarSign} size="xs" className="text-slate-500" />
              Bill Rates
            </h3>
            <AccessDataTable
              columns={billRateColumns}
              rows={customer.billRates}
              rowKey={(r) => r.billRateId}
              emptyMessage="No bill rates on record (tblCustomerBillRates)."
              footer={`${customer.billRates.length} bill rate(s)`}
            />
          </section>

          <section id="contacts">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={Users} size="xs" className="text-slate-500" />
              Contacts
            </h3>
            <AccessDataTable
              columns={contactColumns}
              rows={customer.contacts}
              rowKey={(c) => c.contactId}
              emptyMessage="No contacts on record."
              footer={`${customer.contacts.length} contact(s)`}
            />
          </section>

          <section id="foremen">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={Wrench} size="xs" className="text-slate-500" />
              Foremen
            </h3>
            <AccessDataTable
              columns={foremanColumns}
              rows={customer.foremen}
              rowKey={(f) => f.foremanId}
              emptyMessage="No foremen on record."
              footer={`${customer.foremen.length} foreman(s)`}
            />
          </section>

          <section id="jobs">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={HardHat} size="xs" className="text-slate-500" />
              Jobs / Projects
            </h3>
            <AccessDataTable
              columns={jobColumns()}
              rows={customer.jobs}
              rowKey={(j) => j.jobId}
              emptyMessage="No jobs / projects on record for this customer."
              footer={
                <Link href={`/jobs?customerId=${customer.customerId}`} className="text-blue-700 hover:underline">
                  View all jobs for this customer →
                </Link>
              }
            />
          </section>

          <section id="weeks">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={CalendarDays} size="xs" className="text-slate-500" />
              Customer Weeks (Invoicing)
            </h3>
            <AccessDataTable
              columns={weekColumns}
              rows={customer.weeks}
              rowKey={(w) => w.weekId}
              emptyMessage="No weekly invoice records on file (tblCustomerWeeks)."
              footer={`${customer.weeks.length} week(s) — most recent first`}
              maxHeight="40vh"
            />
          </section>

          <AccessFieldSection
            id="notes"
            title="Notes / Misc"
            icon={StickyNote}
            columns={2}
            fields={[
              { label: "Customer Note", value: customer.customerNote, wide: true },
              { label: "Invoice Note", value: customer.invoiceNote, wide: true },
              { label: "Collections Note", value: customer.collectionsNote, wide: true },
            ]}
          />

          <AccessFieldSection
            id="system"
            title="System Fields"
            icon={Briefcase}
            fields={[
              { label: "Entered By", value: customer.entryUserName },
              { label: "Entered On", value: customer.entryTimestamp },
              { label: "Customer ID", value: customer.customerId, mono: true },
            ]}
          />
        </div>
      )}
    </AppShell>
  );
}
