import Link from "next/link";
import { Suspense } from "react";
import { HelpCircle, Table2 } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import { CustomerSearchViewsPanel } from "@/components/customers/CustomerSearchViewsPanel";
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
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

function cellValue(row: CustomerSearchRow, key: CustomerSearchColumnKey): string {
  if (key === "select") return "";
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
}: {
  customers: CustomerSearchRow[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  query: Record<string, string>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min((page - 1) * pageSize + customers.length, total);
  const hrefForPage = (targetPage: number) => {
    const params = new URLSearchParams(query);
    if (targetPage <= 1) params.delete("page");
    else params.set("page", String(targetPage));
    const search = params.toString();
    return search ? `/customers?${search}` : "/customers";
  };

  const nav = (label: string, targetPage: number, disabled: boolean, title: string) =>
    disabled ? (
      <span className="ac-customer-search-page-nav is-disabled" aria-disabled="true" title={title}>{label}</span>
    ) : (
      <Link className="ac-customer-search-page-nav" href={hrefForPage(targetPage)} title={title}>{label}</Link>
    );

  return (
    <div className="ac-customer-search-grid-wrap">
      <div className="ac-grid ac-grid-tracking ac-customer-search-grid mc-scroll-smooth">
        <table>
          <thead>
            <tr>
              {CUSTOMER_SEARCH_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={[
                    col.key === "select" ? "ac-customer-search-col-select" : "",
                    customerSearchCellClass(col.key) ?? "",
                  ].filter(Boolean).join(" ") || undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={CUSTOMER_SEARCH_COLUMNS.length}
                  className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]"
                >
                  No customers found. Try adjusting your search or clearing the filters.
                </td>
              </tr>
            ) : (
              customers.map((row) => (
                <tr key={row.customerId}>
                  {CUSTOMER_SEARCH_COLUMNS.map((col) => {
                    if (col.key === "select") {
                      return (
                        <td key={col.key} className="ac-customer-search-col-select text-center">
                          —
                        </td>
                      );
                    }
                    if (col.key === "name") {
                      return (
                        <td key={col.key}>
                          <Link href={`/customers/${row.customerId}`} className="font-semibold">
                            {row.customerName || "—"}
                          </Link>
                        </td>
                      );
                    }
                    if (col.key === "contacts") {
                      return (
                        <td key={col.key} className={customerSearchCellClass(col.key)}>
                          <Link href={`/customers/${row.customerId}`} className="ac-customer-search-contacts-link">
                            {cellValue(row, col.key) || "Contacts"}
                          </Link>
                        </td>
                      );
                    }
                    const value = cellValue(row, col.key);
                    return (
                      <td key={col.key} className={customerSearchCellClass(col.key)}>
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
        <span>Record:</span>
        <span className="ac-customer-search-page-navs">
          {nav("|◀", 1, page <= 1, "First page")}
          {nav("◀", page - 1, page <= 1, "Previous page")}
          <span className="font-mono">{firstRecord}-{lastRecord} of {total}</span>
          {nav("▶", page + 1, !hasMore, "Next page")}
          {nav("▶|", totalPages, page >= totalPages || total === 0, "Last page")}
        </span>
        <span className="text-[#7a7a7a]">Page {page} of {totalPages}</span>
        <span className="ml-auto text-[#7a7a7a]">{pageSize} per page</span>
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
  return (
    <aside className="ac-customer-search-sidebar shrink-0">
      <div className="ac-customer-search-screen-size">
        <span className="ac-customer-search-screen-size-label">Screen Size</span>
        <AccessButton disabled className="ac-customer-search-screen-normal">
          Normal
        </AccessButton>
        <div className="ac-customer-search-screen-grid">
          {[1, 2, 3, 4].map((n) => (
            <AccessButton key={n} xs disabled className="ac-customer-search-screen-num">
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
                      readOnly
                      className="ac-input ac-customer-search-side-input"
                      value=""
                      aria-label={`Customer ${row.label}`}
                    />
                  ) : (
                    <div className="ac-customer-search-side-spacer" aria-hidden />
                  )}
                  {row.contact ? (
                    <input
                      readOnly
                      className="ac-input ac-customer-search-side-input"
                      value=""
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

function CustomerSearchActionBar() {
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
        Your mouse is over: <span className="ac-customer-search-mouse-box" />
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
      <Link href="/customers" className="ac-customer-search-clear-link">
        <AccessButton xs>Clear Filters</AccessButton>
      </Link>
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
  page,
  pageSize,
  total,
  hasMore,
}: CustomerSearchScreenProps) {
  const paginationQuery = Object.fromEntries(
    Object.entries({
      search: currentSearch,
      salesmanId: currentSalesmanId,
      customerTypeId: currentCustomerTypeId,
      statusId: currentStatusId,
      city: currentCity,
      state: currentState,
    }).filter(([, value]) => Boolean(value)),
  );
  return (
    <div className="ac-customer-search-page flex min-h-0 flex-1 flex-col">
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
            <CustomerSearchActionBar />
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
