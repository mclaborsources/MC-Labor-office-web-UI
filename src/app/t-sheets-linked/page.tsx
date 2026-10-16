import { AppShell } from "@/components/layout/AppShell";
import { TSheetsLinkedScreen } from "@/components/t-sheets-linked/TSheetsLinkedScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getWeekContextForOffset } from "@/lib/week";
import { getLatestTSheetsWeekEnding, getTSheetsLinkedPage } from "@/lib/tSheetsLinked";

export const dynamic = "force-dynamic";

function toIsoDate(usDate: string) {
  const [month, day, year] = usDate.split("/");
  return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
}

export default async function TSheetsLinkedPage() {
  const [session, context] = await Promise.all([getSessionOrDefault(), Promise.resolve(getWeekContextForOffset(-1))]);
  let date = toIsoDate(context.weekEndingDate);
  let initialPage = { rows: [], total: 0, page: 1, pageSize: 250 } as Awaited<ReturnType<typeof getTSheetsLinkedPage>>;
  let error = "";
  try {
    date = await getLatestTSheetsWeekEnding() ?? date;
    initialPage = await getTSheetsLinkedPage({ startDate: date, endDate: date, page: 1 });
  }
  catch (cause) {
    console.error("[t-sheets-linked] Could not load rows:", cause);
    error = "T Sheets Linked could not be loaded. Check the database connection and try Refresh.";
  }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <TSheetsLinkedScreen initialPage={initialPage} initialDate={date} initialError={error} />
  </AppShell>;
}
