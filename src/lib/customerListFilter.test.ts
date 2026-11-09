import assert from "node:assert/strict";
import test from "node:test";
import { filterCustomerList } from "./customerListFilter";
const make=(i:number)=>({customerId:String(i),customerName:`Customer ${String(i).padStart(4,"0")}`,customerType:"02 Plumbing",noCommunication:false,lastWeekEnding:"",futureCallUserDate:""});
test("six disjoint lists contain 250 records and stop at 1500",()=>{
  const rows=Array.from({length:1600},(_,i)=>make(i));
  const batches=Array.from({length:6},(_,i)=>filterCustomerList(rows,i+1));
  assert.deepEqual(batches.map(batch=>batch.length),[250,250,250,250,250,250]);
  assert.equal(new Set(batches.flat().map(row=>row.customerId)).size,1500);
  assert.equal(batches[1][0].customerId,"250");assert.equal(batches[5][249].customerId,"1499");
  assert.equal(filterCustomerList(rows,0),rows);
});
test("exclude no communication, assignments and the six excluded types before batching",()=>{
  const rows=[make(1),{...make(2),noCommunication:true},{...make(3),lastWeekEnding:"11/01/2026"},...["02 Dump","10 Union","11 Sober House","11 Trade School","11 College","11 High School"].map((customerType,i)=>({...make(i+4),customerType}))];
  assert.deepEqual(filterCustomerList(rows,1).map(row=>row.customerId),["1"]);
});
test("sort oldest future-call update first, null dates first, then names; preserve input",()=>{
  const rows=[{...make(1),futureCallUserDate:"10/10/2026"},{...make(3),futureCallUserDate:"01/01/2026"},make(4),make(2)];
  assert.deepEqual(filterCustomerList(rows,1).map(row=>row.customerId),["2","4","3","1"]);
  assert.deepEqual(rows.map(row=>row.customerId),["1","3","4","2"]);
});
