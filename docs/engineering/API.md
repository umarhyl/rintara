# Rintara Application API Contracts

> **Version:** 3.1
>
> **Date:** July 19, 2026
>
> **Status:** MVP server contract baseline  
> **Domain authority:** `docs/product/BUSINESS_RULES.md`  
> **Schema authority:** `docs/engineering/DATABASE.md`

## 1. API Style

Rintara is a Next.js modular monolith. “API” in this document means the typed server-side contract between presentation code and the application/domain layer.

Default choices:

- Server Components call authorized query functions directly.
- Interactive internal mutations use Server Actions.
- Route Handlers are used only when an actual HTTP boundary is required, such as a health endpoint, authentication callback, or a deliberately exposed endpoint.
- No public third-party API is part of the MVP.

Do not create generic CRUD endpoints that allow a caller to patch ownership, verification fields, credit amounts, or lifecycle statuses.

## 2. Contract Conventions

### 2.1 Authentication context

Every private query and command receives a server-derived context:

```ts
type RequestContext = {
  requestId: string;
  userId: string;
  role: "worker" | "employer" | "admin";
  accountStatus: "active" | "suspended" | "deleted";
};
```

The browser never supplies this object. Server code constructs it after validating the session and loading current authorization data.

### 2.2 Result shape

Domain commands return a typed success or throw/map a typed application error. If represented over HTTP, use:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_..."
  }
}
```

Error representation:

```json
{
  "error": {
    "code": "JOB_NOT_AVAILABLE",
    "message": "This job is no longer accepting applications.",
    "fieldErrors": {}
  },
  "meta": {
    "requestId": "req_..."
  }
}
```

Never return raw SQL, stack traces, provider messages, tokens, hashes, or internal authorization details.

### 2.3 Validation

- Parse all unknown input at the server boundary.
- Trim and normalize text before domain validation.
- Reject unknown object fields for sensitive commands where practical.
- Use server time for lifecycle decisions.
- IDs are opaque UUID strings; an existing ID never implies access.

### 2.4 Pagination

Growing lists use bounded pagination. Default limit is 20 and maximum limit is 50.

```ts
type PageInput = {
  cursor?: string;
  limit?: number;
};

type Page<T> = {
  items: T[];
  nextCursor: string | null;
};
```

Cursors are opaque and encode deterministic sort keys. Clients must not depend on their internal format.

### 2.5 Authentication and onboarding

`signUp(input)`, `signIn(input)`, and `signOut()` are Server Action adapters over
Supabase Auth. Credential input is validated and provider errors are mapped to
the application error catalog; provider messages, tokens, and user objects are
never returned.

`GET /auth/callback` exchanges the one-time PKCE code for a cookie-backed
session. Its optional `next` value accepts only an application-relative path to
prevent open redirects. Failure returns to sign-in with a generic error.

`completeOnboarding(input)` derives `auth_subject` exclusively from verified
Supabase claims. Accepted input is one of:

- worker: `role`, `displayName`, `areaId`, optional `bio`, and optional
  `availabilityNote`, plus up to eight unique optional `categoryInterestIds`; or
- employer: `role`, `displayName`, `areaId`, `employerType`, and optional
  `description`.

Self-service `admin` is invalid. Caller-supplied user ID, account status, or
trusted-role fields are discarded. The command serializes attempts for one
external subject and creates `users` plus exactly one matching role profile in
one transaction. A retry for the existing role returns the existing profile; a
retry for another role returns `FORBIDDEN`. Suspended or deleted records return
`ACCOUNT_INACTIVE`. Worker category interests are self-declared profile data,
not Work Proof. On first worker profile creation, every supplied category must
still be active and the matching `worker_interests` rows are inserted in the
same transaction. An unavailable category fails the entire operation.

`getCurrentUserDashboardContext()` returns only the internal user ID, trusted
role, and role-profile display name. A valid provider session without a complete
Rintara account and matching profile returns `ONBOARDING_REQUIRED`.

## 3. Public Queries

### `getOnboardingReferenceData()`

Access: public.

Returns deterministic, allowlisted reference options for account setup:

- active `city_regency` areas as `id` and `name`; and
- active categories as `id` and `name`.

Inactive records, area codes and hierarchy, category risk fields, and internal
administration data are excluded. The onboarding command still revalidates the
selected IDs transactionally because an option can become inactive after this
query.

### `listPublishedJobs(input)`

Access: public.

Input:

- `categoryId?`
- `areaId?`
- `minimumWage?`
- `maximumWage?`
- `firstOpportunityOnly?`
- `cursor?`
- `limit?`

Output fields:

- job ID, title, category, general area;
- wage amount and unit;
- start time, deadline, First Opportunity flag;
- active-boost flag and safe employer display summary.

Sort: active boost first, then `published_at desc`, then ID as a stable tie-breaker.

The query includes only `published`, visible jobs whose application deadline is still in the future. It must exclude full address, private contact data, applicant count if not approved, and moderation metadata.

### `getPublishedJob(jobId)`

Access: public for a currently published, visible job.

Returns public terms, Wage Guideline status, general area, tools, schedule, application deadline, and safe employer summary. Private address is excluded.

Errors: `JOB_NOT_FOUND` rather than revealing hidden/draft ownership state to anonymous callers.

### `getPublicReferenceData()`

Access: public.

Returns active pilot areas, categories, and safe Wage Guideline display data. Internal admin notes and inactive records are excluded.

## 4. Profile Queries and Commands

### `getMyProfile()`

Access: active worker or employer.

Returns the role-specific private profile DTO for the current user. The Worker
DTO includes category interests and category IDs backed by a currently verified
Work Proof; these derived values are read-only.

### `updateWorkerProfile(input)`

Access: active worker.

Input: display name, area ID, bounded bio, bounded availability note, and active category interest IDs.

Server behavior: validates area/categories and replaces interests transactionally if needed.

### `updateEmployerProfile(input)`

Access: active employer.

Input: display name, employer type, area ID, and bounded description.

Derived fields such as badge, completed-job count, and credit count are not accepted.

## 5. Job Queries and Commands

### `createJobDraft(input)`

Access: active employer.

Input includes every job field defined by FR-020 except server-owned status, wage status, and timestamps. `employerId` is derived from context.

Returns: `{ jobId, status: "draft" }`.

### `updateJobDraft(jobId, input)`

Access: active owning employer.

Allowed only while the job is `draft`. Uses the same validated fields as creation.

### `publishJob(jobId)`

Access: active owning employer.

Behavior:

1. load draft and current reference data;
2. validate required terms, future dates, category/risk rules, and full address;
3. calculate Wage Guideline status;
4. reject a non-compliant First Opportunity job;
5. transition to `published`, set publication time, notify/audit as required.

Errors include `JOB_NOT_DRAFT`, `WAGE_GUIDELINE_UNAVAILABLE`, `WAGE_BELOW_GUIDELINE`, and `CATEGORY_NOT_ALLOWED`.

### `cancelJob(jobId, input)`

Access: active owning employer for draft or unfilled published jobs; admin for exceptional later states.

Input: bounded cancellation reason. The command follows the state machine and does not delete the row. Cancelling an unfilled published job rejects remaining submitted applications, notifies affected workers, and audits the change atomically.

### `getEmployerJob(jobId)`

Access: owning employer or authorized admin.

Returns owner view, safe status actions, and private details appropriate to the owner.

### `listMyEmployerJobs(page)`

Access: active employer. Returns only owned jobs.

## 6. Application Queries and Commands

### `submitApplication(jobId, input)`

Access: active worker.

Input: `jobId` path/action argument plus bounded note.

Behavior validates current job state, visibility, deadline, uniqueness, and category eligibility. It derives `workerId` and stores the eligibility snapshot.

Errors include `JOB_NOT_AVAILABLE`, `APPLICATION_ALREADY_EXISTS`, and `FIRST_OPPORTUNITY_INELIGIBLE`.

### `withdrawApplication(applicationId)`

Access: owning worker.

Allowed only from `submitted`.

Errors include `APPLICATION_NOT_FOUND` and `APPLICATION_NOT_WITHDRAWABLE`.

### `listMyApplications(page)`

Access: active worker. Returns only the current worker's applications with safe job summaries.

### `listJobApplicants(jobId, page)`

Access: active owning employer or authorized admin.

Returns applicant summary, note, server-computed category eligibility, and a link/identifier for the authorized Passport view.

### `getApplicantPassport(jobId, applicationId)`

Access: active owner of the job receiving that application, the worker owner, or authorized admin.

Returns non-revoked Work Proof entries and category eligibility. It does not return unrelated private profile fields.

### `acceptApplication(applicationId)`

Access: active employer who owns the associated job.

Transactional behavior is normative in `docs/product/BUSINESS_RULES.md`. Returns:

```ts
type AcceptApplicationResult = {
  jobId: string;
  applicationId: string;
  agreementId: string;
  jobStatus: "filled";
  agreementStatus: "pending_confirmation";
};
```

Errors include `APPLICATION_NOT_SUBMITTED`, `JOB_NOT_AVAILABLE`, `FIRST_OPPORTUNITY_INELIGIBLE`, and `CONCURRENT_ACCEPTANCE_CONFLICT`.

## 7. Agreement and Attendance Contracts

### `getAgreement(agreementId)`

Access: worker party, employer party, or authorized admin.

Returns the complete immutable terms snapshot, party confirmation states, lifecycle state, and allowed next actions. Full address appears only here and in other explicitly authorized agreement views.

### `confirmAgreement(agreementId)`

Access: either active party.

Behavior sets only the caller's confirmation timestamp. It is idempotent for the same caller. When both timestamps exist, it transitions the agreement to `active` and ensures one scheduled work session exists.

### `generateCheckInCode(agreementId)`

Access: active employer party.

Returns the plaintext six-digit code exactly once to the caller. The database stores only a hash, 15-minute expiry, and attempt metadata. Generating a new code invalidates the previous unused code.

Rate-limit this command.

### `checkIn(input)`

Access: active worker party.

Input: agreement ID and six-digit code.

Behavior verifies the code and transitions the session and job atomically. Never log or return the code after processing.

Errors include `CODE_INVALID`, `CODE_EXPIRED`, `CODE_LOCKED`, and `AGREEMENT_NOT_ACTIVE`.

### `checkOut(input)`

Access: active worker party.

Input: agreement ID and optional bounded completion note. Allowed once from `checked_in`.

### `verifyCompletion(agreementId)`

Access: active employer party.

This command is atomic and idempotent. It returns:

```ts
type VerifyCompletionResult = {
  jobId: string;
  agreementId: string;
  workProofId: string;
  credit: {
    issued: boolean;
    creditId?: string;
    skippedReason?: "NOT_FIRST_OPPORTUNITY" | "ACTIVE_CREDIT_CAP_REACHED";
  };
};
```

Repeated successful requests return the same proof and credit outcome. Errors include `WORK_NOT_CHECKED_OUT` and `ACTIVE_REPORT_BLOCKS_COMPLETION`.

## 8. Passport, Credit, and Boost Contracts

### `getMyPassport(page)`

Access: active worker. Returns the caller's Work Proof entries, including revoked entries only where the UI needs to explain their status.

### `getMyCreditSummary()`

Access: active employer.

Returns active credit count, lifetime non-revoked opportunity count, derived badge, and paginated credit history. No balance input is accepted.

### `redeemOpportunityCredit(input)`

Access: active employer.

Input:

- `creditId`
- `jobId`
- `idempotencyKey`

Behavior is the transaction defined in `docs/product/BUSINESS_RULES.md`. The target job must be visible as well as published. Returns credit ID, job ID, boost ID, start, and end timestamps.

Errors include `CREDIT_NOT_AVAILABLE`, `JOB_NOT_PUBLISHED`, `JOB_NOT_OWNED`, `BOOST_ALREADY_ACTIVE`, and `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_INPUT`.

## 9. Notification Contracts

### `listMyNotifications(page)`

Access: authenticated active user. Returns only the caller's notifications, newest first.

### `markNotificationRead(notificationId)`

Access: owning recipient. Idempotently sets `read_at`.

### `markAllNotificationsRead()`

Access: authenticated active user. Updates only the caller's unread notifications.

Notifications are read through revalidation or bounded polling. No realtime subscription API is required.

## 10. Report and Admin Contracts

### `createReport(input)`

Access: authenticated active user with a legitimate target relationship.

Input: reason, bounded description, and one or more target identifiers permitted by the schema. The server validates visibility and relationship.

### `listMyReports(page)`

Access: reporter. Excludes private moderator notes.

### `adminListReports(filters, page)`

Access: active admin. Filters by status, reason, and age.

### `adminStartReportReview(reportId)`

Access: active admin. Transitions `open -> reviewing`.

### `adminResolveReport(input)`

Access: active admin.

Input includes report ID, outcome `resolved` or `rejected`, factual moderator note, and explicit actions. Supported actions include hide/cancel job, suspend user, revoke Work Proof, revoke credit, and deactivate active boost.

The report must currently be `reviewing`. All selected actions and the report transition occur consistently and are audited. Cancelling an unfinished workflow uses the authorized Job and Mini Agreement transitions without inventing a cancelled Work Session state. A complex action may use a dedicated domain command instead of one generic mutation, but callers may never patch raw state.

Revoking a redeemed credit preserves its redemption metadata and deactivates any related active boost in the same moderated workflow.

### `adminUpsertWageGuideline(input)`

Access: active admin. Validates values, effective range, source, simulation flag, and active-period overlap.

## 11. Operational Route Handlers

### `GET /api/health`

Purpose: shallow deployment health. It must not expose secrets, provider details, database URLs, table names, or user counts.

Recommended response:

```json
{
  "status": "ok",
  "version": "deployment-identifier"
}
```

If a deep database readiness check is required, protect it appropriately and keep its output minimal.

Authentication provider callback routes follow provider documentation and are not reimplemented as Rintara domain endpoints.

## 12. Error Catalog

| Code | Meaning | Typical HTTP mapping if applicable |
| --- | --- | ---: |
| `UNAUTHENTICATED` | No valid session | 401 |
| `ONBOARDING_REQUIRED` | Valid Supabase session exists but no Rintara account/profile has been completed | 409 |
| `ACCOUNT_INACTIVE` | Suspended or deleted account | 403 |
| `FORBIDDEN` | Role/ownership/relationship denied | 403 |
| `NOT_FOUND` | Resource absent or intentionally hidden | 404 |
| `VALIDATION_FAILED` | Invalid fields | 400 |
| `INVALID_STATE_TRANSITION` | Command is not valid from current state | 409 |
| `JOB_NOT_AVAILABLE` | Job is closed, expired, filled, or otherwise unavailable | 409 |
| `FIRST_OPPORTUNITY_INELIGIBLE` | Worker now has category proof | 409 |
| `CONCURRENT_ACCEPTANCE_CONFLICT` | Another applicant won the race | 409 |
| `ACTIVE_REPORT_BLOCKS_COMPLETION` | Moderation must finish first | 409 |
| `CREDIT_NOT_AVAILABLE` | Credit is redeemed, expired, revoked, or absent | 409 |
| `RATE_LIMITED` | Too many attempts | 429 |
| `INTERNAL_ERROR` | Unexpected failure with request ID | 500 |

Use specific field errors for form correction, but do not disclose whether an inaccessible resource belongs to another user.

## 13. Idempotency and Retry Rules

- `confirmAgreement`, `markNotificationRead`, and completed `verifyCompletion` are naturally idempotent.
- Credit redemption requires a caller-generated idempotency key.
- The same key and request hash return the stored result.
- The same key with different input is rejected.
- UI may retry network failures only when the operation contract is idempotent or the same idempotency key is reused.
- Database uniqueness remains the final duplicate-prevention boundary.

## 14. Cache Invalidation

Commands revalidate only affected views:

- publish/cancel/expire/complete job: public discovery, job detail, owner dashboard;
- application submit/withdraw/accept: worker applications, owner applicant list, relevant dashboards;
- agreement/attendance/completion: party dashboards and agreement/work views;
- proof issue/revoke: worker Passport and authorized applicant views;
- credit/boost changes: employer credit view and public discovery;
- reports/moderation: report queues and affected resource views.

Private responses must never enter shared public caches.

## 15. Contract Test Requirements

- Validate every input schema with valid, boundary, and invalid examples.
- Test every command for unauthenticated, wrong-role, wrong-owner, and inactive-account access as applicable.
- Test public DTOs for forbidden fields such as `fullAddress`.
- Test stable error codes, not provider or SQL message text.
- Test concurrent and repeated requests for acceptance, completion, and redemption.
- Keep API contracts synchronized with `docs/engineering/DATABASE.md`, `docs/product/BUSINESS_RULES.md`, and UI flows in the same change.
