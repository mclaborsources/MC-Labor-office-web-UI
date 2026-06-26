import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  HardHat,
  MapPin,
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
import { getJobById } from "@/lib/jobs";
import { statusPillClass } from "@/lib/statusStyles";
import type { JobDetail } from "@/types/job";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { jobId } = await params;
  const session = await getSessionOrDefault();

  let job: JobDetail | null = null;
  let loadError: string | undefined;

  try {
    job = await getJobById(jobId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load job.";
  }

  if (!loadError && !job) {
    notFound();
  }

  const title = job?.jobName || `Job #${jobId}`;

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="mb-4">
        <Link href="/jobs">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-800">
            <Icon icon={ArrowLeft} size="sm" />
            Back to Jobs / Projects
          </Button>
        </Link>
      </div>

      <PageHeader
        title={title}
        icon={HardHat}
        subtitle={`Job ID: ${jobId}`}
      />

      {loadError && <ErrorAlert title="Could not load job" message={loadError} />}

      {job && (
        <div className="flex flex-col gap-4">
          {/* Quick-info strip */}
          <div className="mc-panel p-4 flex flex-wrap items-center gap-4">
            {job.status && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusPillClass(job.status)}`}>
                {job.status}
              </span>
            )}
            {job.customerType && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Icon icon={Briefcase} size="xs" className="text-slate-400" />
                {job.customerType}
              </span>
            )}
            {job.salesman && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Icon icon={User} size="xs" className="text-slate-400" />
                {job.salesman}
              </span>
            )}
            {job.startDate && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Icon icon={CalendarDays} size="xs" className="text-slate-400" />
                {job.startDate}
                {job.endDate ? ` — ${job.endDate}` : ""}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Job information */}
            <DetailSection title="Job / Project Details" icon={HardHat}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField label="Job ID" value={job.jobId} mono />
                <DetailField label="Status" value={job.status} />
                <DetailField label="Job / Site Name" value={job.jobName} span={2} />
                <DetailField label="Start Date" value={job.startDate} />
                <DetailField label="End Date" value={job.endDate} />
                <DetailField label="Customer Type" value={job.customerType} />
                <DetailField label="Salesman" value={job.salesman} />
              </dl>
            </DetailSection>

            {/* Address */}
            <DetailSection title="Job Address" icon={MapPin}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField label="Street" value={job.street} span={2} />
                <DetailField label="City" value={job.city} />
                <DetailField label="State" value={job.state} />
                <DetailField label="Zip" value={job.zip} />
              </dl>
            </DetailSection>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Foreman */}
            <DetailSection title="Foreman" icon={User}>
              {job.foremanName ? (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <DetailField label="Foreman Name" value={job.foremanName} span={2} />
                  {job.foremanPhone && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500 mb-0.5">Phone</dt>
                      <dd>
                        <a
                          href={`tel:${job.foremanPhone}`}
                          className="text-sm font-medium text-blue-700 hover:underline"
                        >
                          {job.foremanPhone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-slate-400 italic">No foreman on record for this job.</p>
              )}
            </DetailSection>

            {/* Customer card */}
            <DetailSection title="Customer" icon={Building2}>
              {job.customerId ? (
                <div className="flex flex-col gap-3">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <DetailField label="Customer ID" value={job.customerId} mono />
                    <DetailField label="Customer Name" value={job.customerName} />
                    {job.customerPhone && (
                      <div>
                        <dt className="text-xs font-medium text-slate-500 mb-0.5">Phone</dt>
                        <dd>
                          <a href={`tel:${job.customerPhone}`} className="text-sm font-medium text-blue-700 hover:underline">
                            {job.customerPhone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {job.customerEmail && (
                      <div>
                        <dt className="text-xs font-medium text-slate-500 mb-0.5">Email</dt>
                        <dd>
                          <a href={`mailto:${job.customerEmail}`} className="text-sm font-medium text-blue-700 hover:underline">
                            {job.customerEmail}
                          </a>
                        </dd>
                      </div>
                    )}
                    <DetailField
                      label="Address"
                      value={[job.customerStreet, job.customerCity, job.customerState, job.customerZip]
                        .filter(Boolean).join(", ")}
                      span={2}
                    />
                  </dl>
                  <div className="pt-1">
                    <Link href={`/customers/${job.customerId}`}>
                      <Button variant="secondary" className="gap-1.5">
                        <Icon icon={Building2} size="sm" />
                        View Customer
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No customer linked to this job.</p>
              )}
            </DetailSection>
          </div>

          {/* Notes */}
          {job.notes && (
            <DetailSection title="Notes" icon={Briefcase}>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {job.notes}
              </p>
            </DetailSection>
          )}

          {/* Assignment placeholder */}
          <DetailSection title="Recent / Current Assignments" icon={CalendarClock}>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-4 text-sm text-slate-500">
              <Icon icon={CalendarClock} size="sm" className="text-slate-400 shrink-0" />
              <span>
                Assignment details will be expanded in{" "}
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
