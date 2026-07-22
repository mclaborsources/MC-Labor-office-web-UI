"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { HelpCircle, Table2 } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import { CustomerSearchViewsPanel } from "@/components/customers/CustomerSearchViewsPanel";
import { CustomerSearchPagination } from "@/components/customers/CustomerSearchPagination";
import { CustomerPlaceholderControls } from "@/components/customers/CustomerPlaceholderControls";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import {
  CUSTOMER_SEARCH_COLUMNS,
  type CustomerSearchColumnKey,
} from "@/lib/customerSearchColumns";
import type { CustomerSearchRow } from "@/types/customer";
import type { FilterOption } from "@/types/search";

interface CustomerSearchScreenProps {
  customers: CustomerSearchRow[];
  loadError?: string;
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
  currentSortKey: string;
  currentSortDirection: "asc" | "desc";
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

function cellValue(row: CustomerSearchRow, key: CustomerSearchColumnKey): string {
  if (key === "select") return "";
  if (key === "name") return row.customerName;
  const value = row[key as keyof CustomerSearchRow];
  return value === null || value === undefined ? "" : String(value);
}

function customerSearchCellClass(key: CustomerSearchColumnKey): string | undefined {
  if (key === "noCommunication") return "ac-customer-search-cell--alert";
  if (key === "act") return "ac-customer-search-cell--activity";
  if (["internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady"].includes(key)) {
    return "ac-customer-search-cell--internet";
  }
  if (["lastActionUser", "lastActionDate", "lastAction"].includes(key)) {
    return "ac-customer-search-cell--last-action";
  }
  if (["futureCallUser", "futureCallUserDate", "futureCallUserTime", "futureCall", "futureCallHistory", "salesHStatus"].includes(key)) {
    return "ac-customer-search-cell--future";
  }
  if (key === "contacts") return "ac-customer-search-cell--contacts";
  return undefined;
}

function CustomerSearchTable({
  customers,
  page,
  pageSize,
  total,
  hasMore,
  query,
  initialSortKey,
  initialSortDirection,
  columnFilters,
  onColumnFiltersChange,
  onHoverColumn,
}: {
  customers: CustomerSearchRow[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  query: Record<string, string>;
  initialSortKey: string;
  initialSortDirection: "asc" | "desc";
  columnFilters: Partial<Record<CustomerSearchColumnKey, string[]>>;
  onColumnFiltersChange: (filters: Partial<Record<CustomerSearchColumnKey, string[]>>) => void;
  onHoverColumn: (label: string) => void;
}) {
  const [sortKey, setSortKey] = useState<CustomerSearchColumnKey | "">(
    CUSTOMER_SEARCH_COLUMNS.some((column) => column.key === initialSortKey) ? initialSortKey as CustomerSearchColumnKey : "",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialSortDirection);

  const columnOptions = useMemo(() => Object.fromEntries(
    CUSTOMER_SEARCH_COLUMNS.filter((column) => column.key !== "select").map((column) => [
      column.key,
      [...new Set(customers.map((row) => cellValue(row, column.key)))].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
      ),
    ]),
  ) as Partial<Record<CustomerSearchColumnKey, string[]>>, [customers]);

  const displayedCustomers = useMemo(() => {
    const filtered = customers.filter((row) => Object.entries(columnFilters).every(([key, selected]) =>
      selected?.includes(cellValue(row, key as CustomerSearchColumnKey)),
    ));
    if (!sortKey || sortKey === "select") return filtered;
    return [...filtered].sort((a, b) => {
      const comparison = cellValue(a, sortKey).localeCompare(cellValue(b, sortKey), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [columnFilters, customers, sortDirection, sortKey]);

  function applySort(key: CustomerSearchColumnKey, direction: "asc" | "desc") {
    setSortKey(key);
    setSortDirection(direction);
  }

  function toggleColumnValue(key: CustomerSearchColumnKey, value: string, checked: boolean) {
    const options = columnOptions[key] ?? [];
    const selected = columnFilters[key] ?? options;
    const nextSelected = checked ? [...new Set([...selected, value])] : selected.filter((item) => item !== value);
    const next = { ...columnFilters };
    if (nextSelected.length === options.length) delete next[key];
    else next[key] = nextSelected;
    onColumnFiltersChange(next);
  }

  return (
    <div className="ac-customer-search-grid-wrap">
      <div className="ac-grid ac-grid-tracking ac-customer-search-grid mc-scroll-smooth">
        <table>
          <thead>
            <tr>
              {CUSTOMER_SEARCH_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onMouseEnter={() => onHoverColumn((col.label as string) || (col.key === "select" ? "Select" : col.key))}
                  className={[
                    col.key === "select" ? "ac-customer-search-col-select" : "",
                    customerSearchCellClass(col.key) ?? "",
                  ].filter(Boolean).join(" ") || undefined}
                >
                  <details className="ac-customer-column-menu">
                    <summary title={`Sort ${col.label || "this column"}`}>
                      <span>{col.label}</span>
                      <span className="ac-customer-column-menu-arrow" aria-hidden>▼</span>
                    </summary>
                    <div className="ac-customer-column-menu-popover">
                      <label>
                        <input
                          type="radio"
                          name={`sort-${col.key}`}
                          checked={sortKey === col.key && sortDirection === "asc"}
                          onChange={(event) => {
                            applySort(col.key, "asc");
                            const menu = event.currentTarget.closest("details");
                            if (menu) menu.open = false;
                          }}
                        />
                        Sort A - Z
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`sort-${col.key}`}
                          checked={sortKey === col.key && sortDirection === "desc"}
                          onChange={(event) => {
                            applySort(col.key, "desc");
                            const menu = event.currentTarget.closest("details");
                            if (menu) menu.open = false;
                          }}
                        />
                        Sort Z - A
                      </label>
                      {col.key !== "select" ? (
                        <>
                          <div className="ac-customer-column-filter-divider" />
                          <div className="ac-customer-column-filter-actions">
                            <button type="button" onClick={() => {
                              const next = { ...columnFilters };
                              delete next[col.key];
                              onColumnFiltersChange(next);
                            }}>Select All</button>
                            <button type="button" onClick={() => onColumnFiltersChange({ ...columnFilters, [col.key]: [] })}>Clear</button>
                          </div>
                          <div className="ac-customer-column-filter-values">
                            {(columnOptions[col.key] ?? []).map((value) => (
                              <label key={value || "__blank__"}>
                                <input
                                  type="checkbox"
                                  checked={(columnFilters[col.key] ?? columnOptions[col.key] ?? []).includes(value)}
                                  onChange={(event) => toggleColumnValue(col.key, value, event.target.checked)}
                                />
                                <span>{value || "(Blanks)"}</span>
                              </label>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </details>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={CUSTOMER_SEARCH_COLUMNS.length}
                  className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]"
                >
                  No customers match the selected column filters.
                </td>
              </tr>
            ) : (
              displayedCustomers.map((row) => (
                <tr key={row.customerId}>
                  {CUSTOMER_SEARCH_COLUMNS.map((col) => {
                    if (col.key === "select") {
                      return (
                        <td
                          key={col.key}
                          className="ac-customer-search-col-select text-center"
                          onMouseEnter={() => onHoverColumn("Select")}
                        >
                          —
                        </td>
                      );
                    }
                    if (col.key === "name") {
                      return (
                        <td key={col.key} onMouseEnter={() => onHoverColumn(col.label)}>
                          <Link href={`/customers/${row.customerId}`} className="font-semibold">
                            {row.customerName || "—"}
                          </Link>
                        </td>
                      );
                    }
                    if (col.key === "contacts") {
                      return (
                        <td
                          key={col.key}
                          className={customerSearchCellClass(col.key)}
                          onMouseEnter={() => onHoverColumn(col.label)}
                        >
                          <Link href={`/customers/${row.customerId}`} className="ac-customer-search-contacts-link">
                            {cellValue(row, col.key) || "Contacts"}
                          </Link>
                        </td>
                      );
                    }
                    const value = cellValue(row, col.key);
                    return (
                      <td
                        key={col.key}
                        className={customerSearchCellClass(col.key)}
                        onMouseEnter={() => onHoverColumn((col.label as string) || col.key)}
                      >
                        {value || (col.key === "noCommunication" ? "" : "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="ac-recordbar ac-customer-search-recordbar">
        <CustomerSearchPagination
          page={page}
          pageSize={pageSize}
          total={Object.keys(columnFilters).length ? displayedCustomers.length : total}
          rowCount={displayedCustomers.length}
          hasMore={hasMore}
          query={query}
        />
      </div>
    </div>
  );
}

const CUSTOMER_SEARCH_SIDE_ROWS = [
  { label: "Name", customer: true, contact: true },
  { label: "Ph/Cell #", customer: true, contact: true },
  { label: "Email", customer: false, contact: true },
  { label: "Text", customer: false, contact: true },
] as const;

function CustomerSearchSidebar() {
  const [activeScreenSize, setActiveScreenSize] = useState<string>("normal");

  return (
    <aside className="ac-customer-search-sidebar shrink-0">
      <div className="ac-customer-search-screen-size">
        <span className="ac-customer-search-screen-size-label">Screen Size</span>
        <AccessButton
          aria-pressed={activeScreenSize === "normal"}
          onClick={() => setActiveScreenSize("normal")}
          className={`ac-customer-search-screen-normal ${
            activeScreenSize === "normal" ? "ac-customer-search-preset-btn--active" : ""
          }`}
        >
          Normal
        </AccessButton>
        <div className="ac-customer-search-screen-grid">
          {[1, 2, 3, 4].map((n) => (
            <AccessButton
              key={n}
              xs
              aria-pressed={activeScreenSize === String(n)}
              onClick={() => setActiveScreenSize(String(n))}
              className={`ac-customer-search-screen-num ${
                activeScreenSize === String(n) ? "ac-customer-search-preset-btn--active" : ""
              }`}
            >
              {n}
            </AccessButton>
          ))}
          {[1, 2, 3, 4].map((n) => (
            <AccessButton key={`save-${n}`} xs disabled className="ac-customer-search-screen-save">
              Save
            </AccessButton>
          ))}
        </div>
      </div>

      <div className="ac-customer-search-side-search-wrap">
        <div className="ac-customer-search-side-label" aria-hidden>
          Search
        </div>
        <div className="ac-customer-search-side-main">
          <div className="ac-customer-search-side-grid-area">
            <div className="ac-customer-search-side-grid">
              <div className="ac-customer-search-side-corner" />
              <div className="ac-customer-search-side-head">Customer</div>
              <div className="ac-customer-search-side-head">Contact</div>

              {CUSTOMER_SEARCH_SIDE_ROWS.map((row) => (
                <div key={row.label} className="ac-customer-search-side-row">
                  <div className="ac-customer-search-side-field-label">{row.label}</div>
                  {row.customer ? (
                    <input
                      className="ac-input ac-customer-search-side-input"
                      defaultValue=""
                      aria-label={`Customer ${row.label}`}
                    />
                  ) : (
                    <div className="ac-customer-search-side-spacer" aria-hidden />
                  )}
                  {row.contact ? (
                    <input
                      className="ac-input ac-customer-search-side-input"
                      defaultValue=""
                      aria-label={`Contact ${row.label}`}
                    />
                  ) : (
                    <div className="ac-customer-search-side-spacer" aria-hidden />
                  )}
                </div>
              ))}
            </div>

            <div className="ac-customer-search-side-search-col">
              <AccessButton xs disabled className="ac-customer-search-side-search-btn">
                Search
              </AccessButton>
              <div className="ac-customer-search-use-button">
                <span className="ac-customer-search-use-button-label">Use Button</span>
                <label className="ac-customer-search-use-radio">
                  <input type="radio" name="cust-use-button" defaultChecked disabled />
                  <span>Yes</span>
                </label>
                <label className="ac-customer-search-use-radio">
                  <input type="radio" name="cust-use-button" disabled />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          <AccessButton xs disabled className="ac-customer-search-deselect-btn">
            Deselect Duplicate Email
          </AccessButton>
        </div>
      </div>
    </aside>
  );
}

function CustomerSearchActionBar({ hoveredColumn, onClearFilters }: { hoveredColumn: string; onClearFilters: () => void }) {
  return (
    <div className="ac-customer-search-action-bar shrink-0">
      <div className="ac-customer-search-action-group">
        <span className="ac-customer-search-action-label">Select:</span>
        <AccessButton xs disabled>
          Clear
        </AccessButton>
        <AccessButton xs disabled>
          All
        </AccessButton>
        <AccessButton xs disabled>
          Email
        </AccessButton>
        <AccessButton xs disabled>
          Text
        </AccessButton>
      </div>
      <span className="ac-customer-search-mouse-over">
        Your mouse is over: <span className="ac-customer-search-mouse-box">{hoveredColumn}</span>
      </span>
      <div className="ac-customer-search-action-group">
        <span className="ac-customer-search-action-hint">Click in column first</span>
        <AccessButton xs disabled>
          Update Column
        </AccessButton>
      </div>
      <div className="ac-customer-search-action-group">
        <span className="ac-customer-search-action-hint">All columns - takes time</span>
        <AccessButton xs disabled>
          Update All
        </AccessButton>
      </div>
      <AccessButton xs disabled className="ac-customer-search-btn-transfer">
        Transfer to Deleted
      </AccessButton>
      <AccessButton xs onClick={onClearFilters}>Clear Filters</AccessButton>
    </div>
  );
}

function CustomerSearchUtilityRail() {
  return (
    <div className="ac-customer-search-utility-rail shrink-0">
      <button type="button" className="ac-customer-search-rail-icon ac-customer-search-rail-icon--grid" disabled aria-label="Grid view">
        <Icon icon={Table2} size="xs" />
      </button>
      <button type="button" className="ac-customer-search-rail-icon ac-customer-search-rail-icon--help" disabled aria-label="Help">
        <Icon icon={HelpCircle} size="xs" />
      </button>
      <div className="ac-customer-search-size-mb">
        <span>Size MB</span>
        <strong>345</strong>
      </div>
    </div>
  );
}

export function CustomerSearchScreen({
  customers,
  loadError,
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
  currentSortKey,
  currentSortDirection,
  page,
  pageSize,
  total,
  hasMore,
}: CustomerSearchScreenProps) {
  const [hoveredColumn, setHoveredColumn] = useState("");
  const [columnFilters, setColumnFilters] = useState<Partial<Record<CustomerSearchColumnKey, string[]>>>({});
  const paginationQuery = Object.fromEntries(
    Object.entries({
      search: currentSearch,
      salesmanId: currentSalesmanId,
      customerTypeId: currentCustomerTypeId,
      statusId: currentStatusId,
      city: currentCity,
      state: currentState,
      sortKey: currentSortKey,
      sortDirection: currentSortKey ? currentSortDirection : "",
    }).filter(([, value]) => Boolean(value)),
  );
  return (
    <div className="ac-customer-search-page flex min-h-0 flex-1 flex-col">
      <CustomerPlaceholderControls />
      <div className="ac-customer-search ac-tracking--modern flex min-h-0 flex-1 flex-col">
        <div className="ac-customer-search-titlebar shrink-0">
          <span className="ac-customer-search-title">Customer Search</span>
          <AccessButton xs disabled>
            New
          </AccessButton>
        </div>

        <div className="ac-customer-search-body min-h-0 flex-1 flex-col">
          <div className="ac-panel ac-panel-elevated ac-customer-search-shell min-h-0 flex-1">
            <div className="ac-customer-search-shell-inner">
              <CustomerSearchSidebar />

              <CustomerSearchViewsPanel
                salesmen={salesmen}
                customerTypes={customerTypes}
                statuses={statuses}
                cities={cities}
                states={states}
                currentSearch={currentSearch}
                currentSalesmanId={currentSalesmanId}
                currentCustomerTypeId={currentCustomerTypeId}
                currentStatusId={currentStatusId}
                currentCity={currentCity}
                currentState={currentState}
              />

              <CustomerSearchUtilityRail />
            </div>
            <CustomerSearchActionBar hoveredColumn={hoveredColumn} onClearFilters={() => setColumnFilters({})} />
          </div>

          <div className="ac-panel ac-panel-elevated ac-customer-search-results-panel min-h-0 flex-1">
            <div className="ac-customer-search-results min-h-0 flex-1">
            {loadError ? (
              <ErrorAlert title="Could not load customers" message={loadError} />
            ) : (
              <Suspense
                fallback={
                  <div className="ac-panel p-3">
                    <Spinner label="Loading customers…" />
                  </div>
                }
              >
                <CustomerSearchTable
                  customers={customers}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  hasMore={hasMore}
                  query={paginationQuery}
                  initialSortKey={currentSortKey}
                  initialSortDirection={currentSortDirection}
                  columnFilters={columnFilters}
                  onColumnFiltersChange={setColumnFilters}
                  onHoverColumn={setHoveredColumn}
                />
              </Suspense>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
