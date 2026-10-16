import { NextRequest, NextResponse } from "next/server";
import { getSessionOrDefault } from "@/lib/auth/session";
import { queryReadOnly } from "@/lib/db/sql";
export async function GET(request:NextRequest){
 const session=await getSessionOrDefault();if(!session.isLoggedIn||!session.user?.active)return NextResponse.json({error:"Sign in required"},{status:401});
 const name=request.nextUrl.searchParams.get('name')?.trim()??'',customer=request.nextUrl.searchParams.get('customer')?.trim()??'';
 if(!name||name.length>300||customer.length>300)return NextResponse.json({error:'Invalid job name'},{status:400});
 try{const matches=await queryReadOnly<{id:number;name:string}>(`SELECT p.ProjectID id,p.SiteName name FROM tblProject p JOIN tblCustomer c ON c.CustomerID=p.CustomerID WHERE LTRIM(RTRIM(p.SiteName))=@name AND (@customer='' OR LTRIM(RTRIM(c.CustBusName))=@customer) ORDER BY p.ProjectID`,[{name:'name',value:name},{name:'customer',value:customer}]);return NextResponse.json({matches});}catch{return NextResponse.json({error:'Job could not be located'},{status:500});}
}
