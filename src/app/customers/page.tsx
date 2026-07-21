import { AppShell } from "@/components/layout/AppShell";
import { CustomerSearchScreen } from "@/components/customers/CustomerSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomerSearchRows } from "@/lib/customers";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;

  const search = params.search ?? "";
  const salesmanId = params.salesmanId ?? "";
  const customerTypeId = params.customerTypeId ?? "";
  const statusId = params.statusId ?? "";
  const city = params.city ?? "";
  const state = params.state ?? "";
  const sortKey = params.sortKey ?? "";
  const sortDirection = params.sortDirection === "desc" ? "desc" : "asc";
  let customers: Awaited<ReturnType<typeof getCustomerSearchRows>>["data"] = [];
  let loadError: string | undefined;

  try {
    const result = await getCustomerSearchRows({
      search: search || undefined,
      salesmanId: salesmanId || undefined,
      customerTypeId: customerTypeId || undefined,
      statusId: statusId || undefined,
      city: city || undefined,
      state: state || undefined,
      page: 1,
      pageSize: 300,
      sortKey: sortKey || undefined,
      sortDirection,
      includeTotal: false,
    });
    customers = result.data;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unable to load customers.";
  }

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <CustomerSearchScreen
        customers={customers}
        loadError={loadError}
        salesmen={[]}
        customerTypes={[]}
        statuses={[]}
        cities={[]}
        states={[]}
        currentSearch={search}
        currentSalesmanId={salesmanId}
        currentCustomerTypeId={customerTypeId}
        currentStatusId={statusId}
        currentCity={city}
        currentState={state}
        currentSortKey={sortKey}
        currentSortDirection={sortDirection}
        page={1}
        pageSize={300}
        total={customers.length}
        hasMore={false}
      />
    </AppShell>
  );
}
