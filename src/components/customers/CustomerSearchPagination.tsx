"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CustomerSearchLoadingOverlay } from "@/components/customers/CustomerSearchLoadingOverlay";

interface CustomerSearchPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  rowCount: number;
  hasMore: boolean;
  query: Record<string, string>;
}

export function CustomerSearchPagination({
  page,
  pageSize,
  total,
  rowCount,
  hasMore,
  query,
}: CustomerSearchPaginationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min((page - 1) * pageSize + rowCount, total);

  function hrefForPage(targetPage: number): string {
    const params = new URLSearchParams(query);
    if (targetPage <= 1) params.delete("page");
    else params.set("page", String(targetPage));
    const search = params.toString();
    return search ? `/customers?${search}` : "/customers";
  }

  function goToPage(targetPage: number) {
    if (isPending || targetPage === page) return;
    startTransition(() => router.push(hrefForPage(targetPage), { scroll: false }));
  }

  const nav = (label: string, targetPage: number, disabled: boolean, title: string) => (
    <button
      type="button"
      className="ac-customer-search-page-nav"
      disabled={disabled || isPending}
      title={title}
      onClick={() => goToPage(targetPage)}
    >
      {label}
    </button>
  );

  return (
    <>
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
      {isPending && <CustomerSearchLoadingOverlay />}
    </>
  );
}
