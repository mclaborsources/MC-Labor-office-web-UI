import { AppShell } from "@/components/layout/AppShell";
import { TrackingScreen } from "@/components/tracking/TrackingScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { resolveTrackingWeek } from "@/lib/trackingWeek";
import {
  getTrackingPreview,
  getTrackingCustomerOptions,
  getTrackingJobOptions,
  getTrackingJobInfo,
  getTrackingReferralAgencies,
  getTrackingSalesmen,
} from "@/lib/tracking";
import { getPerDiemDestinations } from "@/lib/operationalReports";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TrackingPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;

  const weekOffset = params.weekOffset ? Number(params.weekOffset) : undefined;
  const selectedDateParts = params.date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const selectedDate = selectedDateParts
    ? new Date(
        Number(selectedDateParts[1]),
        Number(selectedDateParts[2]) - 1,
        Number(selectedDateParts[3]),
      )
    : undefined;
  const week = await resolveTrackingWeek({
    referenceDate: selectedDate,
    weekOffset:
      weekOffset !== undefined && Number.isFinite(weekOffset) ? weekOffset : undefined,
    explicitWeek:
      params.week && !params.weekOffset ? Number(params.week) : undefined,
    explicitYear:
      params.year && !params.weekOffset ? Number(params.year) : undefined,
    alignFromSql: params.noWeekAlign !== "1",
    // Keep the requested calendar week. A different week must never be shown
    // without the user explicitly navigating to it.
    allowFallback: false,
  });

  const customerId = params.customerId?.trim() ?? "";
  const projectId = params.projectId?.trim() ?? "";
  // The Access tracking form opens with an empty assignment grid. URL filters
  // can be restored by browser tabs, so only the explicit Load action fetches rows.
  const shouldLoadPreview = params.load === "1";
  const [month, day, year] = week.weekEndingDate.split("/").map(Number);
  const weekEndingDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const [preview, customers, jobs, jobInfo, perDiemDestinations, referralAgencies, salesmen] = await Promise.all([
    shouldLoadPreview ? getTrackingPreview({
      week: week.assignWeek,
      year: week.assignYear,
      weekEndingDate,
      customerId: customerId || undefined,
      projectId: projectId || undefined,
    }) : Promise.resolve(undefined),
    getTrackingCustomerOptions(week.assignWeek, week.assignYear, weekEndingDate),
    getTrackingJobOptions(week.assignWeek, week.assignYear, customerId || undefined, weekEndingDate),
    customerId
      ? getTrackingJobInfo(customerId, projectId || undefined, week.assignWeek, week.assignYear, weekEndingDate)
      : Promise.resolve(null),
    getPerDiemDestinations(week.assignWeek, week.assignYear).catch(() => []),
    getTrackingReferralAgencies().catch(() => []),
    getTrackingSalesmen().catch(() => []),
  ]);

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth compactHeader>
      <div className="ac-tracking-page ac-tracking-reference flex min-h-0 flex-1 flex-col">
        <TrackingScreen
          key={`${week.assignYear}-${week.assignWeek}-${customerId}-${projectId}`}
          week={week}
          preview={preview}
          customers={customers}
          jobs={jobs}
          jobInfo={jobInfo}
          referralAgencies={referralAgencies}
          salesmen={salesmen}
          selectedCustomerId={customerId}
          selectedProjectId={projectId}
          userDisplayName={session.user?.displayName}
          officeStaffSession={!!session.user?.officeStaffId}
          perDiemDestinations={perDiemDestinations}
        />
      </div>
    </AppShell>
  );
}
