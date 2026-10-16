import { NextRequest,NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getRegularPayrollCompanies,getRegularPayrollRows } from "@/lib/regularPayrollReport";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
  try{
    const session=await requireSession();if(!session.user?.active)return NextResponse.json({ok:false,error:"Sign-in required."},{status:401});
    const weekEnding=request.nextUrl.searchParams.get("weekEnding")??"";const payrollCo=(request.nextUrl.searchParams.get("payrollCo")??"IPG").toUpperCase();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(weekEnding)||Number.isNaN(Date.parse(`${weekEnding}T00:00:00Z`)))return NextResponse.json({ok:false,error:"Choose a valid week-ending date."},{status:400});
    const companies=await getRegularPayrollCompanies();if(payrollCo!==""&&!companies.some(company=>company.name.toUpperCase()===payrollCo))return NextResponse.json({ok:false,error:"Choose a valid payroll company."},{status:400});
    const rows=await getRegularPayrollRows(weekEnding,payrollCo);return NextResponse.json({ok:true,rows,companies});
  }catch(error){const unauthorized=error instanceof Error&&error.message==="Unauthorized";return NextResponse.json({ok:false,error:unauthorized?"Sign-in required.":"Regular payroll data could not be loaded from the office database."},{status:unauthorized?401:500});}
}
