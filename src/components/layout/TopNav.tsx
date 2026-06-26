"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

const NAV_ITEMS: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/dashboard", label: "Main Menu", match: (p) => p === "/dashboard" || p === "/" },
  { href: "/tracking", label: "Tracking", match: (p) => p.startsWith("/tracking") },
  { href: "/customers", label: "Customer Search", match: (p) => p.startsWith("/customers") },
  { href: "/employees", label: "Employee Search", match: (p) => p.startsWith("/employees") },
  { href: "/jobs", label: "Job Search", match: (p) => p.startsWith("/jobs") },
  { href: "/reports", label: "Reports", match: (p) => p.startsWith("/reports") },
  { href: "/admin/connection", label: "Admin", match: (p) => p.startsWith("/admin") },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="ac-menubar sticky top-[33px] z-30" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`ac-menuitem ${active ? "bg-[#cfe0f2] font-semibold text-[#0b2440]" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
      <span className="ml-auto">
        <button
          type="button"
          className="ac-menuitem flex items-center gap-1.5 text-[#7a3338]"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </span>
    </nav>
  );
}
