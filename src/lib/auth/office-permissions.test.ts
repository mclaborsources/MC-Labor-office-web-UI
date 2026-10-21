import assert from "node:assert/strict";
import { test } from "node:test";
import { officeRouteAllowed, officeFeatureAllowed } from "./office-permissions";
import { matchesAccessPassword } from "./office-staff";
const feature = (objectName: string, controlName = "") => ({ objectName, controlName, title: "" });

test("office route permissions apply to pages and APIs and deny unknown routes", () => {
  const grants = [feature("frmTrackingEdit"), feature("frmAccumulatedReferralSearch")];
  assert.equal(officeRouteAllowed("/tracking", grants), true);
  assert.equal(officeRouteAllowed("/employee-bonus-expense-report", grants), true);
  assert.equal(officeRouteAllowed("/admin/connection", grants), false);
  assert.equal(officeRouteAllowed("/api/customers/123", grants), false);
  assert.equal(officeRouteAllowed("/unmapped-feature", grants), false);
  assert.equal(officeRouteAllowed("/api/reports/contract-report", [feature("frmContractReportSearch")]), true);
});
test("authenticated staff can check SQL status without access to connection settings", () => {
  assert.equal(officeRouteAllowed("/api/health/db", []), true);
  assert.equal(officeRouteAllowed("/api/health/other", []), false);
  assert.equal(officeRouteAllowed("/api/admin/connection", []), false);
});
test("quick search page and data API use the same Access feature", () => {
  const grants = [feature("frmEmployeeQuickSearch")];
  assert.equal(officeRouteAllowed("/employee-quick-search", grants), true);
  assert.equal(officeRouteAllowed("/api/employees/quick-search", grants), true);
  assert.equal(officeRouteAllowed("/api/employees/quick-search", []), false);
});

test("Customer Search 1 uses the existing Customer Search feature grant", () => {
  assert.equal(officeRouteAllowed("/customer-search-1", [feature("frmCustomerSearch")]), true);
  assert.equal(officeRouteAllowed("/customer-search-1", []), false);
});
test("employee detail tabs need their own feature grants", () => {
  const grants = [feature("frmEmployeeDataEntry")];
  assert.equal(officeRouteAllowed("/employees/123", grants), true);
  assert.equal(officeRouteAllowed("/employees/123/rates", grants), false);
  assert.equal(officeRouteAllowed("/employees/123/rates", [feature("frmEmployeeDataEntry_Rates")]), true);
});
test("feature checks match Access object and optional control", () => {
  const grants = [feature("frmTrackingEdit", "cmdPrint")];
  assert.equal(officeFeatureAllowed(grants, "frmTrackingEdit"), true);
  assert.equal(officeFeatureAllowed(grants, "frmTrackingEdit", "cmdPrint"), true);
  assert.equal(officeFeatureAllowed(grants, "frmTrackingEdit", "cmdDelete"), false);
});
test("legacy password comparison follows Access case rules without trimming passwords", () => {
  assert.equal(matchesAccessPassword("Example", "eXAMPLE"), true);
  assert.equal(matchesAccessPassword("wrong", "Example"), false);
  assert.equal(matchesAccessPassword(" Example", "Example"), false);
});
