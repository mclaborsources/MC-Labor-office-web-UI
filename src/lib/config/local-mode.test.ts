import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("local launch skips account setup and persists a secret without login credentials", async () => {
  const cwd = process.cwd();
  const original = { ...process.env };
  const temporary = await mkdtemp(path.join(tmpdir(), "mc-labor-local-test-"));
  try {
    process.chdir(temporary);
    process.env.MC_LABOR_LOCAL_MODE = "1";
    delete process.env.SESSION_SECRET;
    delete process.env.DEV_LOGIN_USERNAME;
    delete process.env.DEV_LOGIN_PASSWORD_HASH;
    const { needsAccountSetup, getEnv } = await import("./env");
    assert.equal(needsAccountSetup(), false);
    const env = getEnv();
    assert.ok(env.SESSION_SECRET.length >= 32);
    assert.equal(await readFile(path.join(temporary, ".local-config", "session-secret"), "utf8"), env.SESSION_SECRET);
    assert.equal(env.DEV_LOGIN_PASSWORD_HASH, "");
    assert.equal(getEnv().SESSION_SECRET, env.SESSION_SECRET);
  } finally {
    process.chdir(cwd);
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
    await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
