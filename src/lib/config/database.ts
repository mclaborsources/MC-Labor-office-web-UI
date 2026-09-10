import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getEnv } from "./env";

export const databaseSchema = z.object({
  server: z.string().trim().min(1).max(255),
  database: z.string().trim().min(1).max(128),
  user: z.string().trim().min(1).max(128),
  password: z.string().max(1024),
  port: z.number().int().min(1).max(65535).optional(),
  instance: z.string().trim().max(128).default(""),
  encrypt: z.boolean(),
  trustServerCertificate: z.boolean(),
}).refine((v) => !(v.port && v.instance), { message: "Use a port or an instance name, not both." });
export type DatabaseSettings = z.infer<typeof databaseSchema>;
const directory = path.join(process.cwd(), ".local-config");
const filename = path.join(directory, "database.enc");
function key() {
  return createHash("sha256").update(getEnv().SESSION_SECRET).digest();
}
export function getDatabaseSettings(): DatabaseSettings | null {
  if (existsSync(filename)) {
    const data = Buffer.from(readFileSync(filename, "utf8"), "base64");
    const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    return databaseSchema.parse(JSON.parse(Buffer.concat([
      decipher.update(data.subarray(28)), decipher.final(),
    ]).toString("utf8")));
  }
  const env = getEnv();
  if (!env.SQL_SERVER || !env.SQL_DATABASE || !env.SQL_USER) return null;
  return databaseSchema.parse({ server: env.SQL_SERVER, database: env.SQL_DATABASE,
    user: env.SQL_USER, password: env.SQL_PASSWORD, encrypt: env.SQL_ENCRYPT,
    trustServerCertificate: env.SQL_TRUST_CERT });
}
export async function saveDatabaseSettings(settings: DatabaseSettings) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(databaseSchema.parse(settings))), cipher.final()]);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const temporary = `${filename}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await writeFile(temporary, Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64"), { mode: 0o600 });
    await rename(temporary, filename);
  } finally {
    await rm(temporary, { force: true });
  }
}
