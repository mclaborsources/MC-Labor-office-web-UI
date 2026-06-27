import { AppShell } from "@/components/layout/AppShell";
import { CustomerProfileScreen } from "@/components/customers/CustomerProfileScreen";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCustomerById } from "@/lib/customers";
import type { CustomerDetail } from "@/types/customer";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;
  const session = await getSessionOrDefault();

  let customer: CustomerDetail | null = null;
  let loadError: string | undefined;

  try {
    customer = await getCustomerById(customerId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load customer.";
  }

  if (!loadError && !customer) {
    notFound();
  }

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      {loadError && <ErrorAlert title="Could not load customer" message={loadError} />}
      {customer && <CustomerProfileScreen customer={customer} />}
    </AppShell>
  );
}
