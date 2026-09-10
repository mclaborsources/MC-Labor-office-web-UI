import { z } from "zod";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { isLocalMode } from "../auth/mode";
import path from "node:path";

export const localAccountFile = path.join(process.cwd(), ".local-config", "account.json");

function parsePasswordHash(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) return undefined;

  // bcrypt hashes start with $2a$, $2b$, or $2y$
  if (/^\$2[aby]\$/.test(trimmed)) {
    return trimmed;
  }

  // Optional: store hash as base64 to avoid $ expansion in .env files
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    if (/^\$2[aby]\$/.test(decoded)) {
      return decoded;
    }
  } catch {
    // ignore invalid base64
  }

  return trimmed;
}

const envSchema = z.object({
  SQL_SERVER: z.string().default(""),
  SQL_DATABASE: z.string().default(""),
  SQL_USER: z.string().default(""),
  SQL_PASSWORD: z.string().default(""),
  SQL_ENCRYPT: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  SQL_TRUST_CERT: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  // Master kill-switch for all write workflows. Defaults to FALSE so writes stay
  // disabled until the architecture decision is approved (Phase B). See
  // docs/ARCHITECTURE_DECISION.md.
  WRITES_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  SESSION_SECRET: z.string().min(32),
  DEV_LOGIN_USERNAME: z.string().min(1),
  DEV_LOGIN_PASSWORD_HASH: z.preprocess(
    parsePasswordHash,
    z.string().min(1).regex(/^\$2[aby]\$/, "Must be a bcrypt hash"),
  ),
  DEV_LOGIN_DISPLAY_NAME: z.string().optional().default("Dev User"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const local = existsSync(localAccountFile) ? JSON.parse(readFileSync(localAccountFile, "utf8")) : {};
  const input = { ...process.env, ...local };
  if (isLocalMode() && !input.SESSION_SECRET) {
    const secretFile = path.join(process.cwd(), ".local-config", "session-secret");
    mkdirSync(path.dirname(secretFile), { recursive: true, mode: 0o700 });
    try {
      writeFileSync(secretFile, randomBytes(48).toString("hex"), { flag: "wx", mode: 0o600 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    input.SESSION_SECRET = readFileSync(secretFile, "utf8");
  }
  const schema = isLocalMode() ? envSchema.extend({
    DEV_LOGIN_USERNAME: z.string().default("local"),
    DEV_LOGIN_PASSWORD_HASH: z.string().default(""),
  }) : envSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Missing or invalid environment variables: ${missing}. See .env.example (bcrypt hashes need \\$ escaping or base64).`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function needsAccountSetup() {
  if (isLocalMode()) return false;
  if (existsSync(localAccountFile)) return false;
  return !envSchema.safeParse(process.env).success;
}

/** Safe subset for client — never includes SQL credentials */
export function getPublicConfig() {
  return {
    appName: "MC Labor",
  };
}
