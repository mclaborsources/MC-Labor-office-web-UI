"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CurrentJobsScreen } from "./CurrentJobsScreen";
import type { JobListingPage } from "@/lib/jobListingReports";

export function CurrentJobsModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState<JobListingPage | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { previous?.focus(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch("/api/reports/job-listings?kind=current&page=1&pageSize=100", { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load Current Jobs."); return data as JobListingPage; })
      .then(setPage).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load Current Jobs."); });
    return () => controller.abort();
  }, [retry]);
  return createPortal(<dialog ref={dialog} className="ac-current-jobs-modal" aria-labelledby="current-jobs-modal-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="ac-current-jobs-modal-title"><span id="current-jobs-modal-title">Current Jobs</span><button type="button" aria-label="Close Current Jobs" onClick={onClose}>×</button></div>
    {page ? <CurrentJobsScreen initialPage={page} onClose={onClose} /> : <div className="ac-current-jobs-modal-loading">{error ? <><p role="alert">{error}</p><button onClick={() => setRetry(value => value + 1)}>Retry</button></> : <p role="status">Loading Current Jobs…</p>}</div>}
  </dialog>, document.body);
}
