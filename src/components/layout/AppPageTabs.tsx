"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type PageTab = { href: string; label: string };
const STORAGE_KEY = "mc-open-page-tabs-v2";
const defaultTabs: PageTab[] = [
  { href: "/dashboard", label: "Main Menu" }, { href: "/tracking", label: "Tracking" },
];
const labels: Record<string, string> = {
  "/dashboard": "Menu", "/tracking": "Tracking", "/reports": "Reports", "/customers": "Customers",
  "/customer-menu": "Customer Menu", "/customer-permits": "Customer Permits", "/employees": "Employees",
  "/jobs": "Jobs", "/deposits-to-be-made": "Record of Deposits to be Made", "/office-staff-hours": "Office Staff Hours",
  "/website-access": "Website Access", "/alerts": "Alerts", "/commissions": "Commissions", "/cluster-commissions": "Cluster Commissions",
  "/commissions-for-salesman": "Commissions for Salesman", "/payroll-adjustments": "Payroll Adjustments",
  "/accounting-reports": "Accounting Reports", "/reports-search": "Payroll Report Search",
};

function labelFor(path: string) {
  if (labels[path]) return labels[path];
  if (path.startsWith("/employees/")) return "Employee";
  if (path.startsWith("/customers/")) return "Customer";
  if (path.startsWith("/jobs/")) return "Job";
  const part = path.split("/").filter(Boolean).pop() ?? "Menu";
  return part.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AppPageTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tabs, setTabs] = useState<PageTab[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as PageTab[] | null;
      const saved = Array.isArray(parsed) ? parsed.filter((tab) => tab && typeof tab.href === "string" && typeof tab.label === "string") : null;
      const merged = [...defaultTabs];
      for (const tab of saved ?? []) {
        if (!merged.some((item) => item.href === tab.href)) merged.push(tab);
      }
      setTabs(merged);
    } catch { setTabs([]); }
  }, []);

  useEffect(() => {
    if (!pathname || pathname === "/login") return;
    setTabs((current) => {
      const href = pathname;
      const next = current.some((tab) => tab.href === href) ? current : [...current, { href, label: labelFor(pathname) }];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* browser storage may be disabled */ }
      return next;
    });
  }, [pathname]);

  const closeTab = (href: string) => {
    const index = tabs.findIndex((tab) => tab.href === href);
    const next = tabs.filter((tab) => tab.href !== href);
    setTabs(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* browser storage may be disabled */ }
    if (pathname === href) router.push(next[Math.max(0, index - 1)]?.href ?? "/dashboard");
  };

  if (!tabs.length) return null;
  return <div className="app-page-tabs" role="tablist" aria-label="Open pages">
    {tabs.map((tab) => {
      const active = pathname === tab.href;
      return <div key={tab.href} className={`app-page-tab ${active ? "is-active" : ""}`} role="presentation">
        <Link href={`${tab.href}${active && searchParams?.size ? `?${searchParams.toString()}` : ""}`} role="tab" aria-selected={active}>{tab.label}</Link>
        <button type="button" aria-label={`Close ${tab.label}`} title={`Close ${tab.label}`} onClick={() => closeTab(tab.href)}>×</button>
      </div>;
    })}
  </div>;
}
