import assert from "node:assert/strict";
import test from "node:test";
import { filterCustomerSearch1Rows } from "./customerSearch1Filters";
import { toCustomerNameMatch } from "./customerNameSearchData";

const rows = [
  toCustomerNameMatch({ customerId: 1, customerName: "Alpha", state: "MA", customerType: "Electrical", custStatus: "Active", lastWeekEnding: "10/16/2026", ctcEmail: "shared@example.test", lastActionNote: "Requested an estimate" }),
  toCustomerNameMatch({ customerId: 2, customerName: "Beta", state: "NH", customerType: "Plumbing", custStatus: "Active", lastWeekEnding: "10/23/2026", ctcEmail: "shared@example.test" }),
  toCustomerNameMatch({ customerId: 3, customerName: "Gamma", state: "MA", customerType: "Electrical", custStatus: "Inactive" }),
];
const ids = (filtered: typeof rows) => filtered.map(row => row.customerId);

test("loaded search finds contact and note fields and combines with exact filters", () => {
  assert.deepEqual(ids(filterCustomerSearch1Rows(rows, { search: "ESTIMATE", state: "MA" })), ["1"]);
  assert.deepEqual(ids(filterCustomerSearch1Rows(rows, { search: "shared@example.test" })), ["1", "2"]);
  assert.deepEqual(ids(filterCustomerSearch1Rows(rows, { customerType: "Electrical", custStatus: "Active" })), ["1"]);
});
test("tracking and inclusive end-date filters exclude records without a matching week", () => {
  assert.deepEqual(ids(filterCustomerSearch1Rows(rows, { inTracking: "no" })), ["3"]);
  assert.deepEqual(ids(filterCustomerSearch1Rows(rows, { fromDate: "2026-10-16", toDate: "2026-10-16" })), ["1"]);
  assert.deepEqual(ids(filterCustomerSearch1Rows(rows, { inTracking: "yes", fromDate: "2026-10-17" })), ["2"]);
});
test("duplicate filtering ignores blank fields and clearing retains the entire dataset", () => {
  assert.deepEqual(ids(filterCustomerSearch1Rows(rows, { duplicates: "ctcEmail" })), ["1", "2"]);
  assert.deepEqual(ids(filterCustomerSearch1Rows(rows, { duplicates: "street" })), []);
  assert.equal(filterCustomerSearch1Rows(rows, {}).length, rows.length);
  assert.equal(rows.length, 3);
});
