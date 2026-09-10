import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("database setup validates settings, preserves saved values on invalid input, and encrypts persistent overrides", async () => {
  const originalDirectory = process.cwd();
  const originalEnv = { ...process.env };
  const temporary = await mkdtemp(path.join(tmpdir(), "mc-labor-config-test-"));
  try {
    process.chdir(temporary);
    Object.assign(process.env, {
      SQL_SERVER: "", SQL_DATABASE: "", SQL_USER: "", SQL_PASSWORD: "",
      SESSION_SECRET: "test-secret-with-at-least-thirty-two-characters",
      DEV_LOGIN_USERNAME: "test", DEV_LOGIN_PASSWORD_HASH: "$2b$10$test",
    });
    const { getDatabaseSettings, saveDatabaseSettings, databaseSchema } = await import("./database");
    assert.equal(getDatabaseSettings(), null);
    const settings = { server: "192.168.4.166", database: "McLabor", user: "office", password: "sensitive-password", instance: "", encrypt: true, trustServerCertificate: false };
    assert.equal(databaseSchema.safeParse({ ...settings, port: 1433, instance: "SQLEXPRESS" }).success, false);
    assert.equal(databaseSchema.safeParse({ ...settings, port: 70000 }).success, false);
    assert.equal(databaseSchema.safeParse({ ...settings, server: " " }).success, false);
    await saveDatabaseSettings(settings);
    assert.deepEqual(getDatabaseSettings(), settings);
    const file = path.join(temporary, ".local-config", "database.enc");
    const encoded = await readFile(file, "utf8");
    assert.equal(Buffer.from(encoded, "base64").includes(Buffer.from(settings.password)), false);
    await assert.rejects(saveDatabaseSettings({ ...settings, server: "" }));
    assert.deepEqual(getDatabaseSettings(), settings);
    await saveDatabaseSettings({ ...settings, database: "Updated" });
    assert.equal(getDatabaseSettings()?.database, "Updated");
    const damaged = Buffer.from(await readFile(file, "utf8"), "base64");
    damaged[damaged.length - 1] ^= 1;
    await writeFile(file, damaged.toString("base64"));
    assert.throws(() => getDatabaseSettings());
  } finally {
    process.chdir(originalDirectory);
    for (const name of Object.keys(process.env)) if (!(name in originalEnv)) delete process.env[name];
    Object.assign(process.env, originalEnv);
    await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
