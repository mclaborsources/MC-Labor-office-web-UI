"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, type ReactNode } from "react";
import { Search } from "lucide-react";
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
  /** Inline row for Access Customer Search views panel */
  compact?: boolean;
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
  compact = false,
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
        for (const f of ["search", "salesmanId", "customerTypeId", "statusId", "city", "state"] as const) {
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
      {fieldWrap(
        "cust-search",
        "Search",
        <input
          id="cust-search"
          name="search"
          type="search"
          defaultValue={currentSearch}
          placeholder={compact ? "" : "Name, ID, phone, city, salesman…"}
          className={`ac-input ${compact ? "ac-customer-search-search-input" : ""}`}
          aria-label="Search"
        />,
      )}

      {!compact && salesmen.length > 0 &&
        fieldWrap(
          "cust-salesman",
          "Salesman",
          <select
            id="cust-salesman"
            name="salesmanId"
            defaultValue={currentSalesmanId}
            onChange={(e) => updateParam("salesmanId", e.target.value)}
            className={`ac-select ${compact ? "ac-customer-search-inline-select" : ""}`}
            aria-label="Salesman"
          >
            <option value="">All salesmen</option>
            {salesmen.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>,
        )}

      {!compact && customerTypes.length > 0 &&
        fieldWrap(
          "cust-type",
          "Customer Type",
          <select
            id="cust-type"
            name="customerTypeId"
            defaultValue={currentCustomerTypeId}
            onChange={(e) => updateParam("customerTypeId", e.target.value)}
            className={`ac-select ${compact ? "ac-customer-search-inline-select" : ""}`}
            aria-label="Customer Type"
          >
            <option value="">All types</option>
            {customerTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>,
        )}

      {!compact && statuses.length > 0 &&
        fieldWrap(
          "cust-status",
          "Status",
          <select
            id="cust-status"
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

      {!compact && cities.length > 0 &&
        fieldWrap(
          "cust-city",
          "City",
          <select
            id="cust-city"
            name="city"
            defaultValue={currentCity}
            onChange={(e) => updateParam("city", e.target.value)}
            className={`ac-select ${compact ? "ac-customer-search-inline-select" : ""}`}
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
          "cust-state",
          "State",
          <select
            id="cust-state"
            name="state"
            defaultValue={currentState}
            onChange={(e) => updateParam("state", e.target.value)}
            className={`ac-select ${compact ? "ac-customer-search-inline-select" : ""}`}
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
