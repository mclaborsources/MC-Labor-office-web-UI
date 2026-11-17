import {queryReadOnlyUncached} from "@/lib/db/sql";
import type {EmployeeOptionsRow} from "@/lib/employeeOptionsSearch";
export async function getEmployeeExclusionRows():Promise<EmployeeOptionsRow[]>{
 const rows=await queryReadOnlyUncached<{id:string;firstName:string;middle:string;lastName:string}>(`SELECT CAST(e.EmployeeID AS varchar(30)) id,ISNULL(e.EmFirstName,'') firstName,ISNULL(e.EmMiddle,'') middle,ISNULL(e.EmLastName,'') lastName FROM dbo.tblEmployee e WITH (NOLOCK) WHERE EXISTS(SELECT 1 FROM dbo.tblEmployeeB b WITH (NOLOCK) WHERE b.EmployeeID=e.EmployeeID AND ISNULL(b.EmployeeExcludeFromReports,0)<>0) ORDER BY e.EmFirstName,e.EmMiddle,e.EmLastName,e.EmployeeID`);
 return rows.map(r=>({...r,flags:[null,null,null,true,null]}));
}