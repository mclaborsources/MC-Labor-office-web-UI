import test from "node:test";
import assert from "node:assert/strict";
import { customerSavedViewSchema, defaultCustomerViewLayout } from "./customerSavedViews";
test("saved views retain reordered, hidden, resized, filtered and sorted columns",()=>{
 const layout=defaultCustomerViewLayout();
 [layout.order[0],layout.order[1]]=[layout.order[1],layout.order[0]];
 layout.hidden=[layout.order[2]];layout.widths[layout.order[0]]=360;
 layout.filters[layout.order[0]]=["A","B"];
 layout.sort={key:layout.order[1],direction:"desc"};
 const saved=customerSavedViewSchema.parse(JSON.parse(JSON.stringify({slot:10,name:"  My customers  ",layout})));
 assert.equal(saved.name,"My customers");assert.deepEqual(saved.layout,layout);
});
test("rejects invalid slots, duplicate or missing columns, unknown columns and invalid widths",()=>{
 const valid={slot:1,name:"My view",layout:defaultCustomerViewLayout()};
 for(const slot of [0,65,1.5])assert.equal(customerSavedViewSchema.safeParse({...valid,slot}).success,false);
 assert.equal(customerSavedViewSchema.safeParse({...valid,layout:{...valid.layout,order:valid.layout.order.slice(1)}}).success,false);
 assert.equal(customerSavedViewSchema.safeParse({...valid,layout:{...valid.layout,order:valid.layout.order.map(()=>valid.layout.order[0])}}).success,false);
 assert.equal(customerSavedViewSchema.safeParse({...valid,layout:{...valid.layout,hidden:["unknown-column"]}}).success,false);
 assert.equal(customerSavedViewSchema.safeParse({...valid,layout:{...valid.layout,widths:{[valid.layout.order[0]]:0}}}).success,false);
 assert.equal(customerSavedViewSchema.safeParse({...valid,name:"   "}).success,false);
});
