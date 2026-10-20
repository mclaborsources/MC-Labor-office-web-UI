"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CUSTOMER_SEARCH_COLUMNS, type CustomerSearchColumnKey } from "@/lib/customerSearchColumns";
import type { CustomerSearchRow } from "@/types/customer";

interface CustomerNameMatch {
  customerId: string;
  customerName: string;
}

interface NameResponse {
  ok: boolean;
  data: CustomerNameMatch[];
  error?: string;
}

interface RowsResponse {
  ok: boolean;
  data: CustomerSearchRow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  error?: string;
}

function displayCell(row: CustomerSearchRow, key: CustomerSearchColumnKey): string {
  if (key === "select") return "—";
  if (key === "name") return row.customerName || "—";
  const value = row[key as keyof CustomerSearchRow];
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export function CustomerNameSearchScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<CustomerNameMatch[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerNameMatch | null>(null);
  const [allNamesVisible, setAllNamesVisible] = useState(false);
  const [rows, setRows] = useState<CustomerSearchRow[]>([]);
  const [rowsSearchTerm, setRowsSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingNames, setLoadingNames] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestVersion = useRef(0);
  const namesRequestVersion = useRef(0);
  const loadingRowsRef = useRef(false);
  const loadingNamesRef = useRef(false);
  const allNamesListRef = useRef<HTMLDivElement>(null);
  const [namesScrollTop, setNamesScrollTop] = useState(0);
  const [namesViewportHeight, setNamesViewportHeight] = useState(500);

  const isLoading = loadingNames || loadingRows;

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

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term || selectedCustomer?.customerName === term) {
      namesRequestVersion.current += 1;
      loadingNamesRef.current = false;
      setCustomers([]);
      setLoadingNames(false);
      if (!loadingRowsRef.current) setLoadingStartedAt(null);
      setDropdownOpen(false);
      return;
    }

    const controller = new AbortController();
    const requestId = ++namesRequestVersion.current;
    loadingNamesRef.current = true;
    setLoadingNames(true);
    setLoadingMessage("Searching matching customer names");
    setLoadingStartedAt(Date.now());
    setError("");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/customers/name-search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json() as NameResponse;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Customer names could not be searched.");
        if (requestId === namesRequestVersion.current) {
          setCustomers(payload.data);
          setDropdownOpen(true);
        }
      } catch (searchError) {
        if (controller.signal.aborted) return;
        if (requestId !== namesRequestVersion.current) return;
        setCustomers([]);
        setError(searchError instanceof Error ? searchError.message : "Customer names could not be searched.");
      } finally {
        if (!controller.signal.aborted && requestId === namesRequestVersion.current) {
          loadingNamesRef.current = false;
          setLoadingNames(false);
          if (!loadingRowsRef.current) setLoadingStartedAt(null);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, selectedCustomer]);

  async function loadRows(target: { customerId?: string; term: string; page?: number }) {
    const requestId = ++requestVersion.current;
    namesRequestVersion.current += 1;
    loadingNamesRef.current = false;
    loadingNamesRef.current = false;
    setLoadingNames(false);
    loadingRowsRef.current = true;
    setLoadingRows(true);
    setLoadingMessage("Loading full customer data");
    setLoadingStartedAt(Date.now());
    setError("");
    setDropdownOpen(false);
    try {
      const params = new URLSearchParams();
      if (target.customerId) params.set("customerId", target.customerId);
      else params.set("q", target.term);
      if (target.page && target.page > 1) params.set("page", String(target.page));
      const response = await fetch(`/api/customers/name-search/results?${params}`, { cache: "no-store" });
      const payload = await response.json() as RowsResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Matching customer data could not be loaded.");
      if (requestId !== requestVersion.current) return;
      setRows(payload.data);
      setTotal(payload.total);
      setPage(payload.page);
      setHasMore(payload.hasMore);
      setRowsSearchTerm(target.customerId ? "" : target.term);
    } catch (loadError) {
      if (requestId !== requestVersion.current) return;
      setRows([]);
      setTotal(0);
      setHasMore(false);
      setError(loadError instanceof Error ? loadError.message : "Matching customer data could not be loaded.");
    } finally {
      if (requestId === requestVersion.current) {
        loadingRowsRef.current = false;
        setLoadingRows(false);
        if (!loadingNamesRef.current) setLoadingStartedAt(null);
      }
    }
  }

  async function loadAllNames() {
    const requestId = ++namesRequestVersion.current;
    requestVersion.current += 1;
    loadingRowsRef.current = false;
    loadingNamesRef.current = true;
    setLoadingRows(false);
    setLoadingNames(true);
    setLoadingMessage("Loading all customer names only");
    setLoadingStartedAt(Date.now());
    setError("");
    setRows([]);
    setRowsSearchTerm("");
    setPage(1);
    setTotal(0);
    setHasMore(false);
    setSelectedCustomer(null);
    setDropdownOpen(false);
    setAllNamesVisible(false);
    try {
      const response = await fetch("/api/customers/name-search?all=1", { cache: "no-store" });
      const payload = await response.json() as NameResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "All customer names could not be loaded.");
      if (requestId !== namesRequestVersion.current) return;
      setCustomers(payload.data);
      setTotal(payload.data.length);
      setNamesScrollTop(0);
      setAllNamesVisible(true);
    } catch (allNamesError) {
      if (requestId !== namesRequestVersion.current) return;
      setCustomers([]);
      setTotal(0);
      setError(allNamesError instanceof Error ? allNamesError.message : "All customer names could not be loaded.");
    } finally {
      if (requestId === namesRequestVersion.current) {
        loadingNamesRef.current = false;
        setLoadingNames(false);
        if (!loadingRowsRef.current) setLoadingStartedAt(null);
      }
    }
  }

  function chooseCustomer(customer: CustomerNameMatch) {
    setSelectedCustomer(customer);
    setSearchTerm(customer.customerName);
    setCustomers([]);
    setAllNamesVisible(false);
    void loadRows({ customerId: customer.customerId, term: customer.customerName });
  }

  function searchAllMatches() {
    const term = searchTerm.trim();
    if (!term) {
      inputRef.current?.focus();
      return;
    }
    setSelectedCustomer(null);
    setAllNamesVisible(false);
    void loadRows({ term, page: 1 });
  }

  const visibleSuggestions = customers.slice(0, 30);
  const namesRowHeight = 30;
  const firstVisibleName = Math.max(0, Math.floor(namesScrollTop / namesRowHeight) - 8);
  const visibleNameCount = Math.ceil(namesViewportHeight / namesRowHeight) + 16;
  const lastVisibleName = Math.min(customers.length, firstVisibleName + visibleNameCount);
  const visibleAllNames = customers.slice(firstVisibleName, lastVisibleName);

  return (
    <main className="ac-customer-name-search">
      <header className="ac-customer-name-search-header">
        <h1>Customer Name Search</h1>
        <span className="ac-customer-name-search-status" role="status" aria-live="polite">
          {loadingRows ? "Loading customer data…" : loadingNames ? "Searching names…" : allNamesVisible ? `${customers.length.toLocaleString()} customer names loaded` : rows.length ? `${rows.length.toLocaleString()} customer${rows.length === 1 ? "" : "s"} displayed · ${total.toLocaleString()} matching` : "Search by customer name"}
        </span>
      </header>

      <section className="ac-customer-name-search-panel">
        <label htmlFor="customer-name-query">Customer name</label>
        <div className="ac-customer-name-search-search-row">
          <div className="ac-customer-name-search-input-wrap">
            <Search size={17} aria-hidden="true" />
            <input
              ref={inputRef}
              id="customer-name-query"
              autoFocus
              autoComplete="off"
              maxLength={100}
              role="combobox"
              aria-expanded={dropdownOpen && customers.length > 0}
              aria-controls="customer-name-options"
              aria-autocomplete="list"
              placeholder="Start typing a customer name…"
              value={searchTerm}
              onFocus={() => customers.length > 0 && setDropdownOpen(true)}
              onChange={(event) => {
                requestVersion.current += 1;
                namesRequestVersion.current += 1;
                loadingRowsRef.current = false;
                loadingNamesRef.current = false;
                setLoadingRows(false);
                setLoadingNames(false);
                setLoadingStartedAt(null);
                setSearchTerm(event.target.value);
                setSelectedCustomer(null);
                setRows([]);
                setTotal(0);
                setAllNamesVisible(false);
                setDropdownOpen(Boolean(event.target.value.trim()));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  searchAllMatches();
                }
                if (event.key === "Escape") setDropdownOpen(false);
              }}
            />
            {searchTerm && (
              <button data-action-status="complete" type="button" aria-label="Clear search" onClick={() => {
                requestVersion.current += 1;
                namesRequestVersion.current += 1;
                loadingRowsRef.current = false;
                loadingNamesRef.current = false;
                setLoadingRows(false);
                setLoadingNames(false);
                setLoadingStartedAt(null);
                setSearchTerm("");
                setSelectedCustomer(null);
                setRows([]);
                setTotal(0);
                setAllNamesVisible(false);
              }}>
                <X size={16} aria-hidden="true" />
              </button>
            )}
            {dropdownOpen && customers.length > 0 && (
              <div id="customer-name-options" className="ac-customer-name-search-dropdown" role="listbox" aria-label="Matching customers">
                {visibleSuggestions.map((customer) => (
                  <button
                    data-action-status="complete"
                    type="button"
                    role="option"
                    aria-selected={selectedCustomer?.customerId === customer.customerId}
                    key={customer.customerId}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseCustomer(customer)}
                  >
                    {customer.customerName}
                  </button>
                ))}
                {customers.length > visibleSuggestions.length && (
                  <div className="ac-customer-name-search-dropdown-note">
                    Showing {visibleSuggestions.length} of {customers.length.toLocaleString()} names. Type more to narrow the list.
                  </div>
                )}
              </div>
            )}
          </div>
          <button data-action-status="complete" type="button" className="ac-btn ac-btn-xs" onClick={searchAllMatches} disabled={loadingRows || !searchTerm.trim()}>
            Search all matches
          </button>
          <button data-action-status="complete" type="button" className="ac-btn ac-btn-xs" onClick={() => void loadAllNames()} disabled={isLoading}>
            Load all names
          </button>
        </div>
        <p>Type to find matching names, select one to load its full customer row, or choose Load all names to browse every customer name. Search all matches loads full rows for the entered name.</p>
        {selectedCustomer && <div className="ac-customer-name-search-selected">Selected: {selectedCustomer.customerName}</div>}
        {error && <div className="ac-customer-name-search-error" role="alert">{error}</div>}

        {allNamesVisible ? (
          <div ref={allNamesListRef} className="ac-customer-name-search-all-names" aria-label="All customer names" onScroll={(event) => setNamesScrollTop(event.currentTarget.scrollTop)}>
            {firstVisibleName > 0 && <div aria-hidden="true" style={{ height: firstVisibleName * namesRowHeight }} />}
            {visibleAllNames.map((customer) => (
              <button key={customer.customerId} type="button" className="ac-customer-name-search-all-name" onClick={() => chooseCustomer(customer)}>
                {customer.customerName}
              </button>
            ))}
            {lastVisibleName < customers.length && <div aria-hidden="true" style={{ height: (customers.length - lastVisibleName) * namesRowHeight }} />}
          </div>
        ) : <div className="ac-customer-name-search-table-wrap" aria-busy={loadingRows}>
          {loadingRows ? (
            <div className="ac-customer-name-search-empty">Loading customer data…</div>
          ) : rows.length === 0 ? (
            <div className="ac-customer-name-search-empty">
              {rowsSearchTerm
                ? `No customer data matches “${rowsSearchTerm}”.`
                : selectedCustomer
                  ? `No Customer Search row was returned for “${selectedCustomer.customerName}”.`
                  : "Choose a customer name or search for all matching customers."}
            </div>
          ) : (
            <>
              <div className="ac-customer-name-search-data-grid">
                <table className="ac-customer-name-search-data-table">
                  <thead><tr>{CUSTOMER_SEARCH_COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.customerId}>
                        {CUSTOMER_SEARCH_COLUMNS.map((column) => <td key={column.key} title={displayCell(row, column.key)}>{displayCell(row, column.key)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rowsSearchTerm && total > 1_000 && (
                <div className="ac-customer-name-search-paging">
                  <span>Showing {(page - 1) * 1_000 + 1}–{Math.min(page * 1_000, total)} of {total.toLocaleString()}</span>
                  <button data-action-status="complete" type="button" className="ac-btn ac-btn-xs" disabled={page <= 1 || loadingRows} onClick={() => void loadRows({ term: rowsSearchTerm, page: page - 1 })}>Previous</button>
                  <button data-action-status="complete" type="button" className="ac-btn ac-btn-xs" disabled={!hasMore || loadingRows} onClick={() => void loadRows({ term: rowsSearchTerm, page: page + 1 })}>Next</button>
                </div>
              )}
            </>
          )}
        </div>}
      </section>
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
