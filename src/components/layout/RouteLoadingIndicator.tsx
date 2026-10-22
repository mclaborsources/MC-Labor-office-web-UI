"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const ROUTE_LOADING_EVENT = "mc-labor-route-loading";

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (loading) document.documentElement.classList.add("mc-route-busy");
    else document.documentElement.classList.remove("mc-route-busy");
    return () => document.documentElement.classList.remove("mc-route-busy");
  }, [loading]);

  useEffect(() => { setLoading(false); }, [pathname, query]);

  useEffect(() => {
    const begin = () => setLoading(true);
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.download) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin === window.location.origin &&
          (destination.pathname !== window.location.pathname || destination.search !== window.location.search)) begin();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(ROUTE_LOADING_EVENT, begin);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(ROUTE_LOADING_EVENT, begin);
    };
  }, []);

  return loading ? <span className="sr-only" role="status">Loading page…</span> : null;
}
