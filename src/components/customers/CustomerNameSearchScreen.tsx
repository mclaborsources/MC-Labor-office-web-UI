"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCustomerViewField } from "./CustomerSavedViews";
import { CustomerNameColumnHeader } from "./CustomerNameColumnHeader";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CUSTOMER_NAME_SEARCH_COLUMNS, customerNameCellValue, compareCustomerNameValues, type CustomerNameMatch, type CustomerNameColumnKey } from "@/lib/customerNameSearchColumns";

const defaultColumns = CUSTOMER_NAME_SEARCH_COLUMNS;
type SummaryColumnKey = CustomerNameColumnKey;
const summaryValue = customerNameCellValue;
const savedColumnOrders: Partial<Record<"names" | "customers", SummaryColumnKey[]>> = {};
const savedHiddenColumns: Partial<Record<"names" | "customers", SummaryColumnKey[]>> = {};
const savedColumnWidths: Partial<Record<"names" | "customers", Partial<Record<SummaryColumnKey, number>>>> = {};

export function resetCustomerColumnOrder(variant: "names" | "customers") {
  delete savedColumnOrders[variant];
  delete savedHiddenColumns[variant];
}

interface NameResponse {
  ok: boolean;
  data: CustomerNameMatch[];
  error?: string;
}

export function CustomerNameSearchScreen({ initialCustomers, fetchedCount, initialLoadTimeMs, resetOrderVersion = 0, showColumnsVersion = 0, variant = "names" }: {
  resetOrderVersion?: number;
  showColumnsVersion?: number;
  initialCustomers?: CustomerNameMatch[];
  fetchedCount?: number;
  initialLoadTimeMs?: number;
  variant?: "names" | "customers";
}) {
  const router = useRouter();
  const [columnOrder, setColumnOrder] = useCustomerViewField("order", defaultColumns.map(column => column.key), variant === "customers");

  const [hiddenColumns, setHiddenColumns] = useCustomerViewField("hidden", [], variant === "customers");
  const previousReset = useRef(resetOrderVersion);
  useEffect(() => {
    const resetChanged=previousReset.current!==resetOrderVersion;
    previousReset.current=resetOrderVersion;
    if(variant === "customers" && !resetChanged)return;
    setColumnOrder(savedColumnOrders[variant] ?? defaultColumns.map(column=>column.key));
    setHiddenColumns(savedHiddenColumns[variant] ?? []);
  }, [variant,resetOrderVersion,setColumnOrder,setHiddenColumns]);
  const previousShowColumns=useRef(showColumnsVersion);
  useEffect(() => {
    if(previousShowColumns.current===showColumnsVersion)return;
    previousShowColumns.current=showColumnsVersion;
    delete savedHiddenColumns[variant];
    setHiddenColumns([]);
  }, [showColumnsVersion, variant, setHiddenColumns]);
  const summaryColumns = useMemo(() => columnOrder.filter(key => !hiddenColumns.includes(key)).map(key => defaultColumns.find(column => column.key === key)!), [columnOrder, hiddenColumns]);
  function hideColumn(key: SummaryColumnKey) {
    setHiddenColumns(current => {
      const next = [...new Set([...current, key])];
      savedHiddenColumns[variant] = next;
      return next;
    });
  }
  function showAllColumns() {
    delete savedHiddenColumns[variant];
    setHiddenColumns([]);
  }
  function moveColumn(key: SummaryColumnKey, offset: number) {
    setColumnOrder(current => {
      const visible = current.filter(column => !hiddenColumns.includes(column));
      const visibleIndex = visible.indexOf(key);
      const destinationKey = visible[visibleIndex + offset];
      if (visibleIndex < 0 || destinationKey === undefined) return current;
      const index = current.indexOf(key);
      const destination = current.indexOf(destinationKey);
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      savedColumnOrders[variant] = next;
      return next;
    });
  }
  const [columnWidths, setColumnWidths] = useCustomerViewField("widths", {}, variant === "customers");
  useEffect(() => { if(variant !== "customers")setColumnWidths(savedColumnWidths[variant] ?? {}); }, [variant,setColumnWidths]);
  function resizeColumn(key: SummaryColumnKey, width?: number) {
    setColumnWidths(current => {
      const next = { ...current };
      if (width === undefined) delete next[key]; else next[key] = width;
      savedColumnWidths[variant] = next;
      return next;
    });
  }
  const summaryGridStyle = {
    gridTemplateColumns: summaryColumns.map(column => column.key === "customerName" && columnWidths[column.key] === undefined ? "minmax(280px, 1fr)" : (columnWidths[column.key] ?? column.width) + "px").join(" "),
    minWidth: summaryColumns.reduce((total, column) => total + (columnWidths[column.key] ?? column.width), 0) + 20,
    whiteSpace: "nowrap",
  } as const;
  const [loadedCustomers, setCustomers] = useState<CustomerNameMatch[]>([]);
  const customers = initialCustomers ?? loadedCustomers;
  const [allNamesVisible, setAllNamesVisible] = useState(initialCustomers !== undefined);
  const [loadingNames, setLoadingNames] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<{ label: string; text: string } | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const namesRequestVersion = useRef(0);
  const allNamesListRef = useRef<HTMLDivElement>(null);
  const [namesScrollTop, setNamesScrollTop] = useState(0);
  const [namesViewportHeight, setNamesViewportHeight] = useState(500);
  const [allNamesLoadMs, setAllNamesLoadMs] = useState<number | null>(initialLoadTimeMs ?? null);
  const [loadedCustomerSearch, setLoadedCustomerSearch] = useState("");
  const [columnFilters, setColumnFilters] = useCustomerViewField("filters", {}, variant === "customers");
  const [summarySort, setSummarySort] = useCustomerViewField("sort", null, variant === "customers");
  const displayedNames = useMemo(() => {
    const filters = Object.entries(columnFilters).map(([key, values]) => [key as SummaryColumnKey, new Set(values)] as const);
    const query = loadedCustomerSearch.trim().toLocaleLowerCase();
    const filtered = filters.length || query ? customers.filter(customer =>
      (!query || customer.customerName.toLocaleLowerCase().includes(query)) &&
      filters.every(([key, values]) => values.has(summaryValue(customer, key)))) : customers;
    if (!summarySort) return filtered;
    const { key, direction } = summarySort;
    const kind = defaultColumns.find(column => column.key === key)?.kind ?? "text";
    return [...filtered].sort((a, b) => {
      const left = summaryValue(a, key), right = summaryValue(b, key);
      const comparison = compareCustomerNameValues(left, right, kind);
      return direction === "asc" ? comparison : -comparison;
    });
  }, [customers, columnFilters, summarySort, loadedCustomerSearch]);
  function resetNamesScroll() {
    setNamesScrollTop(0);
    if (allNamesListRef.current) allNamesListRef.current.scrollTop = 0;
  }

  useEffect(() => {
    if (initialCustomers === undefined) return;
    setNamesScrollTop(0);
    if (allNamesListRef.current) allNamesListRef.current.scrollTop = 0;
  }, [initialCustomers]);

  const isLoading = loadingNames;

  useEffect(() => {
    if (detail) detailDialog.current?.showModal();
  }, [detail]);

  useEffect(() => {
    if (!isLoading || loadingStartedAt === null) {
      setElapsedMs(0);
      return;
    }
    const update = () => setElapsedMs(Date.now() - loadingStartedAt);
    update();
    const timer = window.setInterval(update, 200);
    return () => window.clearInterval(timer);
  }, [isLoading, loadingStartedAt]);

  useEffect(() => {
    if (!isLoading) {
      setShowLoadingDialog(false);
      return;
    }
    const timer = window.setTimeout(() => setShowLoadingDialog(true), 400);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    const viewport = allNamesListRef.current;
    if (!viewport) return;
    const updateHeight = () => setNamesViewportHeight(viewport.clientHeight || 500);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [allNamesVisible]);

  async function loadAllNames() {
    const requestId = ++namesRequestVersion.current;
    setLoadingNames(true);
    setLoadingMessage("Loading customers, sales history, call history, and primary contacts");
    setAllNamesLoadMs(null);
    setLoadedCustomerSearch("");
    setColumnFilters({});
    setSummarySort(null);
    const startedAt = performance.now();
    setLoadingStartedAt(Date.now());
    setError("");
    setAllNamesVisible(false);
    try {
      const response = await fetch("/api/customers/name-search?all=1", { cache: "no-store" });
      const payload = await response.json() as NameResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "All customer names could not be loaded.");
      if (requestId !== namesRequestVersion.current) return;
      setCustomers(payload.data);
      setNamesScrollTop(0);
      setAllNamesVisible(true);
      setAllNamesLoadMs(performance.now() - startedAt);
    } catch (allNamesError) {
      if (requestId !== namesRequestVersion.current) return;
      setCustomers([]);
      setError(allNamesError instanceof Error ? allNamesError.message : "All customer names could not be loaded.");
    } finally {
      if (requestId === namesRequestVersion.current) {
        setLoadingNames(false);
        setLoadingStartedAt(null);
      }
    }
  }

  const namesRowHeight = variant === "customers" ? 22 : 30;
  const firstVisibleName = Math.max(0, Math.min(displayedNames.length - 1, Math.floor(namesScrollTop / namesRowHeight) - 8));
  const visibleNameCount = Math.ceil(namesViewportHeight / namesRowHeight) + 16;
  const lastVisibleName = Math.min(displayedNames.length, firstVisibleName + visibleNameCount);
  const visibleAllNames = displayedNames.slice(firstVisibleName, lastVisibleName);

  return (
    <main className={`ac-customer-name-search${variant === "customers" ? " ac-customer-search-1-results" : ""}`}>
      {variant === "names" && <header className="ac-customer-name-search-header">
        <h1>Customer Name Search</h1>
        <span className="ac-customer-name-search-status" role="status" aria-live="polite">
          {loadingNames ? "Loading customers…" : allNamesVisible ? `${customers.length.toLocaleString()} customers loaded${allNamesLoadMs !== null ? ` in ${(allNamesLoadMs / 1000).toFixed(2)} seconds` : ""}` : "Load all names to browse customers"}
        </span>
      </header>}

      <section className="ac-customer-name-search-panel">
        {variant === "names" && <div className="ac-customer-name-search-search-row">
          <button data-action-status="complete" type="button" className="ac-btn ac-btn-xs" onClick={() => void loadAllNames()} disabled={isLoading}>
            {loadingNames ? "Loading…" : "Load all names"}
          </button>
        </div>}
        {error && <div className="ac-customer-name-search-error" role="alert">{error}</div>}
        {allNamesVisible && variant === "names" && (
          <div>
            <label htmlFor="loaded-customer-query">Search loaded customers</label>
            <div className="ac-customer-name-search-search-row">
              <div className="ac-customer-name-search-input-wrap">
                <Search size={17} aria-hidden="true" />
                <input id="loaded-customer-query" type="search" autoComplete="off" placeholder="Type any part of a customer name…" value={loadedCustomerSearch}
                  onChange={event => { setLoadedCustomerSearch(event.target.value); resetNamesScroll(); }} />
                {loadedCustomerSearch && <button type="button" aria-label="Clear loaded customer search" onClick={() => { setLoadedCustomerSearch(""); resetNamesScroll(); }}><X size={16} aria-hidden="true" /></button>}
              </div>
              <span role="status" aria-live="polite">Showing {displayedNames.length.toLocaleString()} of {customers.length.toLocaleString()} customers</span>
            </div>
          </div>
        )}
        {allNamesVisible && variant === "names" && <div className="ac-customer-name-search-paging"><button type="button" className="ac-btn ac-btn-xs" onClick={() => { resetCustomerColumnOrder(variant); setColumnOrder(defaultColumns.map(column => column.key)); setHiddenColumns([]); }}>Reset column order</button></div>}
        {allNamesVisible && variant === "names" && hiddenColumns.length > 0 && <div className="ac-customer-name-search-paging"><button type="button" className="ac-btn ac-btn-xs" onClick={showAllColumns}>Show all columns</button></div>}
        {allNamesVisible && (Object.keys(columnFilters).length > 0 || summarySort) && (
          <div className="ac-customer-name-search-paging">
            <button type="button" className="ac-btn ac-btn-xs" onClick={() => { setColumnFilters({}); setSummarySort(null); resetNamesScroll(); }}>Clear sorting and filters</button>
          </div>
        )}

        {allNamesVisible ? (
          <div ref={allNamesListRef} className="ac-customer-name-search-all-names" aria-label="All customer names" onScroll={(event) => setNamesScrollTop(event.currentTarget.scrollTop)}>
            <div className="ac-customer-name-search-summary-header" style={summaryGridStyle}>
              {summaryColumns.map((column, index) => <CustomerNameColumnHeader key={column.key} columnKey={column.key} label={column.label} kind={column.kind}
                onHide={summaryColumns.length > 1 ? () => hideColumn(column.key) : undefined}
                onMoveLeft={index > 0 ? () => moveColumn(column.key, -1) : undefined}
                onMoveRight={index < summaryColumns.length - 1 ? () => moveColumn(column.key, 1) : undefined}
                width={columnWidths[column.key] ?? column.width} onResize={width => resizeColumn(column.key, width)} onResetWidth={() => resizeColumn(column.key)}
                getValues={() => customers.map(customer => summaryValue(customer, column.key))}
                selected={columnFilters[column.key]} sort={summarySort?.key === column.key ? summarySort.direction : undefined}
                onFilter={values => { setColumnFilters(current => { const next = { ...current }; if (values === undefined) delete next[column.key]; else next[column.key] = values; return next; }); resetNamesScroll(); }}
                onSort={direction => { setSummarySort({ key: column.key, direction }); resetNamesScroll(); }} />)}
            </div>
            {displayedNames.length === 0 && <div className="ac-customer-name-search-empty">No customers match your search and selected filters.</div>}
            {firstVisibleName > 0 && <div aria-hidden="true" style={{ height: firstVisibleName * namesRowHeight }} />}
            {visibleAllNames.map((customer) => (
              <div key={customer.customerId} className="ac-customer-name-search-all-name" style={{ ...summaryGridStyle, cursor: "default" }}>
                {summaryColumns.map(column => {
                  const value = summaryValue(customer, column.key);
                  return <span key={column.key} data-column={column.key} title={value}>
                    {column.key === "kickback" || column.key === "rts"
                      ? <input type="checkbox" aria-label={`${column.key === "rts" ? "RTS" : "Kickback"} for ${customer.customerName}`} checked={["true", "1", "yes", "x"].includes(value.toLowerCase())} disabled />
                      : variant === "customers" && column.key === "customerName"
                      ? <span role="link" tabIndex={0} className="ac-customer-name-open" title="Double-click to open customer"
                          onDoubleClick={() => router.push(`/customers/${customer.customerId}`)}
                          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); router.push(`/customers/${customer.customerId}`); } }}>{value}</span>
                      : (column.key === "futureCallHistory" || column.key === "lastActionNote") && value
                      ? <button type="button" style={{ border: 0, padding: 0, background: "transparent", color: "inherit", font: "inherit", cursor: "pointer", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          aria-label={`Read ${column.label} for ${customer.customerName}`}
                          onClick={() => setDetail({ label: `${customer.customerName} — ${column.label}`, text: value })}>{value}</button>
                      : value}
                  </span>;
                })}
              </div>
            ))}
            {lastVisibleName < displayedNames.length && <div aria-hidden="true" style={{ height: (displayedNames.length - lastVisibleName) * namesRowHeight }} />}
          </div>
        ) : <div className="ac-customer-name-search-empty" aria-busy={loadingNames}>
          {loadingNames ? "Loading customers…" : "Click Load all names to browse and search customers."}
        </div>}
        {allNamesVisible && <footer className="ac-customer-search-1-count ac-recordbar" role="status" aria-live="polite">
          <strong>Fetched: {(fetchedCount ?? customers.length).toLocaleString()} customers</strong>
          <span>Matching: {displayedNames.length.toLocaleString()}</span>
          {allNamesLoadMs !== null && <span>Load time: {(allNamesLoadMs / 1000).toFixed(2)} seconds</span>}
        </footer>}
      </section>
      {detail && <dialog ref={detailDialog} onClose={() => setDetail(null)} aria-labelledby="customer-name-detail-title"
        style={{ position: "fixed", inset: 0, margin: "auto", padding: 20, width: "min(800px, 90vw)", maxHeight: "80vh", overflow: "auto", border: "1px solid #94a3b8", background: "white", color: "#111" }}>
        <h2 id="customer-name-detail-title">{detail.label}</h2>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", font: "13px Arial, sans-serif", margin: "16px 0" }}>{detail.text}</pre>
        <form method="dialog"><button type="submit" autoFocus className="ac-btn ac-btn-xs">Close</button></form>
      </dialog>}
      {showLoadingDialog && isLoading && (
        <div className="ac-customer-name-loading-overlay" role="status" aria-live="polite">
          <div className="ac-customer-name-loading-dialog">
            <span className="ac-customer-name-loading-spinner" aria-hidden="true" />
            <strong>{loadingMessage || "Loading customer data"}</strong>
            <span>Elapsed: {(elapsedMs / 1000).toFixed(1)} seconds</span>
            <small>The query is still running. The timer stops when results return.</small>
          </div>
        </div>
      )}
    </main>
  );
}
