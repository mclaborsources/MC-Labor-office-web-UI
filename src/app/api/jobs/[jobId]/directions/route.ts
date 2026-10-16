import {NextResponse} from 'next/server';
import {getSessionOrDefault} from '@/lib/auth/session';
import {queryReadOnly} from '@/lib/db/sql';

type EmployeeRecipient={id:number;Name:string;Email:string;TextAddress:string;MobilePhone:string;HasEmail:boolean;HasText:boolean};

export async function GET(request:Request,{params}:{params:Promise<{jobId:string}>}){
 const session=await getSessionOrDefault();
 if(!session.isLoggedIn||!session.user?.active)return NextResponse.json({error:'Sign in required'},{status:401});
 try{
  const id=Number((await params).jobId);if(!Number.isSafeInteger(id)||id<=0)return NextResponse.json({error:'Invalid job'},{status:400});
  const search=(new URL(request.url).searchParams.get('search')??'').trim().slice(0,100);if(!search)return NextResponse.json({data:[]});
  const exists=await queryReadOnly<{ProjectID:number}>(`SELECT ProjectID FROM tblProject WITH (NOLOCK) WHERE ProjectID=@id`,[{name:'id',value:id}]);if(!exists.length)return NextResponse.json({error:'Job not found'},{status:404});
  const pattern=`%${search}%`;
  const data=await queryReadOnly<EmployeeRecipient>(`SELECT TOP (200) EmployeeID id,LTRIM(RTRIM(ISNULL(EmFirstName,'')+' '+ISNULL(EmLastName,''))) Name,ISNULL(EmEmail,'') Email,ISNULL(TextMsgAddress,'') TextAddress,ISNULL(EmMobilePhone,'') MobilePhone,CASE WHEN NULLIF(LTRIM(RTRIM(ISNULL(EmEmail,''))),'') IS NULL THEN CAST(0 AS bit) ELSE CAST(1 AS bit) END HasEmail,CASE WHEN NULLIF(LTRIM(RTRIM(ISNULL(TextMsgAddress,''))),'') IS NULL THEN CAST(0 AS bit) ELSE CAST(1 AS bit) END HasText FROM tblEmployee WITH (NOLOCK) WHERE EmEmployeeStatusID=17 AND (EmFirstName LIKE @pattern OR EmLastName LIKE @pattern OR EmEmail LIKE @pattern OR EmMobilePhone LIKE @pattern) ORDER BY EmLastName,EmFirstName`,[{name:'pattern',value:pattern}]);
  return NextResponse.json({data});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to search employees.'},{status:500});}
}
