import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryReadOnly, clearReadCache } from "@/lib/db/sql";
import { queryWrite, withTransaction } from "@/lib/db/write";
import { ensureAccidentIsUnique, mapAccidentPayload } from "@/lib/accidentReportPayload";

export const dynamic = "force-dynamic";
function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to save accident report.";
  return NextResponse.json({ ok:false,error:message },{status:message.includes("Write operations are disabled")?503:message.includes("required")||message.includes("valid date")||message.includes("numeric")||message.includes("already has")||message.includes("on or")||message.includes("Enter the")?400:500});
}
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireSession(); } catch { return NextResponse.json({ok:false,error:"Sign in required."},{status:403}); }
  const id = Number((await params).id); if (!Number.isInteger(id)||id<=0) return NextResponse.json({ok:false,error:"Invalid accident report ID."},{status:400});
  try { const rows=await queryReadOnly(`SELECT r.* FROM tblProjectAccidentReports r WITH (NOLOCK) WHERE r.ProjectAccidentReportID=@id`,[{name:"id",value:id}]); if(!rows[0])return NextResponse.json({ok:false,error:"Accident report not found."},{status:404}); return NextResponse.json({ok:true,data:rows[0]}); }
  catch(error){return errorResponse(error);}
}
export async function PUT(request: NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireSession();}catch{return NextResponse.json({ok:false,error:"Sign in required."},{status:403});}
  try{const id=Number((await params).id);if(!Number.isInteger(id)||id<=0)throw new Error("Invalid accident report ID.");const fields=mapAccidentPayload(await request.json());await ensureAccidentIsUnique(fields,id);const entries=Object.entries(fields);const affected=await queryWrite(`UPDATE tblProjectAccidentReports SET ${entries.map(([key])=>`[${key}]=@${key}`).join(",")} WHERE ProjectAccidentReportID=@id`,[...entries.map(([name,value])=>({name,value})),{name:"id",value:id}]);if(!affected)return NextResponse.json({ok:false,error:"Accident report was not found."},{status:404});clearReadCache();return NextResponse.json({ok:true});}catch(error){return errorResponse(error);}
}
export async function DELETE(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireSession();}catch{return NextResponse.json({ok:false,error:"Sign in required."},{status:403});}
  try{const id=Number((await params).id);if(!Number.isInteger(id)||id<=0)throw new Error("Invalid accident report ID.");await withTransaction(async run=>{await run(`DELETE FROM tblProjectAccidentReportContactHistory WHERE ProjectAccidentReportID=@id`,[{name:"id",value:id}]);await run(`DELETE FROM tblProjectAccidentReportOurCosts WHERE ProjectAccidentReportID=@id`,[{name:"id",value:id}]);const result=await run(`DELETE FROM tblProjectAccidentReports WHERE ProjectAccidentReportID=@id`,[{name:"id",value:id}]);if(!result.rowsAffected.some(count=>count>0))throw new Error("Accident report was not found.")});clearReadCache();return NextResponse.json({ok:true});}catch(error){return errorResponse(error);}
}
