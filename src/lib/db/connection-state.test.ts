import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {isSqlDisconnected,setSqlDisconnected,assertSqlConnected} from './connection-state';
test('SQL disconnect persists until explicit reconnect without changing saved settings',()=>{
 const previous=process.cwd(),directory=mkdtempSync(path.join(tmpdir(),'mc-sql-state-'));
 try{process.chdir(directory);assert.equal(isSqlDisconnected(),false);assert.doesNotThrow(assertSqlConnected);setSqlDisconnected(true);assert.equal(isSqlDisconnected(),true);assert.throws(assertSqlConnected,/disconnected/);assert.equal(existsSync(path.join(directory,'.local-config','database.enc')),false);setSqlDisconnected(false);assert.equal(isSqlDisconnected(),false);assert.doesNotThrow(assertSqlConnected);setSqlDisconnected(false);}finally{process.chdir(previous);rmSync(directory,{recursive:true,force:true});}
});
