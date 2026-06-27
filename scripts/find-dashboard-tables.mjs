import fs from "fs";
import sql from "mssql";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const pool = await sql.connect({
  server: env.SQL_SERVER,
  database: env.SQL_DATABASE,
  user: env.SQL_USER,
  password: env.SQL_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true },
});

const patterns = ["%Policy%", "%Note%", "%Zip%", "%Map%", "%Menu%", "%Office%"];
for (const p of patterns) {
  const r = await pool.request().input("p", p).query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE @p
    ORDER BY TABLE_NAME`);
  if (r.recordset.length) {
    console.log(`\n${p}:`, r.recordset.map((x) => x.TABLE_NAME).join(", "));
  }
}

const cols = await pool.request().query(`
  SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE COLUMN_NAME LIKE '%Policy%' OR COLUMN_NAME LIKE '%ZipCode%' OR COLUMN_NAME LIKE '%MenuView%'
  ORDER BY TABLE_NAME, COLUMN_NAME`);
console.log("\nColumns:", cols.recordset.slice(0, 40));

await pool.close();
