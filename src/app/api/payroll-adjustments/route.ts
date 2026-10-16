import { NextRequest,NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getPayrollAdjustmentCompanies,getPayrollAdjustmentRows } from "@/lib/regularPayrollReport";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest){try{
  const session=await requireSession();if(!session.user?.active)return NextResponse.json({ok:false,error:"Sign-in required."},{status:401});
  const weekEnding=request.nextUrl.searchParams.get("weekEnding")??"";const payrollCo=(request.nextUrl.searchParams.get("payrollCo")??"").toUpperCase();
  if(weekEnding&&!/^\d{4}-\d{2}-\d{2}$/.test(weekEnding))return NextResponse.json({ok:false,error:"Choose a valid week-ending date."},{status:400});
  const [rows,companies]=await Promise.all([getPayrollAdjustmentRows(weekEnding,payrollCo),getPayrollAdjustmentCompanies()]);return NextResponse.json({ok:true,rows,companies});
}catch(error){const unauthorized=error instanceof Error&&error.message==="Unauthorized";return NextResponse.json({ok:false,error:unauthorized?"Sign-in required.":"Payroll adjustments could not be loaded from the office database."},{status:unauthorized?401:500});}}
