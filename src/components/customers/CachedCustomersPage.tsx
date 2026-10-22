"use client";

import { useEffect, useState } from "react";
import { CustomerSearchScreen, type CustomerSearchScreenProps } from "./CustomerSearchScreen";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

// Browser memory only: survives route changes, clears on a full reload.
// Separate entries preserve each search/page; login changes discard all data.
let activeScope = "";
const cache = new Map<string, Promise<CustomerSearchScreenProps>>();

export function CachedCustomersPage({ scope, params }: {
  scope: string;
  params: Record<string, string | undefined>;
}) {
  const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined).sort(([a], [b]) => a.localeCompare(b))).toString();
  const key = `${scope}:${query}`;
  const [result, setResult] = useState<{ key: string; data: CustomerSearchScreenProps }>();
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (activeScope !== scope) { cache.clear(); activeScope = scope; }
    setError("");
    let request = cache.get(key);
    if (!request) {
      request = fetch(`/api/customers/search-page?${query}`, { cache: "no-store" }).then(async response => {
        if (!response.ok) throw new Error("Could not load customers. Please retry.");
        const data = await response.json() as CustomerSearchScreenProps;
        if (data.loadError) throw new Error(data.loadError);
        return data;
      });
      cache.set(key, request);
    }
    const pending = request;
    void pending.then(data => { if (!cancelled) setResult({ key, data }); }).catch(reason => {
      if (cache.get(key) === pending) cache.delete(key);
      if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load customers.");
    });
    return () => { cancelled = true; };
  }, [key, query, scope, revision]);

  function refresh() {
    cache.clear();
    setResult(undefined);
    setRevision(value => value + 1);
  }

  if (error) return <div><ErrorAlert title="Could not load customers" message={error} /><button type="button" onClick={refresh}>Retry</button></div>;
  if (!result || result.key !== key) return <Spinner label="Loading customers…" />;
  return <CustomerSearchScreen {...result.data} onRefresh={refresh} />;
}
