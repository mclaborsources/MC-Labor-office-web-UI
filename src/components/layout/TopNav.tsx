"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  ["/dashboard", "Main Menu"], ["/tracking", "Tracking"], ["/customer-menu", "Customer Menu"],
  ["/customers", "Customers"], ["/customer-permits", "Customer Permits"], ["/employees", "Employees"],
  ["/jobs", "Jobs"], ["/reports", "Reports"], ["/admin/connection", "Admin"],
] as const;

export function TopNav() {
  const pathname = usePathname();
  return <nav className="ac-menubar" aria-label="Main navigation">
    {navItems.map(([href, label]) => {
      const active = href === "/dashboard" ? pathname === "/dashboard" || pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} className={`ac-menuitem ${active ? "ac-menuitem-active" : ""}`}>{label}</Link>;
    })}
  </nav>;
}

export function LogoutButton() {
  return (
    <button data-action-status="linked"
      type="button"
      className="flex items-center gap-1.5 rounded border border-white/40 bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      <LogOut className="h-3.5 w-3.5" />
      Log out
    </button>
  );
}
