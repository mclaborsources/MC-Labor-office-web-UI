import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  CreditCard,
  HardHat,
  MapPin,
  StickyNote,
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
import { getJobById } from "@/lib/jobs";
import type { JobDetail, ProjectWeek } from "@/types/job";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

const projectWeekColumns: AccessColumn<ProjectWeek>[] = [
  { header: "Wk Ending", cell: (w) => <DataValue value={w.weekEnding} kind="date" />, nowrap: true },
  { header: "Year", cell: (w) => w.assignYear || "—", nowrap: true },
  { header: "Week", cell: (w) => w.assignWeek || "—", nowrap: true },
  {
    header: "Rate Report",
    cell: (w) =>
      w.rateReportLink ? (
        <a href={w.rateReportLink} className="text-blue-700 hover:underline" target="_blank" rel="noreferrer">
          Open
        </a>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
];

const TABS = [
  { id: "main", label: "Job Main Info" },
  { id: "customer", label: "Customer Info" },
  { id: "site", label: "Site Address" },
  { id: "foreman", label: "Foreman" },
  { id: "status", label: "Status / Dates" },
  { id: "contract", label: "Contract" },
  { id: "weeks", label: "Project Weeks" },
  { id: "assignments", label: "Assignments" },
  { id: "notes", label: "Notes" },
  { id: "system", label: "System" },
];

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
      <div className="-mx-2 -mt-2 mb-1.5 sm:-mx-3">
        <AccessWindowTabs
          tabs={[
            { label: "Menu", href: "/dashboard" },
            { label: "Job Search", href: "/jobs" },
            { label: "Job Profile", active: true },
          ]}
        />
      </div>

      <div className="mb-1.5">
        <Link href="/jobs">
          <AccessButton icon={ArrowLeft}>Back to Jobs / Projects</AccessButton>
        </Link>
      </div>

      <PageHeader title={title} icon={HardHat} subtitle={`Job ID: ${jobId}`} />

      {loadError && <ErrorAlert title="Could not load job" message={loadError} />}

      {job && (
        <div className="flex flex-col gap-1.5">
          {/* Status strip */}
          <div className="ac-panel flex flex-wrap items-center gap-3 px-2 py-1.5">
            {job.status && (
              <span className={`rounded px-1.5 py-px text-[10px] font-medium ring-1 ${statusPillClass(job.status)}`}>
                {job.status}
              </span>
            )}
            {job.customerType && <span className="text-[12px] text-[#444]">{job.customerType}</span>}
            {job.salesman && <span className="text-[12px] text-[#6a6a6a]">{job.salesman}</span>}
            {job.customerId && (
              <Link href={`/customers/${job.customerId}`} className="ml-auto">
                <AccessButton icon={Building2}>View Customer</AccessButton>
              </Link>
            )}
          </div>

          <AccessTabs tabs={TABS} />

          <AccessFieldSection
            id="main"
            title="Job Main Info"
            icon={HardHat}
            fields={[
              { label: "Job ID", value: job.jobId, mono: true },
              { label: "Job / Site Name", value: job.jobName },
              { label: "Status", value: job.status },
              { label: "Customer Type", value: job.customerType },
              { label: "Salesman", value: job.salesman },
              { label: "GC On Site", value: job.gcOnSite },
              { label: "# Employees", value: job.numberOfEmployees },
            ]}
          />

          <AccessFieldSection
            id="customer"
            title="Customer Info"
            icon={Building2}
            fields={[
              { label: "Customer ID", value: job.customerId, mono: true },
              { label: "Customer Name", value: job.customerName },
              { label: "Customer Type", value: job.customerType },
              { label: "Salesman", value: job.salesman },
              { label: "Job Contact", value: job.customerContact },
              { label: "Phone", value: job.customerPhone, kind: "phone" },
              { label: "Email", value: job.customerEmail, kind: "email" },
              {
                label: "Customer Address",
                value: [job.customerStreet, job.customerCity, job.customerState, job.customerZip]
                  .filter(Boolean)
                  .join(", "),
                wide: true,
              },
            ]}
          />

          <AccessFieldSection
            id="site"
            title="Site Address"
            icon={MapPin}
            fields={[
              { label: "Street", value: job.street, wide: true },
              { label: "City", value: job.city },
              { label: "State", value: job.state },
              { label: "Zip", value: job.zip },
            ]}
          />

          <AccessFieldSection
            id="foreman"
            title="Foreman / Contact"
            icon={User}
            fields={[
              { label: "Foreman Name", value: job.foremanName },
              { label: "Foreman Phone", value: job.foremanPhone, kind: "phone" },
              { label: "Job Contact", value: job.customerContact },
            ]}
          />

          <AccessFieldSection
            id="status"
            title="Status / Dates"
            icon={CalendarClock}
            fields={[
              { label: "Status", value: job.status },
              { label: "Start Date", value: job.startDate, kind: "date" },
              { label: "End Date", value: job.endDate, kind: "date" },
            ]}
          />

          <AccessFieldSection
            id="contract"
            title="Contract / Financial"
            icon={CreditCard}
            fields={[
              { label: "Contract Amount", value: job.contractAmount, kind: "money" },
              { label: "Total Payments", value: job.contractTotalPayments, kind: "money" },
              { label: "Balance Owed", value: job.contractBalanceOwed, kind: "money" },
            ]}
          />

          <section id="weeks">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Icon icon={CalendarClock} size="xs" className="text-slate-500" />
              Project Weeks
            </h3>
            <AccessDataTable
              columns={projectWeekColumns}
              rows={job.projectWeeks}
              rowKey={(w) => w.weekId}
              emptyMessage="No project week records on file (tblProjectWeeks)."
              footer={`${job.projectWeeks.length} week(s) — most recent first`}
              maxHeight="40vh"
            />
          </section>

          <section id="assignments" className="ac-panel">
            <div className="ac-panel-head">
              <Icon icon={Briefcase} size="xs" className="text-[#5a6c82]" />
              <span>Current / Recent Assignments</span>
            </div>
            <p className="px-2 py-3 text-[12px] italic text-[#6a6a6a]">
              Assignment details will be expanded in Milestone 4 (tblTracking / Portal_Assignment_Export).
            </p>
          </section>

          <AccessFieldSection
            id="notes"
            title="Notes / Misc"
            icon={StickyNote}
            columns={2}
            fields={[
              { label: "Project Note", value: job.notes, wide: true },
              { label: "Office Note", value: job.officeNote, wide: true },
              { label: "Job Note", value: job.jobNote, wide: true },
              { label: "Customer Notes", value: job.customerNotes, wide: true },
            ]}
          />

          <AccessFieldSection
            id="system"
            title="System Fields"
            icon={Briefcase}
            fields={[
              { label: "Entered By", value: job.entryUserName },
              { label: "Entered On", value: job.entryTimestamp },
              { label: "Job ID", value: job.jobId, mono: true },
            ]}
          />
        </div>
      )}
    </AppShell>
  );
}
