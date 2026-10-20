import assert from "node:assert/strict";
import { test } from "node:test";
import { BoundedQueryCache } from "./boundedQueryCache";

test("revisits reuse results but different session keys stay separate", async () => {
  const cache = new BoundedQueryCache(); let calls = 0;
  const load = async () => ++calls;
  assert.equal(await cache.get("session-a", load), 1);
  assert.equal(await cache.get("session-a", load), 1);
  assert.equal(await cache.get("session-b", load), 2);
  cache.clear();
  assert.equal(await cache.get("session-a", load), 3);
});
test("concurrent reads share one successful query, failures are not cached", async () => {
  const cache = new BoundedQueryCache(); let calls = 0;
  const load = async () => ++calls;
  assert.deepEqual(await Promise.all([cache.get("key",load),cache.get("key",load)]), [1,1]);
  await assert.rejects(cache.get("failure",async()=>{throw Error("offline");}));
  assert.equal(await cache.get("failure",load),2);
});
test("expiry, entry limits and oversized results evict cached data", async () => {
  const cache = new BoundedQueryCache(1000, 5, 1); let calls = 0;
  const load = async () => ++calls;
  await cache.get("a",load); await cache.get("b",load);
  assert.equal(await cache.get("a",load),3);
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(await cache.get("a",load),4);
  const tiny = new BoundedQueryCache(1); let hugeCalls=0;
  const huge=async()=>{hugeCalls++;return "large result";};
  await tiny.get("large",huge); await tiny.get("large",huge);
  assert.equal(hugeCalls,2);
});
test("a save invalidation prevents an older in-flight read from filling the cache", async () => {
  const cache = new BoundedQueryCache();
  let finish!: (value:number)=>void;
  const first = cache.get("key",()=>new Promise<number>(resolve=>{finish=resolve;}));
  await Promise.resolve();
  cache.clear();
  finish(1); await first;
  assert.equal(await cache.get("key",async()=>2),2);
});
