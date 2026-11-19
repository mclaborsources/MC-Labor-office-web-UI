import {queryReadOnlyUncached} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface StaffLoginRawRow {id:string;staffId:string;staff:string;date:string;day:string;network:string;computer:string;login:string;logout:string;logoutType:string;durationMinutes:number|null}
export async function getStaffLoginRawReport(criteria:Record<string,string|undefined>){
 let start=payrollDate(criteria.startDate),end=payrollDate(criteria.endDate);
 if(!start&&!end){const dates=await queryReadOnlyUncached<{date:string}>(`SELECT CONVERT(varchar(10),MAX(OfficeStaffLoginTimestamp),23) date FROM dbo.tblOfficeStaffLogin`);start=end=dates[0]?.date||"";}
 start=start||end;end=end||start;if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const rows=await queryReadOnlyUncached<StaffLoginRawRow>(`SELECT CAST(OfficeStaffLoginID AS varchar(30)) id,ISNULL(CAST(OfficeStaffID AS varchar(30)),'') staffId,ISNULL(OfficeStaffFullName,'') staff,
 CONVERT(varchar(10),OfficeStaffLoginTimestamp,101) date,DATENAME(weekday,OfficeStaffLoginTimestamp) day,
 ISNULL(NetworkName,'') network,ISNULL(ComputerName,'') computer,CONVERT(varchar(19),OfficeStaffLoginTimestamp,120) login,
 ISNULL(CONVERT(varchar(19),OfficeStaffLogoutTimestamp,120),'') logout,ISNULL(OfficeStaffLogoutType,'') logoutType,
 CASE WHEN OfficeStaffLogoutTimestamp>=OfficeStaffLoginTimestamp THEN DATEDIFF(minute,OfficeStaffLoginTimestamp,OfficeStaffLogoutTimestamp) ELSE NULL END durationMinutes
 FROM dbo.tblOfficeStaffLogin WITH (NOLOCK)
 WHERE OfficeStaffLoginTimestamp>=CONVERT(date,@start,23) AND OfficeStaffLoginTimestamp<DATEADD(day,1,CONVERT(date,@end,23))
 ORDER BY OfficeStaffLoginTimestamp,OfficeStaffFullName,OfficeStaffLoginID`,[{name:"start",value:start},{name:"end",value:end}]);
 return {rows,start,end};
}


export function summarizeStaffLogins(rows:StaffLoginRawRow[]):StaffLoginRawRow[]{
 const groups=new Map<string,StaffLoginRawRow>();
 for(const row of rows){
  const key=row.staffId||row.staff;
  const previous=groups.get(key);
  if(!previous)groups.set(key,{...row,id:"staff-"+key,durationMinutes:row.durationMinutes});
  else{previous.staff=row.staff||previous.staff;if(row.durationMinutes!=null)previous.durationMinutes=(previous.durationMinutes??0)+row.durationMinutes;}
 }
 return [...groups.values()].sort((a,b)=>a.staff.localeCompare(b.staff));
}

export async function getStaffLoginSummaryReport(criteria:Record<string,string|undefined>){
 const report=await getStaffLoginRawReport(criteria);
 const staff=await queryReadOnlyUncached<{id:string;name:string}>("SELECT CAST(OfficeStaffID AS varchar(30)) id,ISNULL(OfficeStaffFullName,'') name FROM dbo.tblOfficeStaff WITH (NOLOCK) WHERE OfficeStaffActive<>0 AND OfficeStaffID NOT IN (0,1) ORDER BY OfficeStaffFullName");
 const totals=new Map(summarizeStaffLogins(report.rows).map(row=>[row.staffId,row]));
 return {...report,rows:staff.map(person=>totals.get(person.id)??{id:'staff-'+person.id,staffId:person.id,staff:person.name,date:'',day:'',network:'',computer:'',login:'',logout:'',logoutType:'',durationMinutes:0})};
}
