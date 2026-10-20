import type { OfficeFeature } from "./office-staff";

const objects: Record<string, string[]> = {
  tracking: ["frmTrackingEdit"], customers: ["frmCustomerSearch"],
  "customer-menu": ["frmCustomerMenu"], employees: ["frmEmployeeSearch", "frmEmployeeSearch3"],
  jobs: ["frmProjectSearch"], "employee-bonus-expense-report": ["frmAccumulatedReferralSearch"],
  "contract-report": ["frmContractReportSearch"], "weekly-customer-margin": ["frmWeeklyCustomerMarginReportSearch"],
  "weekly-rates": ["frmCheckWeeklyRatesSearchHolding"], "health-ins": ["frmEmployeeHealthInsuranceByMonthSearch"],
  "open-invoices": ["frmAccountsReceivableSearch"], "customer-permits": ["frmCustomerPermitsSearch"],
  "customer-import": ["frmCustomerImportProcess"], "employee-import": ["frmEmployeeImportProcess"],
  "job-orders": ["frmJobOrdersSearch"], "sick-hours": ["frmEmployeeSickHoursSearch"],
  "directions": ["frmDirectionsSearch"], "commissions": ["frmCommissionsSearch"],
  "commissions-report": ["frmCommissionsSearch"], admin: ["frmOfficeStaffPermission"],
  setup: ["frmOfficeStaffPermission"], welcome: ["frmOfficeStaffPermission"],
};
const normalize = (name: string) => name.toLowerCase().replace(/^frm/, "").replace(/[^a-z0-9]/g, "").replace(/(search|report|holding)$/g, "");

export function officeRouteAllowed(pathname: string, features: OfficeFeature[]): boolean {
  // The main-menu status check is available to authenticated staff; changing
  // database settings still requires the separate administrator feature.
  if (pathname === "/api/health/db") return true;
  let parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "api") parts = parts.slice(1);
  if (parts[0] === "reports" && parts.length > 1) parts = parts.slice(1);
  const root = parts[0] ?? "dashboard";
  if (["dashboard", "reports", "forbidden"].includes(root)) return true;
  let required = objects[root];
  if (root === "employee-quick-search" || root === "employees" && parts[1] === "quick-search") required = ["frmEmployeeQuickSearch"];
  if (root === "customers" && /^\d+$/.test(parts[1] ?? "")) required = ["frmCustomerDataEntry"];
  if (root === "employees" && /^\d+$/.test(parts[1] ?? "")) {
    const tab = parts[2];
    required = tab ? [`frmEmployeeDataEntry_${({ rates: "Rates", contacts: "Contacts", adjustments: "Adjustments", loans: "Loans", "sick-hours": "SickHours", "vacation-hours": "VacationHours" } as Record<string, string>)[tab] ?? tab}`] : ["frmEmployeeDataEntry"];
  }
  if (root === "jobs" && /^\d+$/.test(parts[1] ?? "")) required = ["frmProjectDataEntry"];
  return features.some(feature => required
    ? required.some(name => name.toLowerCase() === feature.objectName.toLowerCase())
    : normalize(feature.objectName) === normalize(root) || normalize(feature.title) === normalize(root));
}

export function officeFeatureAllowed(features: OfficeFeature[], objectName: string, controlName?: string): boolean {
  return features.some(feature => feature.objectName.toLowerCase() === objectName.toLowerCase()
    && (!controlName || feature.controlName.toLowerCase() === controlName.toLowerCase()));
}
