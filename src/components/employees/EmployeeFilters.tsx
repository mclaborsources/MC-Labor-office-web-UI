"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, type ReactNode } from "react";
import { Search } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import type { FilterOption } from "@/types/search";

interface EmployeeFiltersProps {
  trades: FilterOption[];
  statuses: FilterOption[];
  grades: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
  currentSearch: string;
  currentTradeId: string;
  currentStatusId: string;
  currentGradeId: string;
  currentCity: string;
  currentState: string;
  /** Inline row for Access Employee Search views panel */
  compact?: boolean;
  /** Hide search field in compact mode (search is in sidebar) */
  hideSearch?: boolean;
}

export function EmployeeFilters({
  trades,
  statuses,
  grades,
  cities,
  states,
  currentSearch,
  currentTradeId,
  currentStatusId,
  currentGradeId,
  currentCity,
  currentState,
  compact = false,
  hideSearch = false,
}: EmployeeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hasFilters =
    currentSearch || currentTradeId || currentStatusId || currentGradeId || currentCity || currentState;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  function clearAll() {
    startTransition(() => router.push(pathname));
  }

  const fieldWrap = (id: string, label: string, children: ReactNode) =>
    compact ? (
      children
    ) : (
      <div className="flex min-w-[140px] flex-col">
        <label className="ac-flabel" htmlFor={id}>
          {label}
        </label>
        {children}
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params = compact
          ? new URLSearchParams(searchParams.toString())
          : new URLSearchParams();
        for (const f of ["search", "tradeId", "statusId", "gradeId", "city", "state"] as const) {
          const v = fd.get(f) as string;
          if (v) params.set(f, v);
          else params.delete(f);
        }
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
      }}
      className={
        compact
          ? "ac-customer-search-filter-row-form"
          : "ac-toolbar items-end gap-x-3 gap-y-1.5"
      }
    >
      {!hideSearch &&
        fieldWrap(
          "emp-search",
          "Search",
          <input
            id="emp-search"
            name="search"
            type="search"
            defaultValue={currentSearch}
            placeholder={compact ? "" : "Name, ID, phone, email, city…"}
            className={`ac-input ${compact ? "ac-customer-search-search-input" : ""}`}
            aria-label="Search"
          />,
        )}

      {trades.length > 0 &&
        fieldWrap(
          "emp-trade",
          "Trade",
          <select
            id="emp-trade"
            name="tradeId"
            defaultValue={currentTradeId}
            onChange={(e) => updateParam("tradeId", e.target.value)}
            className={`ac-select ${compact ? "ac-customer-search-inline-select" : ""}`}
            aria-label="Trade"
          >
            <option value="">All trades</option>
            {trades.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>,
        )}

      {statuses.length > 0 &&
        fieldWrap(
          "emp-status",
          "Status",
          <select
            id="emp-status"
            name="statusId"
            defaultValue={currentStatusId}
            onChange={(e) => updateParam("statusId", e.target.value)}
            className={`ac-select ${compact ? "ac-customer-search-inline-select" : ""}`}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>,
        )}

      {grades.length > 0 &&
        fieldWrap(
          "emp-grade",
          "Grade",
          <select
            id="emp-grade"
            name="gradeId"
            defaultValue={currentGradeId}
            onChange={(e) => updateParam("gradeId", e.target.value)}
            className={`ac-select ${compact ? "ac-customer-search-inline-select" : ""}`}
            aria-label="Grade"
          >
            <option value="">All grades</option>
            {grades.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>,
        )}

      {!compact && cities.length > 0 &&
        fieldWrap(
          "emp-city",
          "City",
          <select
            id="emp-city"
            name="city"
            defaultValue={currentCity}
            onChange={(e) => updateParam("city", e.target.value)}
            className="ac-select"
            aria-label="City"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>,
        )}

      {!compact && states.length > 0 &&
        fieldWrap(
          "emp-state",
          "State",
          <select
            id="emp-state"
            name="state"
            defaultValue={currentState}
            onChange={(e) => updateParam("state", e.target.value)}
            className="ac-select"
            aria-label="State"
          >
            <option value="">All</option>
            {states.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>,
        )}

      {compact ? (
        !hideSearch ? (
          <>
            <AccessButton
              type="submit"
              xs
              disabled={isPending}
              icon={Search}
              className="ac-customer-search-search-icon-btn"
              aria-label="Search"
            />
            {hasFilters && (
              <AccessButton type="button" xs onClick={clearAll}>
                Clear
              </AccessButton>
            )}
          </>
        ) : null
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <AccessButton type="submit" variant="primary" disabled={isPending}>
            Search
          </AccessButton>
          {hasFilters && (
            <AccessButton type="button" onClick={clearAll}>
              Clear
            </AccessButton>
          )}
        </div>
      )}
    </form>
  );
}
