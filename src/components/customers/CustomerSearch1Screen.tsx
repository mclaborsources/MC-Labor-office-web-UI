"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerSavedViewsProvider } from "./CustomerSavedViews";
import { CustomerSearchScreen } from "./CustomerSearchScreen";
import { CustomerNameSearchScreen, resetCustomerColumnOrder } from "./CustomerNameSearchScreen";
import { CustomerSearch1Filters } from "./CustomerSearch1Filters";
import { filterCustomerSearch1Rows, type CustomerSearch1Filters as Filters } from "@/lib/customerSearch1Filters";
import type { CustomerNameMatch } from "@/lib/customerNameSearchColumns";
import type { FilterOption } from "@/types/search";
import { unpackCustomers } from "@/lib/customerSearchTransport";
import { CustomerRecordsLoading, type CustomerLoadProgress } from "./CustomerRecordsLoading";

import { BrowserSessionCache } from "@/lib/browserSessionCache";

const recordsCache = new BrowserSessionCache();
const searchCache = new BrowserSessionCache();

const EMPTY_CUSTOMERS: CustomerNameMatch[] = [];

export function CustomerSearch1Screen({ cacheScope = "default", customers: suppliedCustomers, packedCustomers, fetchedCount, params, loadTimeMs, loadError, options, lastActionUsers }: {
  cacheScope?: string;
  customers?: CustomerNameMatch[];
  packedCustomers?: string;
  fetchedCount?: number;
  params: Record<string, string | undefined>;
  loadTimeMs: number;
  loadError: string;
  options: { salesmen: FilterOption[]; customerTypes: FilterOption[]; statuses: FilterOption[]; cities: FilterOption[]; states: FilterOption[] };
  lastActionUsers: FilterOption[];
}) {
  const [loaded, setLoaded] = useState<{ rows: CustomerNameMatch[]; count: number; elapsed: number }>();
  const [revision, setRevision] = useState(0);
  const [fetchError, setFetchError] = useState("");
  const [progress, setProgress] = useState<CustomerLoadProgress>({ stage: "fetching", bytes: 0 });
  const needsFetch = suppliedCustomers === undefined && packedCustomers === undefined;
  const [sidebarValues, setSidebarValues] = useState<Record<string, string>>(Object.fromEntries(Object.entries(params).map(([key, value]) => [key, value ?? ""])));
  const [matchingIds, setMatchingIds] = useState<Set<string> | null>(null);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const query = new URLSearchParams(sidebarValues);
        query.set("ids", "1");
        query.sort();
        const result = await searchCache.get(cacheScope, query.toString(), async () => {
          const response = await fetch(`/api/customers/name-search?${query}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Search could not be completed. Try again.");
          return await response.json() as { ids: string[] | null };
        });
        if (!controller.signal.aborted) { setMatchingIds(result.ids ? new Set(result.ids) : null); setFetchError(""); }
      } catch (error) { if (!controller.signal.aborted) setFetchError(error instanceof Error ? error.message : "Search failed."); }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [sidebarValues, cacheScope, revision]);
  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;
    const started = performance.now();
    const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined));
    query.set("all", "1");
    query.set("packed", "1");
    for (const key of ["customerName", "customerPhone", "contactName", "contactPhone", "contactEmail", "contactText", "search", "city", "state", "salesmanId", "customerTypeId", "statusId"]) query.delete(key);
    query.sort();
    recordsCache.get(cacheScope, query.toString(), () => fetch(`/api/customers/name-search?${query}`, { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Customer records could not be loaded. Refresh to retry.");
        const count = Number(response.headers.get("X-Customer-Count")) || undefined;
        if (!cancelled) setProgress({ stage: "downloading", bytes: 0, count });
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const chunks: string[] = [];
        let bytes = 0;
        let lastUpdate = 0;
        if (reader) {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            chunks.push(decoder.decode(chunk.value, { stream: true }));
            if (performance.now() - lastUpdate > 150) {
              if (!cancelled) setProgress({ stage: "downloading", bytes, count });
              lastUpdate = performance.now();
            }
          }
          chunks.push(decoder.decode());
        } else chunks.push(await response.text());
        if (!cancelled) setProgress({ stage: "preparing", bytes, count });
        await new Promise(resolve => window.setTimeout(resolve, 30));
        const rows = unpackCustomers(chunks.join(""));
        return { rows, count: Number(response.headers.get("X-Customer-Count")) || rows.length, elapsed: Math.round(performance.now() - started) };
      })).then(data => { if (!cancelled) setLoaded(data); }).catch(error => { if (!cancelled) setFetchError(error.message); });
    return () => { cancelled = true; };
  }, [needsFetch, params, cacheScope, revision]);
  const customers = useMemo(() => loaded?.rows ?? (packedCustomers ? unpackCustomers(packedCustomers) : suppliedCustomers ?? EMPTY_CUSTOMERS), [loaded, packedCustomers, suppliedCustomers]);
  const elapsed = loaded?.elapsed ?? loadTimeMs;
  const router = useRouter();
  const [resetOrderVersion, setResetOrderVersion] = useState(0);
  const [showColumnsVersion, setShowColumnsVersion] = useState(0);
  const [resetVersion, setResetVersion] = useState(0);
  const [filters, setFilters] = useState<Filters>({});
  const filteredCustomers = useMemo(() => {
    const name = sidebarValues.customerName?.trim().toLowerCase();
    return filterCustomerSearch1Rows(customers.filter(row => (!name || row.customerName.toLowerCase().includes(name)) && (!matchingIds || matchingIds.has(row.customerId))), filters);
  }, [customers, filters, matchingIds, sidebarValues.customerName]);
  const clear = () => {
    setFilters({});
    setSidebarValues({});
    setMatchingIds(null);
    setResetVersion(version => version + 1);
    if (Object.values(params).some(Boolean)) router.replace("/customer-search-1");
  };
  const refresh = () => { recordsCache.clear(); searchCache.clear(); setLoaded(undefined); setFetchError(""); setRevision(value => value + 1); };
  return <CustomerSavedViewsProvider><CustomerSearchScreen onShowAllColumns={() => setShowColumnsVersion(value => value + 1)} onResetColumnOrder={() => { resetCustomerColumnOrder("customers"); setResetOrderVersion(value => value + 1); }} onRefresh={refresh} title="Customer Search 1" basePath="/customer-search-1"
    customers={[]} loadError={fetchError || loadError} {...options} customerUserFlagOptions={Array.from({ length: 8 }, () => [])} lastActionUsers={lastActionUsers}
    currentSearch={params.search ?? ""} currentSalesmanId={params.salesmanId ?? ""} currentCustomerTypeId={params.customerTypeId ?? ""}
    currentStatusId={params.statusId ?? ""} currentCity={params.city ?? ""} currentState={params.state ?? ""}
    currentCustomerName={params.customerName ?? ""} currentCustomerPhone={params.customerPhone ?? ""}
    currentContactName={params.contactName ?? ""} currentContactPhone={params.contactPhone ?? ""}
    currentContactEmail={params.contactEmail ?? ""} currentContactText={params.contactText ?? ""}
    currentSortKey="" currentSortDirection="asc" page={1} pageSize={customers.length} total={customers.length} hasMore={false} loadTimeMs={elapsed}
    onClearResultFilters={clear}
    onSidebarSearchChange={setSidebarValues}
    filterRow={<><CustomerSearch1Filters rows={customers} filters={filters} onChange={setFilters} onClear={clear} />{searching && <span role="status">Updating search results…</span>}</>}
    results={needsFetch && !loaded && !fetchError ? <CustomerRecordsLoading progress={progress} /> : <CustomerNameSearchScreen showColumnsVersion={showColumnsVersion} resetOrderVersion={resetOrderVersion} key={resetVersion} variant="customers" initialCustomers={filteredCustomers} fetchedCount={loaded?.count ?? fetchedCount} initialLoadTimeMs={elapsed} />}
  /></CustomerSavedViewsProvider>;
}
