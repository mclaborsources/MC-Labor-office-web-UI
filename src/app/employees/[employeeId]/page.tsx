import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  CreditCard,
  IdCard,
  MapPin,
  ShieldAlert,
  Truck,
  User,
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
import { getEmployeeById } from "@/lib/employees";
import type {
  EmployeeDetail,
  EmployeeRate,
  EmployeeContact,
  EmployeeLicense,
} from "@/types/employee";

interface PageProps {
  params: Promise<{ employeeId: string }>;
}

const TABS = [
  { id: "main", label: "Main Info" },
  { id: "contact", label: "Contact" },
  { id: "address", label: "Address" },
  { id: "employment", label: "Employment" },
  { id: "extended", label: "DOT / PPE" },
  { id: "rates", label: "Rates" },
  { id: "licenses", label: "Licenses" },
  { id: "emergency", label: "Emergency" },
  { id: "assignments", label: "Assignments" },
];

const rateColumns: AccessColumn<EmployeeRate>[] = [
  { header: "Field", cell: (r) => r.field, nowrap: true },
  { header: "Old", cell: (r) => <DataValue value={r.oldRate} kind="money" />, align: "right", nowrap: true },
  { header: "New", cell: (r) => <DataValue value={r.newRate} kind="money" />, align: "right", nowrap: true },
  { header: "Note", cell: (r) => <DataValue value={r.note} /> },
  { header: "Changed By", cell: (r) => <DataValue value={r.changedBy} />, nowrap: true },
  { header: "Changed On", cell: (r) => <DataValue value={r.changedOn} />, nowrap: true },
];

const contactColumns: AccessColumn<EmployeeContact>[] = [
  { header: "Name", cell: (c) => c.fullName, nowrap: true },
  { header: "Relationship", cell: (c) => <DataValue value={c.relationship} />, nowrap: true },
  { header: "Phone", cell: (c) => <DataValue value={c.phone} kind="phone" />, nowrap: true },
  { header: "Cell", cell: (c) => <DataValue value={c.cell} kind="phone" />, nowrap: true },
  { header: "Email", cell: (c) => <DataValue value={c.email} kind="email" />, nowrap: true },
  {
    header: "Emergency",
    cell: (c) =>
      c.emergency ? (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
          Emergency
        </span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
    nowrap: true,
  },
];

const licenseColumns: AccessColumn<EmployeeLicense>[] = [
  { header: "Type", cell: (l) => <DataValue value={l.type} />, nowrap: true },
  { header: "State", cell: (l) => <DataValue value={l.state} />, nowrap: true },
  { header: "License #", cell: (l) => <DataValue value={l.number} mono />, nowrap: true },
  { header: "Expires", cell: (l) => <DataValue value={l.expDate} kind="date" />, nowrap: true },
  { header: "Notes", cell: (l) => <DataValue value={l.notes} /> },
];

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { employeeId } = await params;
  const session = await getSessionOrDefault();

  let employee: EmployeeDetail | null = null;
  let loadError: string | undefined;

  try {
    employee = await getEmployeeById(employeeId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load employee.";
  }

  if (!loadError && !employee) {
    notFound();
  }

  const name = employee?.fullName ?? `Employee #${employeeId}`;

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="-mx-2 -mt-2 mb-1.5 sm:-mx-3">
        <AccessWindowTabs
          tabs={[
            { label: "Menu", href: "/dashboard" },
            { label: "Employee Search", href: "/employees" },
            { label: "Employee Profile", active: true },
          ]}
        />
      </div>

      <div className="mb-1.5">
        <Link href="/employees">
          <AccessButton icon={ArrowLeft}>Back to Employee Search</AccessButton>
        </Link>
      </div>

      <PageHeader title={name} icon={User} subtitle={`Employee ID: ${employeeId}`} />

      {loadError && <ErrorAlert title="Could not load employee" message={loadError} />}

      {employee && (
        <div className="flex flex-col gap-1.5">
          {/* Status strip */}
          <div className="ac-panel flex flex-wrap items-center gap-3 px-2 py-1.5">
            {employee.status && (
              <span className={`rounded px-1.5 py-px text-[10px] font-medium ring-1 ${statusPillClass(employee.status)}`}>
                {employee.status}
              </span>
            )}
            {employee.trade && <span className="text-[12px] text-[#444]">{employee.trade}</span>}
            {employee.grade && <span className="text-[12px] text-[#6a6a6a]">Grade {employee.grade}</span>}
          </div>

          <AccessTabs tabs={TABS} />

          <AccessFieldSection
            id="main"
            title="Main Info"
            icon={User}
            fields={[
              { label: "Employee ID", value: employee.employeeId, mono: true },
              { label: "First Name", value: employee.firstName },
              { label: "Last Name", value: employee.lastName },
              { label: "Status", value: employee.status },
              { label: "Trade", value: employee.trade },
              { label: "Grade", value: employee.grade },
            ]}
          />

          <AccessFieldSection
            id="contact"
            title="Personal / Contact Info"
            icon={Briefcase}
            fields={[
              { label: "Cell Phone", value: employee.cellPhone, kind: "phone" },
              { label: "Email", value: employee.email, kind: "email" },
              { label: "Business Name", value: employee.extended.businessName },
              { label: "Will Travel", value: employee.extended.willTravel },
            ]}
          />

          <AccessFieldSection
            id="address"
            title="Address"
            icon={MapPin}
            fields={[
              { label: "Street", value: employee.address, wide: true },
              { label: "City", value: employee.city },
              { label: "State", value: employee.state },
              { label: "Zip", value: employee.zip },
            ]}
          />

          <AccessFieldSection
            id="employment"
            title="Employment / Trade / Grade"
            icon={Briefcase}
            fields={[
              { label: "Status", value: employee.status },
              { label: "Trade / Position", value: employee.trade },
              { label: "Grade", value: employee.grade },
            ]}
          />

          <AccessFieldSection
            id="extended"
            title="DOT / License / PPE"
            icon={Truck}
            fields={[
              { label: "DOT Number", value: employee.extended.dotNumber },
              { label: "DOT Expiration", value: employee.extended.dotExpiration, kind: "date" },
              { label: "License Number", value: employee.extended.licenseNumber },
              { label: "License Issue Date", value: employee.extended.licenseIssueDate, kind: "date" },
              {
                label: "PPE Issued",
                value: employee.extended.ppe.length ? employee.extended.ppe.join(", ") : "",
                wide: true,
              },
            ]}
          />

          <section id="rates">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={CreditCard} size="xs" className="text-slate-500" />
              Rate History
            </h3>
            <AccessDataTable
              columns={rateColumns}
              rows={employee.rates}
              rowKey={(r) => r.rateId}
              emptyMessage="No rate-change history on record (tblEmployeeRates)."
              footer={`${employee.rates.length} rate change(s) — most recent first`}
              maxHeight="40vh"
            />
          </section>

          <section id="licenses">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={IdCard} size="xs" className="text-slate-500" />
              Licenses
            </h3>
            <AccessDataTable
              columns={licenseColumns}
              rows={employee.licenses}
              rowKey={(l) => l.licenseId}
              emptyMessage="No licenses on record (tblEmployeeLicenses)."
              footer={`${employee.licenses.length} license(s)`}
            />
          </section>

          <section id="emergency">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={ShieldAlert} size="xs" className="text-slate-500" />
              Contacts / Emergency Info
            </h3>
            <AccessDataTable
              columns={contactColumns}
              rows={employee.contacts}
              rowKey={(c) => c.contactId}
              emptyMessage="No contacts on record (tblEmployeeContacts)."
              footer={`${employee.contacts.length} contact(s)`}
            />
          </section>

          <section id="assignments" className="ac-panel">
            <div className="ac-panel-head">
              <Icon icon={CalendarClock} size="xs" className="text-[#5a6c82]" />
              <span>Current / Recent Assignments</span>
            </div>
            <p className="px-2 py-3 text-[12px] italic text-[#6a6a6a]">
              {employee.currentAssignment
                ? `Latest assignment: ${employee.currentAssignment}. Full assignment history will be expanded in Milestone 4 (tblTracking).`
                : "Assignment history will be expanded in Milestone 4 when the full tracking grid is built (tblTracking / Portal_Assignment_Export)."}
            </p>
          </section>
        </div>
      )}
    </AppShell>
  );
}
