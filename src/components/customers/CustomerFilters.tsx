"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { FilterOption } from "@/types/search";

interface CustomerFiltersProps {
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
  currentSearch: string;
  currentSalesmanId: string;
  currentCustomerTypeId: string;
}

export function CustomerFilters({
  salesmen,
  customerTypes,
  currentSearch,
  currentSalesmanId,
  currentCustomerTypeId,
}: CustomerFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hasFilters = currentSearch || currentSalesmanId || currentCustomerTypeId;

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
        const salesmanId = fd.get("salesmanId") as string;
        const customerTypeId = fd.get("customerTypeId") as string;
        if (search) params.set("search", search);
        if (salesmanId) params.set("salesmanId", salesmanId);
        if (customerTypeId) params.set("customerTypeId", customerTypeId);
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }}
      className="mc-panel p-4 flex flex-wrap items-end gap-3"
    >
      {/* Search box */}
      <div className="flex flex-col min-w-[220px] flex-1">
        <label className="mc-label" htmlFor="cust-search">
          Search
        </label>
        <div className="relative">
          <Icon
            icon={Search}
            size="sm"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            id="cust-search"
            name="search"
            type="search"
            defaultValue={currentSearch}
            placeholder="Name, ID, phone, city, salesman…"
            className="mc-input mc-input-icon-left w-full"
          />
        </div>
      </div>

      {/* Salesman filter */}
      {salesmen.length > 0 && (
        <div className="flex flex-col min-w-[180px]">
          <label className="mc-label" htmlFor="cust-salesman">
            Salesman
          </label>
          <select
            id="cust-salesman"
            name="salesmanId"
            defaultValue={currentSalesmanId}
            onChange={(e) => updateParam("salesmanId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All salesmen</option>
            {salesmen.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Customer Type filter */}
      {customerTypes.length > 0 && (
        <div className="flex flex-col min-w-[160px]">
          <label className="mc-label" htmlFor="cust-type">
            Customer Type
          </label>
          <select
            id="cust-type"
            name="customerTypeId"
            defaultValue={currentCustomerTypeId}
            onChange={(e) => updateParam("customerTypeId", e.target.value)}
            className="mc-input mc-input-icon-right appearance-none"
          >
            <option value="">All types</option>
            {customerTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
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
