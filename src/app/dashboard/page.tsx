import Link from "next/link";
import {
  Briefcase,
  Building2,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { getSessionOrDefault } from "@/lib/auth/session";

const SECTIONS = [
  {
    href: "/tracking",
    icon: ClipboardList,
    title: "Tracking",
    description: "View current-week assignment tracking layout.",
    enabled: true,
    badge: null,
  },
  {
    href: "/employees",
    icon: Users,
    title: "Employees",
    description: "Search and view employee details from the database.",
    enabled: true,
    badge: "Milestone 2",
  },
  {
    href: "/customers",
    icon: Building2,
    title: "Customers",
    description: "Search customers, view contacts and foremen.",
    enabled: true,
    badge: "Milestone 2",
  },
  {
    href: "#",
    icon: HardHat,
    title: "Jobs / Projects",
    description: "Job and project search — coming in Milestone 3.",
    enabled: false,
    badge: "Milestone 3",
  },
  {
    href: "#",
    icon: Briefcase,
    title: "Assignment Grid",
    description: "Full tracking grid with CSV export — Milestone 4.",
    enabled: false,
    badge: "Milestone 4",
  },
] as const;

export default async function DashboardPage() {
  const session = await getSessionOrDefault();

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <PageHeader
        title="Dashboard"
        icon={LayoutDashboard}
        subtitle="MC Labor Office Portal — Phase 1"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((item) => {
          const card = (
            <div
              className={`mc-panel p-5 h-full flex flex-col gap-3 transition-all duration-200 ${
                item.enabled
                  ? "hover:shadow-md hover:border-blue-200/60 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 ring-1 ring-blue-600/20">
                  <Icon
                    icon={item.icon}
                    size="md"
                    className={item.enabled ? "text-blue-600" : "text-slate-400"}
                  />
                </div>
                {item.badge && (
                  <span
                    className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.enabled
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
              {!item.enabled && (
                <p className="text-xs text-slate-400 italic mt-auto">
                  Not yet available
                </p>
              )}
            </div>
          );

          return item.enabled ? (
            <Link key={item.title} href={item.href} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={item.title} className="block h-full">
              {card}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
