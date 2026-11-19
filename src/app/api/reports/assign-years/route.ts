import {NextResponse} from "next/server";
import {requireSession} from "@/lib/auth/session";
import {queryReadOnly} from "@/lib/db/sql";
export async function GET(){try{await requireSession();const years=await queryReadOnly<{year:string;min:string;max:string}>("SELECT CAST(AssignYear AS varchar(4)) year,CONVERT(varchar(10),MIN(WeekEndingDate),101) min,CONVERT(varchar(10),MAX(WeekEndingDate),101) max FROM dbo.tblTracking WITH (NOLOCK) WHERE AssignYear IS NOT NULL GROUP BY AssignYear ORDER BY AssignYear DESC");return NextResponse.json({years});}catch{return NextResponse.json({error:"Assign years could not be loaded."},{status:503});}}
