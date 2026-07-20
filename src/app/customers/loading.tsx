import { AppShell } from "@/components/layout/AppShell";
import { CustomerSearchLoadingOverlay } from "@/components/customers/CustomerSearchLoadingOverlay";

export default function CustomersLoading() {
  return (
    <AppShell fillViewport fullWidth>
      <div className="ac-customer-loading-page" />
      <CustomerSearchLoadingOverlay />
    </AppShell>
  );
}
