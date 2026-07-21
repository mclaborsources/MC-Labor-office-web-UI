import { AppShell } from "@/components/layout/AppShell";
import { CustomerSearchScreen } from "@/components/customers/CustomerSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

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
  const requestedPage = Number(params.page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <CustomerSearchScreen
        customers={[]}
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
        page={page}
        pageSize={300}
        total={0}
        hasMore={false}
      />
    </AppShell>
  );
}
