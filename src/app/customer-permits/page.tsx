import { AppShell } from "@/components/layout/AppShell";
import { CustomerPermitsScreen } from "@/components/customer-permits/CustomerPermitsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function CustomerPermitsPage() {
  const session = await getSessionOrDefault();
  return (
    <AppShell
      userDisplayName={session.user?.displayName}
      fillViewport
      fullWidth
      legacyAccessFrame
      legacyAccessTabs={[
        { label: "Menu", href: "/dashboard" },
        { label: "Tracking", href: "/tracking" },
        { label: "Employee Search 3", href: "/employees" },
        { label: "Customer Permits", active: true },
      ]}
    >
      <CustomerPermitsScreen />
    </AppShell>
  );
}
