import sql from "mssql";
import { getEnv } from "@/lib/config/env";
import type { QueryParam } from "@/types/db";

let pool: sql.ConnectionPool | null = null;
let poolPromise: Promise<sql.ConnectionPool> | null = null;

function buildConfig(): sql.config {
  const env = getEnv();
  return {
    server: env.SQL_SERVER,
    database: env.SQL_DATABASE,
    user: env.SQL_USER,
    password: env.SQL_PASSWORD,
    requestTimeout: 60000, // 60 s — tblProject JOIN queries can be slow without indexes
    options: {
      encrypt: env.SQL_ENCRYPT,
      trustServerCertificate: env.SQL_TRUST_CERT,
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
    poolPromise = sql.connect(buildConfig()).then((connectedPool) => {
      pool = connectedPool;
      return connectedPool;
    });
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
  if (pool) {
    await pool.close();
    pool = null;
    poolPromise = null;
  }
}
