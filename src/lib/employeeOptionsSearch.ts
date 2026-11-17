import {queryReadOnlyUncached} from "@/lib/db/sql";
export interface EmployeeOptionsRow {id:string;firstName:string;middle:string;lastName:string;flags:(boolean|null)[]}
export async function getEmployeeOptionsRows():Promise<EmployeeOptionsRow[]>{
 const columns=await queryReadOnlyUncached<{name:string}>(`SELECT name FROM sys.columns WHERE object_id=OBJECT_ID('dbo.tblEmployee')`);
 const available=new Set(columns.map(c=>c.name));
 const candidates=[["EmployeeHoursTimesheetAutoText","HoursTimesheetAutoText","EmUseTextA"],["EmployeeExcludeSickTime","ExcludeSickTime"],["EmployeeExcludeWorkersComp","ExcludeWorkersComp"],["EmployeeExcludeFromReports","ExcludeFromReports"],["EmployeeAdminOnlyRecord","AdminOnlyRecord"]];
 const sources=candidates.map(names=>names.find(n=>available.has(n)));
 const select=sources.map((name,i)=>name?`CAST([${name}] AS int) flag${i}`:`CAST(NULL AS int) flag${i}`).join(",");
 const rows=await queryReadOnlyUncached<Record<string,unknown>>(`SELECT CAST(EmployeeID AS varchar(30)) id,ISNULL(EmFirstName,'') firstName,ISNULL(EmMiddle,'') middle,ISNULL(EmLastName,'') lastName,${select} FROM dbo.tblEmployee WITH (NOLOCK) ORDER BY EmFirstName,EmLastName,EmMiddle,EmployeeID`);
 return rows.map(r=>({id:String(r.id),firstName:String(r.firstName),middle:String(r.middle),lastName:String(r.lastName),flags:sources.map((source,i)=>!source||r["flag"+i]==null?null:Number(r["flag"+i])!==0)}));
}
