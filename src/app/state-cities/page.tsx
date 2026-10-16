import { AppShell } from "@/components/layout/AppShell";
import { StateCitiesScreen } from "@/components/state-cities/StateCitiesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getStateCityRecords } from "@/lib/stateCities";

export default async function StateCitiesPage() {
  const session = await getSessionOrDefault();
  let data: Awaited<ReturnType<typeof getStateCityRecords>> = { cities: [], states: [] };
  try { data = await getStateCityRecords(); } catch { /* The list screen still renders when SQL is offline. */ }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><StateCitiesScreen initialCities={data.cities} states={data.states} /></AppShell>;
}
