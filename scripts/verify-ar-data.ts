import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
loadEnvConfig(process.cwd());
async function main() {
  const { queryReadOnlyUncached, closePool } = await import("../src/lib/db/sql");
  try {
    const { getAccountsReceivableRows } = await import("../src/lib/accountsReceivable");
    const rows = await getAccountsReceivableRows();
    const [source] = await queryReadOnlyUncached<{ total: number }>(`SELECT SUM(CAST(OpenBalance AS decimal(18,2))) total FROM tblQBOpenInvoices WHERE InvoiceDate IS NOT NULL AND OpenBalance>0`);
    const cents = (value: number) => Math.round(value * 100);
    assert.equal(rows.reduce((sum, row) => sum + cents(row.totalOwed), 0), cents(source.total));
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
    for (const row of rows) assert.equal(cents(row.under30) + cents(row.over30), cents(row.totalOwed));
    const coverage = Object.fromEntries(Object.keys(rows[0] ?? {}).map(key => [key, rows.filter(row => row[key as keyof typeof row] !== null && row[key as keyof typeof row] !== "").length]));
    console.log(JSON.stringify({ customers: rows.length, balanceReconciled: true, populatedRowsByColumn: coverage }));
  } finally { await closePool(); }
}
main().catch(error => { console.error("AR data verification failed:", error instanceof Error ? error.message : "Unknown error"); process.exitCode = 1; });
