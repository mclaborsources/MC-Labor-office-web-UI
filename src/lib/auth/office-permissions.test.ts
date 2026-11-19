import assert from "node:assert/strict";
import { test } from "node:test";
import { officeRouteAllowed, officeFeatureAllowed } from "./office-permissions";
import { matchesAccessPassword } from "./office-staff";
const feature = (objectName: string, controlName = "") => ({ objectName, controlName, title: "" });

test("Tracking Admin menu pages and data aliases share the Tracking grant",()=>{
 const routes=["accident-report-search","accidents","vacation-hours-report","vacation-hours","employee-hours-by-week","employee-hours-by-month","full-time-employees-by-month","employee-health-insurance-by-month","employee-advance-report","employee-advance","insurance-certificate-request-search","insurance-certificate-requests","payroll-exclusions","weekly-customer-margin-report","weekly-customer-margin","employee-research","yearly-revenue","newsletter-search","newsletter","email-addresses","employee-licenses","id-drivers-license","interview-questions","osha","resume-work-history","smart-phone","face-meeting","tracking-search","compare-tracking-weeks","deleted-employees"];
 for(const route of routes)for(const path of [`/${route}`,`/api/reports/${route}`,`/api/reports/${route}/options`]){
  assert.equal(officeRouteAllowed(path,[feature("frmTrackingEdit")]),true,path);
  assert.equal(officeRouteAllowed(path,[]),false,path);
 }
 assert.equal(officeRouteAllowed('/api/admin/connection',[feature('frmTrackingEdit')]),false);
});

test("UI Report and its request APIs require the Unemployment Requests feature",()=>{
  for(const path of ["/ui-report","/api/reports/ui-requests","/api/reports/ui-requests/contacts"]){
    assert.equal(officeRouteAllowed(path,[feature("frmTrackingEdit","cmdUnemploymentRequests")]),true);
    assert.equal(officeRouteAllowed(path,[feature("frmEmployeeSearch3","cmdUI")]),true);
    assert.equal(officeRouteAllowed(path,[feature("frmEmployeeSearch3","cmdPrint")]),false);
    assert.equal(officeRouteAllowed(path,[feature("frmTrackingEdit","cmdPrint")]),false);
    assert.equal(officeRouteAllowed(path,[]),false);
  }
});

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
test("Employees in Tracking uses the Tracking feature grant", () => {
  assert.equal(officeRouteAllowed("/employees-in-tracking", [feature("frmTrackingEdit")]), true);
  assert.equal(officeRouteAllowed("/employees-in-tracking", []), false);
  assert.equal(officeRouteAllowed("/employees-in-tracking", [feature("frmEmployeeSearch3")]), false);
});
test("Current Jobs page and report API use Tracking or Job Search grants", () => {
  for (const path of ["/current-jobs", "/api/reports/job-listings"]) {
    assert.equal(officeRouteAllowed(path, [feature("frmTrackingEdit")]), true);
    assert.equal(officeRouteAllowed(path, [feature("frmProjectSearch")]), true);
    assert.equal(officeRouteAllowed(path, []), false);
    assert.equal(officeRouteAllowed(path, [feature("frmCustomerSearch")]), false);
  }
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
