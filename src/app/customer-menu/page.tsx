import { AppShell } from "@/components/layout/AppShell";
import { CustomerMenuScreen } from "@/components/customer-menu/CustomerMenuScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { countByEntity, getCustomerMenuWithFallback } from "@/lib/customerMenu";
import { resolveTrackingWeek } from "@/lib/trackingWeek";

interface PageProps {
  searchParams: Promise<{ week?: string; year?: string; weekOffset?: string }>;
}

export default async function CustomerMenuPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;
  const weekOffset = params.weekOffset ? Number(params.weekOffset) : undefined;

  const week = await resolveTrackingWeek({
    weekOffset: weekOffset !== undefined && Number.isFinite(weekOffset) ? weekOffset : undefined,
    explicitWeek: params.week ? Number(params.week) : undefined,
    explicitYear: params.year ? Number(params.year) : undefined,
  });

  const menu = await getCustomerMenuWithFallback(week.assignWeek, week.assignYear);
  const entityCounts = countByEntity(menu.tiles);
  const ipgCount = entityCounts.IPG ?? 0;
  const isgCount = entityCounts.ISG ?? 0;

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <CustomerMenuScreen menu={menu} ipgCount={ipgCount} isgCount={isgCount} />
    </AppShell>
  );
}
