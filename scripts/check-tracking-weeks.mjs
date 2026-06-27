import dotenv from "dotenv";
import sql from "mssql";

dotenv.config({ path: ".env.local" });

const config = {
  server: process.env.SQL_SERVER || "localhost",
  database: process.env.SQL_DATABASE || "McLabor",
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: process.env.SQL_ENCRYPT === "true",
    trustServerCertificate: process.env.SQL_TRUST_CERT !== "false",
  },
};

const pool = await sql.connect(config);

const recent = await pool.request().query(`
  SELECT TOP 15 AssignYear, AssignWeek, COUNT(*) AS cnt
  FROM tblTracking WITH (NOLOCK)
  GROUP BY AssignYear, AssignWeek
  ORDER BY AssignYear DESC, AssignWeek DESC
`);
console.log("Recent weeks in tblTracking:");
console.table(recent.recordset);

for (const [week, year] of [
  [25, 2026],
  [26, 2026],
  [24, 2026],
]) {
  const r = await pool
    .request()
    .input("week", sql.Int, week)
    .input("year", sql.Int, year)
    .query(
      "SELECT COUNT(*) AS cnt FROM tblTracking WHERE AssignWeek=@week AND AssignYear=@year",
    );
  console.log(`Rows for week ${week}/${year}:`, r.recordset[0].cnt);
}

const total = await pool.request().query("SELECT COUNT(*) AS cnt FROM tblTracking");
console.log("Total tblTracking rows:", total.recordset[0].cnt);

await pool.close();
