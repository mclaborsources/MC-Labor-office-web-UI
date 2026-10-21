import assert from "node:assert/strict";
import test from "node:test";
import { CUSTOMER_NAME_SEARCH_COLUMNS, compareCustomerNameValues, customerNameCellValue } from "./customerNameSearchColumns";
import { toCustomerNameMatch } from "./customerNameSearchData";

test("the expanded customer list includes all 22 requested columns without dropping the original nine", () => {
  assert.equal(CUSTOMER_NAME_SEARCH_COLUMNS.length, 31);
  assert.equal(new Set(CUSTOMER_NAME_SEARCH_COLUMNS.map(column => column.key)).size, 31);
  assert.deepEqual(CUSTOMER_NAME_SEARCH_COLUMNS.slice(9).map(column => column.key), [
    "firstWeekEnding", "lastWeekEnding", "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady",
    "custStatus", "salesAdmin", "act", "futureCallUser", "futureCallUserDate", "futureCall", "futureCallHistory",
    "futureCallUserTime", "lastActionUser", "lastActionDate", "lastAction", "lastActionNote",
    "ctcFirst", "ctcLast", "ctcTitle", "ctcEmail", "ctcCell",
  ]);
});

test("mapping preserves a real zero action count, booleans and multiline history, with blanks for missing contacts", () => {
  const row = toCustomerNameMatch({ customerId: 42, customerName: " Example ", noCommunication: true,
    act: 0, futureCallHistory: "2026-10-21 user: Follow up\n2026-10-20 user: Call", ctcFirst: null });
  assert.equal(row.customerId, "42");
  assert.equal(row.customerName, "Example");
  assert.equal(row.act, "0");
  assert.equal(row.ctcFirst, "");
  assert.equal(customerNameCellValue(row, "noCommunication"), "Yes");
  assert.match(row.futureCallHistory, /Follow up\n2026-10-20/);
  assert.equal(Object.keys(row).length, 32);
});

test("new dates sort across years and action counts sort numerically", () => {
  assert.ok(compareCustomerNameValues("12/31/2025", "01/01/2026", "date") < 0);
  assert.ok(compareCustomerNameValues("2", "10", "number") < 0);
  assert.ok(compareCustomerNameValues("alice", "Bob", "text") < 0);
  assert.ok(Number.isFinite(compareCustomerNameValues("", "01/01/2026", "date")));
});
