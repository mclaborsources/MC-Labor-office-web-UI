import {queryReadOnly} from "@/lib/db/sql";
export interface AccountingReportOptions {states:string[];companies:string[];companyDetails?:{code:string;name:string}[];years:string[];customers?:{id:string;name:string}[];jobs?:{id:string;customerId:string;name:string}[];salesmen?:{id:string;name:string}[];contracts?:string[];employeeExclusionsAvailable?:boolean}
export async function getAccountingReportOptions(includeSelectors=false):Promise<AccountingReportOptions>{
 const results=await Promise.allSettled([
 queryReadOnly<{value:string}>("SELECT DISTINCT LTRIM(RTRIM(PullDownState)) value FROM dbo.tblPullDownStates WITH (NOLOCK) WHERE NULLIF(LTRIM(RTRIM(PullDownState)),'') IS NOT NULL ORDER BY value"),
 queryReadOnly<{value:string;name:string}>("SELECT LTRIM(RTRIM(PullDownPayrollCoOnSiteInitials)) value,PullDownPayrollCoOnSiteName name FROM dbo.tblPullDownPayrollCoOnSite WITH (NOLOCK) ORDER BY PullDownPayrollCoOnSiteSort,PullDownPayrollCoOnSiteID"),
 queryReadOnly<{value:string}>("SELECT DISTINCT CAST(AssignYear AS varchar(4)) value FROM dbo.tblTracking WITH (NOLOCK) WHERE AssignYear IS NOT NULL ORDER BY value DESC")]);
 const values=(i:number)=>results[i].status==='fulfilled'?(results[i] as PromiseFulfilledResult<{value:string}[]>).value.map(r=>r.value):[];
 const [columns,contracts]=await Promise.all([
 queryReadOnly<{name:string}>("SELECT name FROM sys.columns WHERE object_id=OBJECT_ID('dbo.tblEmployee') AND name IN ('EmployeeExcludeFromReports','ExcludeFromReports')"),
 queryReadOnly<{name:string}>("SELECT DISTINCT PullDownContractWith_PayrollCoInitials name FROM dbo.tblPullDownContractWith_PayrollCo WITH (NOLOCK) WHERE NULLIF(PullDownContractWith_PayrollCoInitials,'') IS NOT NULL ORDER BY name")
 ]);
 const companyDetails=results[1].status==="fulfilled"?(results[1].value as {value:string;name:string}[]).map(r=>({code:r.value,name:r.name})):[];
 const base={companyDetails,contracts:contracts.map(c=>c.name),employeeExclusionsAvailable:columns.length>0,states:values(0),companies:values(1),years:values(2)};
 if(!includeSelectors)return base;
 const [customers,jobs,salesmen]=await Promise.all([
 queryReadOnly<{id:string;name:string}>("SELECT CAST(CustomerID AS varchar(30)) id,ISNULL(CustBusName,'') name FROM dbo.tblCustomer WITH (NOLOCK) WHERE NULLIF(CustBusName,'') IS NOT NULL ORDER BY CustBusName"),
 queryReadOnly<{id:string;customerId:string;name:string}>("SELECT CAST(ProjectID AS varchar(30)) id,CAST(CustomerID AS varchar(30)) customerId,ISNULL(SiteName,'') name FROM dbo.tblProject WITH (NOLOCK) WHERE NULLIF(SiteName,'') IS NOT NULL ORDER BY SiteName"),
 queryReadOnly<{id:string;name:string}>("SELECT CAST(PullDownSalesmanID AS varchar(30)) id,LTRIM(RTRIM(CONCAT(PullDownSalesmanFName,' ',PullDownSalesmanLName))) name FROM dbo.tblPullDownSalesman WITH (NOLOCK) ORDER BY PullDownSalesmanLName,PullDownSalesmanFName")
 ]);
 return {...base,customers,jobs,salesmen};
}