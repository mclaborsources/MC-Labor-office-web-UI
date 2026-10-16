"use client";

import { useEffect } from "react";

function describeEvent(value: Event) {
  const target = value.target;
  if (!(target instanceof Element)) {
    return { type: value.type, target: target?.constructor?.name ?? null };
  }

  const element = target as Element & { currentSrc?: string; src?: string; href?: string };
  return {
    type: value.type,
    target: element.tagName.toLowerCase(),
    source: element.currentSrc || element.src || element.href || null,
    element: element.outerHTML.slice(0, 500),
  };
}

export function UnhandledRejectionDiagnostics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const report = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof Event) {
        console.error("Unhandled promise rejected with a browser event:", describeEvent(event.reason));
      } else if (!(event.reason instanceof Error)) {
        console.error("Unhandled promise rejection reason:", event.reason);
      }
    };

    window.addEventListener("unhandledrejection", report, true);
    return () => window.removeEventListener("unhandledrejection", report, true);
  }, []);

  return null;
}
