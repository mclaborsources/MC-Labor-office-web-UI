"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** A new tab starts a new visit; pagehide closes the current web login. */
export function VisitSessionGuard({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(!enabled);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let loginId: number | null = null;
    async function initialize() {
      try {
        if (!sessionStorage.getItem("mc-office-visit")) {
          const response = await fetch("/api/auth/logout", { method: "POST" });
          if (!response.ok) throw new Error("Could not start a new visit");
          sessionStorage.setItem("mc-office-visit", "1");
          window.location.replace("/login");
          return;
        }
        const response = await fetch("/api/auth/visit", { cache: "no-store" });
        if (!response.ok) throw new Error("Session unavailable");
        const payload = await response.json();
        loginId = payload.loginId;
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) { setReady(false); window.location.replace("/login"); }
      }
    }
    void initialize();
    const closeVisit = () => {
      if (!loginId) return;
      sessionStorage.removeItem("mc-office-visit");
      const body = new Blob([JSON.stringify({ closingLoginId: loginId })], { type: "application/json" });
      navigator.sendBeacon("/api/auth/logout", body);
    };
    window.addEventListener("pagehide", closeVisit);
    window.addEventListener("mc-office-session-changed", initialize);
    const restoreVisit = (event: PageTransitionEvent) => { if (event.persisted) window.location.replace("/login"); };
    window.addEventListener("pageshow", restoreVisit);
    return () => { cancelled = true; window.removeEventListener("pagehide", closeVisit); window.removeEventListener("pageshow", restoreVisit); window.removeEventListener("mc-office-session-changed", initialize); };
  }, [enabled, pathname]);
  if (!ready) return <main role="status" className="flex min-h-screen items-center justify-center">Starting a new visit…</main>;
  return children;
}
