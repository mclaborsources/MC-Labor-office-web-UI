import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("first run needs an account; saved local credentials work without an env file", async () => {
  const cwd = process.cwd();
  const original = { ...process.env };
  const temporary = await mkdtemp(path.join(tmpdir(), "mc-labor-account-test-"));
  try {
    process.chdir(temporary);
    delete process.env.SESSION_SECRET;
    delete process.env.DEV_LOGIN_USERNAME;
    delete process.env.DEV_LOGIN_PASSWORD_HASH;
    const { needsAccountSetup, getEnv, localAccountFile } = await import("./env");
    assert.equal(needsAccountSetup(), true);
    Object.assign(process.env, { SESSION_SECRET: "a".repeat(48), DEV_LOGIN_USERNAME: "existing", DEV_LOGIN_PASSWORD_HASH: "$2b$12$example" });
    assert.equal(needsAccountSetup(), false);
    delete process.env.DEV_LOGIN_PASSWORD_HASH;
    assert.equal(needsAccountSetup(), true);
    await mkdir(path.dirname(localAccountFile));
    await writeFile(localAccountFile, JSON.stringify({ SESSION_SECRET: "b".repeat(48), DEV_LOGIN_USERNAME: "office-admin", DEV_LOGIN_PASSWORD_HASH: "$2b$12$example" }));
    assert.equal(needsAccountSetup(), false);
    assert.equal(getEnv().DEV_LOGIN_USERNAME, "office-admin");
    assert.equal(getEnv().SESSION_SECRET, "b".repeat(48));
    assert.equal(getEnv().SESSION_SECRET, getEnv().SESSION_SECRET);
  } finally {
    process.chdir(cwd);
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
    await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
