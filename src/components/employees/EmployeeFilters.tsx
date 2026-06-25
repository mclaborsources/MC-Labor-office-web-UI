"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { FilterOption } from "@/types/search";

interface EmployeeFiltersProps {
  trades: FilterOption[];
  statuses: FilterOption[];
  grades: FilterOption[];
  currentSearch: string;
  currentTradeId: string;
  currentStatusId: string;
  currentGradeId: string;
}

export function EmployeeFilters({
  trades,
  statuses,
  grades,
  currentSearch,
  currentTradeId,
  currentStatusId,
  currentGradeId,
}: EmployeeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hasFilters =
    currentSearch || currentTradeId || currentStatusId || currentGradeId;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  function clearAll() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        const search = fd.get("search") as string;
        const tradeId = fd.get("tradeId") as string;
        const statusId = fd.get("statusId") as string;
        const gradeId = fd.get("gradeId") as string;
        if (search) params.set("search", search);
        if (tradeId) params.set("tradeId", tradeId);
        if (statusId) params.set("statusId", statusId);
        if (gradeId) params.set("gradeId", gradeId);
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }}
      className="mc-panel p-4 flex flex-wrap items-end gap-3"
    >
      {/* Search box */}
      <div className="flex flex-col min-w-[200px] flex-1">
        <label className="mc-label" htmlFor="emp-search">
          Search
        </label>
        <div className="relative">
          <Icon
            icon={Search}
            size="sm"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            id="emp-search"
            name="search"
            type="search"
            defaultValue={currentSearch}
            placeholder="Name, ID, phone, email…"
            className="mc-input mc-input-icon-left w-full"
          />
        </div>
      </div>

      {/* Trade filter */}
      {trades.length > 0 && (
        <div className="flex flex-col min-w-[160px]">
          <label className="mc-label" htmlFor="emp-trade">
            Trade
          </label>
          <select
            id="emp-trade"
            name="tradeId"
            defaultValue={currentTradeId}
            onChange={(e) => updateParam("tradeId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All trades</option>
            {trades.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status filter */}
      {statuses.length > 0 && (
        <div className="flex flex-col min-w-[140px]">
          <label className="mc-label" htmlFor="emp-status">
            Status
          </label>
          <select
            id="emp-status"
            name="statusId"
            defaultValue={currentStatusId}
            onChange={(e) => updateParam("statusId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Grade filter */}
      {grades.length > 0 && (
        <div className="flex flex-col min-w-[140px]">
          <label className="mc-label" htmlFor="emp-grade">
            Grade
          </label>
          <select
            id="emp-grade"
            name="gradeId"
            defaultValue={currentGradeId}
            onChange={(e) => updateParam("gradeId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All grades</option>
            {grades.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className="whitespace-nowrap"
        >
          <Icon icon={Search} size="sm" />
          Search
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="toolbar"
            onClick={clearAll}
            className="whitespace-nowrap"
          >
            <Icon icon={X} size="sm" />
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
