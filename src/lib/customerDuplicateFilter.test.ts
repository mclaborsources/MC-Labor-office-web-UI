import assert from "node:assert/strict";
import test from "node:test";
import { CUSTOMER_DUPLICATE_OPTIONS } from "./customerDuplicateOptions";
import { duplicateSpec,filterCustomerDuplicates } from "./customerDuplicateFilter";
import { customerDuplicateSql } from "./customerDuplicateSql";
import { matchesCustomerProfile } from "./customerProfileSelection";
import { filterCustomerSearch1Rows } from "./customerSearch1Filters";
import type { CustomerNameMatch } from "./customerNameSearchColumns";
const make=(id:string,changes:Partial<CustomerNameMatch>={})=>({customerId:id,customerName:"Bee Hive",street:"12 Main St",city:"New York",state:"NY",phone:"555-0100",ctcFirst:"Mary Ann",ctcLast:"Smith",ctcEmail:"mary@example.com",ctcCell:"555-0200",lastWeekEnding:"",...changes} as CustomerNameMatch);
for(const option of CUSTOMER_DUPLICATE_OPTIONS) test(`${option.label} filters and has a server implementation`,()=>{
  const spec=duplicateSpec(option.value)!;assert.ok(spec);
  const unique=Object.fromEntries(spec.fields.map(field=>[field,"Different"]));
  const rows=[make("1",{lastWeekEnding:"11/01/2026"}),make("2"),make("3",unique)];
  assert.deepEqual(filterCustomerDuplicates(rows,option.value).map(row=>row.customerId),spec.backwards?["3"]:["1","2"]);
  assert.ok(customerDuplicateSql(option.value));
});
for(const option of CUSTOMER_DUPLICATE_OPTIONS) test(`${option.label} uses only explicitly selected profile membership`,()=>{
  assert.equal(matchesCustomerProfile("Spare 1","Customer Search",true),false);
  assert.equal(matchesCustomerProfile("Spare 1","Spare 1",true),true);
  assert.equal(matchesCustomerProfile("Spare 1","Spare 2",true),false);
  assert.equal(matchesCustomerProfile("Spare 1","Customer Search",false),false);
});
test("embedded tabs remain significant just as in Access",()=>{
  assert.equal(filterCustomerDuplicates([make("1",{customerName:"JP Electric"}),make("2",{customerName:"\tJP Electric"})],"name").length,0);
});
test("name/address matching removes spaces, phone matching preserves punctuation",()=>{
  assert.equal(filterCustomerDuplicates([make("1"),make("2",{customerName:"BEEHIVE",street:"12MainSt"})],"name-street").length,2);
  assert.equal(filterCustomerDuplicates([make("1"),make("2",{phone:"5550100"})],"phone").length,0);
});
test("with Last Week Ending includes all members only when a member has a week",()=>{
  assert.equal(filterCustomerDuplicates([make("1"),make("2")],"name-city-last-week-ending").length,0);
  assert.equal(filterCustomerDuplicates([make("1",{lastWeekEnding:"11/01/2026"}),make("2")],"name-city-last-week-ending").length,2);
});
test("Access profile checkboxes hide other profiles only after duplicate groups are found",()=>{
  const rows=[make("1",{customerName:"1a Plumbing",profileType:"Customer Search"}),make("2",{customerName:"1Aplumbing",profileType:"Spare 3"}),make("3",{customerName:"Only One",profileType:"Customer Search"})];
  const marked=filterCustomerDuplicates(rows,"name");
  assert.deepEqual(marked.filter(row=>row.profileType==="Customer Search").map(row=>row.customerId),["1"]);
  assert.deepEqual(filterCustomerDuplicates(rows,"name-backwards").filter(row=>row.profileType==="Customer Search").map(row=>row.customerId),["3"]);
});
for(const profileType of ["Customer Search","Spare 1","Spare 2","Spare 3","Research","Deleted","Hold"]) test(`${profileType} preserves a duplicate whose counterpart is in another profile`,()=>{
  const rows=[make("1",{profileType}),make("2",{profileType:"Other profile"}),make("3",{customerName:"Unique Customer",profileType})];
  assert.deepEqual(filterCustomerDuplicates(rows,"name").filter(row=>row.profileType===profileType).map(row=>row.customerId),["1"]);
  assert.deepEqual(filterCustomerDuplicates(rows,"name-backwards").filter(row=>row.profileType===profileType).map(row=>row.customerId),["3"]);
});
test("duplicate groups are calculated after other filters, and blank keys are excluded",()=>{
  const rows=[make("1"),make("2",{state:"MA"}),make("3",{customerName:""})];
  assert.equal(filterCustomerSearch1Rows(rows,{state:"NY",duplicates:"name"}).length,0);
  assert.deepEqual(filterCustomerDuplicates(rows,"name-backwards"),[]);
  assert.equal(customerDuplicateSql("name';DROP TABLE tblCustomer;--"),null);
  assert.equal(filterCustomerDuplicates(rows,""),rows);
});
