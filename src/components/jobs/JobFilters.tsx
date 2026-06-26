"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import type { FilterOption } from "@/types/search";

interface JobFiltersProps {
  customers: FilterOption[];
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
  currentSearch: string;
  currentCustomerId: string;
  currentSalesmanId: string;
  currentCustomerTypeId: string;
  currentStatusId: string;
  currentCity: string;
  currentStateId: string;
}

export function JobFilters({
  customers,
  salesmen,
  customerTypes,
  statuses,
  cities,
  states,
  currentSearch,
  currentCustomerId,
  currentSalesmanId,
  currentCustomerTypeId,
  currentStatusId,
  currentCity,
  currentStateId,
}: JobFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hasFilters =
    currentSearch || currentCustomerId || currentSalesmanId ||
    currentCustomerTypeId || currentStatusId || currentCity || currentStateId;

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
        const fields = ["search", "customerId", "salesmanId", "customerTypeId", "statusId", "city", "stateId"] as const;
        for (const f of fields) {
          const v = fd.get(f) as string;
          if (v) params.set(f, v);
        }
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
      }}
      className="ac-toolbar items-end gap-x-3 gap-y-1.5"
    >
      <div className="flex min-w-[180px] flex-1 flex-col">
        <label className="ac-flabel" htmlFor="job-search">Search</label>
        <input
          id="job-search"
          name="search"
          type="search"
          defaultValue={currentSearch}
          placeholder="Job name, customer, city, ID…"
          className="ac-input"
        />
      </div>

      {customers.length > 0 && (
        <div className="flex min-w-[160px] flex-col">
          <label className="ac-flabel" htmlFor="job-customer">Customer</label>
          <select id="job-customer" name="customerId" defaultValue={currentCustomerId}
            onChange={(e) => updateParam("customerId", e.target.value)} className="ac-select">
            <option value="">All customers</option>
            {customers.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      {salesmen.length > 0 && (
        <div className="flex min-w-[140px] flex-col">
          <label className="ac-flabel" htmlFor="job-salesman">Salesman</label>
          <select id="job-salesman" name="salesmanId" defaultValue={currentSalesmanId}
            onChange={(e) => updateParam("salesmanId", e.target.value)} className="ac-select">
            <option value="">All salesmen</option>
            {salesmen.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {customerTypes.length > 0 && (
        <div className="flex min-w-[140px] flex-col">
          <label className="ac-flabel" htmlFor="job-custtype">Customer Type</label>
          <select id="job-custtype" name="customerTypeId" defaultValue={currentCustomerTypeId}
            onChange={(e) => updateParam("customerTypeId", e.target.value)} className="ac-select">
            <option value="">All types</option>
            {customerTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      {statuses.length > 0 && (
        <div className="flex min-w-[120px] flex-col">
          <label className="ac-flabel" htmlFor="job-status">Status</label>
          <select id="job-status" name="statusId" defaultValue={currentStatusId}
            onChange={(e) => updateParam("statusId", e.target.value)} className="ac-select">
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {cities.length > 0 && (
        <div className="flex min-w-[140px] flex-col">
          <label className="ac-flabel" htmlFor="job-city">City</label>
          <select id="job-city" name="city" defaultValue={currentCity}
            onChange={(e) => updateParam("city", e.target.value)} className="ac-select">
            <option value="">All cities</option>
            {cities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      {states.length > 0 && (
        <div className="flex min-w-[90px] flex-col">
          <label className="ac-flabel" htmlFor="job-state">State</label>
          <select id="job-state" name="stateId" defaultValue={currentStateId}
            onChange={(e) => updateParam("stateId", e.target.value)} className="ac-select">
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
