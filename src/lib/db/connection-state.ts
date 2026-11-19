import {existsSync,mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
import path from 'node:path';
const filename=()=>path.join(process.cwd(),'.local-config','sql-disconnected');
export function isSqlDisconnected(){return existsSync(filename());}
export function setSqlDisconnected(disconnected:boolean){if(disconnected){mkdirSync(path.dirname(filename()),{recursive:true});writeFileSync(filename(),'Disconnected by an administrator.\n',{mode:0o600});}else if(existsSync(filename()))unlinkSync(filename());}
export function assertSqlConnected(){if(isSqlDisconnected())throw new Error('SQL connection is disconnected. Reconnect from the SQL connection screen.');}
