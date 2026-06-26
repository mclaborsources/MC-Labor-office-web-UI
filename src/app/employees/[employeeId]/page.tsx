import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { DetailSection } from "@/components/ui/DetailSection";
import { DetailField } from "@/components/ui/DetailField";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Icon } from "@/components/ui/Icon";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployeeById } from "@/lib/employees";
import { statusPillClass } from "@/lib/statusStyles";
import type { EmployeeDetail } from "@/types/employee";

interface PageProps {
  params: Promise<{ employeeId: string }>;
}

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
      <div className="mb-4">
        <Link href="/employees">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-800">
            <Icon icon={ArrowLeft} size="sm" />
            Back to Employee Search
          </Button>
        </Link>
      </div>

      <PageHeader
        title={name}
        icon={User}
        subtitle={`Employee ID: ${employeeId}`}
      />

      {loadError && (
        <ErrorAlert title="Could not load employee" message={loadError} />
      )}

      {employee && (
        <div className="flex flex-col gap-4">
          {/* Summary strip */}
          <div className="mc-panel p-4 flex flex-wrap items-center gap-4">
            {employee.status && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusPillClass(employee.status)}`}>
                {employee.status}
              </span>
            )}
            {employee.trade && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Icon icon={Briefcase} size="xs" className="text-slate-400" />
                {employee.trade}
              </span>
            )}
            {employee.grade && (
              <span className="text-sm text-slate-500">Grade: {employee.grade}</span>
            )}
            {employee.cellPhone && (
              <a
                href={`tel:${employee.cellPhone}`}
                className="flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
              >
                <Icon icon={Phone} size="xs" />
                {employee.cellPhone}
              </a>
            )}
            {employee.email && (
              <a
                href={`mailto:${employee.email}`}
                className="flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
              >
                <Icon icon={Mail} size="xs" />
                {employee.email}
              </a>
            )}
          </div>

          {/* Detail fields */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DetailSection title="Employee Information" icon={User}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField label="Employee ID" value={employee.employeeId} mono />
                <DetailField label="Status" value={employee.status} />
                <DetailField label="First Name" value={employee.firstName} />
                <DetailField label="Last Name" value={employee.lastName} />
                <DetailField label="Cell Phone" value={employee.cellPhone} />
                <DetailField label="Email" value={employee.email} />
                <DetailField label="Trade" value={employee.trade} />
                <DetailField label="Grade" value={employee.grade} />
              </dl>
            </DetailSection>

            <DetailSection title="Address" icon={MapPin}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField label="Street" value={employee.address} span={2} />
                <DetailField label="City" value={employee.city} />
                <DetailField label="State" value={employee.state} />
                <DetailField label="Zip" value={employee.zip} />
              </dl>
            </DetailSection>
          </div>

          {/* Assignment history placeholder */}
          <DetailSection title="Recent Assignments" icon={CalendarClock}>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-4 text-sm text-slate-500">
              <Icon icon={CalendarClock} size="sm" className="text-slate-400 shrink-0" />
              <span>
                Assignment history will be expanded in{" "}
                <span className="font-medium text-slate-700">Milestone 4</span>{" "}
                when the full tracking grid is built.
              </span>
            </div>
          </DetailSection>
        </div>
      )}
    </AppShell>
  );
}
