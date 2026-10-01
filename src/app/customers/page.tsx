import { AppShell } from "@/components/layout/AppShell";
import { CustomerSearchScreen } from "@/components/customers/CustomerSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomerFilterOptions, getCustomerSearchRows, getCustomerUserFlagOptions } from "@/lib/customers";
import { getOfficeStaffList } from "@/lib/admin";
import type { FilterOption } from "@/types/search";

interface PageProps { searchParams: Promise<Record<string, string | undefined>> }

export default async function CustomersPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(params.pageSize) || 25));
  const filters = {
    search: params.search ?? "", salesmanId: params.salesmanId ?? "",
    customerTypeId: params.customerTypeId ?? "", statusId: params.statusId ?? "",
    city: params.city ?? "", state: params.state ?? "",
    sortKey: params.sortKey ?? "", sortDirection: params.sortDirection === "desc" ? "desc" as const : "asc" as const,
    page, pageSize,
  };
  let customers: Awaited<ReturnType<typeof getCustomerSearchRows>>["data"] = [];
  let total = 0;
  let loadError = "";
  const [filterOptions, customerUserFlagOptions, officeStaff] = await Promise.all([
    getCustomerFilterOptions().catch(() => ({ salesmen: [], customerTypes: [], statuses: [], cities: [], states: [] })),
    getCustomerUserFlagOptions().catch(() => []),
    getOfficeStaffList().catch(() => []),
  ]);
  try {
    const result = await getCustomerSearchRows(filters);
    customers = result.data;
    total = result.total;
  } catch {
    loadError = "Customer records could not be loaded from SQL Server. Check the database connection and refresh.";
  }
  const lastActionUsers: FilterOption[] = officeStaff.filter((staff) => staff.initials).map((staff) => ({
    value: staff.initials,
    label: `${staff.initials} — ${[staff.firstName, staff.lastName].filter(Boolean).join(" ")}${staff.active ? "" : " (Inactive)"}`,
  }));

  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
    <CustomerSearchScreen
      customers={customers} loadError={loadError}
      salesmen={filterOptions.salesmen} customerTypes={filterOptions.customerTypes}
      statuses={filterOptions.statuses} cities={filterOptions.cities} states={filterOptions.states}
      customerUserFlagOptions={customerUserFlagOptions} lastActionUsers={lastActionUsers}
      currentSearch={filters.search} currentSalesmanId={filters.salesmanId}
      currentCustomerTypeId={filters.customerTypeId} currentStatusId={filters.statusId}
      currentCity={filters.city} currentState={filters.state} currentSortKey={filters.sortKey}
      currentSortDirection={filters.sortDirection} page={page} pageSize={pageSize}
      total={total} hasMore={page * pageSize < total}
    />
  </AppShell>;
}
