import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  Lock,
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
    image: "/Dashboard/tracking_card.png",
    title: "Tracking",
    description: "View the current-week assignment tracking layout.",
    enabled: true,
  },
  {
    href: "/employees",
    icon: Users,
    image: "/Dashboard/empolyees_card.png",
    title: "Employees",
    description: "Search and view employee details from the database.",
    enabled: true,
  },
  {
    href: "/customers",
    icon: Building2,
    image: "/Dashboard/customers_card.png",
    title: "Customers",
    description: "Browse customers with their contacts and foremen.",
    enabled: true,
  },
  {
    href: "/jobs",
    icon: HardHat,
    image: "/Dashboard/jobs_projects_card.png",
    title: "Jobs / Projects",
    description: "Search jobsites, view details and customer links.",
    enabled: true,
  },
  {
    href: "#",
    icon: Briefcase,
    image: "/Dashboard/assignment_grid_card.png",
    title: "Assignment Grid",
    description: "Full tracking grid with CSV export, coming in Milestone 4.",
    enabled: false,
  },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await getSessionOrDefault();
  const name = session.user?.displayName?.split(" ")[0];

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="flex min-h-[calc(100vh-9.5rem)] flex-col">
        <PageHeader
          title="Dashboard"
          icon={LayoutDashboard}
          subtitle={`${greeting()}${name ? `, ${name}` : ""} — MC Labor Office Portal`}
        />

        <div className="grid flex-1 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((item) => {
            const card = (
              <div
                className={`group relative flex h-full min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm ${
                  item.enabled
                    ? "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    : "cursor-not-allowed"
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className={`object-cover transition-transform duration-500 ${
                    item.enabled
                      ? "group-hover:scale-105"
                      : "grayscale"
                  }`}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/10" />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md">
                    <Icon icon={item.icon} size="md" />
                  </div>
                  {item.enabled ? (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 ring-1 ring-white/20 backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-slate-900">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-md">
                      <Lock className="h-3.5 w-3.5" />
                      Coming soon
                    </span>
                  )}
                </div>

                <div className="relative p-5">
                  <h3 className="text-lg font-semibold tracking-tight text-white drop-shadow-sm">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-200/90 drop-shadow-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            );

            return item.enabled ? (
              <Link key={item.title} href={item.href} className="block">
                {card}
              </Link>
            ) : (
              <div key={item.title}>{card}</div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
