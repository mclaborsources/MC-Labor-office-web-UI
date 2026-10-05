import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { clearReadCache } from "@/lib/db/sql";
import { queryWrite } from "@/lib/db/write";
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string;historyId:string}>}){
  try{await requireSession()}catch{return NextResponse.json({ok:false,error:"Sign in required."},{status:403})}
  const {id,historyId}=await params;const accidentId=Number(id),noteId=Number(historyId);if(!Number.isInteger(accidentId)||accidentId<=0||!Number.isInteger(noteId)||noteId<=0)return NextResponse.json({ok:false,error:"Invalid contact history ID."},{status:400});
  try{const affected=await queryWrite(`DELETE FROM tblProjectAccidentReportContactHistory WHERE ProjectAccidentReportContactHistoryID=@noteId AND ProjectAccidentReportID=@id`,[{name:"noteId",value:noteId},{name:"id",value:accidentId}]);if(!affected)return NextResponse.json({ok:false,error:"Contact history entry was not found."},{status:404});clearReadCache();return NextResponse.json({ok:true})}catch(error){const message=error instanceof Error?error.message:"Unable to delete contact history.";return NextResponse.json({ok:false,error:message},{status:message.includes("Write operations are disabled")?503:500})}
}
