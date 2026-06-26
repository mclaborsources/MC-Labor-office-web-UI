import Link from "next/link";
import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomers, getCustomerFilterOptions } from "@/lib/customers";
import type { CustomerSummary } from "@/types/customer";
import type { FilterOption } from "@/types/search";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function CustomerResultsTable({ customers }: { customers: CustomerSummary[] }) {
  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No customers found"
        message="Try adjusting your search or clearing the filters."
      />
    );
  }

  return (
    <div className="mc-panel overflow-hidden">
      <div className="overflow-x-auto mc-scroll-smooth">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Customer Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Salesman
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                City / State
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr
                key={c.customerId}
                style={i < 10 ? { animationDelay: `${i * 25}ms` } : undefined}
                className={`border-b border-slate-100/80 transition-colors duration-100 ${
                  i % 2 === 0 ? "bg-white/60" : "bg-slate-50/50"
                } hover:bg-blue-50/60 group ${i < 10 ? "mc-animate-in" : ""}`}
              >
                <td className="px-4 py-2.5 border-r border-slate-100/80 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {c.customerId || "—"}
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 whitespace-nowrap">
                  <Link
                    href={`/customers/${c.customerId}`}
                    className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {c.customerName || "—"}
                  </Link>
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {c.customerType || "—"}
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {c.salesman || "—"}
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {c.phone || "—"}
                </td>
                <td className="px-4 py-2.5 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="hover:text-blue-700 hover:underline"
                    >
                      {c.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                  {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 backdrop-blur-sm">
        <span>
          Showing <span className="font-semibold text-slate-700">{customers.length}</span> result{customers.length !== 1 ? "s" : ""}
        </span>
        <span className="text-slate-400">Max 200 per page</span>
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

  let customers: CustomerSummary[] = [];
  let loadError: string | undefined;
  let salesmen: FilterOption[] = [];
  let customerTypes: FilterOption[] = [];

  try {
    const [result, filterOpts] = await Promise.all([
      getCustomers({
        search: search || undefined,
        salesmanId: salesmanId || undefined,
        customerTypeId: customerTypeId || undefined,
      }),
      getCustomerFilterOptions().catch(() => ({
        salesmen: [],
        customerTypes: [],
      })),
    ]);
    customers = result.data;
    salesmen = filterOpts.salesmen;
    customerTypes = filterOpts.customerTypes;
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Database connection failed. Check SQL configuration.";
  }

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <PageHeader
        title="Customer Search"
        icon={Building2}
        subtitle="Read-only · Milestone 2"
      />
      <div className="flex flex-col gap-4">
        <Suspense fallback={null}>
          <CustomerFilters
            salesmen={salesmen}
            customerTypes={customerTypes}
            currentSearch={search}
            currentSalesmanId={salesmanId}
            currentCustomerTypeId={customerTypeId}
          />
        </Suspense>

        {loadError ? (
          <Panel>
            <ErrorAlert
              title="Could not load customers"
              message={loadError}
            />
          </Panel>
        ) : (
          <Suspense fallback={<Panel><Spinner label="Loading customers…" /></Panel>}>
            <CustomerResultsTable customers={customers} />
          </Suspense>
        )}
      </div>
    </AppShell>
  );
}
