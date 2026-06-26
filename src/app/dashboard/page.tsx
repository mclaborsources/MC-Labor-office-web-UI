import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AccessWindowTabs } from "@/components/access/AccessWindowTabs";
import { AccessPanel } from "@/components/access/AccessPanel";
import { getSessionOrDefault } from "@/lib/auth/session";

interface MenuItem {
  href: string;
  label: string;
  hint: string;
  enabled: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const GROUPS: MenuGroup[] = [
  {
    title: "Daily Work",
    items: [
      { href: "/tracking", label: "Tracking", hint: "Weekly assignment tracking screen", enabled: true },
    ],
  },
  {
    title: "Search",
    items: [
      { href: "/customers", label: "Customer Search", hint: "Customers, contacts, foremen", enabled: true },
      { href: "/employees", label: "Employee Search", hint: "Employees by name / trade / status", enabled: true },
      { href: "/jobs", label: "Job Search", hint: "Jobsites / projects", enabled: true },
    ],
  },
  {
    title: "Reports & Admin",
    items: [
      { href: "/reports", label: "Reports", hint: "Report menu (read-only catalog)", enabled: true },
      { href: "/admin/connection", label: "Admin", hint: "Connection & access status", enabled: true },
    ],
  },
];

function MenuButton({ item }: { item: MenuItem }) {
  const inner = (
    <div
      className={`flex items-center justify-between gap-3 border px-3 py-2 ${
        item.enabled
          ? "border-[#9c9c9c] bg-gradient-to-b from-white to-[#e8e8e8] hover:from-white hover:to-[#dcdcdc]"
          : "border-[#bcbcbc] bg-[#f0f0f0] text-[#8a8a8a]"
      }`}
    >
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-[#1f2d3d]">{item.label}</div>
        <div className="truncate text-[11px] text-[#6a6a6a]">{item.hint}</div>
      </div>
      {!item.enabled && (
        <span className="shrink-0 border border-[#cdb96a] bg-[#f1e6b2] px-1.5 py-0.5 text-[10px] font-medium text-[#4a3d00]">
          Coming later
        </span>
      )}
    </div>
  );

  return item.enabled ? (
    <Link href={item.href} className="block">
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  );
}

export default async function DashboardPage() {
  const session = await getSessionOrDefault();

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="-mx-2 -mt-2 mb-2 sm:-mx-3">
        <AccessWindowTabs tabs={[{ label: "Menu", active: true }]} />
      </div>

      <div className="mb-2 border-b border-[#b6c2d0] pb-1.5">
        <h1 className="text-[15px] font-bold tracking-tight text-[#1f2d3d]">Main Menu</h1>
        <span className="text-[11px] text-[#6a6a6a]">MC Labor Sources — Office Portal</span>
      </div>

      <div className="grid max-w-3xl grid-cols-1 gap-2 md:grid-cols-3">
        {GROUPS.map((group) => (
          <AccessPanel key={group.title} title={group.title} bodyClassName="space-y-1.5">
            {group.items.map((item) => (
              <MenuButton key={item.label} item={item} />
            ))}
          </AccessPanel>
        ))}
      </div>
    </AppShell>
  );
}
