import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {initialReportUrl} from './accountingReportRequest';

test('direct report entry sends server-resolved dates to the loader',()=>{
  const url=new URL(initialReportUrl('http://localhost/total-payroll-report-search',{
    startDate:'2026-01-02',endDate:'2026-11-13',jobAppStatus:'No SUB'
  }),'http://localhost');
  assert.equal(url.searchParams.get('startDate'),'2026-01-02');
  assert.equal(url.searchParams.get('endDate'),'2026-11-13');
  assert.equal(url.searchParams.get('jobAppStatus'),'No SUB');
});
test('normalized criteria override URL values while preserving other filters',()=>{
  const url=new URL(initialReportUrl('http://localhost/invoice-report?startDate=1%2F2%2F2026&customer=42',{
    startDate:'2026-01-02',endDate:undefined,payrollCompany:''
  }),'http://localhost');
  assert.equal(url.searchParams.get('startDate'),'2026-01-02');
  assert.equal(url.searchParams.get('customer'),'42');
  assert.equal(url.searchParams.has('endDate'),false);
  assert.equal(url.searchParams.get('payrollCompany'),'');
});
test('every Accounting Reports dropdown item has a loader and automatic fetch registration',()=>{
  const menu=readFileSync('src/components/reports/AccountingReportsSearchScreen.tsx','utf8');
  const loaders=readFileSync('src/lib/accountingReportData.ts','utf8');
  const hook=readFileSync('src/components/reports/useAccountingReportData.ts','utf8');
  const labels=[...menu.split('const reports=')[1].split('];')[0].matchAll(/"([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('<'));
  assert.equal(labels.length,22);
  for(const label of labels){
    const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const route=new RegExp('"'+escaped+'":"/([^"?]+)"').exec(menu)?.[1];
    assert.ok(route,`Missing route: ${label}`);
    assert.ok(loaders.includes('"'+route+'":'),`Missing loader: ${label}`);
    assert.ok(hook.includes('"'+route+'"'),`Missing initial fetch: ${label}`);
  }
});
