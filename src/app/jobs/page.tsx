import { AppShell } from "@/components/layout/AppShell";
import { JobSearchScreen } from "@/components/jobs/JobSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getJobs, getJobFilterOptions } from "@/lib/jobs";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;

  const search = params.search ?? "";
  const customerId = params.customerId ?? "";
  const salesmanId = params.salesmanId ?? "";
  const customerTypeId = params.customerTypeId ?? "";
  const statusId = params.statusId ?? "";
  const city = params.city ?? "";
  const stateId = params.stateId ?? "";

  let jobs: Awaited<ReturnType<typeof getJobs>>["data"] = [];
  let loadError: string | undefined;
  let customers: Awaited<ReturnType<typeof getJobFilterOptions>>["customers"] = [];
  let salesmen: Awaited<ReturnType<typeof getJobFilterOptions>>["salesmen"] = [];
  let customerTypes: Awaited<ReturnType<typeof getJobFilterOptions>>["customerTypes"] = [];
  let statuses: Awaited<ReturnType<typeof getJobFilterOptions>>["statuses"] = [];
  let cities: Awaited<ReturnType<typeof getJobFilterOptions>>["cities"] = [];
  let states: Awaited<ReturnType<typeof getJobFilterOptions>>["states"] = [];

  try {
    const [result, filterOpts] = await Promise.all([
      getJobs({
        search: search || undefined,
        customerId: customerId || undefined,
        salesmanId: salesmanId || undefined,
        customerTypeId: customerTypeId || undefined,
        statusId: statusId || undefined,
        city: city || undefined,
        stateId: stateId || undefined,
      }),
      getJobFilterOptions().catch(() => ({
        customers: [],
        salesmen: [],
        customerTypes: [],
        statuses: [],
        cities: [],
        states: [],
      })),
    ]);
    jobs = result.data;
    customers = filterOpts.customers;
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
      <JobSearchScreen
        jobs={jobs}
        loadError={loadError}
        customers={customers}
        salesmen={salesmen}
        customerTypes={customerTypes}
        statuses={statuses}
        cities={cities}
        states={states}
        currentSearch={search}
        currentCustomerId={customerId}
        currentSalesmanId={salesmanId}
        currentCustomerTypeId={customerTypeId}
        currentStatusId={statusId}
        currentCity={city}
        currentStateId={stateId}
      />
    </AppShell>
  );
}
