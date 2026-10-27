"use client";

import { useEffect, useState } from "react";

export function CustomerSearchLoadingOverlay({ title = "Loading Customer Search", description = "Searching and preparing customer records…" }: { title?: string; description?: string } = {}) {
  const [elapsedTenths, setElapsedTenths] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedTenths((value) => value + 1);
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="ac-customer-loading-backdrop" role="status" aria-live="polite" aria-label="Loading customer data">
      <div className="ac-customer-loading-modal">
        <div className="ac-customer-loading-title">{title}</div>
        <p>{description}</p>
        <div className="ac-customer-loading-track" aria-hidden="true">
          <span className="ac-customer-loading-bar" />
        </div>
        <div className="ac-customer-loading-time">
          Elapsed time: <strong>{(elapsedTenths / 10).toFixed(1)} seconds</strong>
        </div>
        {elapsedTenths >= 100 && (
          <p className="ac-customer-loading-slow">Still loading and preparing the page…</p>
        )}
      </div>
    </div>
  );
}
