import sql from "mssql";
import { getPool } from "@/lib/db/sql";
import { getEnv } from "@/lib/config/env";
import type { QueryParam } from "@/types/db";

// ---------------------------------------------------------------------------
// WRITE INFRASTRUCTURE — Phase B0 (NOT YET WIRED TO ANY SCREEN).
//
// This is the ONLY module allowed to run non-SELECT SQL. It is separate from
// the read-only guard in sql.ts so reads can never accidentally gain write
// power. Every public helper is gated behind WRITES_ENABLED (default false),
// so importing this module changes nothing until writes are explicitly turned
// on AND the architecture decision (docs/ARCHITECTURE_DECISION.md) is approved.
//
// Design contract for future write workflows (Phase B1+):
//   1. Validate input in the data layer BEFORE opening a transaction.
//   2. Use parameterized statements only — never string-concatenate values.
//   3. Wrap multi-table writes in withTransaction() so they commit/rollback
//      atomically.
//   4. Never write a column that is not explicitly mapped (preserve Access data).
//   5. Stamp the matching *UserName / *Timestamp audit columns the schema already
//      carries, and append an audit row (see recordAudit()).
// ---------------------------------------------------------------------------

export class WritesDisabledError extends Error {
  constructor() {
    super(
      "Write operations are disabled. Set WRITES_ENABLED=true and complete the " +
        "architecture sign-off (docs/ARCHITECTURE_DECISION.md) before enabling writes.",
    );
    this.name = "WritesDisabledError";
  }
}

export function writesEnabled(): boolean {
  try {
    return getEnv().WRITES_ENABLED === true;
  } catch {
    return false;
  }
}

function assertWritesEnabled(): void {
  if (!writesEnabled()) throw new WritesDisabledError();
}

function applyParams(request: sql.Request, params?: QueryParam[]): void {
  if (!params) return;
  for (const p of params) request.input(p.name, p.value);
}

/**
 * Run a single parameterized write (INSERT/UPDATE/DELETE) outside a transaction.
 * Returns the number of affected rows. Gated behind WRITES_ENABLED.
 */
export async function queryWrite(query: string, params?: QueryParam[]): Promise<number> {
  assertWritesEnabled();
  const pool = await getPool();
  const request = pool.request();
  applyParams(request, params);
  const result = await request.query(query);
  return result.rowsAffected.reduce((a, b) => a + b, 0);
}

/**
 * Run a set of writes inside a single transaction. The callback receives a
 * `run(query, params)` function; if it throws, the whole transaction rolls back.
 * Gated behind WRITES_ENABLED.
 */
export async function withTransaction<T>(
  work: (run: (query: string, params?: QueryParam[]) => Promise<sql.IResult<unknown>>) => Promise<T>,
): Promise<T> {
  assertWritesEnabled();
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const run = (query: string, params?: QueryParam[]) => {
      const request = new sql.Request(transaction);
      applyParams(request, params);
      return request.query(query);
    };
    const result = await work(run);
    await transaction.commit();
    return result;
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      /* rollback best-effort */
    }
    throw err;
  }
}

/**
 * Audit strategy placeholder. Until Raymond confirms the audit/log table, this
 * helper documents the intended call site. It is a no-op so wiring it early is
 * safe; the real implementation will insert into a dedicated audit table inside
 * the same transaction as the write.
 */
export interface AuditEntry {
  table: string;
  recordId: string;
  action: "insert" | "update" | "delete";
  userName: string;
  details?: string;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  // Intentionally not implemented yet — pending audit-table confirmation (Phase B0).
  // Will run inside the caller's transaction via withTransaction's `run`.
  void entry;
}
