"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const ROUTE_LOADING_EVENT = "mc-labor-route-loading";

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => { setLoading(false); }, [pathname]);

  useEffect(() => {
    const begin = () => setLoading(true);
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.download) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin === window.location.origin && destination.href !== window.location.href) begin();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(ROUTE_LOADING_EVENT, begin);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(ROUTE_LOADING_EVENT, begin);
    };
  }, []);

  if (!loading) return null;
  return <div className="route-loading-backdrop" role="status" aria-live="polite" aria-label="Loading page data"><div className="route-loading-dialog"><div className="route-loading-title">MC Labor</div><div className="route-loading-content"><strong>Loading data…</strong><span>Please wait while the latest records are fetched.</span><div className="route-loading-track" aria-hidden="true"><div className="route-loading-bar" /></div></div></div></div>;
}
