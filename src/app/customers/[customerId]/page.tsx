import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { DetailSection } from "@/components/ui/DetailSection";
import { DetailField } from "@/components/ui/DetailField";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Icon } from "@/components/ui/Icon";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomerById } from "@/lib/customers";
import type { CustomerDetail, CustomerContact, CustomerForeman } from "@/types/customer";

interface PageProps {
  params: Promise<{ customerId: string }>;
}

function ContactsTable({ contacts }: { contacts: CustomerContact[] }) {
  if (contacts.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">No contacts on record.</p>
    );
  }
  return (
    <div className="overflow-x-auto mc-scroll-smooth">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
            <th className="px-3 py-2 text-left text-xs font-semibold">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Title</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Cell</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Office</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Email</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr
              key={c.contactId}
              className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
            >
              <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                {c.fullName}
              </td>
              <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                {c.title || "—"}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {c.cellPhone ? (
                  <a href={`tel:${c.cellPhone}`} className="text-blue-700 hover:underline">
                    {c.cellPhone}
                  </a>
                ) : "—"}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {c.officePhone ? (
                  <a href={`tel:${c.officePhone}`} className="text-blue-700 hover:underline">
                    {c.officePhone}
                  </a>
                ) : "—"}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {c.email ? (
                  <a href={`mailto:${c.email}`} className="text-blue-700 hover:underline">
                    {c.email}
                  </a>
                ) : "—"}
              </td>
              <td className="px-3 py-2.5 text-slate-500 max-w-[200px] truncate">
                {c.notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ForemenTable({ foremen }: { foremen: CustomerForeman[] }) {
  if (foremen.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">No foremen on record.</p>
    );
  }
  return (
    <div className="overflow-x-auto mc-scroll-smooth">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
            <th className="px-3 py-2 text-left text-xs font-semibold">Foreman Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Phone</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Default</th>
          </tr>
        </thead>
        <tbody>
          {foremen.map((f) => (
            <tr
              key={f.foremanId}
              className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
            >
              <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                {f.foremanName}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {f.phone ? (
                  <a href={`tel:${f.phone}`} className="text-blue-700 hover:underline">
                    {f.phone}
                  </a>
                ) : "—"}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {f.notes === "Default" ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                    Default
                  </span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
      <div className="mb-4">
        <Link href="/customers">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-800">
            <Icon icon={ArrowLeft} size="sm" />
            Back to Customer Search
          </Button>
        </Link>
      </div>

      <PageHeader
        title={title}
        icon={Building2}
        subtitle={`Customer ID: ${customerId}`}
      />

      {loadError && (
        <ErrorAlert title="Could not load customer" message={loadError} />
      )}

      {customer && (
        <div className="flex flex-col gap-4">
          {/* Quick-info strip */}
          <div className="mc-panel p-4 flex flex-wrap items-center gap-4">
            {customer.customerType && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Icon icon={Briefcase} size="xs" className="text-slate-400" />
                {customer.customerType}
              </span>
            )}
            {customer.salesman && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Icon icon={User} size="xs" className="text-slate-400" />
                Salesman: {customer.salesman}
              </span>
            )}
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
              >
                <Icon icon={Phone} size="xs" />
                {customer.phone}
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
              >
                <Icon icon={Mail} size="xs" />
                {customer.email}
              </a>
            )}
          </div>

          {/* Customer detail fields */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DetailSection title="Customer Information" icon={Building2}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField label="Customer ID" value={customer.customerId} mono />
                <DetailField label="Customer Type" value={customer.customerType} />
                <DetailField label="Customer Name" value={customer.customerName} span={2} />
                <DetailField label="Salesman" value={customer.salesman} />
                <DetailField label="Phone" value={customer.phone} />
                <DetailField label="Email" value={customer.email} span={2} />
              </dl>
            </DetailSection>

            <DetailSection title="Address" icon={MapPin}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField label="Street" value={customer.street} span={2} />
                <DetailField label="City" value={customer.city} />
                <DetailField label="State" value={customer.state} />
                <DetailField label="Zip" value={customer.zip} />
              </dl>
            </DetailSection>
          </div>

          {/* Contacts */}
          <DetailSection title="Customer Contacts" icon={Users}>
            <ContactsTable contacts={customer.contacts} />
          </DetailSection>

          {/* Foremen */}
          <DetailSection title="Customer Foremen" icon={User}>
            <ForemenTable foremen={customer.foremen} />
          </DetailSection>

          {/* Jobs placeholder */}
          <DetailSection title="Jobs / Projects" icon={Briefcase}>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-4 text-sm text-slate-500">
              <Icon icon={Briefcase} size="sm" className="text-slate-400 shrink-0" />
              <span>
                Job and project details will be available in{" "}
                <span className="font-medium text-slate-700">Milestone 3</span>.
              </span>
            </div>
          </DetailSection>
        </div>
      )}
    </AppShell>
  );
}
