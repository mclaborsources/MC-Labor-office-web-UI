"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const OPEN_RECORD_TARGETS = [
  ".employee-name-open",
  'a[href^="/employees/"]',
  'a[href^="/customers/"]',
  '[id^="tracking-row-"]',
  ".eqs-grid tbody tr",
  ".deleted-grid-wrap tbody tr",
  ".health-ins-grid-wrap tbody tr",
  ".contact-report-grid tbody tr",
  ".manpower-report .customer-report-grid tbody tr",
  'td[title="Double-click to open customer"]',
].join(",");

export function NavigationLoadingFeedback() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    function onDoubleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(OPEN_RECORD_TARGETS)) return;
      setLoading(true);
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => setLoading(false), 15000);
    }
    document.addEventListener("dblclick", onDoubleClick, true);
    return () => {
      document.removeEventListener("dblclick", onDoubleClick, true);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);

  if (!loading) return null;
  return <div className="route-loading-overlay" role="status" aria-live="polite">
    <div className="route-loading-card"><span className="route-loading-spinner" aria-hidden="true"/><span>Opening record…</span></div>
  </div>;
}
