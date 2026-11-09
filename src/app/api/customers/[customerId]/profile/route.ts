import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { loadCustomerProfileData, saveCustomerProfile } from "@/lib/customerProfileData";
import { withTransaction } from "@/lib/db/write";
import type { ProfileMutation } from "@/lib/customerProfileData";

export const dynamic="force-dynamic";
type Context={params:Promise<{customerId:string}>};
export async function GET(_request:Request,{params}:Context) {
  try { await requireSession(); const {customerId}=await params; if(!/^\d+$/.test(customerId)) return NextResponse.json({ok:false,error:"Invalid customer ID."},{status:400});
    return NextResponse.json({ok:true,data:await loadCustomerProfileData(customerId)});
  } catch(error) { console.error("[customer profile]",error); return NextResponse.json({ok:false,error:"Could not load customer profile data."},{status:500}); }
}
export async function PATCH(request:Request,{params}:Context) {
  if(!hasSameOrigin(request)) return NextResponse.json({ok:false,error:"Invalid request origin."},{status:403});
  const session=await requireSession();
  try { const {customerId}=await params; if(!/^\d+$/.test(customerId)) throw new Error("Invalid customer ID.");
    const body=await request.json();
    const mutations:ProfileMutation[]=Array.isArray(body.mutations)?body.mutations:[body];
    if(!mutations.length || mutations.length>200) throw new Error("Save between 1 and 200 changes at a time.");
    await withTransaction(async run=>{for(const mutation of mutations) await saveCustomerProfile(customerId,mutation,session.user?.username??"unknown",run);});
    return NextResponse.json({ok:true,data:await loadCustomerProfileData(customerId)});
  } catch(error) { console.error("[customer profile save]",error); return NextResponse.json({ok:false,error:error instanceof Error ? error.message : "Could not save customer profile."},{status:400}); }
}
