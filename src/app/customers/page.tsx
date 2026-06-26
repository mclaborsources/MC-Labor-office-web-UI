import Link from "next/link";
import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessWindowTabs } from "@/components/access/AccessWindowTabs";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomers, getCustomerFilterOptions } from "@/lib/customers";
import { statusPillClass } from "@/lib/statusStyles";
import type { CustomerSummary } from "@/types/customer";
import type { FilterOption } from "@/types/search";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const CUST_HEADERS = [
  "ID", "Customer Name", "Type", "Salesman", "Status", "Phone", "Email", "City", "State", "Zip", "",
];

function CustomerResultsTable({ customers }: { customers: CustomerSummary[] }) {
  return (
    <div>
      <div className="ac-grid mc-scroll-smooth" style={{ maxHeight: "70vh" }}>
        <table>
          <thead>
            <tr>
              {CUST_HEADERS.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={CUST_HEADERS.length} className="!whitespace-normal py-6 text-center italic text-[#7a7a7a]">
                  No customers found. Try adjusting your search or clearing the filters.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.customerId}>
                  <td className="font-mono text-[#555]">{c.customerId || "—"}</td>
                  <td>
                    <Link href={`/customers/${c.customerId}`} className="font-semibold">
                      {c.customerName || "—"}
                    </Link>
                  </td>
                  <td>{c.customerType || "—"}</td>
                  <td>{c.salesman || "—"}</td>
                  <td>
                    {c.status ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusPillClass(c.status)}`}>
                        {c.status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : "—"}</td>
                  <td>{c.city || "—"}</td>
                  <td>{c.state || "—"}</td>
                  <td>{c.zip || "—"}</td>
                  <td>
                    <Link href={`/customers/${c.customerId}`} className="font-semibold">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="ac-recordbar">
        <span className="font-mono">
          Record: |◄ ◄ {customers.length === 0 ? 0 : 1} of {customers.length} ► ►|
        </span>
        <span className="text-[#7a7a7a]">Unfiltered</span>
        <span className="ml-auto text-[#7a7a7a]">Max 300 per page</span>
      </div>
    </div>
  );
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

  let customers: CustomerSummary[] = [];
  let loadError: string | undefined;
  let salesmen: FilterOption[] = [];
  let customerTypes: FilterOption[] = [];
  let statuses: FilterOption[] = [];
  let cities: FilterOption[] = [];
  let states: FilterOption[] = [];

  try {
    const [result, filterOpts] = await Promise.all([
      getCustomers({
        search: search || undefined,
        salesmanId: salesmanId || undefined,
        customerTypeId: customerTypeId || undefined,
        statusId: statusId || undefined,
        city: city || undefined,
        state: state || undefined,
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
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="-mx-2 -mt-2 mb-1.5 sm:-mx-3">
        <AccessWindowTabs
          tabs={[
            { label: "Menu", href: "/dashboard" },
            { label: "Customer Search", active: true },
          ]}
        />
      </div>
      <PageHeader title="Customer Search" icon={Building2} subtitle="Read-only" />
      <div className="flex flex-col gap-1.5">
        <Suspense fallback={null}>
          <CustomerFilters
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
          />
        </Suspense>

        {loadError ? (
          <ErrorAlert title="Could not load customers" message={loadError} />
        ) : (
          <Suspense fallback={<div className="ac-panel p-3"><Spinner label="Loading customers…" /></div>}>
            <CustomerResultsTable customers={customers} />
          </Suspense>
        )}
      </div>
    </AppShell>
  );
}
