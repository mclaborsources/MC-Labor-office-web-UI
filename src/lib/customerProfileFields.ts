// Explicit Access-to-web bindings shared by the editor and server validation.
export const CUSTOMER_PROFILE_FIELDS: Record<string,string> = {
  "No Communication":"CustomerNoCommunication", "Return to Sender":"CustomerReturnToSender", "Invoice Email":"CustEmail", "Customer Web Site":"CustWebSiteHLink", "LinkedIn Profile":"CustomerLinkedInProfile", "Customer Note Shown in Tracking":"CustomerNote", "Invoice Note Shown in Tracking":"InvoiceNote",
  Customer:"CustBusName", "Cust.":"CustBusName", Street:"Street", "City, State":"City", "City, St.":"City", State:"State", Zip:"Zip",
  Phone:"Phone", Fax:"CustFaxNum", Email:"CustEmail", "Web Site":"CustWebSiteHLink", "Corp Web Site":"CustCorpWebSiteHLink", "Cust. Web Site":"CustWebSiteHLink",
  Status:"CustStatusID", "Where Found":"WhereCustomerFoundID", "Cust Type":"CustomerTypeID", "Cust. Type":"CustomerTypeID", "Assigned Type":"CustomerAssignedTypeID",
  "License Number":"CustomerLicenseNumber", "License Issue Date":"CustomerLicenseIssueDate", "License Expire Date":"CustomerLicenseExpDate",
  "Customer Since":"CustEntryTimestamp", "Contract Date":"ContractDate", "Date on Contract":"ContractDate", "Contract With":"CustContractWith_PayrollCoID",
  "Contract Salesman":"ContractSalesmanID", "Salesman (Admin)":"SalesmanID", "Allow Contract With":"AllowContractWith_PayrollCoID", "Extra Verbiage on Contract":"ExtraVerbiageOnContractID",
  "Contract user":"PopulateContractUserName", "Contract update date":"PopulateContractTimestamp", "Updated Contract":"UpdatedContract", "Companies folder":"CustomerFolder",
  "Different Mailing Address":"DifferentMailingAddress", "Send Timesheets with Verify":"SendTimesheetsWithVerify", "Send Timesheets with Invoice":"SendTimesheetsWithInvoice",
  "Total Invoices by Job":"TotalByJobInvoice", "Show Customer in Tracking":"CustomerShowInTracking", "Cannot Make Assignments":"CustomerCannotMakeAssignments",
  "Allow Segments":"AllowSegments", "Allow Multiple Jobs per Segment":"AllowMultipleJobsPerSegment", "Exclude from Margin Report":"ExcludeFromMarginReport",
  "Exclude from Directions":"CustomerExcludeFromDirections", "AR Report Show Due Date":"AccountsReceivableShowDueDate", "AR Report Note 1":"AccountsReceivableNote1", "AR Report Note 2":"AccountsReceivableNote2",
  "Customer is Set Up":"CustomerIsSetUp", Hunter:"HunterID", "Credit History":"CustPaymentStatusID", "Term Limit":"CreditTermLimitID", "Legal Status":"LegalStatusID",
  "Insurance note":"CustInsuranceNote", "Bill Rate Overtime Multiplier":"BillRateOTMultiplier",
  "Pay Rate to Bill Rate Multiplier Grade X1":"PayRateToBillRateMultiplierX1", "Pay Rate to Bill Rate Multiplier Grade X2":"PayRateToBillRateMultiplierX2", "Pay Rate to Bill Rate Multiplier Grade X3":"PayRateToBillRateMultiplierX3",
  "Labor Rate A from":"LaborRateAFrom", "Labor Rate A to":"LaborRateATo", "Labor Rate B from":"LaborRateBFrom", "Labor Rate B to":"LaborRateBTo", "Labor Rate C from":"LaborRateCFrom", "Labor Rate C to":"LaborRateCTo",
  "Customer Note":"CustomerNote", "Invoice Note":"InvoiceNote", "Collections Note":"CollectionsNote", "Credit Limit":"CreditLimit", "QBCustomer ID":"QBCustomerID",
  "Internet Sales Ready":"InternetSalesReadyID", "Sales History Status":"SalesHistoryStatusID", "Future Call:":"FutureCall", "Customer Research Notes":"CustomerNote",
  "Corp Search, Found":"CorpSearchFound", "Corp Search, Not Found":"CorpSearchNotFound", "Lic Search, Found":"LicenseSearchFound", "Lic Search, Not Found":"LicenseSearchNotFound",
};
export const VERIFY_FIELDS: Record<string,string> = {
  "Cust.":"CustBusNameVerify", Street:"StreetVerify", "City, St.":"StateCityIDVerify", Zip:"ZipVerify",
  "mailing street":"MailStreetVerify", "mailing city state":"MailStateCityIDVerify", "mailing zip":"MailZipVerify", phone:"PhoneVerify", fax:"CustFaxNumVerify",
  "customer type":"CustomerTypeIDVerify", "corporate website":"CustCorpSiteVerify", "customer website":"CustWebSiteVerify",
};
export type ProfileRecord = Record<string,string>;
export interface CustomerProfileData {
  fields:ProfileRecord;
  related:Record<string,ProfileRecord[]>;
  lookups:Record<string,Array<{value:string;label:string}>>;
  errors:string[];
}
export const PROFILE_RELATED = {
  collections:{table:"tblCustomerNotes",id:"CustomerNoteID",fields:["CustomerNote","CustomerNoteActive"],user:"CustomerNoteUserName",date:"CustomerNoteTimestamp"},
  wcc:{table:"tblCustomerWCCs",id:"CustomerWCCID",fields:["WCCID","CustomerWCCActive"],user:"CustomerWCCUserName",date:"CustomerWCCTimestamp"},
  certificates:{table:"tblCustomerInsuranceCertReqs",id:"CustomerInsuranceCertReqID",fields:["CustomerInsuranceCertReqRequestedBy","CustomerInsuranceCertReqStateID","CustomerInsuranceCertReqTimestamp"],user:"",date:"CustomerInsuranceCertReqTimestamp"},
  history:{table:"tblCustomerSalesHistory",id:"CustomerSalesHistoryID",fields:["CustomerSalesHistoryActionTypeID","CustomerSalesHistoryNote","CustomerSalesHistoryContactID","CustomerSalesHistoryResponseHLink"],user:"CustomerSalesHistoryUserName",date:"CustomerSalesHistoryTimestamp"},
  contacts:{table:"tblCustomerContacts",id:"CustomerContactID",fields:["CustomerContactFName","CustomerContactLName","CustomerContactTitleID","CustomerContactEmail","CustomerContactCell","CustomerContactOfficePhone","CustomerContactNotes","CustomerContactSort","CustomerContactLinkedInProfile"],user:"CustomerContactUserName",date:"CustomerContactTimestamp"},
  billRates:{table:"tblCustomerBillRates",id:"CustomerBillRateID",fields:["BillRateGrade","BillRate","BillRateNote","BillRateActive","BillRateSort"],user:"BillRateUserName",date:"BillRateTimestamp"},
  permits:{table:"tblCustomerPermits",id:"CustomerPermitID",fields:["CustomerPermitStreet","CustomerPermitCity","CustomerPermitState","CustomerPermitDate","CustomerPermitFee","CustomerPermitValue"],user:"CustomerPermitUserName",date:"CustomerPermitTimestamp"},
  jobs:{table:"tblProject",id:"ProjectID",fields:["ProjStatusID"],user:"",date:""},
  research:{table:"tblCustomerResearchNotes",id:"CustomerResearchNoteID",fields:["CustomerResearchNote"],user:"CustomerResearchNoteUserName",date:"CustomerResearchNoteTimestamp"},
} as const;
