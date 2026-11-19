import {sqlRecoverySession} from "@/lib/auth/sql-recovery-session";
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {getIronSession} from 'iron-session';
import {getSessionOptions} from '@/lib/auth/constants';
import type {SessionData} from '@/types/auth';
import {isLocalMode,isOfficeStaffMode} from '@/lib/auth/mode';
import {sessionGenerationMatches} from '@/lib/auth/session-generation';
import {hasSameOrigin} from '@/lib/auth/origin';
import {isSqlDisconnected,setSqlDisconnected} from '@/lib/db/connection-state';
import {closePool} from '@/lib/db/sql';
// Recovery must read the signed session without opening the disconnected database.
async function allowed(){if(isLocalMode())return true;const session=await getIronSession<SessionData>(await cookies(),getSessionOptions());return Boolean(session.isLoggedIn&&session.user?.active&&session.user.roles.includes('admin')&&!session.needsLoginPrompts&&(!isOfficeStaffMode()||sessionGenerationMatches(session.loginGeneration)));}
export async function GET(){return NextResponse.json({disconnected:isSqlDisconnected(),canManage:await allowed()},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){if(!hasSameOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});if(!await allowed())return NextResponse.json({error:'Administrator sign-in required to manage the SQL connection.'},{status:403});const body=await request.json().catch(()=>null);if(body?.action!=='disconnect')return NextResponse.json({error:'Enter SQL connection credentials through setup to reconnect.'},{status:400});try{const recovery=await sqlRecoverySession();recovery.authorized=true;await recovery.save();setSqlDisconnected(true);await closePool();return NextResponse.json({ok:true,disconnected:isSqlDisconnected()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to change SQL connection.'},{status:503});}}
