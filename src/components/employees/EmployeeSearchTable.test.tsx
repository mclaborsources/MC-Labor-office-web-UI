import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { EmployeeSummary } from "@/types/employee";
import { EmployeeSearchTable } from "./EmployeeSearchTable";

const router = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
function employee(overrides: Partial<EmployeeSummary> = {}): EmployeeSummary {
  return {
    employeeId: "42", firstName: "Test", lastName: "Employee", middleInitial: "", fullName: "Test Employee",
    cellPhone: "", email: "", trade: "", status: "", grade: "", street: "", city: "", state: "",
    userFlag5: "", s1: "", profileType: "", howReferred: "", qualification: "", averageInterview: "",
    fda: "", thw: "", licenseExpiration: "", weekEnding: "", payRate: "", payrollCompany: "",
    accessFields: {}, currentAssignment: "", ...overrides,
  };
}
function render(employees: EmployeeSummary[]) {
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router }, createElement(EmployeeSearchTable, { employees })));
}

test("the full employee dataset is counted while the DOM stays bounded", () => {
  const employees = Array.from({ length: 178_891 }, (_, index) => ({
    employeeId: String(index + 1), firstName: `Employee-${index + 1}`, lastName: "Test", accessFields: {},
  } as EmployeeSummary));
  const html = render(employees);
  assert.match(html, /Record: 1 of 178,891/);
  assert.match(html, /Employee-1</);
  assert.doesNotMatch(html, /Employee-1000</);
  assert.ok((html.match(/<tr\b/g) ?? []).length < 60, "Only the visible window and spacer rows should render");
  assert.match(html, /ac-customer-search-virtual-spacer/);
});

test("an empty employee dataset keeps the empty-state message", () => {
  const html = render([]);
  assert.match(html, /No employees found/);
  assert.match(html, /Record: 0 of 0/);
  assert.doesNotMatch(html, /ac-customer-search-virtual-spacer/);
});

test("source-derived default values render in the matching Access columns", () => {
  const html = render([employee({ accessFields: {
    PayrollCoOnSiteInitials_IPG: "IPG", JobApplicationStatus_IPG: "RTG", EmployeeProfileType: "Main",
    S1: "Ready", EmHowReferred: "Indeed", EmQualification: "Licensed", FirstDateOnJob: "08/15/2026",
    TotalHoursWorked: "4,138.75", AvgHrsWorked: "36.20", EmMobilePhoneVerifyText: "X",
  } })]);
  for (const value of ["IPG", "RTG", "Ready", "Indeed", "Licensed", "08/15/2026", "4,138.75", "36.20"]) {
    assert.ok(html.includes(`>${value}<`), value);
  }
  assert.match(html, /ac-employee-search-col-ipg/);
  assert.match(html, /ac-employee-search-col-ipc/);
});
