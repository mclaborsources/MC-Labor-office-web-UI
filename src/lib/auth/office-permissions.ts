import type { OfficeFeature } from "./office-staff";

const objects: Record<string, string[]> = {
  "wcc-payroll": ["frmWCCPayrollReportSearchHolding", "frmWCCPayrollReportByCustomerSearchHolding"],
  tracking: ["frmTrackingEdit"], customers: ["frmCustomerSearch"],
  "employees-in-tracking": ["frmTrackingEdit"],
  "current-jobs": ["frmTrackingEdit", "frmProjectSearch"],
  "job-listings": ["frmTrackingEdit", "frmProjectSearch"],
  "customer-search-1": ["frmCustomerSearch"],
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
// These are the existing Tracking Admin menu entry points, not system settings.
// Keep the page and its differently named data API under the same Tracking grant.
const trackingAdminRoutes=new Set([
  "accident-report-search","accidents","vacation-hours-report","vacation-hours",
  "employee-hours-by-week","employee-hours-by-month","full-time-employees-by-month",
  "employee-health-insurance-by-month","employee-advance-report","employee-advance",
  "insurance-certificate-request-search","insurance-certificate-requests",
  "payroll-exclusions","weekly-customer-margin-report","weekly-customer-margin",
  "employee-research","yearly-revenue","newsletter-search","newsletter",
  "email-addresses","employee-licenses","id-drivers-license","interview-questions",
  "osha","resume-work-history","smart-phone","face-meeting","tracking-search",
  "compare-tracking-weeks","deleted-employees",
]);

export function officeRouteAllowed(pathname: string, features: OfficeFeature[]): boolean {
  // The main-menu status check is available to authenticated staff; changing
  // database settings still requires the separate administrator feature.
  if (pathname === "/api/health/db" || pathname === "/api/reports/payroll-companies" || pathname === "/api/reports/assign-years" || pathname === "/api/reports/states" || pathname === "/api/reports/selectors") return true;
  let parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "api") parts = parts.slice(1);
  if (parts[0] === "reports" && parts.length > 1) parts = parts.slice(1);
  let root = parts[0] ?? "dashboard";
  if (root === "ui-report" || root === "ui-requests") return officeFeatureAllowed(features,"frmEmployeeSearch3","cmdUI")
    || officeFeatureAllowed(features,"frmTrackingEdit","cmdUnemploymentRequests");
  if(trackingAdminRoutes.has(root)&&officeFeatureAllowed(features,"frmTrackingEdit")) return true;
  if (root === "employee-exclusions" || root === "wcc-payroll-by-customer" || root === "ui-unemployment-report-search" || root === "tracking-report" || root === "sales-by-customer" || root === "sales-by-customer-by-state" || root === "sales-by-salesman-weekly-breakdown" || root === "customer-history-report" || root === "gross-payroll-by-week" || root === "employees-on-site-per-week-report" || root === "invoice-report" || root === "weekly-sales-report" || root === "yearly-sales-report" || root === "office-staff-login-raw-data-search" || root === "office-staff-login-summary-search" || root === "new-assignments-returned-employees" || root === "salesman-report" || root === "employee-referral-report" || root === "employee-options-search" || root === "accounting-job-orders-report") root = "wcc-payroll";
  // Total Payroll Report Search is a separate entry point that uses the same
  // office permission as the established Payroll Report Search screen.
  if (root === "total-payroll-report-search" || root === "total-payroll-by-job-search") root = "payroll-report-search";
  if (["dashboard", "reports", "forbidden"].includes(root)) return true;
  if (root === "wcc-payroll") return features.some(feature =>
    (feature.objectName.toLowerCase() === "frmreports" && feature.title.toLowerCase() === "accounting reports") ||
    (feature.objectName.toLowerCase() === "frmtrackingedit" && feature.title.toLowerCase() === "wcc payroll / sales report by customer"));
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
