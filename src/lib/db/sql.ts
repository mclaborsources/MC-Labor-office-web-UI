import sql from "mssql";
import { getDatabaseSettings, type DatabaseSettings } from "@/lib/config/database";
import type { QueryParam } from "@/types/db";

let pool: sql.ConnectionPool | null = null;
let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function buildConfig(settings?: DatabaseSettings): sql.config {
  const env = settings ?? getDatabaseSettings();
  if (!env) throw new Error("SQL Server setup is required.");
  return {
    server: env.server,
    database: env.database,
    user: env.user,
    password: env.password,
    port: env.port,
    connectionTimeout: 10000,
    requestTimeout: 60000, // 60 s — tblProject JOIN queries can be slow without indexes
    options: {
      encrypt: env.encrypt,
      trustServerCertificate: env.trustServerCertificate,
      ...(env.instance ? { instanceName: env.instance } : {}),
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool?.connected) return pool;

  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(buildConfig()).connect().then((connectedPool) => {
      pool = connectedPool;
      return connectedPool;
    }).catch((error) => { poolPromise = null; throw error; });
  }

  return poolPromise;
}

function isReadOnlyQuery(query: string): boolean {
  const normalized = query.trim().replace(/^\s*--.*$/gm, "").trim();
  const firstToken = normalized.split(/\s+/)[0]?.toUpperCase();
  return firstToken === "SELECT" || firstToken === "WITH";
}

export async function queryReadOnly<T = Record<string, unknown>>(
  query: string,
  params?: QueryParam[],
): Promise<T[]> {
  if (!isReadOnlyQuery(query)) {
    throw new Error("Only read-only SELECT queries are allowed in Phase 1.");
  }

  const connection = await getPool();
  const request = connection.request();

  if (params) {
    for (const param of params) {
      request.input(param.name, param.value);
    }
  }

  const result = await request.query<T>(query);
  return result.recordset ?? [];
}

export async function testConnection(): Promise<{
  ok: boolean;
  database?: string;
  error?: string;
}> {
  try {
    const rows = await queryReadOnly<{ ok: number; db: string }>(
      "SELECT 1 AS ok, DB_NAME() AS db",
    );
    const row = rows[0];
    if (!row || row.ok !== 1) {
      return { ok: false, error: "Database health check returned unexpected result." };
    }
    return { ok: true, database: row.db };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to connect to database.";
    console.error("[db] Connection test failed:", message);
    return { ok: false, error: "Database connection failed." };
  }
}

export async function closePool(): Promise<void> {
  const previous = poolPromise;
  pool = null;
  poolPromise = null;
  const connected = await previous?.catch(() => null);
  await connected?.close();
}
