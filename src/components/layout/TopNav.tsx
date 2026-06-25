"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, HardHat, LayoutDashboard, LogOut, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
  enabled: boolean;
}[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
    enabled: true,
  },
  {
    href: "/tracking",
    label: "Tracking",
    icon: ClipboardList,
    match: (p) => p.startsWith("/tracking"),
    enabled: true,
  },
  {
    href: "/employees",
    label: "Employees",
    icon: Users,
    match: (p) => p.startsWith("/employees"),
    enabled: true,
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Building2,
    match: (p) => p.startsWith("/customers"),
    enabled: true,
  },
  {
    href: "#",
    label: "Jobs",
    icon: HardHat,
    match: (p) => p.startsWith("/jobs"),
    enabled: false,
  },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-slate-200/70 bg-white/70 px-3 backdrop-blur-xl lg:px-6"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-1 py-2.5 overflow-x-auto mc-scroll-smooth">
        <div className="flex gap-0.5 rounded-xl bg-slate-100/90 p-1 ring-1 ring-slate-200/60 shrink-0">
          {NAV_ITEMS.map((item) => {
            const isActive = item.enabled && item.match(pathname);
            const isDisabled = !item.enabled;

            const content = (
              <>
                <Icon
                  icon={item.icon}
                  size="sm"
                  className={isActive ? "text-blue-600" : "text-slate-400"}
                />
                {item.label}
                {isDisabled && (
                  <span className="hidden sm:inline text-[10px] font-medium text-slate-400 bg-slate-200/80 rounded-full px-1.5 py-0.5 ml-0.5">
                    M3
                  </span>
                )}
              </>
            );

            if (isDisabled) {
              return (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
                  aria-disabled="true"
                >
                  {content}
                </span>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-200/80 ring-1 ring-slate-200/80"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-800"
                }`}
              >
                {content}
              </Link>
            );
          })}
        </div>

        <div className="flex-1 min-w-[1rem]" />

        <Button
          variant="ghost"
          className="text-slate-500 hover:bg-slate-100/80 hover:text-slate-800 shrink-0"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <Icon icon={LogOut} size="sm" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </nav>
  );
}
