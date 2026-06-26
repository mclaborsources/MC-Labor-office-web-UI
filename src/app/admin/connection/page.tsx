import { Database, Server, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessWindowTabs } from "@/components/access/AccessWindowTabs";
import { AccessPanel } from "@/components/access/AccessPanel";
import { AccessDataTable, type AccessColumn } from "@/components/access/AccessDataTable";
import { getSessionOrDefault } from "@/lib/auth/session";
import {
  getConnectionStatus,
  getPermissionOverview,
  type OfficeStaffPermissionSummary,
} from "@/lib/admin";

const staffColumns: AccessColumn<OfficeStaffPermissionSummary>[] = [
  { header: "Name", cell: (s) => s.name, nowrap: true },
  { header: "Initials", cell: (s) => s.initials || "—", nowrap: true },
  { header: "Title", cell: (s) => s.title || "—", nowrap: true },
  {
    header: "Active",
    cell: (s) =>
      s.active ? (
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
          Active
        </span>
      ) : (
        <span className="text-slate-400">Inactive</span>
      ),
    nowrap: true,
  },
  { header: "Feature Grants", cell: (s) => String(s.featureGrants), align: "right", nowrap: true },
];

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#e2e2e2] py-1 last:border-0">
      <span className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">{label}</span>
      <span className="text-[12px] font-medium text-[#33414f]">{value || "—"}</span>
    </div>
  );
}

export default async function AdminConnectionPage() {
  const session = await getSessionOrDefault();
  const [conn, perms] = await Promise.all([getConnectionStatus(), getPermissionOverview()]);

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="-mx-2 -mt-2 mb-1.5 sm:-mx-3">
        <AccessWindowTabs
          tabs={[
            { label: "Menu", href: "/dashboard" },
            { label: "Admin — Connection", active: true },
          ]}
        />
      </div>

      <PageHeader title="Admin — Connection & Access" icon={Server} subtitle="Read-only status" />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <AccessPanel title="SQL Server Connection" icon={Database}>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                conn.ok
                  ? "bg-green-50 text-green-700 ring-green-200"
                  : "bg-red-50 text-red-700 ring-red-200"
              }`}
            >
              {conn.ok ? "Connected" : "Disconnected"}
            </span>
          </div>
          {conn.ok ? (
            <div>
              <StatusRow label="Database" value={conn.database} />
              <StatusRow label="Server" value={conn.server} />
              <StatusRow label="SQL Version" value={conn.version} />
              <StatusRow label="Server Time" value={conn.serverTime} />
            </div>
          ) : (
            <p className="text-[12px] text-red-700">{conn.error}</p>
          )}
        </AccessPanel>

        <AccessPanel title="Read-Only Safety" icon={ShieldCheck}>
          <ul className="space-y-1.5 text-[12px] text-[#33414f]">
            <li className="flex items-start gap-2">
              <span className="mt-px rounded-full bg-green-50 px-1.5 text-[10px] font-medium text-green-700 ring-1 ring-green-200">ON</span>
              All queries pass through <code>queryReadOnly</code>, which rejects any non-SELECT statement.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-px rounded-full bg-green-50 px-1.5 text-[10px] font-medium text-green-700 ring-1 ring-green-200">ON</span>
              Reads use <code>WITH (NOLOCK)</code> so the app never blocks Access users.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-px rounded-full bg-amber-50 px-1.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">GATED</span>
              Write workflows are disabled pending the architecture decision (see <code>docs/ARCHITECTURE_DECISION.md</code>).
            </li>
          </ul>
        </AccessPanel>
      </div>

      <div className="mt-2">
        <AccessPanel
          title="Office Staff & Permissions (read-only)"
          icon={Users}
          headerRight={
            <span className="text-[11px] text-[#5a6c82]">
              {perms.activeStaff} active staff · {perms.activeFeatures}/{perms.totalFeatures} features
            </span>
          }
        >
          <p className="mb-2 text-[11px] text-[#6a6a6a]">
            Access permissions are stored per staff member in <code>tblOfficeStaffPermission</code>
            (a row per granted <code>tblFeature</code>). Mapping these feature grants to web roles is
            scheduled for Phase B6; this screen only displays the current model.
          </p>
          <AccessDataTable
            columns={staffColumns}
            rows={perms.staff}
            rowKey={(s) => s.staffId}
            emptyMessage="No office staff records found (tblOfficeStaff)."
            footer={`${perms.staff.length} staff member(s)`}
            maxHeight="50vh"
          />
        </AccessPanel>
      </div>
    </AppShell>
  );
}
