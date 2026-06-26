"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { FilterOption } from "@/types/search";

interface JobFiltersProps {
  customers: FilterOption[];
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  statuses: FilterOption[];
  currentSearch: string;
  currentCustomerId: string;
  currentSalesmanId: string;
  currentCustomerTypeId: string;
  currentStatusId: string;
}

export function JobFilters({
  customers,
  salesmen,
  customerTypes,
  statuses,
  currentSearch,
  currentCustomerId,
  currentSalesmanId,
  currentCustomerTypeId,
  currentStatusId,
}: JobFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hasFilters =
    currentSearch || currentCustomerId || currentSalesmanId ||
    currentCustomerTypeId || currentStatusId;

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
        const fields = ["search", "customerId", "salesmanId", "customerTypeId", "statusId"] as const;
        for (const f of fields) {
          const v = fd.get(f) as string;
          if (v) params.set(f, v);
        }
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
      }}
      className="mc-panel p-4 flex flex-wrap items-end gap-3"
    >
      {/* Search */}
      <div className="flex flex-col min-w-[180px] flex-1">
        <label className="mc-label" htmlFor="job-search">Search</label>
        <div className="relative">
          <Icon icon={Search} size="sm" className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="job-search"
            name="search"
            type="search"
            defaultValue={currentSearch}
            placeholder="Job name, customer, city, ID…"
            className="mc-input mc-input-icon-left w-full"
          />
        </div>
      </div>

      {/* Customer */}
      {customers.length > 0 && (
        <div className="flex flex-col min-w-[150px] flex-1">
          <label className="mc-label" htmlFor="job-customer">Customer</label>
          <select
            id="job-customer"
            name="customerId"
            defaultValue={currentCustomerId}
            onChange={(e) => updateParam("customerId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Salesman */}
      {salesmen.length > 0 && (
        <div className="flex flex-col min-w-[140px] flex-1">
          <label className="mc-label" htmlFor="job-salesman">Salesman</label>
          <select
            id="job-salesman"
            name="salesmanId"
            defaultValue={currentSalesmanId}
            onChange={(e) => updateParam("salesmanId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All salesmen</option>
            {salesmen.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Customer Type */}
      {customerTypes.length > 0 && (
        <div className="flex flex-col min-w-[140px] flex-1">
          <label className="mc-label" htmlFor="job-custtype">Customer Type</label>
          <select
            id="job-custtype"
            name="customerTypeId"
            defaultValue={currentCustomerTypeId}
            onChange={(e) => updateParam("customerTypeId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All types</option>
            {customerTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Status */}
      {statuses.length > 0 && (
        <div className="flex flex-col min-w-[130px] flex-1">
          <label className="mc-label" htmlFor="job-status">Status</label>
          <select
            id="job-status"
            name="statusId"
            defaultValue={currentStatusId}
            onChange={(e) => updateParam("statusId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 shrink-0">
        <Button type="submit" variant="primary" disabled={isPending} className="whitespace-nowrap">
          <Icon icon={Search} size="sm" />
          Search
        </Button>
        {hasFilters && (
          <Button type="button" variant="toolbar" onClick={clearAll} className="whitespace-nowrap">
            <Icon icon={X} size="sm" />
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
