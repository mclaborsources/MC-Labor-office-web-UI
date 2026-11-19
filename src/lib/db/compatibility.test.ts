import assert from 'node:assert/strict';
import {test} from 'node:test';
import manifest from './compatibility-manifest.json';
import {evaluateCompatibility} from './compatibility';
const full=()=>manifest.map(entry=>({name:entry.table,exists:1,canSelect:1,canInsert:1,canUpdate:1,canDelete:1}));
test('compatible schema permission metadata passes',()=>{assert.equal(evaluateCompatibility(full()).ok,true);});
test('missing tables block compatibility',()=>{const rows=full();rows[0].exists=0;const result=evaluateCompatibility(rows);assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.object==='dbo.'+rows[0].name));});
test('missing mapped CRUD permission blocks compatibility',()=>{const rows=full();const entry=manifest.find(x=>x.permissions.includes('INSERT'))!;rows.find(x=>x.name===entry.table)!.canInsert=0;assert.ok(evaluateCompatibility(rows).issues.some(i=>i.problem==='Missing INSERT permission'));});
test('read-only tables do not require write grants',()=>{const rows=full();const entry=manifest.find(x=>x.permissions.length===1)!;const row=rows.find(x=>x.name===entry.table)!;row.canInsert=row.canUpdate=row.canDelete=0;assert.equal(evaluateCompatibility(rows).ok,true);});
