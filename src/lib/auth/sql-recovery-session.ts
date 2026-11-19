import {getIronSession} from 'iron-session';
import {cookies} from 'next/headers';
import {getSessionOptions} from './constants';
export async function sqlRecoverySession(){const options=getSessionOptions();return getIronSession<{authorized?:boolean}>(await cookies(),{...options,cookieName:'mc-sql-recovery',ttl:7*24*60*60,cookieOptions:{...options.cookieOptions,maxAge:7*24*60*60}});}
