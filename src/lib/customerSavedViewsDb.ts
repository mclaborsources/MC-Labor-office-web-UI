import sql from "mssql";
import { randomUUID } from "node:crypto";
import type { QueryParam } from "@/types/db";

/**
 * Provision the small app-owned table used for saved view layouts. This runs
 * when the SQL connection is first set up and as a fallback when the view API
 * is first opened. It is idempotent and does not touch customer records.
 */
export async function ensureCustomerSavedViewsTable(pool: sql.ConnectionPool) {
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.WebCustomerSavedView', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.WebCustomerSavedView (
        UserKey nvarchar(128) NOT NULL,
        Slot int NOT NULL CHECK (Slot BETWEEN 1 AND 64),
        ViewName nvarchar(80) NOT NULL,
        LayoutJson nvarchar(max) NOT NULL CHECK (ISJSON(LayoutJson)=1),
        UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_WebCustomerSavedView PRIMARY KEY (UserKey, Slot)
      );
    END;
  `);
}

/** Confirm the configured app account can use the view table without keeping
 * any probe data. Everything runs in a transaction that is always rolled back.
 */
export async function verifyCustomerSavedViewsAccess(pool: sql.ConnectionPool) {
  const transaction = new sql.Transaction(pool);
  const userKey = `__mc_setup_${randomUUID()}`;
  await transaction.begin();
  try {
    const insert = new sql.Request(transaction);
    insert.input("user",userKey).input("slot",64).input("name","Permission check").input("layout","{}");
    await insert.query("INSERT INTO dbo.WebCustomerSavedView(UserKey,Slot,ViewName,LayoutJson) VALUES(@user,@slot,@name,@layout)");
    const update = new sql.Request(transaction);
    update.input("user",userKey).input("slot",64);
    await update.query("UPDATE dbo.WebCustomerSavedView SET ViewName=N'Permission check updated' WHERE UserKey=@user AND Slot=@slot");
    const select = new sql.Request(transaction);
    select.input("user",userKey).input("slot",64);
    await select.query("SELECT ViewName FROM dbo.WebCustomerSavedView WHERE UserKey=@user AND Slot=@slot");
    const remove = new sql.Request(transaction);
    remove.input("user",userKey).input("slot",64);
    await remove.query("DELETE FROM dbo.WebCustomerSavedView WHERE UserKey=@user AND Slot=@slot");
    await transaction.rollback();
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
}

async function savedViewTransaction<T>(pool: sql.ConnectionPool, work: (run: (query:string, params?:QueryParam[])=>Promise<sql.IResult<unknown>>)=>Promise<T>) {
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const run = async (query:string, params?:QueryParam[]) => {
      const request = new sql.Request(transaction);
      for (const param of params ?? []) request.input(param.name, param.value);
      return request.query(query);
    };
    const result = await work(run);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
}

/** Saved layouts are user preferences, so WRITES_ENABLED for business records
 * does not disable them. The caller must provide the authenticated user's key.
 */
export async function saveCustomerSavedView(pool:sql.ConnectionPool, userKey:string, slot:number, name:string, layout:string) {
  await savedViewTransaction(pool, async run => {
    await run(`UPDATE dbo.WebCustomerSavedView WITH (UPDLOCK,SERIALIZABLE)
      SET ViewName=@name,LayoutJson=@layout,UpdatedAt=SYSUTCDATETIME()
      WHERE UserKey=@user AND Slot=@slot;
      IF @@ROWCOUNT=0 INSERT INTO dbo.WebCustomerSavedView(UserKey,Slot,ViewName,LayoutJson)
      VALUES(@user,@slot,@name,@layout);`,[
      {name:"user",value:userKey},{name:"slot",value:slot},{name:"name",value:name},{name:"layout",value:layout},
    ]);
  });
}

export async function deleteCustomerSavedView(pool:sql.ConnectionPool, userKey:string, slot:number) {
  await savedViewTransaction(pool, run => run(
    "DELETE FROM dbo.WebCustomerSavedView WHERE UserKey=@user AND Slot=@slot",
    [{name:"user",value:userKey},{name:"slot",value:slot}],
  ));
}
