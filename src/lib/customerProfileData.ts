import { queryReadOnlyUncached, clearReadCache } from "./db/sql";
import { queryWrite, withTransaction } from "./db/write";
import { CUSTOMER_PROFILE_FIELDS, VERIFY_FIELDS, PROFILE_RELATED, type CustomerProfileData, type ProfileRecord } from "./customerProfileFields";

const quote = (name:string) => `[${name.replace(/]/g,"]]" )}]`;
const serialize = (row:Record<string,unknown>):ProfileRecord => Object.fromEntries(Object.entries(row).map(([key,value]) => [key,value == null ? "" : value instanceof Date ? value.toISOString() : String(value)]));
const LOOKUPS: Record<string,string> = {
  ProjStatusID:"tblPullDownProjStatus", CustStatusID:"tblPullDownCustStatus", CustomerTypeID:"tblPullDownCustomerTypes", SalesmanID:"tblPullDownSalesman", ContractSalesmanID:"tblPullDownSalesman", HunterID:"tblPullDownSalesman",
  CustPaymentStatusID:"tblPullDownCustPaymentStatus", CreditTermLimitID:"tblPullDownCreditTermLimits", LegalStatusID:"tblPullDownLegalStatus",
  InternetSalesReadyID:"tblPullDownInternetSalesReady", SalesHistoryStatusID:"tblPullDownSalesHistoryStatus", WhereCustomerFoundID:"tblPullDownWhereCustomerFound",
  AllowContractWith_PayrollCoID:"tblPullDownContractWith_PayrollCo", CustContractWith_PayrollCoID:"tblPullDownContractWith_PayrollCo",
  CustomerContactTitleID:"tblPullDownCustomerContactTitles", CustomerContactCellCarrierID:"tblPullDownCellCarriers", WCCID:"tblPullDownWCC", CustomerSalesHistoryActionTypeID:"tblPullDownActionTypes",
  CustomerInsuranceCertReqStateID:"tblPullDownStates", ExtraVerbiageOnContractID:"tblPullDownExtraVerbiageOnContract",
};
type Column = {name:string;type:string;length:number};
async function columns(table:string) { return queryReadOnlyUncached<Column>("SELECT COLUMN_NAME AS name,DATA_TYPE AS type,CHARACTER_MAXIMUM_LENGTH AS length FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME=@table ORDER BY ORDINAL_POSITION",[{name:"table",value:table}]); }
export async function loadCustomerProfileData(customerId:string):Promise<CustomerProfileData> {
  const data:CustomerProfileData = {fields:{},related:{},lookups:{},errors:[]};
  const rows=await queryReadOnlyUncached("SELECT * FROM dbo.tblCustomer WHERE CustomerID=@id",[{name:"id",value:customerId}]);
  if (!rows[0]) throw new Error("Customer not found.");
  data.fields=serialize(rows[0]);
  await Promise.all(Object.entries(PROFILE_RELATED).map(async ([key,config]) => {
    try { data.related[key]=(await queryReadOnlyUncached(`SELECT * FROM dbo.${quote(config.table)} WHERE CustomerID=@id ORDER BY ${quote(config.id)} DESC`,[{name:"id",value:customerId}])).map(serialize); }
    catch { data.related[key]=[]; data.errors.push(`Could not load ${key}.`); }
  }));
  const tables = new Map<string,Array<{value:string;label:string}>>();
  await Promise.all([...new Set(Object.values(LOOKUPS))].map(async table => {
    const schema=await columns(table);
    if (!schema.length) return;
    const id=schema.find(column => /ID$/.test(column.name));
    const label=schema.find(column => /char|text/.test(column.type) && !/note|email|phone|hlink|address|street|aka|desc/i.test(column.name)) ?? schema.find(column => /char|text/.test(column.type));
    if (!id || !label) return;
    const options=await queryReadOnlyUncached<{value:unknown;label:unknown}>(`SELECT ${quote(id.name)} AS value,${quote(label.name)} AS label FROM dbo.${quote(table)} ORDER BY ${quote(label.name)}`);
    tables.set(table,options.map(row=>({value:String(row.value??""),label:String(row.label??"")})));
  }));
  for(const [field,table] of Object.entries(LOOKUPS)) data.lookups[field]=tables.get(table)??[];
  const actionOptions=data.lookups.CustomerSalesHistoryActionTypeID??[];
  for(const row of data.related.history??[]) row.actionLabel=actionOptions.find(option=>option.value===row.CustomerSalesHistoryActionTypeID)?.label??"";
  return data;
}

export function coerceProfileValue(value:unknown,column:Column):string|number|boolean|null {
  if(value === "" || value == null) return null;
  if(column.type === "bit") { if(![true,false,1,0,"1","0","true","false"].includes(value as string)) throw new Error(`Invalid ${column.name}.`); return [true,1,"1","true"].includes(value as string); }
  if(/int|decimal|numeric|money|float|real/.test(column.type)) { const number=Number(value); if(!Number.isFinite(number) || (/int/.test(column.type) && !Number.isSafeInteger(number))) throw new Error(`Invalid ${column.name}.`); return number; }
  if(/date|time/.test(column.type)) { const date=new Date(String(value)); if(!Number.isFinite(date.getTime())) throw new Error(`Invalid ${column.name}.`); return date.toISOString(); }
  const text=String(value); if(column.length>0 && text.length>column.length) throw new Error(`${column.name} exceeds ${column.length} characters.`); return text;
}
export type ProfileMutation={entity?:string;id?:string;action?:string;changes?:Record<string,unknown>};
type TransactionRun=Parameters<Parameters<typeof withTransaction>[0]>[0];
export async function saveCustomerProfile(customerId:string,body:ProfileMutation,user:string,runOverride?:TransactionRun) {
  const entity=body.entity??"customer";
  const config=entity === "customer" ? {table:"tblCustomer",id:"CustomerID",fields:[...Object.values(CUSTOMER_PROFILE_FIELDS),...Object.values(VERIFY_FIELDS),"MailStreet","MailCity","MailState","MailZip",...Array.from({length:4},(_,i)=>`CustomerSubType${i+1}ID`),...['','HDE','IPG','ISG','MLS','T_R','HSG','AMP'].flatMap(suffix=>[`WCxDate${suffix}`,`GLxDate${suffix}`])],user:"",date:""} : PROFILE_RELATED[entity as keyof typeof PROFILE_RELATED];
  if(!config) throw new Error("Unsupported customer section.");
  const id=entity === "customer" ? customerId : body.id;
  if(body.action === "delete") {
    if(entity === "customer" || !id || !/^\d+$/.test(id)) throw new Error("Choose a saved record to delete.");
    const statement=`DELETE FROM dbo.${quote(config.table)} WHERE ${quote(config.id)}=@record AND CustomerID=@customer`;
    const parameters=[{name:"record",value:id},{name:"customer",value:customerId}];
    const count=runOverride ? (await runOverride(statement,parameters)).rowsAffected[0] : await queryWrite(statement,parameters);
    if(count!==1) throw new Error("The selected record no longer exists.");
    clearReadCache(); return;
  }
  const schema=await columns(config.table);
  const changes=body.changes;
  if(!changes || !Object.keys(changes).length || Object.keys(changes).length>100) throw new Error("No valid changes to save.");
  const validated=Object.entries(changes).map(([field,value]) => {
    if(!config.fields.includes(field as never) || /^(CustEntry|PopulateContract)/.test(field)) throw new Error(`Field ${field} cannot be edited here.`);
    const column=schema.find(c=>c.name===field); if(!column) throw new Error(`Field ${field} is unavailable.`);
    return {field,value:coerceProfileValue(value,column)};
  });
  if(entity === "customer") for(const {field} of [...validated]) {
    for(const [suffix,value] of [["UserName",user],["Timestamp",new Date().toISOString()]] as const) if(schema.some(c=>c.name===field+suffix)) validated.push({field:field+suffix,value});
  }
  if(config.user) validated.push({field:config.user,value:user});
  if(config.date && !validated.some(item=>item.field===config.date)) validated.push({field:config.date,value:new Date().toISOString()});
  const params=validated.map((item,i)=>({name:`p${i}`,value:item.value}));
  const work=async (run:TransactionRun)=> {
    if(id) {
      if(!/^\d+$/.test(id)) throw new Error("Invalid record ID.");
      const result=await run(`UPDATE dbo.${quote(config.table)} SET ${validated.map((item,i)=>`${quote(item.field)}=@p${i}`).join(",")} WHERE ${quote(config.id)}=@record AND CustomerID=@customer`,[...params,{name:"record",value:id},{name:"customer",value:customerId}]);
      if(result.rowsAffected[0]!==1) throw new Error("The record no longer exists.");
    } else await run(`INSERT INTO dbo.${quote(config.table)} (CustomerID,${validated.map(item=>quote(item.field)).join(",")}) VALUES (@customer,${validated.map((_,i)=>`@p${i}`).join(",")})`,[...params,{name:"customer",value:customerId}]);
  };
  if(runOverride) await work(runOverride); else await withTransaction(work);
  clearReadCache();
}
