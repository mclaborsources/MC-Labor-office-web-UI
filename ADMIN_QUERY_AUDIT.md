# Admin dropdown database query audit

Audited 2026-10-13 against the 26 entries in LEGACY_ADMIN_OPTIONS in src/components/tracking/TrackingScreen.tsx and the connected SQL Server catalog. Every item has a database query path. The queries below were executed read-only against the connected database.

The live catalog contains 3,482 columns. The referenced Access .accdb and exported form modules are absent from this checkout. Table and field mappings are verified against SQL Server; exact Access form layouts and VBA calculation parity are not asserted.

## Item inventory

| Admin item | Result | Source / query |
|---|---|---|
| UI Report | Existing query verified (26 requests) | tblUnemploymentRequests; getAllUnemploymentRequestRows |
| Accident Report Search | Existing query verified (213 reports) | tblProjectAccidentReports and related lookup/history tables; getAllAccidentReportRows |
| Vacation Hours Report | Replaced sample rows; 8 summaries for latest year | tblEmployee, tblTracking, tblEmployeeVacationHours, tblPullDownPayrollCoOnSite; getVacationHoursRows |
| Employee Hours By Week Report | Existing query verified | tblTracking; getEmployeeHoursRows("week", year) |
| Employee Hours By Month Report | Existing query verified | tblTracking; getEmployeeHoursRows("month", year) |
| Full-Time Employees by Month | Existing query verified | tblTracking and payroll lookup; getFullTimeEmployeesByMonthRows |
| Employee Health Ins By Month Report | Existing query verified | tblEmployeeHealthInsurance, tblEmployeePayrollCoOnSite, tblEmployee, tracking and insurance lookups; getHealthInsuranceMonthRows |
| Employee Advance Report | Replaced missing holding-table query; 1,487 advances | tblEmployeeAdvances, tblEmployee, tblPayrollAdjustments; getEmployeeAdvanceReportRows |
| Insurance Certificate Request Search | Existing query verified (4,274 requests with All range) | tblCustomerInsuranceCertReqs, tblCustomer, state lookup; getInsuranceCertificateRequestRows |
| Payroll Exclusions | Replaced sample rows and local-only checkboxes; 4 records | tblPayrollExclusions → employee and payroll company; getPayrollExclusionRows |
| Weekly Customer Margin Report | Existing date-range API query verified | tblCustomerWeeks, tblCustomer, tblTracking and customer/salesman lookups; getMarginByWeekRows |
| Employee Research | Existing query verified (353 records); previous screen-name fix preserved | tblEmployeeResearch.EmployeeResearchObject and employee/staff lookups; getEmployeeResearchRows |
| Yearly Revenue | Recreated Access customer-by-year design; all 104,271 customers searchable with 200-row pages | tblCustomer, tblCustomerWeeks, customer type and salesman lookups; getYearlyRevenueReport |
| Newsletter Search | Replaced general-contact query; 15 newsletter contacts | tblNewsletterContacts; getNewsletterContactRows |
| Email Addresses | Existing query verified | tblTracking → tblEmployee; getEmailAddressRows |
| Employee Licenses | Replaced guessed holding fields and 200-employee cap | tblEmployeeLicenses → employee, license type and state; getEmployeeDocumentRows("licenses") |
| Health Ins | Existing date-prompt/query verified | tblTracking and health insurance relationships; getHealthInsuranceRows |
| ID Drivers License | Added dedicated route/query | tblEmployee.ID1/ID2/ID3 fields → tblPullDownIDTitles; getEmployeeDocumentRows("id") |
| Interview Questions | Replaced holding-table values | tblEmployee.InterviewQuestions / InterviewQuestionsNotes; getEmployeeDocumentRows("interview") |
| OSHA | Replaced guessed OSHA / OSHANotes fields | tblEmployee.OSHA10StatusID / OSHA10 / EmOSHANotes / OSHANumber → tblPullDownOSHA10Status; getEmployeeDocumentRows("osha") |
| Resume or Work History | Replaced holding-table values | tblEmployee.ResumeOrWorkHistory / ResumeOrWorkHistoryNotes; getEmployeeDocumentRows("resume") |
| Smart Phone | Replaced nonexistent SmartPhone / SmartPhoneNotes fields | tblEmployee.EmSmartPhone; getEmployeeDocumentRows("smartphone") |
| Face Meeting | Replaced holding-table values | tblEmployee.FaceMeeting / FaceMeetingNotes; getEmployeeDocumentRows("face") |
| Tracking Search | Replaced capped preview query; historical week selector | tblTracking by actual WeekEndingDate; getTrackingSearchRows |
| Compare Tracking Weeks | Added dedicated route/query | tblTracking grouped by EmployeeID, CustomerID, ProjectID, PayrollCoOnSiteID and week; getTrackingWeekComparisonRows |
| Deleted Employees | Existing query verified | tblTracking previous/current assignment comparison; getDeletedEmployees |

## Mapping and calculation details

- Employee document screens query permanent employee/licensing records. They display 200 rows per page with a database-wide search and full matching record count. The database contains 178,543 employees and 55,607 linked license records. Latest customer/job context comes from the latest non-expense tracking row, ordered by week ending and TrackingID.
- Document search covers employee name, cell, trade, qualification, status and details. SQL parameters are bound; percent, underscore and opening bracket in search input are treated literally. Assignment text is context, not a search field.
- ID Drivers License expands all three stored ID slots. Each returned row retains its employee ID and slot, title, number, agency, expiration and on-file flag.
- Vacation summaries group non-expense tracking rows by employee, payroll company and selected AssignYear, using stored TotalHours, RegularHours and OvertimeHours. Eligibility comes from configured vacation fields or paid vacation in that year. Vacation paid hours come from EmployeeVacationHoursQuantity dated by EmployeeVacationHoursWeekEndingPaid. Historical first/last worked weeks are limited to the end of the selected year. First Assignment Date is the recorded AssignmentTimestamp. Annual hour headings explicitly identify the selected year; they are not represented as lifetime accruals.
- Advance balances are EmployeeAdvanceAmount plus the sum of signed PayrollAdjustmentAmount linked by EmployeeAdvanceID. Negative payroll deductions reduce balances; positive corrections increase them. The configured EmployeeAdvanceRepaymentAmount is displayed separately, and Up To Date is the latest linked adjustment's WeekEndingDate.
- Comparison aggregates duplicate work rows before matching assignments, including NULL job/company identifiers. Added, Removed, Changed and Unchanged statuses compare presence, hours, pay rate and bill rate. A transfer appears as Removed plus Added. It excludes expense rows. Changes-only is a display filter.
- Payroll exclusion Active values are read from SQL, not toggled in browser state. This task connects reads; it does not add write workflows.
- Changed report pages check for an active signed-in session before querying data.

## Validation

- All 26 report query paths executed successfully against SQL Server.
- Unique row IDs checked for new/rewritten reports.
- Same-week comparison: all rows Unchanged, all hour differences zero.
- License pages 1 and 2: 200 rows each, no overlapping IDs, consistent total count matching an independent license-table count.
- Database search: matching records found beyond the default page; literal wildcard search does not expand to unrelated records.
- Vacation totals matched an independent employee/payroll/year aggregation from tblTracking.
- Browser: payroll exclusions (4 rows), vacation (8 rows), newsletter (15 rows), license pagination/search, comparison (327 assignments), and historical tracking controls checked.
- ESLint passed for changed report/query files.
- Full TypeScript check reports the pre-existing invalid helper export mapAccidentPayload from src/app/api/reports/accidents/[id]/route.ts. No new TypeScript errors were reported.

## Existing implementation limits outside the missing-query work

Existing weekly/monthly hours and email queries retain their pre-existing TOP limits. Weekly Customer Margin already has a query invoked by Refresh after choosing a date range; some specialized margin fields remain NULL and existing disabled filters remain unimplemented. This audit establishes query coverage, not complete Access workflow parity or a replacement for those separate report calculations.

## Yearly Revenue design update

Recreated the supplied Access design with compact toolbar, six view slots, explicit/live name search, years-of-no-business radio filters, customer metadata and annual revenue columns. Revenue is summed by customer and WeekEndingDate year; absence of an invoice-year remains blank instead of a fabricated zero. Customers without any customer-week records are included. SQL-backed pagination replaces the old 3,000 customer-year limit. Years 1999–2026 are available; the initial columns start at 2011, matching the reference. Go To changes the first visible year.

Cu Since is the first recorded customer-week year; First/Last Week E are its minimum/maximum dates. Entry Date comes from CustEntryTimestamp; S Admin comes from the customer SalesmanID lookup. Years of No Business includes customers with no recorded weeks or a last week older than the selected rolling number of years. Saved views are stored in this browser; Export View exports the displayed page as CSV.

Verified pagination has no duplicate customer IDs, report counts match the customer table, annual sums match independent invoice aggregation, revenue sorting is numeric, name search treats wildcard characters literally, and inactivity counts match an independent SQL query. Browser checks covered search, view save/restore/delete, year selection and sorting.

## Employee Research reconciliation with original Access

The original Access screenshot confirms that the report displays stored EmployeeResearchTime and places staff names alphabetically with records in research-ID order. The previous web newest-first order put unnamed search sessions above named contact history. Timestamp-based duration calculations also differed from the original report. Both have been corrected.

All 353 records remain present, including 102 employee-linked contact-history records and 251 search sessions with no employee ID. The first six rows now match Access IDs 260–265: Dave Dupie, a search session, Christopher Brown, a search session, Adriano Andrade, and a search session. Aaron A DuHamel follows for Raymond Mc Veigh. Empty fields are rendered blank, as in Access, with optional explanatory hover text. First/last name search works with or without a middle initial.

Type names come from tblPullDownEmployeeResearchTypes: 1=Sleep Time, 2=Work Time. Time Sec comes directly from EmployeeResearchTime, preserving NULL values. Its stored values sum to 6,638 Sleep seconds and 1,911 Work seconds, for 8,549 Overall seconds. Each total rounds to the nearest minute, matching the screenshot: 1 hr 51 min Sleep, 0 hr 32 min Work, 2 hr 22 min Overall. The observed stored values are seconds components, but Access parity requires displaying them rather than substituting full elapsed timestamp differences. A timestamp difference is used only for compatibility with schemas lacking a stored duration column.

Verified every returned type, employee ID and Time Sec against an independent SQL query, plus the screenshot row order, names, date format, record count and totals. No employee data was missing from the query; expected blank search-session fields remain blank in both applications.

## Newsletter Search design update

Recreated the provided Access layout: five view slots and presets, Name/Email search, Use Button Yes/No, communication radio filters, Clear/All selection, newsletter selector, preview controls, Import/Delete controls, and separate Select, Source, First Name, Last Name, Email Address, No Communication and Sent columns. The grid includes the empty Access-style worksheet area after the 15 records.

Contact ordering matches the screenshot by source, first name, email, communication flag and contact ID, including duplicate email entries. All 15 contacts are preserved; three have No Communication set. Two newsletter options are read from tblEmailTemplates where EmailTemplateType is Newsletter. Search, selection, header sorting, browser-saved views, CSV export and template preview are implemented. Preview is isolated in a sandbox with external resources blocked.

Email delivery, contact import and deletion remain inactive: this request implements the UI and reads, not those write workflows. No Communication is displayed read-only from SQL; Sent has no backing field in tblNewsletterContacts and is shown as an unavailable status. No emails were sent and no contacts were imported or deleted during verification.

SQL validation checked contact count, unique IDs, screenshot order, communication preferences and newsletter options. Browser validation checked explicit name search, saving/restoring/deleting a view, No Communication filtering (3 of 15), selection, preview and inactive sending controls.

Newsletter CSV download verification was blocked because browser download permission was declined. The download was not retried or performed through another route. Live email filtering was also checked: irohc matches 2 of 15 contacts.

## Original Access source located (2026-10-13)
Read the user-provided Desktop database `2026 08-30 MLS 5-43-8.accdb` read-only through DAO. Exported forms, VBA modules, report definitions, and selected query SQL into the ignored `reference/access-export` folder using a separate inspection copy with startup macros disabled. The original file was not edited. The web report renderer uses extracted report controls and captions in `src/lib/jobLegalTemplates.json`.
Corrected instruction copying to duplicate a named template; added duplicate-name validation, verification clearing, address-change history, and tracking job-name propagation. Massachusetts previews for NOI, NOC, Statement of Account, Satisfaction of Claim of Lien, Satisfaction of Notice of Contract, Stop Payment Notice, and Money Owed are connected. Missing party/county fields block printing; signature images are omitted. Other states and Bond Claim remain unported; this is not complete parity with all Access reports.
Live report data queries and 121 original expressions validated. Six mocked write-validation checks passed without production writes. Existing accident route helper-export error still blocks the overall TypeScript check.
