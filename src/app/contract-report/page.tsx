import { AppShell } from "@/components/layout/AppShell";
import { ContractReportScreen } from "@/components/contract-report/ContractReportScreen";

export default function ContractReportPage() {
  return (
    <AppShell
      fillViewport
      fullWidth
      legacyAccessFrame
      legacyAccessTabs={[
        { label: "Menu", href: "/dashboard" },
        { label: "Tracking", href: "/tracking" },
        { label: "Employee Search 3", href: "/employees" },
        { label: "Customer Permits Search", href: "/customer-permits" },
        { label: "Invoice Search", href: "/jobs" },
        { label: "Employees", href: "/employees" },
        { label: "Contract Report", active: true },
      ]}
    >
      <ContractReportScreen />
    </AppShell>
  );
}
