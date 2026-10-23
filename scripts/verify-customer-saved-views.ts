import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
loadEnvConfig(process.cwd());
async function main() {
 const {queryWrite,withTransaction}=await import("../src/lib/db/write");
 const {getPool,queryReadOnlyUncached}=await import("../src/lib/db/sql");
 const {defaultCustomerViewLayout,customerSavedViewSchema}=await import("../src/lib/customerSavedViews");
 try {
  await queryWrite(readFileSync("scripts/sql/customer-saved-views.sql","utf8"));
  console.log("Saved-view table is installed.");
  const rollback=new Error("test rollback");
  try {await withTransaction(async run=>{
   const layout=defaultCustomerViewLayout();layout.hidden=[layout.order[1]];layout.widths[layout.order[0]]=350;
   const view=customerSavedViewSchema.parse({slot:64,name:"Roundtrip test",layout});
   const params=[{name:"user",value:"codex-validation-only"},{name:"slot",value:view.slot},{name:"name",value:view.name},{name:"layout",value:JSON.stringify(view.layout)}];
   await run("INSERT INTO dbo.WebCustomerSavedView(UserKey,Slot,ViewName,LayoutJson) VALUES(@user,@slot,@name,@layout)",params);
   await run("UPDATE dbo.WebCustomerSavedView SET ViewName='Renamed test' WHERE UserKey=@user AND Slot=@slot",params.slice(0,2));
   const result=await run("SELECT ViewName,LayoutJson FROM dbo.WebCustomerSavedView WHERE UserKey=@user AND Slot=@slot",params.slice(0,2));
   const row=result.recordset[0] as {ViewName:string;LayoutJson:string};assert.equal(row.ViewName,"Renamed test");assert.deepEqual(JSON.parse(row.LayoutJson),layout);
   const other=await run("SELECT Slot FROM dbo.WebCustomerSavedView WHERE UserKey=@user",[{name:"user",value:"different-user-validation"}]);assert.equal(other.recordset.length,0);
   throw rollback;
  });}catch(e){if(e!==rollback)throw e;}
  const rows=await queryReadOnlyUncached("SELECT Slot FROM dbo.WebCustomerSavedView WHERE UserKey=@user",[{name:"user",value:"codex-validation-only"}]);assert.equal(rows.length,0);
  console.log("Database save, rename, column-layout roundtrip, and user isolation passed; test records rolled back.");
 }finally{await (await getPool()).close();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
