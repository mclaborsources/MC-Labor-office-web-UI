import assert from "node:assert/strict";
import test from "node:test";
import { toCustomerNameMatch } from "./customerNameSearchData";
import { packCustomers, unpackCustomers } from "./customerSearchTransport";

test("transport preserves every customer, boolean, Unicode and full multiline note", () => {
  const rows = Array.from({ length: 1000 }, (_, index) => toCustomerNameMatch({
    customerId: index + 1, customerName: `Customer ${index}`, noCommunication: index % 2 === 0,
    futureCallHistory: 'Full history\n"Quoted" — José <script> & more', lastActionNote: "Repeated full note",
  }));
  const packed = packCustomers(rows);
  assert.deepEqual(unpackCustomers(packed), rows);
  assert.ok(packed.length < JSON.stringify(rows).length / 2);
  assert.deepEqual(unpackCustomers(packCustomers([])), []);
});
