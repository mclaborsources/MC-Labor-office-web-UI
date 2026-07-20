import { AppShell } from "@/components/layout/AppShell";
import { CustomerSearchScreen } from "@/components/customers/CustomerSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomerFilterOptions, getCustomerSearchRows } from "@/lib/customers";

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
  const requestedPage = Number(params.page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let customers: Awaited<ReturnType<typeof getCustomerSearchRows>>["data"] = [];
  let loadError: string | undefined;
  let salesmen: Awaited<ReturnType<typeof getCustomerFilterOptions>>["salesmen"] = [];
  let customerTypes: Awaited<ReturnType<typeof getCustomerFilterOptions>>["customerTypes"] = [];
  let statuses: Awaited<ReturnType<typeof getCustomerFilterOptions>>["statuses"] = [];
  let cities: Awaited<ReturnType<typeof getCustomerFilterOptions>>["cities"] = [];
  let states: Awaited<ReturnType<typeof getCustomerFilterOptions>>["states"] = [];
  let total = 0;
  let currentPage = page;
  let pageSize = 300;
  let hasMore = false;

  try {
    const [result, filterOpts] = await Promise.all([
      getCustomerSearchRows({
        search: search || undefined,
        salesmanId: salesmanId || undefined,
        customerTypeId: customerTypeId || undefined,
        statusId: statusId || undefined,
        city: city || undefined,
        state: state || undefined,
        page,
        pageSize: 300,
      }),
      getCustomerFilterOptions().catch(() => ({
        salesmen: [],
        customerTypes: [],
        statuses: [],
        cities: [],
        states: [],
      })),
    ]);
    customers = result.data;
    total = result.total;
    currentPage = result.page;
    pageSize = result.pageSize;
    hasMore = result.hasMore;
    salesmen = filterOpts.salesmen;
    customerTypes = filterOpts.customerTypes;
    statuses = filterOpts.statuses;
    cities = filterOpts.cities;
    states = filterOpts.states;
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Database connection failed. Check SQL configuration.";
  }

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <CustomerSearchScreen
        customers={customers}
        loadError={loadError}
        salesmen={salesmen}
        customerTypes={customerTypes}
        statuses={statuses}
        cities={cities}
        states={states}
        currentSearch={search}
        currentSalesmanId={salesmanId}
        currentCustomerTypeId={customerTypeId}
        currentStatusId={statusId}
        currentCity={city}
        currentState={state}
        page={currentPage}
        pageSize={pageSize}
        total={total}
        hasMore={hasMore}
      />
    </AppShell>
  );
}
