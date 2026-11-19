import {NextResponse} from 'next/server';
import sql from 'mssql';
import {hasSameOrigin} from '@/lib/auth/origin';
import {isSqlDisconnected} from '@/lib/db/connection-state';
import {getDatabaseSettings} from '@/lib/config/database';
import {buildConfig} from '@/lib/db/sql';
import {matchesAccessPassword} from '@/lib/auth/office-staff';
import {sqlRecoverySession} from '@/lib/auth/sql-recovery-session';
const attempts=new Map<string,{count:number;until:number}>();
export async function POST(request:Request){
 if(!hasSameOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 if(!isSqlDisconnected())return NextResponse.json({error:'Use normal administrator sign-in while connected.'},{status:400});
 const body=await request.json().catch(()=>null);const name=typeof body?.name==='string'?body.name.trim():'';const password=typeof body?.password==='string'?body.password:'';
 if(!name||name.length>200||!password||password.length>1024)return NextResponse.json({error:'Enter your existing office administrator name and password.'},{status:400});
 const key=name.toLowerCase(),now=Date.now();for(const[k,v]of attempts)if(v.until<=now)attempts.delete(k);const old=attempts.get(key);if(old&&old.count>=10)return NextResponse.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429});attempts.set(key,{count:(old?.count??0)+1,until:old?.until??now+900000});
 const settings=getDatabaseSettings();if(!settings)return NextResponse.json({error:'No previous office server is available for administrator verification.'},{status:503});
 // Authenticate ONLY against the previously trusted server, never the proposed server.
 const candidate=new sql.ConnectionPool(buildConfig(settings));
 try{await candidate.connect();const result=await candidate.request().input('name',name).query<{password:string;admin:number}>(`SELECT s.OfficeStaffPassword password,CASE WHEN EXISTS(SELECT 1 FROM dbo.tblOfficeStaffPermission p JOIN dbo.tblFeature f ON f.FeatureID=p.FeatureID WHERE p.OfficeStaffID=s.OfficeStaffID AND f.FeatureActive=1 AND f.ObjectName='frmOfficeStaffPermission') THEN 1 ELSE 0 END admin FROM dbo.tblOfficeStaff s WHERE s.OfficeStaffID<>0 AND s.OfficeStaffActive=1 AND ISNULL(s.Profile,0)=0 AND (s.OfficeStaffFullName=@name OR CAST(s.OfficeStaffID AS varchar(20))=@name)`);const staff=result.recordset[0];if(!staff?.password||!matchesAccessPassword(password,staff.password)||!staff.admin)return NextResponse.json({error:'The name or password is incorrect, or this account is not an office administrator.'},{status:403});const recovery=await sqlRecoverySession();recovery.authorized=true;await recovery.save();attempts.delete(key);return NextResponse.json({ok:true});}catch{return NextResponse.json({error:'The previous office server could not be reached to verify the administrator. No connection settings were changed.'},{status:503});}finally{await candidate.close().catch(()=>undefined);}
}
