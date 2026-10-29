"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { compareEmployeesAccessOrder, filterEmployeeSearch } from "@/lib/employeeSearchInteractions";
import { EmployeeSearchScreen, type EmployeeSearchScreenProps } from "./EmployeeSearchScreen";
import { EmployeeSearchTable } from "./EmployeeSearchTable";
import { CustomerRecordsLoading, type CustomerLoadProgress } from "../customers/CustomerRecordsLoading";
import { BrowserSessionCache } from "@/lib/browserSessionCache";
import type { EmployeeSummary } from "@/types/employee";
import { filterEmployeeSearchViews3Rows, type EmployeeSearchViews3Filters } from "@/lib/employeeSearchViews3Filters";
import { filterEmployeeSearchViews4Rows, type EmployeeSearchViews4Filters } from "@/lib/employeeSearchViews4Filters";
import { filterEmployeeSearchUtilities, filterEmployeeSearchCallNumber, type EmployeeSearchUtilityFilters, type EmployeeCallNumberFilter } from "@/lib/employeeSearchUtilities";
import { EMPLOYEE_ADMIN_INCLUDE_PROFILES } from "@/lib/employeeSearchViewsLayout";
import { filterEmployeeSearchViews1Rows, type EmployeeSearchViews1Filters } from "@/lib/employeeSearchViews1Filters";
import { filterEmployeeSearchCallListRows, type EmployeeSearchCallListFilters } from "@/lib/employeeSearchCallListFilters";
import { filterEmployeeSearchCallLists2Rows, type EmployeeSearchCallLists2Filters } from "@/lib/employeeSearchCallLists2";

const recordsCache = new BrowserSessionCache();

export function EmployeeSearchLoader({ cacheScope, ...props }: Omit<EmployeeSearchScreenProps, "employees"> & { cacheScope: string }) {
  const router = useRouter();
  const [search, setSearch] = useState<Record<string, string>>({});
  const deferredSearch = useDeferredValue(search);
  const [resetVersion, setResetVersion] = useState(0);
  const [tableResetVersion, setTableResetVersion] = useState(0);
  const [sortResetVersion, setSortResetVersion] = useState(0);
  const [selectedTrade, setSelectedTrade] = useState(props.currentTradeId);
  const [accessSort, setAccessSort] = useState(false);
  const [views3Filters, setViews3Filters] = useState<EmployeeSearchViews3Filters>({});
  const [views1Filters, setViews1Filters] = useState<EmployeeSearchViews1Filters>({});
  const [views4Filters, setViews4Filters] = useState<EmployeeSearchViews4Filters>({});
  const [activeEmployee, setActiveEmployee] = useState<EmployeeSummary>();
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [utilityFilters, setUtilityFilters] = useState<EmployeeSearchUtilityFilters>({});
  const [callNumberFilter, setCallNumberFilter] = useState<EmployeeCallNumberFilter>("none");
  const [callListFilters, setCallListFilters] = useState<EmployeeSearchCallListFilters>({});
  const [callLists2Filters, setCallLists2Filters] = useState<EmployeeSearchCallLists2Filters>({});
  const [callLists2Sort, setCallLists2Sort] = useState<"name" | "number" | "">("");
  const [adminIncludedProfiles, setAdminIncludedProfiles] = useState<string[]>(EMPLOYEE_ADMIN_INCLUDE_PROFILES.map(label => label.replace(/^Include\s+/, "")));
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [data, setData] = useState<{ rows: EmployeeSummary[]; elapsed: number; queryMs: number }>();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<CustomerLoadProgress>({ stage: "fetching", bytes: 0 });
  const { currentSearch, currentTradeId, currentStatusId, currentGradeId, currentCity, currentState } = props;
  useEffect(() => {
    let active = true;
    setError("");
    const started = performance.now();
    const query = new URLSearchParams({ compressed: "1", search: currentSearch, tradeId: currentTradeId, statusId: currentStatusId, gradeId: currentGradeId, city: currentCity, state: currentState });
    recordsCache.get(cacheScope, query.toString(), () => fetch(`/api/employees?${query}`, { cache: "no-store" }).then(async response => {
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || `Employee records could not be loaded (HTTP ${response.status}). Refresh to retry.`);
      }
      const count = Number(response.headers.get("X-Record-Count"));
      const queryMs = Number(response.headers.get("X-Query-Ms"));
      if (active) setProgress({ stage: "downloading", bytes: 0, count });
      const reader = response.body?.getReader();
      const chunks: string[] = [];
      const decoder = new TextDecoder();
      let bytes = 0;
      let lastUpdate = 0;
      if (reader) {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          chunks.push(decoder.decode(chunk.value, { stream: true }));
          if (performance.now() - lastUpdate > 150 && active) {
            setProgress({ stage: "downloading", bytes, count });
            lastUpdate = performance.now();
          }
        }
        chunks.push(decoder.decode());
      } else chunks.push(await response.text());
      if (active) setProgress({ stage: "preparing", bytes, count });
      await new Promise(resolve => window.setTimeout(resolve, 30));
      const rows = JSON.parse(chunks.join("")) as EmployeeSummary[];
      return { rows, queryMs, elapsed: performance.now() - started };
    })).then(result => { if (active) setData(result); }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [cacheScope, currentSearch, currentTradeId, currentStatusId, currentGradeId, currentCity, currentState, refreshVersion]);
  const filtered = useMemo(() => {
    const rows = filterEmployeeSearch(data?.rows ?? [], deferredSearch);
    const tradeLabel = props.trades.find(trade => trade.value === selectedTrade)?.label;
    const matching = tradeLabel ? rows.filter(row => row.trade === tradeLabel) : rows;
    const knownProfiles = EMPLOYEE_ADMIN_INCLUDE_PROFILES.map(label => label.replace(/^Include\s+/, ""));
    const included = new Set(adminIncludedProfiles.map(value => value.toLowerCase().replace(/[^a-z0-9]/g, "")));
    const profileFiltered = adminIncludedProfiles.length === knownProfiles.length ? matching : matching.filter(row => {
      const profile = (row.profileType || row.accessFields.EmployeeProfileType || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const profileIndex = knownProfiles.findIndex(name => {
        const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return profile === normalized || profile.includes(normalized.replace("employeesearch3", "")) || normalized.includes(profile);
      });
      return profileIndex < 0 || included.has(knownProfiles[profileIndex].toLowerCase().replace(/[^a-z0-9]/g, ""));
    });
    const callFiltered = filterEmployeeSearchCallNumber(profileFiltered, callNumberFilter);
    return accessSort ? [...callFiltered].sort(compareEmployeesAccessOrder) : callFiltered;
  }, [data, deferredSearch, accessSort, selectedTrade, props.trades, adminIncludedProfiles, callNumberFilter]);
  const views1Filtered = useMemo(() => filterEmployeeSearchViews1Rows(filtered, views1Filters), [filtered, views1Filters]);
  const views3Filtered = useMemo(() => filterEmployeeSearchViews3Rows(views1Filtered, views3Filters), [views1Filtered, views3Filters]);
  const views4Filtered = useMemo(() => filterEmployeeSearchViews4Rows(views3Filtered, views4Filters), [views3Filtered, views4Filters]);
  const callListsFiltered = useMemo(() => filterEmployeeSearchCallLists2Rows(filterEmployeeSearchCallListRows(views4Filtered, callListFilters), callLists2Filters), [views4Filtered, callListFilters, callLists2Filters]);
  const utilityFiltered = useMemo(() => {
    const rows = filterEmployeeSearchUtilities(callListsFiltered, utilityFilters);
    if (callLists2Sort === "name") return [...rows].sort((a, b) => a.fullName.localeCompare(b.fullName));
    if (callLists2Sort === "number") return [...rows].sort((a, b) => Number(a.employeeId) - Number(b.employeeId));
    return rows;
  }, [callListsFiltered, utilityFilters, callLists2Sort]);
  const applySelectedUserFlag = async (slot: number, value: string, password: string) => {
    const targetIds = [...selectedEmployeeIds];
    if (!targetIds.length) throw new Error("Select at least one employee row first.");
    if (targetIds.length > 1000) throw new Error("Select no more than 1,000 employees at a time.");
    const response = await fetch("/api/employees/user-flags", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, value, password, employeeIds: targetIds }),
    });
    const result = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) throw new Error(result.error || "The employee user flag could not be updated.");
    recordsCache.clear();
    const selected = new Set(targetIds);
    const key = `EmployeeUserFlag${slot}`;
    setData(current => current ? {
      ...current,
      rows: current.rows.map(row => selected.has(row.employeeId)
        ? { ...row, userFlag5: slot === 5 ? value : row.userFlag5, accessFields: { ...row.accessFields, [key]: value } }
        : row),
    } : current);
  };
  return <EmployeeSearchScreen {...props} employees={views4Filtered} loadError={error}
    activeEmployee={activeEmployee} onActiveEmployeeChange={setActiveEmployee}
    currentTradeId={selectedTrade} onTradeChange={setSelectedTrade}
    views3Filters={views3Filters} onViews3FiltersChange={setViews3Filters}
    views1Filters={views1Filters} onViews1FiltersChange={setViews1Filters}
    views4Filters={views4Filters} onViews4FiltersChange={setViews4Filters}
    utilityFilters={utilityFilters} onUtilityFiltersChange={setUtilityFilters}
    adminIncludedProfiles={adminIncludedProfiles} onAdminIncludedProfilesChange={setAdminIncludedProfiles}
    onSelectedEmployeeIdsChange={setSelectedEmployeeIds}
    callNumberFilter={callNumberFilter} onCallNumberFilterChange={setCallNumberFilter}
    callListFilters={callListFilters} onCallListFiltersChange={setCallListFilters}
    callLists2Filters={callLists2Filters} onCallLists2FiltersChange={setCallLists2Filters} onCallLists2SortChange={setCallLists2Sort}
    utilityEmployees={utilityFiltered} employeeRows={data?.rows ?? []} selectedEmployeeIds={selectedEmployeeIds}
    onRefresh={() => { recordsCache.clear(); setRefreshVersion(value => value + 1); }}
    userSettingsSelectedCount={selectedEmployeeIds.length} onApplyUserFlag={applySelectedUserFlag}
    onEmployeeSearch={setSearch} searchResetVersion={resetVersion}
    onClearFilters={() => { setSearch({}); setViews1Filters({}); setViews3Filters({}); setViews4Filters({}); setUtilityFilters({}); setCallListFilters({}); setCallLists2Filters({}); setCallLists2Sort(""); setSelectedEmployeeIds([]); setResetVersion(value => value + 1); setTableResetVersion(value => value + 1); setSelectedTrade(""); setAccessSort(false); if ([currentSearch, currentTradeId, currentStatusId, currentGradeId, currentCity, currentState].some(Boolean)) router.replace("/employees"); }}
    onSort={() => { setAccessSort(true); setSortResetVersion(value => value + 1); }}
    results={data ? <EmployeeSearchTable employees={utilityFiltered} fetchedCount={data.rows.length} resetVersion={tableResetVersion} sortResetVersion={sortResetVersion} loadTiming={data} onActiveEmployeeChange={setActiveEmployee} selectedEmployeeIds={selectedEmployeeIds} onSelectedEmployeeIdsChange={setSelectedEmployeeIds} /> : <CustomerRecordsLoading recordType="employee" progress={progress} />} />;
}
