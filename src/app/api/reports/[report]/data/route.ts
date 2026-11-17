import {NextRequest,NextResponse} from "next/server";
import {requireSession} from "@/lib/auth/session";
import {withFreshDatabaseReads} from "@/lib/db/sql";
import {accountingDataLoaders} from "@/lib/accountingReportData";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{report:string}>}){
 try{await requireSession();const {report}=await params;
 if(!Object.prototype.hasOwnProperty.call(accountingDataLoaders,report))return NextResponse.json({ok:false,error:"Unknown report."},{status:404});
 const criteria=Object.fromEntries(request.nextUrl.searchParams);
 const result=await withFreshDatabaseReads<unknown>(()=>accountingDataLoaders[report as keyof typeof accountingDataLoaders](criteria));
 return NextResponse.json({ok:true,...(Array.isArray(result)?{rows:result,criteria}:(result as {rows:unknown[];criteria:Record<string,string|undefined>}))},{headers:{"Cache-Control":"no-store"}});
 }catch(error){const unauthorized=error instanceof Error&&error.message==="Unauthorized";return NextResponse.json({ok:false,error:unauthorized?"Sign-in required.":"Report data could not be fetched. Check the filters and database connection."},{status:unauthorized?401:500,headers:{"Cache-Control":"no-store"}});}
}
