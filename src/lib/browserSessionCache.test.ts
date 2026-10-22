import assert from "node:assert/strict";
import test from "node:test";
import { BrowserSessionCache } from "./browserSessionCache";

test("route revisits share pending and completed downloads until refresh", async () => {
  const cache = new BrowserSessionCache();
  let calls = 0;
  const load = async () => { calls++; return ["customer"]; };
  const first = cache.get("login1", "all", load);
  assert.equal(cache.get("login1", "all", load), first);
  const data = await first;
  assert.equal(await cache.get("login1", "all", load), data);
  assert.equal(calls, 1);
  cache.clear();
  await cache.get("login1", "all", load);
  assert.equal(calls, 2);
  await cache.get("login2", "all", load);
  assert.equal(calls, 3);
});

test("failed requests can retry and different searches stay separate", async () => {
  const cache = new BrowserSessionCache();
  await assert.rejects(cache.get("login", "all", async () => { throw new Error("offline"); }));
  assert.equal(await cache.get("login", "all", async () => 1), 1);
  assert.equal(await cache.get("login", "filtered", async () => 2), 2);
});
