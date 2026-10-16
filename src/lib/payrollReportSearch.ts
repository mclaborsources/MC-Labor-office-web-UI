import {queryReadOnly} from "@/lib/db/sql";
import {getNewReportSearchRows,type NewReportSearchRow} from "@/lib/newReportSearch";

export interface PayrollReportSearchRow extends NewReportSearchRow {
  firstName:string;middleInitial:string;lastName:string;jobApplicationDate:string;payMethod:string;pmDate:string;
  jobApplicationStatus:string;jasDate:string;pis:string;mailState:string;adjustmentNote:string;note:string;job:string;wcCode:string;
  totalAmount:number;grossPayroll:number;
}

export async function getPayrollReportSearchRows(weekEnding:string):Promise<PayrollReportSearchRow[]>{
  const [work,adjustments]=await Promise.all([
    getNewReportSearchRows(weekEnding),
    queryReadOnly<{id:number;employeeId:number;payrollCompany:string;weekEnding:string;firstName:string;middleInitial:string;lastName:string;adjustmentNote:string;amount:number}>(`SELECT a.PayrollAdjustmentID id,a.EmployeeID employeeId,ISNULL(co.PullDownPayrollCoOnSiteInitials,'') payrollCompany,CONVERT(varchar(10),CAST(a.WeekEndingDate AS date),101) weekEnding,ISNULL(e.EmFirstName,'') firstName,ISNULL(e.EmMiddle,'') middleInitial,ISNULL(e.EmLastName,'') lastName,ISNULL(a.PayrollAdjustmentNote,'') adjustmentNote,ISNULL(a.PayrollAdjustmentAmount,0) amount FROM dbo.tblPayrollAdjustments a WITH (NOLOCK) LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=a.EmployeeID LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID WHERE a.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))`,[{name:"weekEnding",value:weekEnding}]),
  ]);
  const rows:PayrollReportSearchRow[]=work.map(row=>{const parts=row.name.split(" ");return {...row,firstName:parts[0]??"",middleInitial:parts.length>2?parts[1]:"",lastName:parts.length>1?parts.at(-1)??"":"",jobApplicationDate:"",payMethod:"",pmDate:"",jobApplicationStatus:"",jasDate:"",pis:"",mailState:"",adjustmentNote:"",note:"",job:"",wcCode:"",totalAmount:row.regularPayAmount,grossPayroll:row.regularPayAmount};});
  for(const item of adjustments){rows.push({id:`adjustment-${item.id}`,employeeId:String(item.employeeId),payrollCompany:item.payrollCompany,weekEnding:item.weekEnding,multiple:"",ssn:"",name:`${item.firstName} ${item.middleInitial?`${item.middleInitial} `:""}${item.lastName}`.trim(),regularPayRate:null,regularRegHours:null,regularOtHours:null,regularPayAmount:item.amount,juryDutyRate:null,juryDutyRegHours:null,juryDutyAmount:null,retroRate:null,retroRegHours:null,retroAmount:null,advanceRepayment:0,firstName:item.firstName,middleInitial:item.middleInitial,lastName:item.lastName,jobApplicationDate:"",payMethod:"",pmDate:"",jobApplicationStatus:"",jasDate:"",pis:"",mailState:"",adjustmentNote:item.adjustmentNote,note:"",job:"",wcCode:"",totalAmount:item.amount,grossPayroll:item.amount});}
  return rows.sort((a,b)=>a.payrollCompany.localeCompare(b.payrollCompany)||a.lastName.localeCompare(b.lastName));
}
