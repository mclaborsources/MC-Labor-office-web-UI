import { z } from "zod";
import { CUSTOMER_NAME_SEARCH_COLUMNS, type CustomerNameColumnKey } from "./customerNameSearchColumns";
const keys = new Set<string>(CUSTOMER_NAME_SEARCH_COLUMNS.map(column => column.key));
const columnKey = z.custom<CustomerNameColumnKey>(value => typeof value === "string" && keys.has(value));
export const customerViewLayoutSchema = z.object({
  order: z.array(columnKey).max(keys.size).refine(order => order.length === keys.size && new Set(order).size === keys.size, "Every column must appear once."),
  hidden: z.array(columnKey).max(keys.size - 1),
  widths: z.record(columnKey, z.number().int().min(4).max(1600)),
  filters: z.record(columnKey, z.array(z.string().max(5000)).max(20000)),
  sort: z.object({key:columnKey, direction:z.enum(["asc","desc"])}).nullable(),
});
export type CustomerViewLayout = z.infer<typeof customerViewLayoutSchema>;
export const customerSavedViewSchema = z.object({slot:z.number().int().min(1).max(64),name:z.string().trim().min(1).max(80),layout:customerViewLayoutSchema});
export type CustomerSavedView = z.infer<typeof customerSavedViewSchema>;
export function defaultCustomerViewLayout(): CustomerViewLayout {
  return {order:CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key),hidden:[],widths:{},filters:{},sort:null};
}

/** Access frmCustomerSearch > Views > Default column order and visibility. */
export function defaultCustomerPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType",
    "lastWeekEnding", "firstWeekEnding", "act", "internetSalesReadyUser", "internetSalesReadyDate",
    "internetSalesReady", "lastActionUser", "lastActionDate", "lastAction", "futureCallUser",
    "futureCallUserDate", "futureCallUserTime", "futureCall", "futureCallHistory", "salesHistoryStatus",
    "contactsLink", "basicInfoLink", "licenseNumber", "licenseIssueDate", "licenseExpireDate", "salesPackageSentFilter",
    "salesPackageSentDate", "salesPackageSentUser", "contactCount",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:66,customerName:193,noCommunication:15,street:72,city:86,state:57,customerType:79,lastWeekEnding:79,firstWeekEnding:87,act:36,internetSalesReadyUser:37,internetSalesReadyDate:79,internetSalesReady:47,lastActionUser:37,lastActionDate:79,lastAction:106,futureCallUser:37,futureCallUserDate:79,futureCallUserTime:79,futureCall:107,futureCallHistory:142,salesHistoryStatus:347,contactsLink:51,basicInfoLink:96,licenseNumber:128,licenseIssueDate:141,licenseExpireDate:148,salesPackageSentFilter:96,salesPackageSentDate:96,salesPackageSentUser:96,contactCount:115}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Customer Info column order and visibility. */
export function customerInfoPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType",
    "lastWeekEnding", "act", "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady",
    "lastActionUser", "lastActionDate", "lastAction", "futureCallUser", "futureCallUserDate",
    "futureCall", "futureCallHistory", "salesHistoryStatus", "contactsLink", "customerDescription", "importNote",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:193,noCommunication:15,street:72,city:86,state:53,customerType:79,lastWeekEnding:79,act:36,internetSalesReadyUser:37,internetSalesReadyDate:79,internetSalesReady:47,lastActionUser:37,lastActionDate:79,lastAction:106,futureCallUser:37,futureCallUserDate:79,futureCall:107,salesHistoryStatus:86,contactsLink:51,customerDescription:152,importNote:130}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Blast Email column order and visibility. */
export function blastEmailPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType", "lastWeekEnding", "act",
    "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady", "lastActionUser", "lastActionDate", "lastAction",
    "futureCallUser", "futureCallUserDate", "futureCall", "salesHistoryStatus", "contactsLink", "ctcTitle", "ctcFirst", "ctcLast", "ctcEmail",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

/** Shared Blast Email and Blast Testing widths measured from the Access reference. */
export function viewThreePresetLayout(): CustomerViewLayout {
  const layout = blastEmailPresetLayout();
  return {...layout, widths: {
    select:23,customerName:193,noCommunication:15,street:72,city:86,state:53,
    customerType:79,lastWeekEnding:79,act:36,internetSalesReadyUser:37,
    internetSalesReadyDate:79,internetSalesReady:47,lastActionUser:37,
    lastActionDate:79,lastAction:106,futureCallUser:37,futureCallUserDate:79,
    futureCall:107,salesHistoryStatus:86,contactsLink:51,
    ctcTitle:79,ctcFirst:78,ctcLast:81,ctcEmail:200,
  }};
}

/** Access frmCustomerSearch > Views > Site / Office Visit column order and visibility. */
export function siteOfficeVisitPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType", "lastWeekEnding", "act",
    "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady", "lastActionUser", "lastActionDate", "lastAction",
    "futureCallUser", "futureCallUserDate", "futureCall", "salesHistoryStatus", "contactsLink",
    "siteVisitUser", "siteVisitDate", "officeVisitUser", "officeVisitDate",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {...viewThreePresetLayout().widths,siteVisitUser:37,siteVisitDate:114,officeVisitUser:38,officeVisitDate:128}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Cold / Dormant Call column order and visibility. */
export function coldDormantCallPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType", "lastWeekEnding", "act",
    "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady", "lastActionUser", "lastActionDate", "lastAction",
    "futureCallUser", "futureCallUserDate", "futureCall", "salesHistoryStatus", "contactsLink",
    "coldCallUser", "coldCallDate", "dormantCallUser", "dormantCallDate",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {...viewThreePresetLayout().widths,coldCallUser:37,coldCallDate:114,dormantCallUser:38,dormantCallDate:140}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Email / Mailer column order and visibility. */
export function emailMailerPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType", "lastWeekEnding", "act",
    "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady", "lastActionUser", "lastActionDate", "lastAction",
    "futureCallUser", "futureCallUserDate", "futureCall", "salesHistoryStatus", "contactsLink",
    "outlookEmailUser", "outlookEmailDate", "mailerUser", "mailerDate",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {...viewThreePresetLayout().widths,outlookEmailUser:51,outlookEmailDate:148,mailerUser:37,mailerDate:99}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 08: an empty grid with only Select visible. */
export function viewEightPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = ["select"];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 19: an empty grid with only Select visible. */
export function viewNineteenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = ["select"];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23}, filters: {}, sort: null,
  };
}

export function isBlankGridCustomerViewSlot(slot: number): boolean {
  return [8, 19, 20, 21, 22, 29, 30].includes(slot);
}

/** Access frmCustomerSearch > Views > View 31 column order and visibility. */
export function viewThirtyOnePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "sAdm", "customerType", "firstWeekEnding", "lastWeekEnding", "act",
    "siteVisitStatus", "siteVisitDate", "officeVisitUser", "officeVisitDate", "lastActionUser", "lastActionDate", "lastAction",
    "futureCallUser", "futureCallUserDate", "futureCall", "futureCallHistory", "salesHistoryStatus", "contactsLink", "spare1", "spare2",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:213,noCommunication:15,sAdm:57,customerType:80,firstWeekEnding:104,lastWeekEnding:80,act:37,siteVisitStatus:36,siteVisitDate:79,officeVisitUser:38,officeVisitDate:79,lastActionUser:37,lastActionDate:79,lastAction:105,futureCallUser:37,futureCallUserDate:79,futureCall:107,futureCallHistory:142,salesHistoryStatus:116,contactsLink:67,spare1:96,spare2:109}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 32 column order and visibility. */
export function viewThirtyTwoPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerType", "customerName", "noCommunication", "street", "city",
    "state", "phone", "act", "lastWeekEnding", "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady",
    "futureCallUser", "futureCallUserDate", "futureCall", "futureCallHistory", "salesHistoryStatus", "spacer1", "kickback",
    "kickbackTimes", "kickbackAction", "salesHistoryLink", "lastActionUser", "lastActionDate", "lastAction", "permitDate",
    "permitStreet", "permitCity", "permitState", "permitFee", "permitValue", "siteVisitStatus", "siteVisitDate", "officeVisitUser",
    "officeVisitDate", "spacer3", "mailerUser", "mailerDate", "coldCallUser", "coldCallDate", "ctcTitle", "ctcFirst", "ctcLast",
    "ctcCell", "contactOffPhone", "ctcEmail", "spacer2", "spare1", "spare2", "spare3", "spare4", "spare5", "spare6", "spare7", "spare8",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:46,entryUserName:37,entryDate:79,profileType:99,customerType:88,customerName:193,noCommunication:15,street:72,city:86,state:53,phone:101,act:37,lastWeekEnding:136,internetSalesReadyUser:37,internetSalesReadyDate:79,internetSalesReady:47,futureCallUser:37,futureCallUserDate:79,futureCall:107,futureCallHistory:142,salesHistoryStatus:347,spacer1:64,kickback:81,kickbackTimes:121,kickbackAction:124,salesHistoryLink:84,lastActionUser:37,lastActionDate:79,lastAction:105,permitDate:102,permitStreet:111,permitCity:97,permitState:105,permitFee:96,permitValue:110,siteVisitStatus:37,siteVisitDate:79,officeVisitUser:38,officeVisitDate:79,spacer3:23,mailerUser:23,mailerDate:79,coldCallUser:37,coldCallDate:79,ctcTitle:79,ctcFirst:78,ctcLast:81,ctcCell:98,contactOffPhone:98,ctcEmail:160,spacer2:88,spare1:89,spare2:111,spare3:94,spare4:96,spare5:96,spare6:96,spare7:96,spare8:96}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 33 (Deepak) columns. */
export function viewThirtyThreePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerName", "street", "city", "state", "sAdm",
    "customerType", "salesAdmin", "permitDate", "permitCity", "permitState", "permitFee", "permitValue",
    "spacer3", "ctcFirst", "ctcLast", "ctcCell", "ctcEmail",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,entryUserName:37,entryDate:79,profileType:96,customerName:191,street:72,city:86,state:57,sAdm:28,customerType:80,salesAdmin:28,permitDate:93,permitCity:93,permitState:93,permitFee:89,permitValue:102,spacer3:28,ctcFirst:79,ctcLast:81,ctcCell:98,ctcEmail:212}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 13 column order and visibility. */
export function viewThirteenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType", "phone", "website",
    "researchTries", "researchUser", "researchDate", "researchNoteShort", "spacer1", "contactsLink",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:144,noCommunication:22,street:122,city:90,state:53,customerType:80,phone:101,website:73,researchTries:71,researchUser:69,researchDate:79,researchNoteShort:154,spacer1:96,contactsLink:68}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 14 column order and visibility. */
export function viewFourteenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "phone", "website", "researchTries",
    "researchUser", "researchDate", "timePerSearch", "researchNoteShort", "researchBefore", "researchAfter", "researchUp",
    "spacer1", "contactsLink",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:144,noCommunication:22,street:122,city:90,state:53,phone:101,website:73,researchTries:71,researchUser:69,researchDate:79,timePerSearch:127,researchNoteShort:154,researchBefore:118,researchAfter:118,researchUp:58,spacer1:96,contactsLink:68}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 15 column order and visibility. */
export function viewFifteenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "phone", "lcu", "researchTries", "researchUser",
    "researchDate", "researchTime", "timePerSearch", "researchNoteShort", "researchBefore", "researchAfter", "researchUp",
    "researchWebsite", "researchWebsiteB", "researchWebsiteChanged", "corpS", "contactsLink", "researchNote",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:144,noCommunication:22,street:122,city:90,state:53,phone:101,lcu:51,researchTries:51,researchUser:50,researchDate:79,researchTime:78,timePerSearch:96,researchNoteShort:79,researchBefore:65,researchAfter:65,researchUp:64,researchWebsite:124,researchWebsiteB:120,researchWebsiteChanged:116,corpS:67,contactsLink:68,researchNote:121}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 16 column order and visibility. */
export function viewSixteenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType", "whereFound", "profileType",
    "phone", "website", "lastWeekEnding", "internetSalesReady", "internetSalesReadyDate", "spare1", "spare2", "spare3", "spare4",
    "lcu", "researchTries", "researchUser", "researchDate", "researchTime", "timePerSearch", "researchNoteShort",
    "researchBefore", "researchAfter", "researchUp", "corpS", "contactsLink", "researchNote", "researchWebsite",
    "researchWebsiteB", "researchWebsiteChanged",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:144,noCommunication:22,street:122,city:90,state:53,customerType:79,whereFound:74,profileType:96,phone:101,website:73,lastWeekEnding:90,internetSalesReady:107,internetSalesReadyDate:37,spare1:37,spare2:94,spare3:94,spare4:94,lcu:51,researchTries:51,researchUser:50,researchDate:79,researchTime:78,timePerSearch:96,researchNoteShort:79,researchBefore:65,researchAfter:65,researchUp:64,corpS:67,contactsLink:68,researchNote:121,researchWebsite:124,researchWebsiteB:120,researchWebsiteChanged:116}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Ryan-Eamon Brian column order and visibility. */
export function ryanEamonBrianPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "profileType", "sAdm", "salesAdmin", "street", "city", "state",
    "customerType", "firstWeekEnding", "lastWeekEnding", "act", "internetSalesReadyUser", "internetSalesReadyDate",
    "internetSalesReady", "salesHistoryLink", "spare1",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:193,noCommunication:15,profileType:96,sAdm:60,salesAdmin:94,street:72,city:86,state:53,customerType:151,firstWeekEnding:101,lastWeekEnding:135,act:36,internetSalesReadyUser:37,internetSalesReadyDate:79,internetSalesReady:155,salesHistoryLink:124,spare1:182}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Siobhan 1 column order and visibility. */
export function siobhanOnePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "city", "state", "phone", "sAdm", "noCommunication", "customerType", "lastActionUser", "lastActionDate", "lastAction",
    "futureCallUser", "futureCallUserDate", "futureCall", "futureCallUserTime", "salesHistoryStatus", "contactsLink", "spare2",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:167,city:86,state:53,phone:100,sAdm:60,noCommunication:15,customerType:80,lastActionUser:36,lastActionDate:79,lastAction:107,futureCallUser:37,futureCallUserDate:79,futureCall:107,futureCallUserTime:98,salesHistoryStatus:211,contactsLink:45,spare2:110}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Profile Type column order and visibility. */
export function profileTypePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerType", "sAdm", "customerName", "noCommunication",
    "street", "city", "state", "act", "lastWeekEnding", "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady",
    "futureCallUser", "futureCallUserDate", "futureCall", "futureCallHistory", "salesHistoryStatus", "spacer1", "salesHistoryLink",
    "lastActionUser", "lastActionDate", "lastAction", "permitDate", "permitStreet", "permitCity", "permitState", "permitFee",
    "permitValue", "siteVisitUser", "siteVisitDate", "officeVisitUser", "officeVisitDate", "spacer3", "mailerUser", "mailerDate",
    "coldCallUser", "coldCallDate", "ctcTitle", "ctcFirst", "ctcLast", "ctcCell", "ctcEmail",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:48,entryUserName:37,entryDate:79,profileType:100,customerType:88,sAdm:60,customerName:193,noCommunication:15,street:72,city:86,state:53,act:48,lastWeekEnding:136,internetSalesReadyUser:37,internetSalesReadyDate:79,internetSalesReady:47,futureCallUser:37,futureCallUserDate:79,futureCall:107,futureCallHistory:142,salesHistoryStatus:303,spacer1:94,salesHistoryLink:84,lastActionUser:37,lastActionDate:79,lastAction:105,permitDate:102,permitStreet:111,permitCity:97,permitState:105,permitFee:96,permitValue:110,siteVisitUser:37,siteVisitDate:79,officeVisitUser:38,officeVisitDate:79,spacer3:23,mailerUser:23,mailerDate:79,coldCallUser:37,coldCallDate:79,ctcTitle:79,ctcFirst:78,ctcLast:81,ctcCell:98,ctcEmail:160}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Kick Backs column order and visibility. */
export function kickbacksPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "customerType", "lastWeekEnding", "act",
    "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady", "lastActionUser", "lastActionDate", "lastAction",
    "futureCallUser", "futureCallUserDate", "futureCall", "salesHistoryStatus", "contactsLink",
    "kickback", "kickbackTimes", "kickbackAction",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {...viewThreePresetLayout().widths,kickback:81,kickbackTimes:121,kickbackAction:124}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Select Profile column order and visibility. */
export function selectProfilePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = ["select", "entryUserName", "entryDate", "profileType"];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:33,entryUserName:37,entryDate:79,profileType:96}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Siobhan 2 column order and visibility. */
export function siobhanTwoPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "city", "phone", "state", "noCommunication", "customerType", "firstWeekEnding", "lastWeekEnding", "act",
    "lastActionUser", "lastActionDate", "lastAction", "permitCity", "permitDate", "futureCallUser", "futureCallUserDate",
    "futureCall", "futureCallHistory", "salesHistoryStatus", "contactsLink", "spare2",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,customerName:167,city:86,phone:100,state:53,noCommunication:15,customerType:79,firstWeekEnding:87,lastWeekEnding:79,act:37,lastActionUser:37,lastActionDate:79,lastAction:106,permitCity:97,permitDate:102,futureCallUser:37,futureCallUserDate:79,futureCall:107,futureCallHistory:97,salesHistoryStatus:212,contactsLink:51,spare2:110}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > RTS column order and visibility. */
export function rtsPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerName", "street", "city", "state",
    "ctcFirst", "ctcLast", "permitCards", "ctcEmail", "rts", "rtsUser", "rtsDate",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:40,entryUserName:37,entryDate:79,profileType:96,customerName:272}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Siobhan 2 Screens column order and visibility. */
export function siobhanTwoScreensPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerName", "phone", "city", "state", "noCommunication", "customerType",
    "contractWith", "sAdm", "firstWeekEnding", "lastWeekEnding", "lastActionUser", "lastActionDate", "lastAction", "act",
    "futureCallUser", "customerIdValue", "futureCallUserDate", "futureCall", "futureCallUserTime", "salesHistoryStatus",
    "contactsLink", "spare2", "spacer1", "permitDate", "permitCity", "permitState", "permitFee", "permitValue",
    "ctcFirst", "ctcLast", "ctcTitle", "ctcCell", "contactOffPhone", "ctcEmail",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,entryUserName:37,entryDate:79,profileType:126,customerName:167,phone:100,city:86,state:53,noCommunication:16,customerType:79,contractWith:63,sAdm:71,firstWeekEnding:87,lastWeekEnding:79,lastActionUser:37,lastActionDate:79,lastAction:107,act:36,futureCallUser:37,customerIdValue:101,futureCallUserDate:79,futureCall:79,futureCallUserTime:35,salesHistoryStatus:183,contactsLink:59,spare2:76,spacer1:85,permitDate:102,permitCity:97,permitState:105,permitFee:96,permitValue:109,ctcFirst:142,ctcLast:142,ctcTitle:72,ctcCell:142,contactOffPhone:142,ctcEmail:142}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Sales Packages column order and visibility. */
export function salesPackagesPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "profileType", "customerName", "city", "state", "noCommunication", "customerType", "contractWith", "sAdm", "firstWeekEnding",
    "lastWeekEnding", "lastActionUser", "lastActionDate", "lastAction", "act", "futureCallUser", "futureCallUserDate",
    "futureCall", "futureCallUserTime", "salesHistoryStatus", "salesPackageSentFilter", "salesPackageSentDate",
    "salesPackageSent", "contactsLink", "spare2", "spacer1", "permitDate", "permitCity", "permitState", "permitFee",
    "permitValue", "ctcFirst", "ctcLast", "ctcTitle", "ctcCell", "contactOffPhone", "entryUserName", "entryDate",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:23,profileType:126,customerName:167,city:86,state:53,noCommunication:15,customerType:79,contractWith:63,sAdm:70,firstWeekEnding:87,lastWeekEnding:79,lastActionUser:37,lastActionDate:79,lastAction:106,act:36,futureCallUser:37,futureCallUserDate:79,futureCall:79,futureCallUserTime:35,salesHistoryStatus:183,salesPackageSentFilter:37,salesPackageSentDate:37,salesPackageSent:79,contactsLink:59,spare2:111,spacer1:85,permitDate:102,permitCity:97,permitState:105,permitFee:96,permitValue:109,ctcFirst:142,ctcLast:142,ctcTitle:72,ctcCell:142,contactOffPhone:142,entryUserName:37,entryDate:79}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Call List Template column order and visibility. */
export function callListTemplatePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerName", "city", "state", "noCommunication", "customerType",
    "contractWith", "sAdm", "firstWeekEnding", "lastWeekEnding", "lastActionUser", "lastActionDate", "lastAction", "act",
    "futureCallUser", "futureCallUserDate", "futureCall", "futureCallUserTime", "salesHistoryStatus", "salesPackageSentFilter",
    "salesPackageSentDate", "salesPackageSent", "spacer1", "permitDate", "permitCity", "permitState",
    "permitFee", "permitValue", "ctcFirst", "ctcLast", "ctcTitle", "ctcCell", "contactOffPhone", "ctcEmail", "spacer3",
    "spare1", "spare3", "spare4", "spare5", "spare6", "spare7", "spacer2", "spare2", "spare8",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {...salesPackagesPresetLayout().widths,select:23,entryUserName:37,entryDate:79,profileType:126,customerName:167,noCommunication:89,spacer1:32,permitDate:79,permitCity:79,permitState:86,permitFee:83,permitValue:79,ctcFirst:95,ctcLast:86,ctcTitle:72,ctcCell:98,contactOffPhone:114,ctcEmail:120,spacer3:8,spare1:114,spare3:114,spare4:114,spare5:114,spare6:114,spare7:114,spacer2:16,spare2:163,spare8:114}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Test 1 Screen column order and visibility. */
export function testOneScreenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerName", "noCommunication", "city", "state", "act", "lastActionUser", "lastActionDate", "lastAction", "futureCallUser", "futureCallUserDate", "futureCall",
    "futureCallUserTime", "salesHistoryStatus", "permitDate", "permitCity", "permitState", "permitFee", "permitValue",
    "ctcTitle", "ctcFirst", "ctcLast", "ctcCell", "ctcEmail", "spare1", "contactCount",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {select:21,entryUserName:37,entryDate:79,profileType:63,customerName:109,noCommunication:15,city:86,state:53,act:26,lastActionUser:37,lastActionDate:79,lastAction:82,futureCallUser:37,futureCallUserDate:79,futureCall:79,futureCallUserTime:35,salesHistoryStatus:114,permitDate:79,permitCity:79,permitState:32}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Test 2 Screen column order and visibility. */
export function testTwoScreenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerType", "sAdm", "customerName", "noCommunication", "street", "city", "state", "act", "lastWeekEnding",
    "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady", "futureCallUser", "futureCallUserDate", "futureCall",
    "futureCallHistory", "salesHistoryStatus", "spacer1", "salesHistoryLink", "lastActionUser", "lastActionDate", "lastAction",
    "permitDate", "permitStreet", "permitCity", "permitState", "permitFee", "permitValue", "spare8", "siteVisitUser", "siteVisitDate",
    "officeVisitUser", "officeVisitDate", "coldCallUser", "coldCallDate", "ctcTitle", "ctcFirst", "ctcLast", "ctcCell", "ctcEmail",
    "mailerDate", "mailerUser",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {...profileTypePresetLayout().widths,permitDate:79,permitStreet:89,permitCity:79,permitState:89,permitFee:72,permitValue:82,spare8:97,siteVisitUser:37,siteVisitDate:79,officeVisitUser:37,officeVisitDate:79,coldCallUser:37,coldCallDate:79,ctcTitle:79,ctcFirst:79,ctcLast:81,ctcCell:98,ctcEmail:160,mailerDate:37,mailerUser:37}, filters: {}, sort: null,
  };
}

/** Keep saved layouts created before new Access columns were added usable. */
export function normalizeCustomerViewLayout(value: unknown): CustomerViewLayout {
  const raw = typeof value === "string" ? JSON.parse(value) as Record<string, unknown> : value as Record<string, unknown>;
  if (!raw || typeof raw !== "object") return defaultCustomerViewLayout();
  const valid = (key: unknown): key is CustomerNameColumnKey => typeof key === "string" && keys.has(key);
  const order = Array.isArray(raw.order) ? raw.order.filter(valid) : [];
  const uniqueOrder = [...new Set(order)];
  const widthsRaw = raw.widths && typeof raw.widths === "object" ? raw.widths as Record<string, unknown> : {};
  const filtersRaw = raw.filters && typeof raw.filters === "object" ? raw.filters as Record<string, unknown> : {};
  const widths = Object.fromEntries(Object.entries(widthsRaw).filter(([key, width]) => valid(key) && typeof width === "number" && Number.isInteger(width) && width >= 4 && width <= 1600)) as CustomerViewLayout["widths"];
  const filters = Object.fromEntries(Object.entries(filtersRaw).filter(([key, selected]) => valid(key) && Array.isArray(selected) && selected.every(item => typeof item === "string"))) as CustomerViewLayout["filters"];
  const sortRaw = raw.sort && typeof raw.sort === "object" ? raw.sort as Record<string, unknown> : null;
  const sort = sortRaw && valid(sortRaw.key) && (sortRaw.direction === "asc" || sortRaw.direction === "desc")
    ? { key: sortRaw.key, direction: sortRaw.direction } as CustomerViewLayout["sort"] : null;
  const candidate = {
    order: [...uniqueOrder, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column => column.key).filter(key => !uniqueOrder.includes(key))],
    hidden: Array.isArray(raw.hidden) ? [...new Set(raw.hidden.filter(valid))] : [],
    widths, filters, sort,
  };
  return customerViewLayoutSchema.parse(candidate);
}

export function normalizeCustomerSavedView(value: unknown): CustomerSavedView {
  const raw = value as Record<string, unknown>;
  return customerSavedViewSchema.parse({ ...raw, layout: normalizeCustomerViewLayout(raw.layout) });
}
