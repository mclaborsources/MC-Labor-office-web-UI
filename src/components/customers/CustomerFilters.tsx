"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import type { FilterOption } from "@/types/search";

interface CustomerFiltersProps {
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
  currentSearch: string;
  currentSalesmanId: string;
  currentCustomerTypeId: string;
  currentStatusId: string;
  currentCity: string;
  currentState: string;
}

export function CustomerFilters({
  salesmen,
  customerTypes,
  statuses,
  cities,
  states,
  currentSearch,
  currentSalesmanId,
  currentCustomerTypeId,
  currentStatusId,
  currentCity,
  currentState,
}: CustomerFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hasFilters =
    currentSearch ||
    currentSalesmanId ||
    currentCustomerTypeId ||
    currentStatusId ||
    currentCity ||
    currentState;

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
        for (const f of ["search", "salesmanId", "customerTypeId", "statusId", "city", "state"] as const) {
          const v = fd.get(f) as string;
          if (v) params.set(f, v);
        }
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
      }}
      className="ac-toolbar items-end gap-x-3 gap-y-1.5"
    >
      <div className="flex min-w-[220px] flex-1 flex-col">
        <label className="ac-flabel" htmlFor="cust-search">Search</label>
        <input
          id="cust-search"
          name="search"
          type="search"
          defaultValue={currentSearch}
          placeholder="Name, ID, phone, city, salesman…"
          className="ac-input"
        />
      </div>

      {salesmen.length > 0 && (
        <div className="flex min-w-[170px] flex-col">
          <label className="ac-flabel" htmlFor="cust-salesman">Salesman</label>
          <select id="cust-salesman" name="salesmanId" defaultValue={currentSalesmanId}
            onChange={(e) => updateParam("salesmanId", e.target.value)} className="ac-select">
            <option value="">All salesmen</option>
            {salesmen.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {customerTypes.length > 0 && (
        <div className="flex min-w-[150px] flex-col">
          <label className="ac-flabel" htmlFor="cust-type">Customer Type</label>
          <select id="cust-type" name="customerTypeId" defaultValue={currentCustomerTypeId}
            onChange={(e) => updateParam("customerTypeId", e.target.value)} className="ac-select">
            <option value="">All types</option>
            {customerTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      {statuses.length > 0 && (
        <div className="flex min-w-[140px] flex-col">
          <label className="ac-flabel" htmlFor="cust-status">Status</label>
          <select id="cust-status" name="statusId" defaultValue={currentStatusId}
            onChange={(e) => updateParam("statusId", e.target.value)} className="ac-select">
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {cities.length > 0 && (
        <div className="flex min-w-[140px] flex-col">
          <label className="ac-flabel" htmlFor="cust-city">City</label>
          <select id="cust-city" name="city" defaultValue={currentCity}
            onChange={(e) => updateParam("city", e.target.value)} className="ac-select">
            <option value="">All cities</option>
            {cities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      {states.length > 0 && (
        <div className="flex min-w-[90px] flex-col">
          <label className="ac-flabel" htmlFor="cust-state">State</label>
          <select id="cust-state" name="state" defaultValue={currentState}
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
