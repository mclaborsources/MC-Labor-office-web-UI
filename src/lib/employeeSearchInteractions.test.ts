import assert from "node:assert/strict";
import test from "node:test";
import { compareEmployeesAccessOrder, filterEmployeeSearch } from "./employeeSearchInteractions";
import type { EmployeeSummary } from "@/types/employee";

const employee = (values: Partial<EmployeeSummary>): EmployeeSummary => ({ firstName: "", middleInitial: "", lastName: "", fullName: "", cellPhone: "", email: "", weekEnding: "", accessFields: {}, ...values } as EmployeeSummary);

test("employee sidebar combines name, formatted phone, email, text and license filters", () => {
  const rows = [employee({ firstName: "José", lastName: "Smith", cellPhone: "(617) 555-1212", email: "js@example.com", accessFields: { TextMsgAddress2: "6175551212@carrier.com", EmLicenseNum: "MA-12345" } }), employee({ firstName: "Other" })];
  assert.equal(filterEmployeeSearch(rows, { Name: "JOSÉ SMITH", "Cell #": "617-555", Email: "EXAMPLE", Text: "carrier", "Lic #": "12345" }).length, 1);
  assert.equal(filterEmployeeSearch(rows, { "Cell #": "abc" }).length, 0);
  assert.equal(filterEmployeeSearch(rows, {}).length, 2);
  assert.equal(filterEmployeeSearch(rows, { "Lic #": "missing" }).length, 0);
});

test("Access Sort orders latest week first, then first, last and middle names", () => {
  const rows = [employee({ firstName: "Z", weekEnding: "10/16/2026" }), employee({ firstName: "Ben", weekEnding: "10/23/2026" }), employee({ firstName: "Amy", lastName: "Smith", middleInitial: "Z", weekEnding: "10/23/2026" }), employee({ firstName: "Amy", lastName: "Smith", middleInitial: "A", weekEnding: "10/23/2026" })];
  assert.deepEqual([...rows].sort(compareEmployeesAccessOrder).map(row => `${row.firstName}${row.middleInitial}`), ["AmyA", "AmyZ", "Ben", "Z"]);
});
