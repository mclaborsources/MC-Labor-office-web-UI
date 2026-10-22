import { getCustomerFilterOptions, getCustomerSearchRows } from "@/lib/customers";
import { getOfficeStaffList } from "@/lib/admin";
import type { FilterOption } from "@/types/search";
import type { CustomerSearchScreenProps } from "@/components/customers/CustomerSearchScreen";
export async function loadCustomerPageData(params: Record<string, string | undefined>): Promise<CustomerSearchScreenProps> {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Math.min(1_000, Number(params.pageSize) || 1_000));
  const filters = {
    search: params.search ?? "", salesmanId: params.salesmanId ?? "",
    customerTypeId: params.customerTypeId ?? "", statusId: params.statusId ?? "",
    city: params.city ?? "", state: params.state ?? "",
    customerName: params.customerName ?? "", customerPhone: params.customerPhone ?? "",
    contactName: params.contactName ?? "", contactPhone: params.contactPhone ?? "",
    contactEmail: params.contactEmail ?? "", contactText: params.contactText ?? "",
    sortKey: params.sortKey ?? "", sortDirection: params.sortDirection === "desc" ? "desc" as const : "asc" as const,
    page, pageSize,
  };
  let customers: Awaited<ReturnType<typeof getCustomerSearchRows>>["data"] = [];
  let total = 0;
  let loadError = "";
  const loadStartedAt = performance.now();
  const [filterOptions, officeStaff, customerResult] = await Promise.all([
    getCustomerFilterOptions().catch(() => ({ salesmen: [], customerTypes: [], statuses: [], cities: [], states: [] })),
    getOfficeStaffList().catch(() => []),
    getCustomerSearchRows(filters).then((result) => ({ result, error: "" })).catch(() => ({ result: null, error: "Customer records could not be loaded from SQL Server. Check the database connection and refresh." })),
  ]);
  const loadTimeMs = Math.round(performance.now() - loadStartedAt);
  const customerUserFlagOptions = Array.from({ length: 8 }, () => [] as FilterOption[]);
  if (customerResult.result) {
    customers = customerResult.result.data;
    total = customerResult.result.total;
  } else {
    loadError = customerResult.error;
  }
  const lastActionUsers: FilterOption[] = officeStaff.filter((staff) => staff.initials).map((staff) => ({
    value: staff.initials,
    label: `${staff.initials} — ${[staff.firstName, staff.lastName].filter(Boolean).join(" ")}${staff.active ? "" : " (Inactive)"}`,
  }));

return {customers: customers,
loadError: loadError,
salesmen: filterOptions.salesmen,
customerTypes: filterOptions.customerTypes,
statuses: filterOptions.statuses,
cities: filterOptions.cities,
states: filterOptions.states,
customerUserFlagOptions: customerUserFlagOptions,
lastActionUsers: lastActionUsers,
currentSearch: filters.search,
currentSalesmanId: filters.salesmanId,
currentCustomerTypeId: filters.customerTypeId,
currentStatusId: filters.statusId,
currentCity: filters.city,
currentState: filters.state,
currentSortKey: filters.sortKey,
currentCustomerName: filters.customerName,
currentCustomerPhone: filters.customerPhone,
currentContactName: filters.contactName,
currentContactPhone: filters.contactPhone,
currentContactEmail: filters.contactEmail,
currentContactText: filters.contactText,
currentSortDirection: filters.sortDirection,
page: page,
pageSize: pageSize,
total: total,
hasMore: page * pageSize < total,
loadTimeMs: loadTimeMs};
}
