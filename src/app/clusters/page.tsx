import { AppShell } from "@/components/layout/AppShell";
import { ClustersScreen } from "@/components/clusters/ClustersScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getClusterEditorData } from "@/lib/clusters";
import { writesEnabled } from "@/lib/db/write";

export default async function ClustersPage() {
  const session = await getSessionOrDefault();
  let data: Awaited<ReturnType<typeof getClusterEditorData>> = { clusters: [], cities: [], cityOptions: [] };
  try { data = await getClusterEditorData(); } catch { /* Keep the editor shell available if SQL is unavailable. */ }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><ClustersScreen initialData={data} editingEnabled={writesEnabled()} /></AppShell>;
}
