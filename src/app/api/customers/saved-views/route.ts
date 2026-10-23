import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { queryReadOnlyUncached } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";
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
  if(error instanceof WritesDisabledError) return NextResponse.json({error:"Database writes are disabled. Your view was not saved."},{status:403});
  console.error("[customer-saved-views]",error);
  return NextResponse.json({error:"The database could not save or load your views. Please retry."},{status:500});
}
export async function GET() {
  try {
    const key=await userKey();
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
    await withTransaction(async run=>{
      await run(`UPDATE dbo.WebCustomerSavedView WITH (UPDLOCK,SERIALIZABLE) SET ViewName=@name,LayoutJson=@layout,UpdatedAt=SYSUTCDATETIME() WHERE UserKey=@user AND Slot=@slot;
        IF @@ROWCOUNT=0 INSERT INTO dbo.WebCustomerSavedView(UserKey,Slot,ViewName,LayoutJson) VALUES(@user,@slot,@name,@layout);`,[
        {name:"user",value:key},{name:"slot",value:view.slot},{name:"name",value:view.name},{name:"layout",value:JSON.stringify(customerViewLayoutSchema.parse(view.layout))}]);
    });
    return NextResponse.json({view});
  }catch(error){return failure(error);}
}
export async function DELETE(request:Request) {
  if(!hasSameOrigin(request)) return NextResponse.json({error:"Invalid request origin."},{status:403});
  try {
    const key=await userKey();
    const {slot}=z.object({slot:z.number().int().min(1).max(64)}).parse(await request.json());
    await withTransaction(async run=>{await run("DELETE FROM dbo.WebCustomerSavedView WHERE UserKey=@user AND Slot=@slot",[{name:"user",value:key},{name:"slot",value:slot}]);});
    return NextResponse.json({ok:true});
  }catch(error){return failure(error);}
}
