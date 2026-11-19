import type sql from 'mssql';
import manifest from './compatibility-manifest.json';
export type CompatibilityIssue={object:string;problem:string};
export type CompatibilityReport={ok:boolean;tablesChecked:number;issues:CompatibilityIssue[]};
export function evaluateCompatibility(rows:{name:string;exists:number;canSelect:number;canInsert:number;canUpdate:number;canDelete:number}[]):CompatibilityReport{
 const issues:CompatibilityIssue[]=[];const byName=new Map(rows.map(r=>[r.name.toLowerCase(),r]));
 for(const entry of manifest){const row=byName.get(entry.table.toLowerCase());if(!row?.exists){issues.push({object:'dbo.'+entry.table,problem:'Missing table or not visible to this SQL account'});continue;}for(const permission of entry.permissions){const key=({SELECT:'canSelect',INSERT:'canInsert',UPDATE:'canUpdate',DELETE:'canDelete'} as const)[permission as 'SELECT'|'INSERT'|'UPDATE'|'DELETE'];if(!row[key])issues.push({object:'dbo.'+entry.table,problem:'Missing '+permission+' permission'});}}
 return {ok:issues.length===0,tablesChecked:manifest.length,issues};
}
export async function checkDatabaseCompatibility(pool:sql.ConnectionPool):Promise<CompatibilityReport>{
 const request=pool.request();request.input('manifest',JSON.stringify(manifest));
 const result=await request.query<{name:string;exists:number;canSelect:number;canInsert:number;canUpdate:number;canDelete:number}>(`SELECT j.name,CASE WHEN OBJECT_ID('dbo.'+QUOTENAME(j.name),'U') IS NOT NULL OR OBJECT_ID('dbo.'+QUOTENAME(j.name),'V') IS NOT NULL THEN 1 ELSE 0 END [exists],HAS_PERMS_BY_NAME('dbo.'+QUOTENAME(j.name),'OBJECT','SELECT') canSelect,HAS_PERMS_BY_NAME('dbo.'+QUOTENAME(j.name),'OBJECT','INSERT') canInsert,HAS_PERMS_BY_NAME('dbo.'+QUOTENAME(j.name),'OBJECT','UPDATE') canUpdate,HAS_PERMS_BY_NAME('dbo.'+QUOTENAME(j.name),'OBJECT','DELETE') canDelete FROM OPENJSON(@manifest) WITH(name nvarchar(128) '$.table') j`);
 const report=evaluateCompatibility(result.recordset);
 const provision=await pool.request().query<{allowed:number}>("SELECT CASE WHEN HAS_PERMS_BY_NAME(DB_NAME(),'DATABASE','CREATE TABLE')=1 AND HAS_PERMS_BY_NAME('dbo','SCHEMA','ALTER')=1 THEN 1 ELSE 0 END allowed");
 if(provision.recordset[0]?.allowed)report.issues=report.issues.filter(issue=>!(issue.problem.startsWith('Missing table')&&['dbo.WebCustomerSavedView','dbo.WebAccountingSavedView'].includes(issue.object)));
 // Essential columns must match the application's schema, not just table names.
 const columns={tblEmployee:['EmployeeID','EmFirstName','EmLastName'],tblCustomer:['CustomerID','CustBusName'],tblProject:['ProjectID','SiteName'],tblTracking:['TrackingID','EmployeeID','CustomerID','WeekEndingDate'],tblOfficeStaff:['OfficeStaffID','OfficeStaffActive','OfficeStaffPassword'],tblOfficeStaffPermission:['OfficeStaffID','FeatureID']};
 const columnRequest=pool.request();columnRequest.input('columns',JSON.stringify(columns));const missing=await columnRequest.query<{object:string;problem:string}>(`SELECT 'dbo.'+t.[key] [object],'Missing column '+c.value problem FROM OPENJSON(@columns) t CROSS APPLY OPENJSON(t.value) c WHERE NOT EXISTS(SELECT 1 FROM sys.columns sc WHERE sc.object_id=OBJECT_ID('dbo.'+QUOTENAME(t.[key])) AND sc.name=c.value)`);report.issues.push(...missing.recordset);report.ok=report.issues.length===0;return report;
}
