import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { getPool, queryReadOnlyUncached } from "@/lib/db/sql";
import { ensureCustomerSavedViewsTable, saveCustomerSavedView, deleteCustomerSavedView } from "@/lib/customerSavedViewsDb";
import { customerSavedViewSchema, customerViewLayoutSchema, normalizeCustomerSavedView } from "@/lib/customerSavedViews";
export const runtime = "nodejs";
async function userKey() {
  const session = await requireSession();
  return session.user!.officeStaffId ? `staff:${session.user!.officeStaffId}` : session.user!.userId;
}
function failure(error:unknown) {
  if(error instanceof Error && error.message === "Unauthorized") return NextResponse.json({error:"Sign in to save views."},{status:401});
  if(error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({error:"The view settings are invalid."},{status:400});
  if(error instanceof Error && error.message === "You do not have permission to delete data.") return NextResponse.json({error:"Your account cannot delete saved views."},{status:403});
  const sqlError=error as {number?:number;originalError?:{info?:{number?:number}};precedingErrors?:Array<{number?:number}>};
  const sqlNumber=sqlError?.number ?? sqlError?.originalError?.info?.number ?? sqlError?.precedingErrors?.[0]?.number;
  if(sqlNumber===208) return NextResponse.json({error:"The saved-views table is missing from this database. Ask an administrator to run scripts/sql/customer-saved-views.sql."},{status:503});
  if(sqlNumber===229 || sqlNumber===230) return NextResponse.json({error:"The app’s SQL account needs SELECT, INSERT, UPDATE, and DELETE access to dbo.WebCustomerSavedView."},{status:503});
  if(sqlNumber===916) return NextResponse.json({error:"The app’s SQL account cannot access the configured database. Check the connection’s database access."},{status:503});
  if(sqlNumber===1205 || sqlNumber===2601 || sqlNumber===2627) return NextResponse.json({error:"This view changed in another session. Reload the saved views and try again."},{status:409});
  console.error("[customer-saved-views]",error);
  return NextResponse.json({error:"The database could not save or load your views. Please retry."},{status:500});
}
export async function GET() {
  try {
    const key=await userKey();
    await ensureCustomerSavedViewsTable(await getPool());
    const rows=await queryReadOnlyUncached<{slot:number;name:string;layout:string}>("SELECT Slot AS slot, ViewName AS name, LayoutJson AS layout FROM dbo.WebCustomerSavedView WHERE UserKey=@user ORDER BY Slot",[{name:"user",value:key}]);
    return NextResponse.json({views:rows.map(row=>normalizeCustomerSavedView({...row,layout:JSON.parse(row.layout)}))},{headers:{"Cache-Control":"private, no-store"}});
  } catch(error) {return failure(error);}
}
export async function PUT(request:Request) {
  if(!hasSameOrigin(request)) return NextResponse.json({error:"Invalid request origin."},{status:403});
  try {
    const key=await userKey();
    const text=await request.text();
    if(text.length>1000000) return NextResponse.json({error:"View settings are too large."},{status:413});
    const view=customerSavedViewSchema.parse(JSON.parse(text));
    await ensureCustomerSavedViewsTable(await getPool());
    await saveCustomerSavedView(await getPool(),key,view.slot,view.name,JSON.stringify(customerViewLayoutSchema.parse(view.layout)));
    return NextResponse.json({view});
  }catch(error){return failure(error);}
}
export async function DELETE(request:Request) {
  if(!hasSameOrigin(request)) return NextResponse.json({error:"Invalid request origin."},{status:403});
  try {
    const key=await userKey();
    const {slot}=z.object({slot:z.number().int().min(1).max(64)}).parse(await request.json());
    await deleteCustomerSavedView(await getPool(),key,slot);
    return NextResponse.json({ok:true});
  }catch(error){return failure(error);}
}
