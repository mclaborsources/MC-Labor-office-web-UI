# MC Labor Access / Web App Gap Tracker

This is a code-and-reference inventory to help track parity work. It records what is visible in this checkout; it does not prescribe a design or treat Access UI controls as approved web requirements.

## Evidence limits

- The project includes `reference/MC-Labor-Access-Reference.accdb`, but this review did not extract a complete Access catalog (tables, columns, keys, relationships, queries, forms, reports, macros, permissions). Thus database parity is **not fully assessed**.
- The text exports currently present are three employee-search form modules under `reference/access-export/`. They expose a lot of Access logic, but do not represent the whole Access application.
- `README.md` points to `reference/Back-up-SQL` and `docs/` status/decision documents. Neither directory exists in this checkout. `WRITES_ENABLED` comments also refer to a missing `docs/ARCHITECTURE_DECISION.md`.
- “Implemented” here means there is code in this repository, not that it has been validated against a live/restored database or tested for operational parity.

## Status key

- **Present** — visible implementation in source.
- **Partial** — some code/UI exists, but material behavior or coverage remains absent/placeholder.
- **Not present** — no implementation found in this checkout.
- **Unknown** — cannot establish without a full Access/SQL schema inventory or deployment check.

## Access architecture and workflow comparison

| Area | Status | What is present | What remains to track |
|---|---|---|---|
| Application host/runtime | Present | Next.js App Router, local Windows launcher, Node/mssql SQL Server connectivity. | Confirm target deployment/hosting and operational ownership outside the local launcher. |
| Main Access menu/navigation | Partial | Dashboard and Access-style navigation components; numerous route pages. | Inventory every Access menu item/form/report against a working web route; some pages are visual shells. |
| Employee search/profile | Partial | Employee list/detail and API/data modules; substantial employee-search Access column metadata. | Compare every Access tab, filter, action, related record, and edit workflow; identify placeholders and unsupported fields. |
| Customer search/profile/menu | Partial | Customer list/detail, menu, filters, APIs and data modules. | Full form/report/action mapping and workflow parity not documented. |
| Jobs/projects | Partial | Job search/detail, filters, APIs and SQL query modules. | Confirm all Access fields, related forms and update workflows. |
| Tracking / assignment | Partial | Tracking UI/data types and SQL-backed reports/helpers exist. Some screens use placeholder data. | Verify Access forms/actions, assignment editing, week behavior, validation and complete live-data coverage. |
| Reports | Partial | Many named report routes and several SQL report functions. | Route-by-route source/query parity, print/export, parameter behavior and result validation remain untracked. |
| Office staff screen | Partial | Read-only `tblOfficeStaff` list/detail fields. | Create/edit/deactivate/delete, password management and full related permission/email flags are disabled or absent. |
| Access feature permissions | Partial | Read-only staff/feature grant counts from `tblOfficeStaff`, `tblOfficeStaffPermission`, `tblFeature`. | Per-feature grant detail and enforcement are missing; mapping grants to web access is explicitly deferred in UI to Phase B6. |
| Access VBA/business logic | Unknown | Three employee-search form exports include extensive VBA and SQL action logic. | Extract/index remaining forms, queries, reports, macros and modules; map each consequential behavior to web implementation. |
| Workflow parity register | Not present | No docs directory or route-by-route parity matrix in this checkout. | Track owner, priority, acceptance/evidence, status and source Access object for each item. |

## Authentication and authorization comparison

| Capability | Status | Evidence / gap |
|---|---|---|
| Sign-in / sign-out | Partial | Login/logout routes and `iron-session` cookie exist. Normal mode has one configured `DEV_LOGIN_USERNAME`/bcrypt hash, rather than Access-backed individual staff authentication. |
| Local-office mode | Present | Launcher enables local mode, bypasses login, and synthesizes an active admin session; documentation says loopback-only bind. Verify deployment cannot expose this mode beyond the local computer. |
| Session protection | Partial | HTTP-only, SameSite=Lax, eight-hour cookie configuration. Middleware checks only for a cookie value on selected page prefixes; API routes bypass middleware. |
| Server-side API authentication | Partial | Admin connection POST calls `requireSession` and checks admin role. Employee/customer/job data routes shown do not call session authorization. Health endpoint is also public. Audit every API route and make intended exposure explicit. |
| Route coverage | Partial | Middleware protects tracking, employees, customers, jobs, dashboard, customer-menu, admin, reports, health-ins, deleted-employees. Many other app routes are not covered by these prefixes. |
| Roles | Partial | Type union includes `admin`, `user`, `read_only`; current configured login and local-mode user receive `admin`. No role/feature authorization middleware or route policy found. |
| Access staff identity link | Not present | `officeStaffId` is marked future in `src/types/auth.ts`; current login does not look up an Access `tblOfficeStaff` account. |
| Password lifecycle / multiple accounts | Not present | No Access-backed user lookup, individual credential lifecycle, password reset/change flow, lockout, or user administration found. Office staff password is intentionally never selected. |
| Permission enforcement | Not present | Existing Access feature grants are displayed as counts only; they do not gate pages, APIs, data, or actions. |
| CSRF/origin checks | Partial | Same-origin protection is used on admin connection POST and account setup is localhost/origin-limited. Review mutation routes as write functionality is introduced. |
| Audit trail | Not present | Write helper contains a no-op `recordAudit`; target audit/log table is unconfirmed. |

## Database architecture and implementation

| Capability | Status | Evidence / gap |
|---|---|---|
| SQL Server connection | Present | `mssql` pool with configurable server/database/user/password/port/instance and encrypted saved settings. |
| Connection health | Present | `/api/health/db`, SQL status query and admin connection page. Schema compatibility is not checked by connection test. |
| Read-only query gate | Partial | `queryReadOnly` accepts queries whose first token is `SELECT` or `WITH`, caches results for five minutes, and many queries use `WITH (NOLOCK)`. This is an application guard; verify the configured SQL login itself is read-only. |
| Parameterized query support | Present | Read query helper applies named parameters; many application queries use them. Audit dynamic SQL identifiers separately. |
| Data reads | Partial | Core employee/customer/job/tracking and many report reads exist in `src/lib`; only some workflows are backed by live queries. Numerous report/screens have empty grids, hard-coded options or placeholder values. |
| Schema catalog / migration baseline | Not present | No checked-in SQL schema dump, migration set, generated schema catalog, or full table/column/key/relationship inventory found. Reference SQL backup path in README is absent. |
| Schema validation | Not present | Startup/health checks test connectivity, not required table/column compatibility. Queries can return empty arrays after swallowed errors in some read modules. |
| Writes | Partial | Unemployment Request Contacts has authenticated insert, update, and delete API routes through the gated write helper. `WRITES_ENABLED` now defaults true and can be set false per installation. Actual writes still depend on SQL principal permissions; other write workflows remain unimplemented. |
| Write transaction support | Partial | Generic transaction wrapper exists, but no feature workflows are implemented and allowed statements/authorization are not validated by this layer. |
| Audit recording | Not present | `recordAudit` is explicitly a placeholder no-op pending confirmation of Access audit table/columns. |
| Database connection setup storage | Present | Admin connection setup tests candidate SQL details and saves them AES-GCM encrypted under `.local-config/database.enc`, keyed from `SESSION_SECRET`. |
| Schema/feature ownership | Unknown | No authoritative schema owner, backup/restore procedure, or upgrade/deployment compatibility note found in repo docs. |

## Working decision recorded 2026-09-30

- Tracking remains **read-only for now**. Assignment add/end/transfer/delete and inline hours/rates edits are future work, not canceled. Keep them gated until the user supplies the expected Access behavior and the write/audit mapping is confirmed.

## Work items to carry forward

Use `[ ]` / `[x]` while tracking. Suggested priority is only a sequencing aid, not a design decision.

### Baseline and inventory

- [ ] **P0** Restore/export a trustworthy SQL Server schema snapshot: tables, columns/types/nullability, PK/FK, indexes, views, stored procedures, triggers, constraints and relevant database roles.
- [ ] **P0** Export complete Access object inventory: forms, reports, queries, macros, modules, linked tables, relationships and feature permissions.
- [ ] **P0** Create an Access object → web route/API/data query parity matrix and classify each item as implemented, partial, missing, retired or undecided.
- [ ] **P1** Add schema compatibility checks for required tables/columns and report clear mismatch details to administrators.
- [ ] **P1** Identify all placeholder and hard-coded data in screens/reports and verify whether each has a live SQL source.

### Identity and access control

- [ ] **P0** Decide and document intended account source and how Access staff identities map to web users.
- [ ] **P0** Audit and classify every page and API endpoint as public, authenticated, role-gated or local-only; record current enforcement and gaps.
- [ ] **P0** Confirm effective authorization for every sensitive employee/customer/payroll/report endpoint, including requests made without a browser page session.
- [ ] **P1** Inventory `tblFeature` and `tblOfficeStaffPermission` grants in detail and map Access permissions to web routes/actions after policy decisions are made.
- [ ] **P1** Document account lifecycle needs: onboarding, deactivation, password handling/reset, session expiry/revocation and recovery.
- [ ] **P1** Verify local mode only binds to loopback in every launcher/start path and cannot be activated in a shared deployment unintentionally.

### Database and workflow completion

- [ ] **P0** Confirm database principal privileges independently of app query guards; capture environment-specific read/write grants.
- [ ] **P1** Compare SQL reads and report outputs against Access for representative records and parameter combinations.
- [ ] **P1** Inventory Access updates/actions and mark which must remain unavailable until write policy is approved.
- [ ] **P1** Confirm the intended audit/log table and required identity/timestamp fields before implementing audit writes.
- [ ] **P2** Record backup/restore ownership, saved-connection recovery, schema upgrade process and operational support procedure.

## Source index

- Project and setup claims: `README.md`, `.env.example`, `Start-MC-Labor.cmd`
- Auth/session: `src/middleware.ts`, `src/lib/auth/`, `src/types/auth.ts`, `src/app/api/auth/`
- Connection/data access: `src/lib/config/database.ts`, `src/lib/db/sql.ts`, `src/lib/db/write.ts`
- Access permission surface: `src/lib/admin.ts`, `src/app/admin/office-staff/page.tsx`, `src/app/admin/connection/page.tsx`
- API surface: `src/app/api/`
- Access references: `reference/MC-Labor-Access-Reference.accdb`, `reference/access-export/`
