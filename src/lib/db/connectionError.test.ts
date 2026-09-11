import { test } from "node:test";
import assert from "node:assert/strict";
import { connectionErrorMessage } from "./connectionError";

test("classify SQL errors including nested certificate and database errors", () => {
  assert.match(connectionErrorMessage({ code: "ESOCKET", originalError: { message: "self signed certificate" } }), /certificate validation/);
  assert.match(connectionErrorMessage({ code: "ELOGIN", originalError: { info: { number: 4060 } } }), /could not open the database/);
  assert.match(connectionErrorMessage({ code: "ELOGIN" }), /rejected the login/);
  assert.match(connectionErrorMessage({ code: "ETIMEOUT" }), /Could not reach/);
  assert.match(connectionErrorMessage({ code: "EINSTLOOKUP" }), /instance could not be found/);
});
test("never expose driver messages or credentials, and tolerate cyclic errors", () => {
  const error: Record<string, unknown> = { message: "password=private-value" };
  error.cause = error;
  assert.doesNotMatch(connectionErrorMessage(error), /private-value/);
  assert.match(connectionErrorMessage(null), /connection failed/);
});
