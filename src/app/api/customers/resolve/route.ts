import { NextRequest, NextResponse } from "next/server";
import { getSessionOrDefault } from "@/lib/auth/session";
import { queryReadOnly } from "@/lib/db/sql";
export async function GET(request: NextRequest) {
 const session=await getSessionOrDefault();
 if(!session.isLoggedIn||!session.user?.active)return NextResponse.json({error:"Sign in required."},{status:401});
 const name=request.nextUrl.searchParams.get("name")?.trim() ?? "";
 if(!name||name.length>300)return NextResponse.json({error:"Invalid customer name."},{status:400});
 try{const matches=await queryReadOnly<{id:number;name:string}>(`SELECT CustomerID id,CustBusName name FROM tblCustomer WHERE LTRIM(RTRIM(CustBusName))=@name ORDER BY CustomerID`,[{name:"name",value:name}]);return NextResponse.json({matches});}
 catch{return NextResponse.json({error:"Customer details could not be located."},{status:500});}
}
