"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { compareEmployeesAccessOrder, filterEmployeeSearch } from "@/lib/employeeSearchInteractions";
import { EmployeeSearchScreen, type EmployeeSearchScreenProps } from "./EmployeeSearchScreen";
import { EmployeeSearchTable } from "./EmployeeSearchTable";
import { CustomerRecordsLoading, type CustomerLoadProgress } from "../customers/CustomerRecordsLoading";
import type { EmployeeSummary } from "@/types/employee";

export function EmployeeSearchLoader(props: Omit<EmployeeSearchScreenProps, "employees">) {
  const router = useRouter();
  const [search, setSearch] = useState<Record<string, string>>({});
  const deferredSearch = useDeferredValue(search);
  const [resetVersion, setResetVersion] = useState(0);
  const [tableResetVersion, setTableResetVersion] = useState(0);
  const [sortResetVersion, setSortResetVersion] = useState(0);
  const [selectedTrade, setSelectedTrade] = useState(props.currentTradeId);
  const [accessSort, setAccessSort] = useState(false);
  const [data, setData] = useState<{ rows: EmployeeSummary[]; elapsed: number; queryMs: number }>();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<CustomerLoadProgress>({ stage: "fetching", bytes: 0 });
  const { currentSearch, currentTradeId, currentStatusId, currentGradeId, currentCity, currentState } = props;
  useEffect(() => {
    const controller = new AbortController();
    const started = performance.now();
    const query = new URLSearchParams({ compressed: "1", search: currentSearch, tradeId: currentTradeId, statusId: currentStatusId, gradeId: currentGradeId, city: currentCity, state: currentState });
    fetch(`/api/employees?${query}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Employee records could not be loaded. Refresh to retry.");
      const count = Number(response.headers.get("X-Record-Count"));
      const queryMs = Number(response.headers.get("X-Query-Ms"));
      setProgress({ stage: "downloading", bytes: 0, count });
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
          if (performance.now() - lastUpdate > 150 && !controller.signal.aborted) {
            setProgress({ stage: "downloading", bytes, count });
            lastUpdate = performance.now();
          }
        }
        chunks.push(decoder.decode());
      } else chunks.push(await response.text());
      if (controller.signal.aborted) return;
      setProgress({ stage: "preparing", bytes, count });
      await new Promise(resolve => window.setTimeout(resolve, 30));
      if (controller.signal.aborted) return;
      const rows = JSON.parse(chunks.join("")) as EmployeeSummary[];
      setData({ rows, queryMs, elapsed: performance.now() - started });
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [currentSearch, currentTradeId, currentStatusId, currentGradeId, currentCity, currentState]);
  const filtered = useMemo(() => {
    const rows = filterEmployeeSearch(data?.rows ?? [], deferredSearch);
    const tradeLabel = props.trades.find(trade => trade.value === selectedTrade)?.label;
    const matching = tradeLabel ? rows.filter(row => row.trade === tradeLabel) : rows;
    return accessSort ? [...matching].sort(compareEmployeesAccessOrder) : matching;
  }, [data, deferredSearch, accessSort, selectedTrade, props.trades]);
  return <EmployeeSearchScreen {...props} employees={filtered} loadError={error}
    currentTradeId={selectedTrade} onTradeChange={setSelectedTrade}
    onEmployeeSearch={setSearch} searchResetVersion={resetVersion}
    onClearFilters={() => { setSearch({}); setResetVersion(value => value + 1); setTableResetVersion(value => value + 1); setSelectedTrade(""); setAccessSort(false); if ([currentSearch, currentTradeId, currentStatusId, currentGradeId, currentCity, currentState].some(Boolean)) router.replace("/employees"); }}
    onSort={() => { setAccessSort(true); setSortResetVersion(value => value + 1); }}
    results={data ? <EmployeeSearchTable employees={filtered} fetchedCount={data.rows.length} resetVersion={tableResetVersion} sortResetVersion={sortResetVersion} loadTiming={data} /> : <CustomerRecordsLoading recordType="employee" progress={progress} />} />;
}
