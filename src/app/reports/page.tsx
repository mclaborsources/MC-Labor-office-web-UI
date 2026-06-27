import { FileBarChart } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessPanel } from "@/components/access/AccessPanel";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getReportCatalog, type ReportMenu } from "@/lib/reports";

export default async function ReportsPage() {
  const session = await getSessionOrDefault();

  let menus: ReportMenu[] = [];
  let loadError: string | undefined;
  try {
    menus = await getReportCatalog();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load the report catalog.";
  }

  const totalReports = menus.reduce((sum, m) => sum + m.reports.length, 0);

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <PageHeader title="Reports" icon={FileBarChart} subtitle="Read-only catalog (navigation only)" />

      <div className="mb-2 border border-[#cdb96a] bg-[#f7f1d8] px-3 py-2 text-[12px] text-[#4a3d00]">
        This is the report <strong>menu</strong> from Access (<code>frmReports</code>). The reports
        themselves are not generated here yet — each one is built and validated against the Access
        output one at a time (Phase B4), so no totals are calculated on this screen.
      </div>

      {loadError && <ErrorAlert title="Could not load report catalog" message={loadError} />}

      {!loadError && menus.length === 0 && (
        <div className="ac-panel p-4 text-[12px] italic text-[#6a6a6a]">
          No report menus found in <code>tblPullDownReportMenus</code> / <code>tblPullDownTrackingReports</code>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {menus.map((menu) => (
          <AccessPanel key={menu.id} title={menu.title} icon={FileBarChart} bodyClassName="space-y-1">
            {menu.note && <p className="px-1 pb-1 text-[11px] text-[#6a6a6a]">{menu.note}</p>}
            {menu.reports.length === 0 ? (
              <p className="px-1 py-2 text-[11px] italic text-[#8a8a8a]">No reports in this menu.</p>
            ) : (
              menu.reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between gap-3 border border-[#bcbcbc] bg-[#f0f0f0] px-2.5 py-1.5 text-[#6a6a6a]"
                  title={report.description || report.name}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-medium text-[#33414f]">{report.name}</div>
                    {report.description && (
                      <div className="truncate text-[11px] text-[#7a7a7a]">{report.description}</div>
                    )}
                  </div>
                  <span className="shrink-0 border border-[#cdb96a] bg-[#f1e6b2] px-1.5 py-0.5 text-[10px] font-medium text-[#4a3d00]">
                    Pending
                  </span>
                </div>
              ))
            )}
          </AccessPanel>
        ))}
      </div>

      {menus.length > 0 && (
        <p className="mt-2 text-[11px] text-[#7a7a7a]">
          {menus.length} report menu(s), {totalReports} report(s) catalogued from Access.
        </p>
      )}
    </AppShell>
  );
}
