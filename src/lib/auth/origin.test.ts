import { test } from "node:test";
import assert from "node:assert/strict";
import { hasSameOrigin } from "./origin";

test("accept browser-facing host even when Next uses an internal listen address", () => {
  assert.equal(hasSameOrigin(new Request("http://0.0.0.0:3000/api/admin/connection", { headers: { host: "localhost:3000", origin: "http://localhost:3000" } })), true);
  assert.equal(hasSameOrigin(new Request("http://localhost:3000/api/admin/connection", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } })), true);
});
test("reject external, missing, null, wrong-port and wrong-scheme origins", () => {
  for (const origin of ["https://evil.example", "null", "http://localhost:4000", "https://localhost:3000"]) {
    assert.equal(hasSameOrigin(new Request("http://localhost:3000/api/admin/connection", { headers: { host: "localhost:3000", origin } })), false);
  }
  assert.equal(hasSameOrigin(new Request("http://localhost:3000/api/admin/connection")), false);
});
