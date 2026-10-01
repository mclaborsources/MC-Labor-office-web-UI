# Access UI Page Parity Tracker

This checklist tracks **screens/pages**, not architecture or implementation design. Status is based on the page and component source in this checkout. A matching URL or visual shell does not mean the Access page is functionally complete.

## Important source limitation

The repo contains three exported VBA form modules under `reference/access-export/`, all for employee search/holding (including one deleted form), plus the binary `reference/MC-Labor-Access-Reference.accdb`. It does not contain an exported complete Access form/report inventory. Therefore, this is a reliable inventory of the current web pages and a partial Access comparison; Access items listed as “confirm” must be checked against the actual Access navigation/object list before calling the page missing.

Status: **Complete-ish** = identifiable, data-bearing page exists (parity still needs comparison); **Partial** = shell/limited fields, placeholder data, disabled actions, or incomplete UI; **Missing** = no matching web page found; **Confirm** = Access source inventory does not establish whether the Access screen exists or what it contains.

## Main navigation and primary pages

| Access area/page | Web page | UI status | Features visibly not implemented / incomplete |
|---|---|---|---|
| Main menu / home | `/`, `/dashboard` | Partial | Access-to-web menu item mapping; exact tile/group/order parity; root-to-dashboard landing parity. |
| Tracking | `/tracking` | Partial | Main grid, week/customer/job filtering, sorting, keyboard/record navigation and CSV export are present. Job-tab drafts now restore locally and selected customer contacts drive email/text recipients; several report buttons now open matching pages. Remaining: some tab panels still contain placeholders; contact/salesman recipient data is incomplete; document paths, full Access field/tab parity and operational report outputs need confirmation. Assignment/employee writes (add/end/transfer/delete and inline hours/rates edits) intentionally remain read-only for now and are future work. |
| Employee Search 3 | `/employees` | Partial | Search sidebar inputs are read-only; row selection and bulk email/text/letter/postcard actions; screen-size save; saved-view save/delete; go-to; sort/update-column; new/new-SUB/cancel/delete; utility-rail actions; full Access column filtering and pagination are not wired. |
| Employee record/profile | `/employees/[employeeId]` | Partial | Page is read-only; edit/save/cancel/delete, record navigation, Access employee tabs/subforms (including notes, work history and specialized sections), and associated create/update actions remain incomplete or absent. |
| Customer Search | `/customers` | Partial | Replace hard-coded sample customer rows with database results; populate salesman/type/status/city/state options; wire disabled quick-search and bulk contact actions, deselect/transfer, saved views, sort/update-column, delete, and save screen sizes; confirm full filter and pagination behavior. |
| Customer profile | `/customers/[customerId]` | Partial | Save/edit/delete and record navigation; contact/action history links and detail; several Access tabs/subforms and edit actions; complete customer-related collection/WCC/permit/rate actions; live data coverage and field parity remain incomplete. |
| Customer Menu | `/customer-menu` | Partial | Placeholder selector/action is static; Refresh from Tracking and Reset Customer Colors are disabled; implement/verify week navigation, tile actions/colors and parity of entity counts and all Access menu controls. |
| Job Search | `/jobs` | Partial | Search sidebar fields are read-only and quick search disabled; New/New Sub Job/Cancel, bulk contact actions, saved views, Go To, Sort, Delete Job, screen-size saves and selection/update-column controls are disabled or unwired; complete row navigation and Access columns/filter parity. |
| Job/project detail | `/jobs/[jobId]` | Partial | Verify/implement editable fields, save/cancel/delete, full Access tabs/subforms, project/customer related actions, record navigation and any missing job-specific controls; confirm all displayed values are live SQL-backed. |
| Reports menu | `/reports` | Partial | Most launcher buttons display “not connected” messages; only a small link map navigates. Wire every intended report/document launcher, document edit/open selection, filters/date controls and Access grouping/order; confirm unimplemented report names. |
| Office Staff | `/admin/office-staff` | Partial | New/Save/Modify Permissions/Cancel/Delete/Clear Sort/Modify Permissions by Feature/Close are disabled; permission detail and email flags absent/read-only; form field edit and record navigation are missing. |
| SQL connection / access admin | `/admin/connection`, `/setup` | Partial | Compare staff permission detail per feature and all Access admin pages/actions; current permission data is summarized by grant count only. SQL connection UI is web-specific. |
| Login / first setup | `/login`, `/welcome` | Web-only | Product setup screens; no Access UI counterpart established. |

## Web pages with a visible route (review each against Access)

Most specialized pages below render the shared `OperationalReportScreen`. Presence means a route/screen exists, not that the original Access controls or report layout are complete.

| Web route | Current screen shape | UI parity status |
|---|---|---|
| `/401k-report` | Shared operational report | Partial — compare selectors, totals, print/export and report layout. |
| `/accident-report-search` | Dedicated search screen | Partial — compare search criteria, result columns and row actions. |
| `/accounts-receivable` | Shared operational report | Partial — confirm exact Access report/page identity and layout. |
| `/active-customers` | Shared operational report | Partial — compare filters and displayed customer summary. |
| `/all-contacts-search` | Dedicated search screen | Partial — compare contact scope, search controls, columns and actions. |
| `/attendance` | Shared operational report | Partial — compare date/week controls, groupings and totals. |
| `/check-weekly-rates` | Shared operational report | Partial — compare rate selectors, warnings, actions and columns. |
| `/contract-report` | Dedicated report screen | Partial — compare form parameters and printed report. |
| `/current-jobs` | Dedicated report screen | Partial — compare criteria, row actions and print output. |
| `/customer-permits` | Dedicated report screen | Partial — compare customer fields and expiration/status indicators. |
| `/deleted-employees` | Dedicated screen | Partial — compare filters, restore/delete actions and table fields. |
| `/directions` | Shared operational report | Partial — compare selected week and route/directions layout. |
| `/email-addresses` | Dedicated report screen | Partial — compare filters, recipients and action controls. |
| `/employee-advance-report` | Dedicated report screen | Partial — compare employee/date parameters, totals and print view. |
| `/employee-application` | Employee application screen | Partial — compare full application sections, navigation and save/submit actions. |
| `/employee-bonus-expense-report` | Shared operational report | Partial — compare period selection, amounts and totals. |
| `/employee-health-insurance-by-month` | Shared monthly report | Partial — compare month/year controls and insurance columns. |
| `/employee-hours-by-month` | Shared hours report | Partial — source shows placeholder grid/options; compare inputs and calculations. |
| `/employee-hours-by-week` | Shared hours report | Partial — source shows placeholder grid/options; compare week controls and totals. |
| `/employee-licenses` | Employee-license screen | Partial — compare license tabs, expiry alerts and editing/detail actions. |
| `/employee-quick-search` | Quick-search screen | Partial — compare Access quick-search criteria and open-record behavior. |
| `/employee-research` | Research screen | Partial — compare research fields, notes and supporting subforms. |
| `/employee-review-search` | Shared report/search screen | Partial — compare criteria, records and actions. |
| `/employees-in-tracking` | Employee menu/grid | Partial — includes static/hard-coded behavior and placeholder controls; compare assignments, views and navigation. |
| `/face-meeting` | Route exists; screen identity needs review | Confirm — inspect page and compare to its Access object. |
| `/full-time-employees-by-month` | Monthly report screen | Partial — source shows placeholder grid/options; compare year/payroll filters and totals. |
| `/health-ins` | Health insurance screen | Partial — compare editable details, month tabs, calculations and alerts. |
| `/insurance-certificate-request-search` | Dedicated search/report | Partial — compare filters, status, document details and actions. |
| `/interview-questions` | Route exists; screen identity needs review | Confirm — inspect page and compare to its Access object. |
| `/invoice-search` | Dedicated search screen | Partial — compare invoice filters, columns, detail actions and print/export. |
| `/invoices-by-week-report` | Shared report | Partial — compare weekly controls, totals, detail rows and print view. |
| `/invoices-contact-report` | Shared report | Partial — compare contact flags, parameters and results. |
| `/job-address-wcc-changes` | Shared report | Partial — compare change fields, filters and row presentation. |
| `/job-app-problems` | Dedicated report screen | Partial — compare problem categories, filters and remediation actions. |
| `/job-orders-report` | Shared report | Partial — compare customer/job/week criteria and print output. |
| `/lien-summary` | Shared report | Partial — compare balance/aging columns, grouping and print layout. |
| `/manpower-report` | Shared report | Partial — compare weekly staffing fields, sorting, totals and print layout. |
| `/margin-by-week-report` | Shared report | Partial — compare week controls, margin math, totals and print layout. |
| `/multiple-jobs-per-employee` | Shared report/search | Partial — compare duplicate/grouping criteria and drill-down behavior. |
| `/newsletter-search` | Dedicated search screen | Partial — compare subscription criteria, result fields and actions. |
| `/notice-of-contract-search` | Shared report/search | Partial — compare contract date/status filters and document actions. |
| `/notice-of-identification-search` | Shared report/search | Partial — compare criteria, document details and actions. |
| `/office-staff-notes` | Dedicated notes screen | Partial — compare note history, add/edit behavior and filtering. |
| `/open-invoices` | Shared report | Partial — compare aging/balance summaries, sorting and drill-downs. |
| `/osha` | Route exists; compare with OSHA link report | Confirm — distinguish `/osha` from `/osha-link-sent-report` and verify whether this is duplicate, separate or unfinished. |
| `/osha-link-sent-report` | Shared report | Partial — compare fields, date range, filters and export. |
| `/payroll-exclusions` | Dedicated screen | Partial — compare exclusion categories, reasons and actions. |
| `/phone-number-search` | Dedicated search screen | Partial — compare matching rules, result fields and row navigation. |
| `/resume-work-history` | Shared report/search | Partial — compare history sections and employee drill-down. |
| `/schooling-report` | Shared report | Partial — compare eligibility/calculation details, period inputs and totals. |
| `/sick-hours-report` | Shared report | Partial — compare employee/period criteria, calculations and totals. |
| `/smart-phone` | Route exists; screen identity needs review | Confirm — inspect page and compare to its Access object. |
| `/tools-report` | Shared report | Partial — compare balances, usage calculations, criteria and totals. |
| `/tracking-search` | Dedicated search screen | Partial — compare date/customer/employee criteria, columns and open-record actions. |
| `/ui-report` | Dedicated report screen | Partial — compare exact Access object and report parameters. |
| `/vacation-hours-report` | Shared report | Partial — compare earned/used balances, period filters and totals. |
| `/verify-hours-contact-report` | Shared report | Partial — compare contact status, week parameters and action flow. |
| `/wcc-on-site` | Shared report | Partial — compare on-site WCC fields, grouping and report actions. |
| `/wcc-payroll` | Dedicated payroll screen | Partial — compare controls, rows, payroll totals and outputs. |
| `/website-application` | Application screen | Partial — compare Access entry/review workflow and validation. |
| `/weekly-customer-margin-report` | Shared report | Partial — compare customer/week selector, calculations and grouped layout. |
| `/yearly-revenue` | Dedicated chart/report screen | Partial — compare range selectors, labels, totals and export. |

## Export-backed Access employee-search screens and dialogs

These are concrete Access objects referenced by the exported VBA. Match them to web pages/components and track each dialog separately; some may be retired or out of scope, so confirm before marking missing.

| Access object evidenced in export | Web candidate | Status |
|---|---|---|
| `frmEmployeeSearch3` | `/employees` + `EmployeeSearchScreen` | Partial; compare main layout, filters, saved views, multi-filter and action toolbars. |
| `frmEmployeeSearch3Holding` | `/employees` + `/employees/[employeeId]` | Partial; compare row fields and all employee tabs/subforms. |
| `frmEmployeeSearch3QuickView` | Employee detail/quick view | Confirm; no clearly identified matching web quick-view dialog. |
| `frmEmployeeSearchCriteria` | Employee search panel/dialog | Confirm; compare criteria editor and saved criteria flow. |
| `frmMultiFilter_EditSelections_Main` | Employee search filters | Confirm; no explicit multi-filter editor identified. |
| `frmLastContactSearch` | Contact/search pages | Confirm; no clearly identified equivalent. |
| `frmSalesmanRecordsEmployeesSearch` | Employee search | Confirm; no clearly identified salesman-specific employee view. |
| `frmContactHistoryAction` | Contact report/actions | Confirm; no equivalent action dialog established. |
| `frmOutsideSystemContactHistoryAction` | Contact history | Confirm; no equivalent action dialog established. |
| `frmEmployeeContactHistory` | Employee detail / office notes | Confirm; employee contact history UI is not clearly identified. |
| `frmEmployeeCallNumberNotesEdit` | `/office-staff-notes` or employee detail | Confirm; needs record-specific note editor parity check. |
| `frmEmployeeCovid19VaccinationStatusNotesEdit` | Employee detail | Confirm; no equivalent editor identified. |
| `frmEmployeeS1NotesEdit`, `frmEmployeeS2NotesEdit` | Employee detail | Confirm; section-specific notes UI not established. |
| `frmEmployeeOnUnemploymentNotesEdit` | Employee detail | Confirm; no equivalent editor identified. |
| `frmEmployeeResearchNotesEdit` | `/employee-research` | Partial/confirm; compare note history and editing. |
| `frmEmployeeTimesheetRequestsEdit` | Employee detail / hours pages | Confirm; request-specific page/dialog not identified. |
| `frmEmployeePostEmployeeAsAvailableNotesEdit` | Employee detail | Confirm; no equivalent editor identified. |
| `frmEmployeeWorkHistorySnapshotView` | `/resume-work-history` | Partial; compare snapshot layout and record context. |
| `frmEmployeeLicensesEdit` | `/employee-licenses` | Partial; route exists, editing behavior and form detail need comparison. |
| `frmTrackingEdit` | `/tracking` | Partial; compare edit window, tabs, controls and save/cancel behavior. |
| `rptEmployeeSearch3HoldingAddressLabels_Avery5260` | Print/export from employee search | Missing/confirm; no specific label-print page/action found. |
| `frmPullDownMaps` | Dashboard/map setup | Confirm; map configuration UI not identified. |
| `frmEmployeeSearch3Compare` | Employee search comparison | Confirm; no explicit comparison screen identified. |

## Suggested next tracking pass

- [ ] Get/export the Access Navigation Pane object list (all forms and reports) and replace the “confirm” entries with the complete reference inventory.
- [ ] For each Access form, capture a screenshot and list visible tabs, controls, columns, dialogs and actions; compare against the matching web page.
- [ ] Mark each visible web page control as working, placeholder/disabled, or not wired; focus on the employee/customer/tracking pages first.
- [ ] Mark duplicate-looking web routes (for example `/osha` and `/osha-link-sent-report`) as intentional, merged, obsolete or unfinished.
- [ ] For every page marked partial, write the missing visible UI elements directly into this table or link a page-specific checklist.
