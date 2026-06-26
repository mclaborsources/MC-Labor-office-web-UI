"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        for (const f of ["search", "tradeId", "statusId", "gradeId", "city", "state"] as const) {
          const v = fd.get(f) as string;
          if (v) params.set(f, v);
        }
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
      }}
      className="ac-toolbar items-end gap-x-3 gap-y-1.5"
    >
      <div className="flex min-w-[200px] flex-1 flex-col">
        <label className="ac-flabel" htmlFor="emp-search">Search</label>
        <input
          id="emp-search"
          name="search"
          type="search"
          defaultValue={currentSearch}
          placeholder="Name, ID, phone, email, city…"
          className="ac-input"
        />
      </div>

      {trades.length > 0 && (
        <div className="flex min-w-[150px] flex-col">
          <label className="ac-flabel" htmlFor="emp-trade">Trade</label>
          <select id="emp-trade" name="tradeId" defaultValue={currentTradeId}
            onChange={(e) => updateParam("tradeId", e.target.value)} className="ac-select">
            <option value="">All trades</option>
            {trades.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      {statuses.length > 0 && (
        <div className="flex min-w-[130px] flex-col">
          <label className="ac-flabel" htmlFor="emp-status">Status</label>
          <select id="emp-status" name="statusId" defaultValue={currentStatusId}
            onChange={(e) => updateParam("statusId", e.target.value)} className="ac-select">
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {grades.length > 0 && (
        <div className="flex min-w-[120px] flex-col">
          <label className="ac-flabel" htmlFor="emp-grade">Grade</label>
          <select id="emp-grade" name="gradeId" defaultValue={currentGradeId}
            onChange={(e) => updateParam("gradeId", e.target.value)} className="ac-select">
            <option value="">All grades</option>
            {grades.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
      )}

      {cities.length > 0 && (
        <div className="flex min-w-[140px] flex-col">
          <label className="ac-flabel" htmlFor="emp-city">City</label>
          <select id="emp-city" name="city" defaultValue={currentCity}
            onChange={(e) => updateParam("city", e.target.value)} className="ac-select">
            <option value="">All cities</option>
            {cities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      {states.length > 0 && (
        <div className="flex min-w-[90px] flex-col">
          <label className="ac-flabel" htmlFor="emp-state">State</label>
          <select id="emp-state" name="state" defaultValue={currentState}
            onChange={(e) => updateParam("state", e.target.value)} className="ac-select">
            <option value="">All</option>
            {states.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <AccessButton type="submit" variant="primary" disabled={isPending}>Search</AccessButton>
        {hasFilters && <AccessButton type="button" onClick={clearAll}>Clear</AccessButton>}
      </div>
    </form>
  );
}
