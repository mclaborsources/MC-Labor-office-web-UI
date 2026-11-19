import {sqlRecoverySession} from "./sql-recovery-session";
import {isSqlDisconnected} from "@/lib/db/connection-state";
import {getIronSession} from 'iron-session';
import {cookies} from 'next/headers';
import {getSessionOptions} from '@/lib/auth/constants';
import {isLocalMode,isOfficeStaffMode} from '@/lib/auth/mode';
import {sessionGenerationMatches} from '@/lib/auth/session-generation';
import type {SessionData} from '@/types/auth';
/** Authenticate connection recovery without using the disconnected SQL server. */
export async function getConnectionSetupSession():Promise<SessionData>{
 if(isSqlDisconnected()&&(await sqlRecoverySession()).authorized)return {isLoggedIn:true,user:{userId:"sql-recovery",username:"sql-recovery",displayName:"SQL Connection Setup",active:true,roles:["admin"]}};
 if(isLocalMode())return {isLoggedIn:true,user:{userId:'local-office',username:'local',displayName:'Local Office',active:true,roles:['admin']}};
 const session=await getIronSession<SessionData>(await cookies(),getSessionOptions());
 if(!session.isLoggedIn||!session.user?.active||session.needsLoginPrompts||(isOfficeStaffMode()&&!sessionGenerationMatches(session.loginGeneration)))throw Error('Unauthorized');
 return session;
}
