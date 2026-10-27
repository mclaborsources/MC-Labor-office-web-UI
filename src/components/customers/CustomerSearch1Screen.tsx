"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerSavedViewsProvider } from "./CustomerSavedViews";
import { CustomerSearchScreen } from "./CustomerSearchScreen";
import { CustomerNameSearchScreen, resetCustomerColumnOrder } from "./CustomerNameSearchScreen";
import { CustomerSearch1Filters } from "./CustomerSearch1Filters";
import { filterCustomerSearch1RowsAsync, filterCustomerSearch1Views3RowsAsync, type CustomerSearch1Filters as Filters, type CustomerSearchViews3Filters } from "@/lib/customerSearch1Filters";
import { CUSTOMER_NAME_SEARCH_COLUMNS, customerNameCellValue, type CustomerNameColumnKey, type CustomerNameMatch } from "@/lib/customerNameSearchColumns";
import type { FilterOption } from "@/types/search";
import { unpackCustomers } from "@/lib/customerSearchTransport";
import { CustomerRecordsLoading, type CustomerLoadProgress } from "./CustomerRecordsLoading";
import { CustomerSearchLoadingOverlay } from "./CustomerSearchLoadingOverlay";

import { BrowserSessionCache } from "@/lib/browserSessionCache";
import { CUSTOMER_ADMIN_INCLUDE_PROFILES } from "@/lib/customerSearchViewsLayout";

const recordsCache = new BrowserSessionCache();
const searchCache = new BrowserSessionCache();

const EMPTY_CUSTOMERS: CustomerNameMatch[] = [];
const ADMIN_PROFILE_NAMES = CUSTOMER_ADMIN_INCLUDE_PROFILES.flat().filter(Boolean) as string[];
function profileNamesMatch(left: string, right: string) {
  const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ").replace(/^cust search$/, "customer search");
  return normalize(left) === normalize(right);
}

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
  const [goToColumnRequest, setGoToColumnRequest] = useState<{ key: string; id: number } | null>(null);
  const [selectedColumnKey, setSelectedColumnKey] = useState<CustomerNameColumnKey>();
  const [visibleCustomerColumns, setVisibleCustomerColumns] = useState<string[]>(() => CUSTOMER_NAME_SEARCH_COLUMNS.filter(column => column.key !== "select").map(column => column.key));
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
  const [views3Filters, setViews3Filters] = useState<CustomerSearchViews3Filters>({});
  const [views3UpdateVersion, setViews3UpdateVersion] = useState(0);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [multiFilterIds, setMultiFilterIds] = useState<string[] | null>(null);
  const [includedProfiles, setIncludedProfiles] = useState<string[]>(ADMIN_PROFILE_NAMES);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const previousFilters = useRef(filters);
  const candidateCustomers = useMemo(() => {
    const name = sidebarValues.customerName?.trim().toLowerCase();
    const allIncluded = includedProfiles.length === ADMIN_PROFILE_NAMES.length;
    const activeMultiFilter = multiFilterIds ? new Set(multiFilterIds) : null;
    return customers.filter(row => (!name || row.customerName.toLowerCase().includes(name)) && (!matchingIds || matchingIds.has(row.customerId))
      && (!activeMultiFilter || activeMultiFilter.has(row.customerId))
      && (allIncluded || includedProfiles.some(profile => profileNamesMatch(profile, row.profileType ?? ""))));
  }, [customers, matchingIds, sidebarValues.customerName, includedProfiles, multiFilterIds]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerNameMatch[]>(candidateCustomers);
  useEffect(() => {
    const topFiltersChanged = previousFilters.current !== filters;
    previousFilters.current = filters;
    const hasFilters = Object.values(filters).some(Boolean) || Object.values(views3Filters).some(value => Boolean(value) && value !== "All");
    if (!hasFilters) {
      setFilteredCustomers(candidateCustomers);
      setFiltersLoading(false);
      return;
    }
    let cancelled = false;
    setFiltersLoading(topFiltersChanged);
    (async () => {
      const baseRows = await filterCustomerSearch1RowsAsync(candidateCustomers, filters, () => cancelled);
      if (cancelled || !baseRows) return;
      const result = await filterCustomerSearch1Views3RowsAsync(baseRows, views3Filters, () => cancelled);
      if (!cancelled && result) setFilteredCustomers(result);
    })().finally(() => { if (!cancelled && topFiltersChanged) setFiltersLoading(false); });
    return () => { cancelled = true; };
  }, [candidateCustomers, filters, views3Filters, views3UpdateVersion]);
  const updateViews3Filters = (next: CustomerSearchViews3Filters) => {
    setViews3Filters(next);
    setViews3UpdateVersion(version => version + 1);
  };
  const clear = () => {
    setFilters({});
    setViews3Filters({});
    setSidebarValues({});
    setMatchingIds(null);
    setMultiFilterIds(null);
    setSelectedCustomerIds([]);
    setIncludedProfiles(ADMIN_PROFILE_NAMES);
    setResetVersion(version => version + 1);
    if (Object.values(params).some(Boolean)) router.replace("/customer-search-1");
  };
  const fetchCustomerRows = async () => {
    recordsCache.clear(); searchCache.clear(); setFetchError("");
    const started = performance.now();
    const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined));
    query.set("all", "1"); query.set("packed", "1");
    for (const key of ["customerName", "customerPhone", "contactName", "contactPhone", "contactEmail", "contactText", "search", "city", "state", "salesmanId", "customerTypeId", "statusId"]) query.delete(key);
    query.sort();
    const response = await fetch(`/api/customers/name-search?${query}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Customer records could not be refreshed from the database.");
    const rows = unpackCustomers(await response.text());
    return { rows, count: Number(response.headers.get("X-Customer-Count")) || rows.length, elapsed: Math.round(performance.now() - started) };
  };
  const refresh = async () => setLoaded(await fetchCustomerRows());
  const updateColumnFromDatabase = async (columnKey: string) => {
    const fresh = await fetchCustomerRows();
    const freshById = new Map(fresh.rows.map(row => [row.customerId, row]));
    setLoaded(current => ({
      rows: (current?.rows ?? customers).map(row => {
        const updated = freshById.get(row.customerId);
        return updated ? { ...row, [columnKey]: updated[columnKey as keyof CustomerNameMatch] } : row;
      }),
      count: fresh.count,
      elapsed: fresh.elapsed,
    }));
  };
  const updateAllFromDatabase = async () => setLoaded(await fetchCustomerRows());
  const runCustomerUtility = async (action: "create-action" | "clear-future-call", extra: Record<string, unknown>) => {
    if (!selectedCustomerIds.length) throw new Error("Select one or more customer rows first.");
    const response = await fetch("/api/customers/utilities", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, customerIds: selectedCustomerIds, ...extra }),
    });
    const result = await response.json() as { ok?: boolean; error?: string; affected?: number };
    if (!response.ok || !result.ok) throw new Error(result.error || "The utility action failed.");
    refresh();
  };
  const runRayAction = async (action: "change-customer-type" | "fix-zips" | "change-contact-title" | "delete-contacts" | "set-flag4-do-not-email", extra?: { customerTypeId?: number; titleId?: number }) => {
    if (["change-customer-type", "change-contact-title", "delete-contacts"].includes(action) && !selectedCustomerIds.length) throw new Error("Select one or more customer rows first.");
    const response = await fetch("/api/customers/ray-utilities", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, customerIds: selectedCustomerIds, ...extra }),
    });
    const result = await response.json() as { ok?: boolean; error?: string; affected?: number };
    if (!response.ok || !result.ok) throw new Error(result.error || "The Ray action failed.");
    refresh();
    return result.affected ?? 0;
  };
  const transferSelectedCustomers = async (profile: string) => {
    if (!selectedCustomerIds.length) throw new Error("Select at least one customer row first.");
    const response = await fetch("/api/customers/admin-utilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, customerIds: selectedCustomerIds }),
    });
    const result = await response.json() as { ok?: boolean; error?: string; transferred?: number; profileName?: string };
    if (!response.ok || !result.ok) throw new Error(result.error || "The customer profile transfer failed.");
    const selected = new Set(selectedCustomerIds);
    setLoaded({
      rows: customers.map(row => selected.has(row.customerId) ? { ...row, profileType: result.profileName ?? profile } : row),
      count: loaded?.count ?? fetchedCount ?? customers.length,
      elapsed: loaded?.elapsed ?? elapsed,
    });
    setSelectedCustomerIds([]);
  };
  const applySelectedUserFlag = async (slot: number, value: string, password: string) => {
    const targetIds = [...selectedCustomerIds];
    if (!targetIds.length) throw new Error("Select at least one customer row first.");
    if (targetIds.length > 1000) throw new Error("Select no more than 1,000 customers at a time.");
    const response = await fetch("/api/customers/user-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, value, password, customerIds: targetIds }),
    });
    const result = await response.json() as { ok?: boolean; error?: string; updated?: number };
    if (!response.ok || !result.ok) throw new Error(result.error || "The customer user flag could not be updated.");
    const selected = new Set(targetIds);
    const key = `spare${slot}` as keyof CustomerNameMatch;
    setLoaded({
      rows: customers.map(row => selected.has(row.customerId) ? { ...row, [key]: value } : row),
      count: loaded?.count ?? fetchedCount ?? customers.length,
      elapsed: loaded?.elapsed ?? elapsed,
    });
  };
  const goToColumn = (key: string) => setGoToColumnRequest(current => ({ key, id: (current?.id ?? 0) + 1 }));
  const exportCurrentView = async () => {
    const columns = visibleCustomerColumns
      .filter(key => key !== "select")
      .map(key => CUSTOMER_NAME_SEARCH_COLUMNS.find(column => column.key === key))
      .filter((column): column is (typeof CUSTOMER_NAME_SEARCH_COLUMNS)[number] => Boolean(column));
    const XLSX = await import("xlsx");
    const rows = filteredCustomers.map(customer => columns.map(column => customerNameCellValue(customer, column.key as CustomerNameColumnKey)));
    const sheet = XLSX.utils.aoa_to_sheet([columns.map(column => column.label), ...rows]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Customer View");
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(book, `Customer-Search-View-${date}.xlsx`);
  };
  const selectedCustomerNames = useMemo(() => {
    const selected = new Set(selectedCustomerIds);
    return customers.filter(row => selected.has(row.customerId)).map(row => row.customerName);
  }, [customers, selectedCustomerIds]);
  return <CustomerSavedViewsProvider><CustomerSearchScreen onShowAllColumns={() => setShowColumnsVersion(value => value + 1)} onResetColumnOrder={() => { resetCustomerColumnOrder("customers"); setResetOrderVersion(value => value + 1); }} onRefresh={() => { void refresh().catch(error => setFetchError(error instanceof Error ? error.message : "Refresh failed.")); }} onUpdateColumn={updateColumnFromDatabase} onUpdateAll={updateAllFromDatabase} selectedCustomerColumn={selectedColumnKey} onGoToColumn={goToColumn} visibleCustomerColumns={visibleCustomerColumns} onExportView={exportCurrentView} title="Customer Search 1" basePath="/customer-search-1"
    customers={[]} loadError={fetchError || loadError} {...options} customerUserFlagOptions={Array.from({ length: 8 }, () => [])} lastActionUsers={lastActionUsers}
    views3Filters={views3Filters} onViews3FiltersChange={updateViews3Filters}
    adminSelectedCount={selectedCustomerIds.length} adminIncludeProfiles={includedProfiles}
    onAdminIncludeProfilesChange={setIncludedProfiles} onAdminTransfer={transferSelectedCustomers}
    selectedCustomerNames={selectedCustomerNames} onApplyMultiFilter={() => setMultiFilterIds([...selectedCustomerIds])}
    onClearMultiFilter={() => setMultiFilterIds(null)} multiFilterActive={multiFilterIds !== null}
    selectedCustomerIds={selectedCustomerIds}
    onCreateCustomerAction={actionType => runCustomerUtility("create-action", { actionType })}
    onClearFutureCall={(choice, statusId) => runCustomerUtility("clear-future-call", { statusChoice: choice, statusId })}
    onRayAction={runRayAction}
    userSettingsSelectedCount={selectedCustomerIds.length} onApplyUserFlag={applySelectedUserFlag}
    currentSearch={params.search ?? ""} currentSalesmanId={params.salesmanId ?? ""} currentCustomerTypeId={params.customerTypeId ?? ""}
    currentStatusId={params.statusId ?? ""} currentCity={params.city ?? ""} currentState={params.state ?? ""}
    currentCustomerName={params.customerName ?? ""} currentCustomerPhone={params.customerPhone ?? ""}
    currentContactName={params.contactName ?? ""} currentContactPhone={params.contactPhone ?? ""}
    currentContactEmail={params.contactEmail ?? ""} currentContactText={params.contactText ?? ""}
    currentSortKey="" currentSortDirection="asc" page={1} pageSize={customers.length} total={customers.length} hasMore={false} loadTimeMs={elapsed}
    onClearResultFilters={clear}
    onSidebarSearchChange={setSidebarValues}
    filterRow={<><CustomerSearch1Filters rows={customers} filters={filters} onChange={setFilters} onClear={clear} />{searching && <span role="status">Updating search results…</span>}</>}
    results={<>{filtersLoading && <CustomerSearchLoadingOverlay title="Updating Customer Results" description="Applying customer filters…" />}{needsFetch && !loaded && !fetchError ? <CustomerRecordsLoading progress={progress} /> : <CustomerNameSearchScreen showColumnsVersion={showColumnsVersion} resetOrderVersion={resetOrderVersion} goToColumnRequest={goToColumnRequest} onVisibleColumnsChange={setVisibleCustomerColumns} onSelectedColumnChange={setSelectedColumnKey} key={resetVersion} variant="customers" initialCustomers={filteredCustomers} fetchedCount={loaded?.count ?? fetchedCount} initialLoadTimeMs={elapsed} selectedCustomerIds={selectedCustomerIds} onSelectedCustomerIdsChange={setSelectedCustomerIds} />}</>}
  /></CustomerSavedViewsProvider>;
}
