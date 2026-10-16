import { NextResponse } from "next/server";
import { getSessionOrDefault } from "@/lib/auth/session";
import { clearReadCache } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";
import { getCompanyContacts } from "@/lib/companyContacts";

export async function GET(){
  const session=await getSessionOrDefault();
  if(!session.isLoggedIn||!session.user?.active)return NextResponse.json({error:"Sign in required."},{status:401});
  try{return NextResponse.json(await getCompanyContacts());}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not load company contacts."},{status:500});}
}

export async function POST(request:Request){
  const session=await getSessionOrDefault();
  if(!session.isLoggedIn||!session.user?.active)return NextResponse.json({error:"Sign in required."},{status:401});
  if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
  try{
    const body=await request.json() as Record<string,unknown>;const action=String(body.action??"");
    await withTransaction(async run=>{
      if(action==="delete"){
        const id=Number(body.id);if(!Number.isSafeInteger(id)||id<=0)throw new Error("Select a contact to delete.");
        const result=await run(`DELETE FROM dbo.tblCompanyContacts WHERE CompanyContactID=@id`,[{name:"id",value:id}]);if(!result.rowsAffected[0])throw new Error("Contact not found.");return;
      }
      if(action!=="save")throw new Error("Unsupported company contact action.");
      const value=(key:string,label:string,max:number)=>{const text=String(body[key]??"").trim();if(text.length>max)throw new Error(`${label} must be ${max} characters or fewer.`);return text||null;};
      const id=Number(body.id);const company=value("company","Company",255);if(!company)throw new Error("Enter a company name.");
      const fields=[{name:"company",value:company},{name:"firstName",value:value("firstName","First name",100)},{name:"lastName",value:value("lastName","Last name",100)},{name:"role",value:value("role","Role",100)},{name:"sort",value:Number.isFinite(Number(body.sort))&&body.sort!==""?Number(body.sort):null},{name:"active",value:body.active===true?1:0},{name:"phone",value:value("phone","Phone",50)},{name:"cell",value:value("cell","Cell",50)},{name:"email",value:value("email","Email",255)},{name:"notes",value:value("notes","Notes",1000)}];
      if(Number.isSafeInteger(id)&&id>0){const result=await run(`UPDATE dbo.tblCompanyContacts SET CompanyContactCompany=@company,CompanyContactFName=@firstName,CompanyContactLName=@lastName,CompanyContactRole=@role,CompanyContactSort=@sort,CompanyContactActive=@active,CompanyContactPhone=@phone,CompanyContactCell=@cell,CompanyContactEmail=@email,CompanyContactNotes=@notes WHERE CompanyContactID=@id`,[...fields,{name:"id",value:id}]);if(!result.rowsAffected[0])throw new Error("Contact not found.");}
      else await run(`INSERT INTO dbo.tblCompanyContacts(CompanyContactCompany,CompanyContactFName,CompanyContactLName,CompanyContactRole,CompanyContactSort,CompanyContactActive,CompanyContactPhone,CompanyContactCell,CompanyContactEmail,CompanyContactNotes) VALUES(@company,@firstName,@lastName,@role,@sort,@active,@phone,@cell,@email,@notes)`,fields);
    });
    clearReadCache();return NextResponse.json(await getCompanyContacts());
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not save company contact."},{status:400});}
}
