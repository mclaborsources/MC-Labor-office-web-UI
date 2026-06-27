import { AppShell } from "@/components/layout/AppShell";
import { TrackingScreen } from "@/components/tracking/TrackingScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { resolveTrackingWeek } from "@/lib/trackingWeek";
import {
  getTrackingPreview,
  getTrackingCustomerOptions,
  getTrackingJobOptions,
  getTrackingJobInfo,
} from "@/lib/tracking";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TrackingPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;

  const weekOffset = params.weekOffset ? Number(params.weekOffset) : undefined;
  const week = await resolveTrackingWeek({
    weekOffset:
      weekOffset !== undefined && Number.isFinite(weekOffset) ? weekOffset : undefined,
    explicitWeek:
      params.week && !params.weekOffset ? Number(params.week) : undefined,
    explicitYear:
      params.year && !params.weekOffset ? Number(params.year) : undefined,
  });

  const customerId = params.customerId?.trim() ?? "";
  const projectId = params.projectId?.trim() ?? "";

  const [preview, customers, jobs, jobInfo] = await Promise.all([
    getTrackingPreview({
      week: week.assignWeek,
      year: week.assignYear,
      customerId: customerId || undefined,
      projectId: projectId || undefined,
      limit: 300,
    }),
    getTrackingCustomerOptions(week.assignWeek, week.assignYear),
    customerId
      ? getTrackingJobOptions(week.assignWeek, week.assignYear, customerId)
      : Promise.resolve([]),
    customerId ? getTrackingJobInfo(customerId) : Promise.resolve(null),
  ]);

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <div className="ac-tracking-page flex min-h-0 flex-1 flex-col">
        <TrackingScreen
          week={week}
          preview={preview}
          customers={customers}
          jobs={jobs}
          jobInfo={jobInfo}
          selectedCustomerId={customerId}
          selectedProjectId={projectId}
          userDisplayName={session.user?.displayName}
        />
      </div>
    </AppShell>
  );
}
