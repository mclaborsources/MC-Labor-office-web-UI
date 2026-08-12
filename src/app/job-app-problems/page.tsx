import { AppShell } from "@/components/layout/AppShell";
import { JobAppProblemsScreen } from "@/components/job-app-problems/JobAppProblemsScreen";

export default function JobAppProblemsPage() {
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
        { label: "Job App Problems", active: true },
      ]}
    >
      <JobAppProblemsScreen />
    </AppShell>
  );
}
