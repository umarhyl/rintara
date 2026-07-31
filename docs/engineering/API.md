# Rintara Application API Contracts

> **Version:** 3.2
>
> **Date:** July 24, 2026
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

Cursors are opaque and encode deterministic sort keys. Clients must not depend
on their internal format. Malformed or incompatible cursors return
`VALIDATION_FAILED`.

### 2.5 Authentication and onboarding

`signUp(input)`, `resendSignUpVerification(input)`, `signIn(input)`, `signOut()`,
`requestPasswordRecovery(input)`, and `updatePassword(input)` are Server Action
adapters over Supabase Auth. Credential input is validated and provider errors
are mapped to the application error catalog; provider messages, tokens, and
user objects are never returned. Password recovery requests use one generic
success response to avoid disclosing whether an email is registered.
An existing-account signup error and a new signup awaiting email confirmation
both map to the handled `confirm-or-sign-in` continuation outcome. The client
must not infer or state which case occurred; it offers sign-in and password
recovery while retaining the validated internal destination.

New self-service registrations use Supabase's email-confirmation mode. Both
initial signup and `resendSignUpVerification` set an allowlisted callback that
retains the selected `worker` or `employer` onboarding route and validated
internal destination. Resend validates and normalizes the email, returns the
same handled result for unknown, confirmed, and pending accounts, maps provider
rate limiting to `RATE_LIMITED`, and never returns provider user data.

`GET /auth/callback` exchanges the one-time PKCE code for a cookie-backed
session. Its optional `next` value accepts only an application-relative path to
prevent open redirects. A password recovery request uses the same allowlisted
callback with `next=/reset-password`; the reset screen requires the resulting
provider session. General callback failure returns to sign-in, recovery failure
returns to `/forgot-password`, and signup-verification failure returns to
`/verify-email`. Each case uses a generic error; the verification screen can
request another one-time signup link without disclosing account state.

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

- `search?`
- `categoryId?`
- `areaId?`
- `minimumWage?`
- `maximumWage?`
- `opportunity?: "all" | "first" | "general"`
- `cursor?`
- `limit?`

Returns `Page<PublicJobCard>`.

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

### `getPublicJobReferenceData()`

Access: public.

Returns up to 50 active pilot areas and 50 active categories for discovery
filters in stable name/ID order. Internal area codes, category risk fields,
Wage Guideline records, and inactive records are excluded.

## 4. Profile Queries and Commands

### `getMyProfile()`

Access: active worker.

Returns the current worker's private profile, category interests, and category
IDs backed by a currently verified Work Proof; derived values are read-only.

### `getEmployerProfile()`

Access: active employer.

Returns the current employer's private profile and system-derived completed-job,
active-credit, and Opportunity Giver values.

### `updateWorkerProfile(input)`

Access: active worker.

Input: display name, area ID, bounded bio, bounded availability note, and active category interest IDs.

Server behavior: validates area/categories and replaces interests transactionally if needed.

### `updateEmployerProfile(input)`

Access: active employer.

Input: display name, employer type, area ID, and bounded description.

Server behavior derives the employer identity from the active session, requires
an active city/regency, and updates only that employer's profile. Derived fields
such as badge, completed-job count, and credit count are not accepted.

## 4.5 Admin Marketplace Configuration

### `getAdminMarketplaceConfig(input?)`

Access: active admin.

Returns bounded, independently cursor-paginated category, pilot-area, and Wage
Guideline pages plus bounded active area/category options for the creation form.
The input accepts `areaCursor`, `categoryCursor`, `wageGuidelineCursor`, and
`limit`.

### `createCategory(input)`

Access: active admin.

Input: category name, slug, risk level, First Opportunity availability, and
active flag. A category with `restricted` risk cannot allow First Opportunity.

### `setCategoryActive(input)`

Access: active admin.

Input: category ID and target active flag. The command records an audit entry
and refreshes marketplace configuration, employer job creation, and discovery
views.

### `createPilotArea(input)`

Access: active admin.

Input: area name, unique code, and active flag. MVP pilot areas are stored as
`city_regency` records so onboarding, job publishing, and discovery use one
consistent area source.

### `setPilotAreaActive(input)`

Access: active admin.

Input: pilot area ID and target active flag. Only MVP `city_regency` pilot areas
can be changed through this command.

### `createWageGuideline(input)`

Access: active admin.

Input: active pilot area, active category, wage unit, minimum reference amount,
recommended reference amount, source label, optional source URL, effective date
range, simulation flag, and active flag.

Server behavior records an audit entry and revalidates admin configuration,
employer job creation, and public discovery views. Creating an active guideline
acquires the scope advisory lock and rejects any half-open effective-period
overlap with `VALIDATION_FAILED` on `effectiveFrom`.

### `setWageGuidelineActive(input)`

Access: active admin.

Input: Wage Guideline ID and target active flag. This is the supported MVP edit
path for existing guidelines; changing wage amounts requires creating a new
guideline version with its own effective dates instead of mutating the old
record. Reactivation uses the same scope lock and refuses an overlap without
changing either guideline.

## 5. Job Queries and Commands

### `getJobReferenceData()`

Access: active employer through the protected job create/edit flow.

Returns active city/regency and category options plus active Wage Guidelines.
Guidelines include their source label and simulation flag so the form can
present the reference without implying a legal minimum. Active guidelines are
ordered by `effective_from DESC, created_at DESC, id ASC`, matching the
authoritative publish lookup even while legacy overlapping data is being
repaired.

### `createJobDraft(input)`

Access: active employer.

Input includes every job field defined by FR-020 except server-owned status, wage status, and timestamps. `employerId` is derived from context.
`selectionCutoff` is not accepted or stored; the server derives it as
`startsAt - 24 hours`.

Returns: `{ jobId, status: "draft" }`.

The job-form Server Action adapter converts expected `ApplicationError`
failures into a serializable `{ ok: false, code, message, fieldErrors? }`
result. Only allowlisted job fields and safe user-facing validation messages
cross the React Server Action boundary; domain commands continue to throw
typed errors for server-side callers and transaction rollback.

### `updateJobDraft(jobId, input)`

Access: active owning employer.

Allowed only while the job is `draft`. Uses the same validated fields as creation.

### `publishJob(jobId)`

Access: active owning employer.

Behavior:

1. lock the owned draft and load locked current reference data;
2. validate required terms, future dates, `applicationDeadline <
   startsAt - 24 hours`, category/risk rules, and full address;
3. calculate Wage Guideline status;
4. reject a non-compliant First Opportunity job;
5. transition to `published`, set publication time, notify/audit as required.

An invalid application-deadline/selection-cutoff relationship returns
`VALIDATION_FAILED` for `applicationDeadline`. Other errors include
`JOB_NOT_DRAFT`, `WAGE_GUIDELINE_UNAVAILABLE`, `WAGE_BELOW_GUIDELINE`, and
`CATEGORY_NOT_ALLOWED`.

### `cancelJob(jobId, input)`

Access: active owning employer for draft or unfilled published jobs; admin for exceptional later states.

Input: bounded cancellation reason. The command follows the state machine and does not delete the row. Cancelling an unfilled published job rejects remaining submitted applications, notifies affected workers, and audits the change atomically.

### `expireUnfilledJobs(input)`

Access: protected maintenance runner only.

Processes a bounded locked batch of published jobs whose server-derived
selection cutoff has passed. Each job transition, remaining application
rejection, notification, and system audit entry is committed atomically.
Concurrent runners skip locked rows and retries are idempotent.

### `getEmployerJob(jobId)`

Access: owning employer or authorized admin.

Derives identity, active status, and role from the server session. Returns the
owner/admin view, safe status actions, and private details appropriate to the
authorized reader. Owner job and applicant views include the server-derived
selection cutoff.

### `listMyEmployerJobs(input?: PageInput)`

Access: active employer. Returns `Page<EmployerJobListItem>` containing only
owned jobs.

## 6. Application Queries and Commands

### `submitApplication(jobId, input)`

Access: active worker.

Input: UUID `jobId` path/action argument plus bounded note.

Behavior validates current job state, visibility, deadline, uniqueness, and
category eligibility. It derives `workerId`, stores the eligibility snapshot,
and creates one employer notification plus a safe application audit entry in
the same transaction. When the unique existing application is `withdrawn`, the
command reactivates that row, replaces the note, refreshes `submittedAt` and
the eligibility snapshot, and clears `withdrawnAt`. Accepted, rejected, and
already-submitted records return `APPLICATION_ALREADY_EXISTS`. Notifications
and audit records never copy the application note or private job details.

Errors include `JOB_NOT_AVAILABLE`, `APPLICATION_ALREADY_EXISTS`, and `FIRST_OPPORTUNITY_INELIGIBLE`.

### `withdrawApplication(applicationId)`

Access: owning worker.

The application identifier must be a UUID. Withdrawal is allowed only from
`submitted` and creates one employer notification plus a safe audit entry in
the same transaction. Retrying after a successful withdrawal returns
`APPLICATION_NOT_WITHDRAWABLE` and does not create another notification.

Errors include `APPLICATION_NOT_FOUND` and `APPLICATION_NOT_WITHDRAWABLE`.

### `getWorkerJobApplicationState(jobId)`

Access: active worker.

Returns one safe presentation state:

```ts
type WorkerJobApplicationState =
  | { state: "eligible" }
  | {
      state: "existing";
      applicationStatus: "submitted" | "accepted" | "rejected" | "withdrawn";
      agreementId?: string;
    }
  | { state: "ineligible" }
  | { state: "unavailable" };
```

The read validates the UUID, checks current public availability, and calculates
First Opportunity eligibility from non-revoked verified Work Proof in the
job's category. An existing application takes precedence over current public
availability so the Worker receives the recorded state instead of a second
application form. The DTO excludes the application note, private address,
proof rows, and Employer-private fields. The application command remains the
final authority after this read.

`GET /jobs/:jobId/application-status` is the private, no-store presentation
adapter for this query. It returns no raw provider or database error detail.

### `listMyApplications(input?: PageInput & { view?: "active" | "history" })`

Access: active worker. Returns a bounded cursor page containing only the current
worker's applications with safe job summaries. `active` filters `submitted`
and `accepted`; `history` filters `rejected` and `withdrawn`. Filtering happens
before cursor pagination. Omitting `view` retains all statuses for compact
dashboard queries. Each item includes a derived `publicDetailAvailable`
boolean so closed, hidden, or deadline-passed jobs are not linked back to an
unavailable public detail route.

### `listJobApplicants(jobId, input?: PageInput)`

Access: active owning employer or authorized admin.

Returns `{ job, applicants, nextCursor }`. `applicants` contains bounded
summaries, notes, server-computed category eligibility, aggregate proof counts,
and a link/identifier for the authorized Passport view; full proof history is
not embedded in the list. `job` includes the lifecycle status, application
deadline, server-derived selection cutoff, and total submitted-applicant count
so page-local pagination never produces an incorrect active count.

### `getApplicantPassport(jobId, applicationId, input?: PageInput)`

Access: active owner while the application is still `submitted`, the worker
owner, or authorized admin.

Returns applicant/category eligibility plus a bounded `proofEntries` cursor
page containing only non-revoked verified Work Proof. It does not return
unrelated private profile fields. An employer loses this applicant-review
access after the application leaves `submitted`.

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

`applicationDeadline` closes new submissions only. The command uses server time
inside the transaction and allows acceptance while
`now < startsAt - 24 hours`. At or after that selection cutoff it returns
`JOB_NOT_AVAILABLE` without writes, even when the persisted job status is still
`published`.

Errors include `APPLICATION_NOT_SUBMITTED`, `JOB_NOT_AVAILABLE`,
`FIRST_OPPORTUNITY_INELIGIBLE`, and `CONCURRENT_ACCEPTANCE_CONFLICT`.

## 7. Agreement and Attendance Contracts

### `getAgreement(agreementId)`

Access: worker party, employer party, or authorized admin.

Returns the complete immutable terms snapshot, party confirmation states, lifecycle state, and allowed next actions. Full address appears only here and in other explicitly authorized agreement views.

```ts
type AgreementView = {
  id: string;
  applicationId: string;
  snapshot: {
    version: number;
    jobId: string;
    workerId: string;
    employerId: string;
    // Complete accepted terms from the immutable agreement snapshot.
    title: string;
    categoryId: string;
    categoryName: string;
    taskScope: string;
    generalArea: string;
    fullAddress: string;
    arrivalInstructions: string | null;
    startsAt: string;
    estimatedMinutes: number;
    wageAmount: string;
    wageUnit: "hour" | "day" | "job";
    paymentMethod: string;
    paymentTiming: string;
    toolsProvided: string | null;
    toolsRequired: string | null;
    cancellationWording: string;
    isFirstOpportunity: boolean;
    wageStatus: "compliant" | "below" | "unavailable";
  };
  confirmations: {
    workerConfirmedAt: string | null;
    employerConfirmedAt: string | null;
  };
  status: "pending_confirmation" | "active" | "completed" | "cancelled";
  cancellation: { cancelledAt: string; reason: string } | null;
  allowedActions: { confirm: boolean };
  createdAt: string;
  updatedAt: string;
};
```

The query reads accepted terms from `agreements.terms_snapshot`; it does not
reconstruct them from mutable job or profile records. Inaccessible identifiers
return safe `NOT_FOUND` behavior.

### `confirmAgreement(agreementId)`

Access: either active party.

Behavior sets only the caller's confirmation timestamp. It is idempotent for the same caller. When both timestamps exist, it transitions the agreement to `active` and ensures one scheduled work session exists.

```ts
type ConfirmAgreementResult = {
  agreementId: string;
  status: "pending_confirmation" | "active" | "completed" | "cancelled";
  workerConfirmedAt: string | null;
  employerConfirmedAt: string | null;
};
```

The command locks the agreement row and performs confirmation, activation,
scheduled-session creation, safe notifications, and the append-only
`confirm_agreement` audit in one transaction. The activation audit is recorded
by `metadata.activated = true`. A retry by an already-confirmed caller returns
the stored state without another write, notification, audit, or work session.

Errors include `VALIDATION_FAILED`, `UNAUTHENTICATED`, `ACCOUNT_INACTIVE`,
`FORBIDDEN`, `NOT_FOUND`, and `INVALID_STATE_TRANSITION`.

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

Input: agreement ID and optional bounded completion note. Allowed once from
`checked_in` only when the session has one completion-evidence record.

### `POST /api/work-evidence/:agreementId`

Access: accepted active worker party.

Accepts one multipart field named `photo`: JPG, PNG, or WebP up to 5 MB.
Available only while the session is `checked_in`. The server decodes, rotates,
resizes within 2048×2048, and re-encodes the input as WebP without copied
metadata before saving it to a random path in the private bucket. A replacement
atomically swaps the PostgreSQL metadata pointer and is unavailable after
checkout. Successful output returns only agreement ID, upload timestamp, and
normalized byte size; it never returns a storage path.

At most five successful uploads/replacements per actor and agreement are
allowed per rolling minute.

### `GET /api/work-evidence/:agreementId`

Access: related active worker, related active employer, or active admin.

Streams the normalized private image with `private, no-store` and
`nosniff` headers after server-side relationship authorization. Anonymous and
unrelated identifiers return safe authorization/not-found responses. Storage
paths and provider credentials are never returned.

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

Repeated successful requests return the same proof and credit outcome. Errors
include `WORK_NOT_CHECKED_OUT` and `ACTIVE_REPORT_BLOCKS_COMPLETION`.

### `markCashPaymentPaid(agreementId)`

Access: active related Employer. Requires completed Job/Mini Agreement,
verified Work Session, and a `Tunai`/`Cash` agreement-snapshot payment method.

Creates the unique `awaiting_worker` confirmation with a server-time deadline
exactly 48 hours later. A retry while awaiting or already confirmed returns the
stored result. From `reported_not_received`, it starts a new response window.

### `confirmCashPaymentReceipt(input)`

Access: active related Worker.

Input is strict `{ agreementId, received: boolean }`. An explicit response
records `confirmed_received` or `reported_not_received`. The latter blocks
automatic confirmation. A Worker can correct `auto_confirmed` to
`reported_not_received` and can later change a not-received response to
received. Both commands return only:

```ts
type CashPaymentConfirmationResult = {
  agreementId: string;
  status: "awaiting_worker" | "confirmed_received" |
    "reported_not_received" | "auto_confirmed";
  employerMarkedPaidAt: string;
  workerRespondedAt: string | null;
  confirmedAt: string | null;
  autoConfirmAt: string;
};
```

## 8. Passport, Credit, and Boost Contracts

### `getMyPassport(input?: PageInput)`

Access: active worker. Returns a summary and a cursor-paginated page of the
caller's non-revoked verified Work Proof entries in completion-time order.
Each entry contains only its category, job-title snapshot, general-area
snapshot, work dates, and verification state. Worker identity is derived from
the trusted session.

### `getMyCreditSummary()`

Access: active employer.

Returns active credit count, lifetime non-revoked opportunity count, derived badge, and paginated credit history. No balance input is accepted.

### `getMyCreditDashboardSummary()`

Access: active employer.

Returns only the current active-credit count and active-boost count needed by
the Employer dashboard. It does not load credit history, target jobs, or accept
caller-supplied ownership and balance fields.

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
Normal users cannot report an arbitrary standalone user identifier. The command
serializes submissions per reporter, permits at most three reports per rolling
minute, rejects a duplicate active report for the same target, and inserts the
report and audit entry in one transaction.

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

### `GET /api/maintenance/expire-jobs`

Access: `Authorization: Bearer <CRON_SECRET>` for Vercel Cron, or
`Authorization: Bearer <RINTARA_MAINTENANCE_SECRET>` for a manually configured
scheduler.

Runs one bounded `expireUnfilledJobs` batch and returns only processed job and
application counts. The maintenance secret must contain at least 32 characters.

### `GET /api/maintenance/confirm-cash-payments`

Uses the same protected maintenance credentials. Runs one bounded
`autoConfirmCashPayments` batch for `awaiting_worker` rows whose exact 48-hour
deadline has passed. It returns only `{ confirmedPaymentCount }`. Conditional
updates and row locks make retries safe and prevent overwriting Worker
responses. The Vercel Hobby schedule scans daily, so an overdue record is
persisted on the first daily invocation after its deadline.

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
| `JOB_NOT_FOUND` | Job is absent, hidden, or not owned by the caller | 404 |
| `JOB_NOT_DRAFT` | Job is no longer editable or publishable as a draft | 409 |
| `JOB_NOT_AVAILABLE` | Job is closed for the requested operation, its application or selection cutoff passed, or it is expired/filled | 409 |
| `CATEGORY_NOT_ALLOWED` | Current category policy rejects the requested operation | 409 |
| `WAGE_GUIDELINE_UNAVAILABLE` | No applicable active Wage Guideline exists | 409 |
| `WAGE_BELOW_GUIDELINE` | Wage does not meet the applicable guideline | 409 |
| `APPLICATION_ALREADY_EXISTS` | Worker already applied to the job | 409 |
| `APPLICATION_NOT_FOUND` | Application is absent or not owned by the caller | 404 |
| `APPLICATION_NOT_WITHDRAWABLE` | Application is no longer submitted | 409 |
| `FIRST_OPPORTUNITY_INELIGIBLE` | Worker now has category proof | 409 |
| `CONCURRENT_ACCEPTANCE_CONFLICT` | Another applicant won the race | 409 |
| `ACTIVE_REPORT_BLOCKS_COMPLETION` | Moderation must finish first | 409 |
| `WORK_EVIDENCE_REQUIRED` | Worker has not stored the required result photo before checkout | 409 |
| `WORK_EVIDENCE_INVALID` | Photo format, content, or size is invalid | 400 |
| `CASH_PAYMENT_CONFIRMATION_NOT_AVAILABLE` | Work/method does not permit cash confirmation | 409 |
| `CASH_PAYMENT_CONFIRMATION_NOT_PENDING` | Explicit receipt is already final or state changed | 409 |
| `REPORT_ALREADY_EXISTS` | The reporter already has an active report for the same target | 409 |
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
- application submit/withdraw/accept: worker applications, owner applicant
  list, relevant dashboards, and affected notification views;
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
