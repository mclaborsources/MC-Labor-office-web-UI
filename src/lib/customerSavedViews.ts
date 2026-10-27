import { z } from "zod";
import { CUSTOMER_NAME_SEARCH_COLUMNS, type CustomerNameColumnKey } from "./customerNameSearchColumns";
const keys = new Set<string>(CUSTOMER_NAME_SEARCH_COLUMNS.map(column => column.key));
const columnKey = z.custom<CustomerNameColumnKey>(value => typeof value === "string" && keys.has(value));
export const customerViewLayoutSchema = z.object({
  order: z.array(columnKey).max(keys.size).refine(order => order.length === keys.size && new Set(order).size === keys.size, "Every column must appear once."),
  hidden: z.array(columnKey).max(keys.size - 1),
  widths: z.record(columnKey, z.number().int().min(48).max(1600)),
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
    "contactsLink", "licenseNumber", "licenseIssueDate", "licenseExpireDate", "salesPackageSentFilter",
    "salesPackageSentDate", "salesPackageSentUser", "contactCount",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 08: an empty grid with only Select visible. */
export function viewEightPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = ["select"];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 19: an empty grid with only Select visible. */
export function viewNineteenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = ["select"];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

export function isBlankGridCustomerViewSlot(slot: number): boolean {
  return [19, 20, 21, 22, 29, 30].includes(slot);
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
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > View 15 column order and visibility. */
export function viewFifteenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "noCommunication", "street", "city", "state", "phone", "lcu", "researchTries", "researchUser",
    "researchDate", "researchTime", "timePerSearch", "researchNoteShort", "researchBefore", "researchAfter", "researchUp",
    "researchWebsite", "researchWebsiteB", "cannotMakeAssignments", "corpS", "contactsLink", "researchNote",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Siobhan 1 column order and visibility. */
export function siobhanOnePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "city", "state", "phone", "sAdm", "customerType", "lastActionUser", "lastActionDate", "lastAction",
    "futureCallUser", "futureCallUserDate", "futureCall", "futureCallUserTime", "salesHistoryStatus", "contactsLink", "spare2",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Profile Type column order and visibility. */
export function profileTypePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerType", "sAdm", "customerName", "noCommunication",
    "street", "city", "state", "act", "lastWeekEnding", "internetSalesReadyUser", "internetSalesReadyDate", "internetSalesReady",
    "futureCallUser", "futureCallUserDate", "futureCall", "futureCallHistory", "salesHistoryStatus", "spacer1", "salesHistoryLink",
    "lastActionUser", "lastActionDate", "lastAction", "permitDate", "permitStreet", "permitCity", "permitState", "permitFee",
    "permitValue", "siteVisitUser", "siteVisitDate", "officeVisitUser", "officeVisitDate", "mailerUser", "mailerDate",
    "coldCallUser", "coldCallDate", "ctcTitle", "ctcFirst", "ctcLast", "ctcCell", "ctcEmail",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Select Profile column order and visibility. */
export function selectProfilePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = ["select", "entryUserName", "entryDate", "profileType"];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Siobhan 2 column order and visibility. */
export function siobhanTwoPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerName", "city", "phone", "state", "customerType", "firstWeekEnding", "lastWeekEnding", "act",
    "lastActionUser", "lastActionDate", "lastAction", "permitCity", "permitDate", "futureCallUser", "futureCallUserDate",
    "futureCall", "futureCallHistory", "salesHistoryStatus", "contactsLink", "spare2",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
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
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Siobhan 2 Screens column order and visibility. */
export function siobhanTwoScreensPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerName", "phone", "city", "state", "customerType",
    "contractWith", "sAdm", "firstWeekEnding", "lastWeekEnding", "lastActionUser", "lastActionDate", "lastAction", "act",
    "futureCallUser", "customerIdValue", "futureCallUserDate", "futureCall", "futureCallUserTime", "salesHistoryStatus",
    "contactsLink", "spare2", "spacer1", "permitDate", "permitCity", "permitState", "permitFee", "permitValue",
    "ctcFirst", "ctcLast", "ctcTitle", "ctcCell", "contactOffPhone", "ctcEmail",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Sales Packages column order and visibility. */
export function salesPackagesPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "profileType", "customerName", "city", "state", "customerType", "contractWith", "sAdm", "firstWeekEnding",
    "lastWeekEnding", "lastActionUser", "lastActionDate", "lastAction", "act", "futureCallUser", "futureCallUserDate",
    "futureCall", "futureCallUserTime", "salesHistoryStatus", "salesPackageSentFilter", "salesPackageSentDate",
    "salesPackageSent", "contactsLink", "spare2", "spacer1", "permitDate", "permitCity", "permitState", "permitFee",
    "permitValue", "ctcFirst", "ctcLast", "ctcTitle", "ctcCell", "contactOffPhone", "ctcEmail", "entryUserName", "entryDate",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Call List Template column order and visibility. */
export function callListTemplatePresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerName", "city", "state", "noCommunication", "customerType",
    "contractWith", "sAdm", "firstWeekEnding", "lastWeekEnding", "lastActionUser", "lastActionDate", "lastAction", "act",
    "futureCallUser", "futureCallUserDate", "futureCall", "futureCallUserTime", "salesHistoryStatus", "salesPackageSentFilter",
    "salesPackageSentDate", "salesPackageSent", "contactsLink", "spacer1", "permitDate", "permitCity", "permitState",
    "permitFee", "permitValue", "ctcFirst", "ctcLast", "ctcTitle", "ctcCell", "contactOffPhone", "ctcEmail", "spacer3",
    "spare1", "spare3", "spare4", "spare5", "spare6", "spare7", "spacer2", "spare2", "spare8",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Test 1 Screen column order and visibility. */
export function testOneScreenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "entryUserName", "entryDate", "profileType", "customerName", "noCommunication", "city", "state", "customerType",
    "lastWeekEnding", "lastActionUser", "lastActionDate", "lastAction", "act", "futureCallUser", "futureCallUserDate", "futureCall",
    "futureCallUserTime", "salesHistoryStatus", "permitDate", "permitCity", "permitState", "permitFee", "permitValue",
    "ctcTitle", "ctcFirst", "ctcLast", "ctcCell", "ctcEmail", "spare1", "contactCount",
  ];
  const visibleSet = new Set(visible);
  return {
    order: [...visible, ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key))],
    hidden: CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key).filter(key=>!visibleSet.has(key)),
    widths: {}, filters: {}, sort: null,
  };
}

/** Access frmCustomerSearch > Views > Test 2 Screen column order and visibility. */
export function testTwoScreenPresetLayout(): CustomerViewLayout {
  const visible: CustomerNameColumnKey[] = [
    "select", "customerType", "sAdm", "customerName", "noCommunication", "street", "city", "state", "act", "lastWeekEnding",
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
    widths: {}, filters: {}, sort: null,
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
  const widths = Object.fromEntries(Object.entries(widthsRaw).filter(([key, width]) => valid(key) && typeof width === "number" && Number.isInteger(width) && width >= 48 && width <= 1600)) as CustomerViewLayout["widths"];
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
