import test from "node:test";
import assert from "node:assert/strict";
import { blastEmailPresetLayout, callListTemplatePresetLayout, coldDormantCallPresetLayout, customerInfoPresetLayout, customerSavedViewSchema, defaultCustomerPresetLayout, defaultCustomerViewLayout, emailMailerPresetLayout, isBlankGridCustomerViewSlot, kickbacksPresetLayout, profileTypePresetLayout, ryanEamonBrianPresetLayout, rtsPresetLayout, salesPackagesPresetLayout, selectProfilePresetLayout, siobhanOnePresetLayout, siobhanTwoPresetLayout, siobhanTwoScreensPresetLayout, siteOfficeVisitPresetLayout, testOneScreenPresetLayout, testTwoScreenPresetLayout, viewEightPresetLayout, viewThirteenPresetLayout, viewFourteenPresetLayout, viewFifteenPresetLayout, viewSixteenPresetLayout, viewNineteenPresetLayout, viewThirtyOnePresetLayout, viewThirtyTwoPresetLayout } from "./customerSavedViews";
test("Default preset exposes the Access columns in screenshot order",()=>{
 const layout=defaultCustomerPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","noCommunication","street","city","state","customerType","lastWeekEnding","firstWeekEnding","act",
  "internetSalesReadyUser","internetSalesReadyDate","internetSalesReady","lastActionUser","lastActionDate","lastAction",
  "futureCallUser","futureCallUserDate","futureCallUserTime","futureCall","futureCallHistory","salesHistoryStatus","contactsLink",
  "licenseNumber","licenseIssueDate","licenseExpireDate","salesPackageSentFilter","salesPackageSentDate","salesPackageSentUser","contactCount",
 ]);
});
test("Customer Info preset adds its screenshot columns after the shared customer columns",()=>{
 const layout=customerInfoPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)).slice(-3),["contactsLink","customerDescription","importNote"]);
 assert.equal(layout.hidden.includes("firstWeekEnding"),true);
});
test("Blast Email preset exposes the screenshot contact columns in order",()=>{
 const layout=blastEmailPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)).slice(-6),["salesHistoryStatus","contactsLink","ctcTitle","ctcFirst","ctcLast","ctcEmail"]);
});
test("Site / Office Visit preset exposes both visit user and date columns",()=>{
 const layout=siteOfficeVisitPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)).slice(-4),["siteVisitUser","siteVisitDate","officeVisitUser","officeVisitDate"]);
});
test("Cold / Dormant Call preset exposes the user and date columns in screenshot order",()=>{
 const layout=coldDormantCallPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)).slice(-4),["coldCallUser","coldCallDate","dormantCallUser","dormantCallDate"]);
});
test("Email / Mailer preset exposes Outlook and Mailer dates and users in order",()=>{
 const layout=emailMailerPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)).slice(-4),["outlookEmailUser","outlookEmailDate","mailerUser","mailerDate"]);
});
test("View 08 preset leaves only the Select column visible",()=>{
 const layout=viewEightPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),["select"]);
});
test("View 19 preset leaves only the Select column visible",()=>{
 const layout=viewNineteenPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),["select"]);
});
test("Views 20, 21, 22, 29 and 30 share the same blank-grid preset as View 19",()=>{
 for(const slot of [19,20,21,22,29,30])assert.equal(isBlankGridCustomerViewSlot(slot),true,`View ${slot}`);
 for(const slot of [18,23,28,31])assert.equal(isBlankGridCustomerViewSlot(slot),false,`View ${slot}`);
 const shared=viewNineteenPresetLayout();
 assert.deepEqual(shared.order.filter(key=>!shared.hidden.includes(key)),["select"]);
});
test("View 31 preset exposes the activity and future-call columns in screenshot order",()=>{
 const layout=viewThirtyOnePresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","noCommunication","sAdm","customerType","firstWeekEnding","lastWeekEnding","act","siteVisitStatus",
  "siteVisitDate","officeVisitUser","officeVisitDate","lastActionUser","lastActionDate","lastAction","futureCallUser",
  "futureCallUserDate","futureCall","futureCallHistory","salesHistoryStatus","contactsLink","spare1","spare2",
 ]);
});
test("View 32 preset exposes the customer, permit, activity and contact columns in screenshot order",()=>{
 const layout=viewThirtyTwoPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","entryUserName","entryDate","profileType","customerType","customerName","noCommunication","street","city","state","phone",
  "act","lastWeekEnding","internetSalesReadyUser","internetSalesReadyDate","internetSalesReady","futureCallUser","futureCallUserDate",
  "futureCall","futureCallHistory","salesHistoryStatus","spacer1","kickback","kickbackTimes","kickbackAction","salesHistoryLink",
  "lastActionUser","lastActionDate","lastAction","permitDate","permitStreet","permitCity","permitState","permitFee","permitValue",
  "siteVisitStatus","siteVisitDate","officeVisitUser","officeVisitDate","spacer3","mailerUser","mailerDate","coldCallUser","coldCallDate",
  "ctcTitle","ctcFirst","ctcLast","ctcCell","contactOffPhone","ctcEmail","spacer2","spare1","spare2","spare3","spare4","spare5","spare6","spare7","spare8",
 ]);
});
test("View 13 preset exposes its customer and research columns in screenshot order",()=>{
 const layout=viewThirteenPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","noCommunication","street","city","state","customerType","phone","website",
  "researchTries","researchUser","researchDate","researchNoteShort","spacer1","contactsLink",
 ]);
});
test("View 14 preset exposes the full research columns in screenshot order",()=>{
 const layout=viewFourteenPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","noCommunication","street","city","state","phone","website","researchTries","researchUser",
  "researchDate","timePerSearch","researchNoteShort","researchBefore","researchAfter","researchUp","spacer1","contactsLink",
 ]);
});
test("View 15 preset exposes the extended research columns in screenshot order",()=>{
 const layout=viewFifteenPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","noCommunication","street","city","state","phone","lcu","researchTries","researchUser",
  "researchDate","researchTime","timePerSearch","researchNoteShort","researchBefore","researchAfter","researchUp",
  "researchWebsite","researchWebsiteB","cannotMakeAssignments","corpS","contactsLink","researchNote",
 ]);
});
test("View 16 preset exposes profile, flags and extended research columns in screenshot order",()=>{
 const layout=viewSixteenPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","noCommunication","street","city","state","customerType","whereFound","profileType","phone","website",
  "lastWeekEnding","internetSalesReady","internetSalesReadyDate","spare1","spare2","spare3","spare4","lcu","researchTries",
  "researchUser","researchDate","researchTime","timePerSearch","researchNoteShort","researchBefore","researchAfter","researchUp",
  "corpS","contactsLink","researchNote","researchWebsite","researchWebsiteB","researchWebsiteChanged",
 ]);
});
test("Ryan-Eamon Brian preset exposes its profile and sales columns in screenshot order",()=>{
 const layout=ryanEamonBrianPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","noCommunication","profileType","sAdm","salesAdmin","street","city","state","customerType",
  "firstWeekEnding","lastWeekEnding","act","internetSalesReadyUser","internetSalesReadyDate","internetSalesReady","salesHistoryLink","spare1",
 ]);
});
test("Siobhan 1 preset exposes its compact location and action columns in order",()=>{
 const layout=siobhanOnePresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","city","state","phone","sAdm","customerType","lastActionUser","lastActionDate","lastAction",
  "futureCallUser","futureCallUserDate","futureCall","futureCallUserTime","salesHistoryStatus","contactsLink","spare2",
 ]);
});
test("Profile Type preset joins both screenshot sections in column order",()=>{
 const layout=profileTypePresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","entryUserName","entryDate","profileType","customerType","sAdm","customerName","noCommunication","street","city","state",
  "act","lastWeekEnding","internetSalesReadyUser","internetSalesReadyDate","internetSalesReady","futureCallUser","futureCallUserDate",
  "futureCall","futureCallHistory","salesHistoryStatus","spacer1","salesHistoryLink","lastActionUser","lastActionDate","lastAction",
  "permitDate","permitStreet","permitCity","permitState","permitFee","permitValue","siteVisitUser","siteVisitDate","officeVisitUser",
  "officeVisitDate","mailerUser","mailerDate","coldCallUser","coldCallDate","ctcTitle","ctcFirst","ctcLast","ctcCell","ctcEmail",
 ]);
});
test("Kick Backs preset exposes its checkbox, count and action columns in order",()=>{
 const layout=kickbacksPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)).slice(-3),["kickback","kickbackTimes","kickbackAction"]);
});
test("Select Profile preset shows only its four screenshot columns",()=>{
 const layout=selectProfilePresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),["select","entryUserName","entryDate","profileType"]);
});
test("Siobhan 2 preset exposes its permit and future-call columns in screenshot order",()=>{
 const layout=siobhanTwoPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerName","city","phone","state","customerType","firstWeekEnding","lastWeekEnding","act","lastActionUser","lastActionDate",
  "lastAction","permitCity","permitDate","futureCallUser","futureCallUserDate","futureCall","futureCallHistory","salesHistoryStatus","contactsLink","spare2",
 ]);
});
test("RTS preset exposes its customer and return-to-sender columns in screenshot order",()=>{
 const layout=rtsPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","entryUserName","entryDate","profileType","customerName","street","city","state","ctcFirst","ctcLast","permitCards","ctcEmail","rts","rtsUser","rtsDate",
 ]);
});
test("Siobhan 2 Screens preset exposes both screenshot sections in column order",()=>{
 const layout=siobhanTwoScreensPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","entryUserName","entryDate","profileType","customerName","phone","city","state","customerType","contractWith","sAdm",
  "firstWeekEnding","lastWeekEnding","lastActionUser","lastActionDate","lastAction","act","futureCallUser","customerIdValue",
  "futureCallUserDate","futureCall","futureCallUserTime","salesHistoryStatus","contactsLink","spare2","spacer1","permitDate",
  "permitCity","permitState","permitFee","permitValue","ctcFirst","ctcLast","ctcTitle","ctcCell","contactOffPhone","ctcEmail",
 ]);
});
test("Sales Packages preset exposes the screenshot columns and package fields in order",()=>{
 const layout=salesPackagesPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","profileType","customerName","city","state","customerType","contractWith","sAdm","firstWeekEnding","lastWeekEnding",
  "lastActionUser","lastActionDate","lastAction","act","futureCallUser","futureCallUserDate","futureCall","futureCallUserTime",
  "salesHistoryStatus","salesPackageSentFilter","salesPackageSentDate","salesPackageSent","contactsLink","spare2","spacer1",
  "permitDate","permitCity","permitState","permitFee","permitValue","ctcFirst","ctcLast","ctcTitle","ctcCell","contactOffPhone",
  "ctcEmail","entryUserName","entryDate",
 ]);
});
test("Call List Template preset exposes both screenshot sections and user flags in order",()=>{
 const layout=callListTemplatePresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","entryUserName","entryDate","profileType","customerName","city","state","noCommunication","customerType","contractWith",
  "sAdm","firstWeekEnding","lastWeekEnding","lastActionUser","lastActionDate","lastAction","act","futureCallUser",
  "futureCallUserDate","futureCall","futureCallUserTime","salesHistoryStatus","salesPackageSentFilter","salesPackageSentDate",
  "salesPackageSent","contactsLink","spacer1","permitDate","permitCity","permitState","permitFee","permitValue","ctcFirst",
  "ctcLast","ctcTitle","ctcCell","contactOffPhone","ctcEmail","spacer3","spare1","spare3","spare4","spare5","spare6",
  "spare7","spacer2","spare2","spare8",
 ]);
});
test("Test 1 Screen preset exposes the screenshot permit and contact columns in order",()=>{
 const layout=testOneScreenPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","entryUserName","entryDate","profileType","customerName","noCommunication","city","state","customerType","lastWeekEnding",
  "lastActionUser","lastActionDate","lastAction","act","futureCallUser","futureCallUserDate","futureCall","futureCallUserTime",
  "salesHistoryStatus","permitDate","permitCity","permitState","permitFee","permitValue","ctcTitle","ctcFirst","ctcLast",
  "ctcCell","ctcEmail","spare1","contactCount",
 ]);
});
test("Test 2 Screen preset exposes the screenshot sales, permit and contact columns in order",()=>{
 const layout=testTwoScreenPresetLayout();
 assert.deepEqual(layout.order.filter(key=>!layout.hidden.includes(key)),[
  "select","customerType","sAdm","customerName","noCommunication","street","city","state","act","lastWeekEnding",
  "internetSalesReadyUser","internetSalesReadyDate","internetSalesReady","futureCallUser","futureCallUserDate","futureCall",
  "futureCallHistory","salesHistoryStatus","spacer1","salesHistoryLink","lastActionUser","lastActionDate","lastAction","permitDate",
  "permitStreet","permitCity","permitState","permitFee","permitValue","spare8","siteVisitUser","siteVisitDate","officeVisitUser",
  "officeVisitDate","coldCallUser","coldCallDate","ctcTitle","ctcFirst","ctcLast","ctcCell","ctcEmail","mailerDate","mailerUser",
 ]);
});
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
