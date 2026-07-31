# Rintara Product Requirements

> **Version:** 3.0  
> **Date:** July 18, 2026  
> **Status:** MVP implementation baseline  
> **Parent document:** `docs/product/PRD.md`

## 1. Requirement Conventions

The keywords **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative. A P0 requirement is complete only when its acceptance criteria and applicable negative paths are covered by tests.

Priority labels:

- **P0:** required for the MVP release.
- **P1:** implement only after every P0 release gate passes.
- **Later:** explicitly excluded from this release.

## 2. Functional Requirements

### FR-001 — Authentication and session management [P0]

The system MUST support registration, sign-in, sign-out, password recovery, and
secure session handling through a mature authentication solution. New
self-service accounts MUST verify ownership of their email address before an
authenticated onboarding session is established.

Acceptance criteria:

- Anonymous users cannot read private resources or execute authenticated mutations.
- Every private operation derives the user identity from the server session.
- Passwords, tokens, and session implementation are not built or logged by application code.
- Password recovery returns a generic request result, uses a one-time provider
  callback, and rejects an invalid or expired recovery session.
- Registration uses a one-time provider email callback; an invalid or expired
  verification link can be retried without revealing whether the email belongs
  to an existing, confirmed, or pending account.
- A successful email verification retains the selected Worker or Employer role
  and any validated internal continuation destination.
- Registration role selection MUST NOT be repeated after verification. The
  verified account continues directly to its selected role's profile form;
  server-side onboarding remains the only operation that persists the role.
- Registration keeps an explicit consent checkbox and exposes **Ketentuan
  Penggunaan** and **Kebijakan Privasi** as separate readable document dialogs
  before submission. Opening either document does not change consent state.
- Each registration document is scrollable in a near-full-height, bounded-width
  dialog and can be dismissed using its back action, Escape, or the surrounding
  overlay without losing valid form input.

### FR-002 — Role onboarding and account status [P0]

Each account MUST have exactly one active MVP role: `worker`, `employer`, or `admin`. A new non-admin user selects either worker or employer during onboarding.

Acceptance criteria:

- Role is persisted server-side and cannot be overridden in request input.
- Role change is not self-service in the MVP.
- `suspended` and `deleted` accounts cannot perform protected operations.
- Worker-only and employer-only operations reject the opposite role.

### FR-010 — Worker profile [P0]

A worker MUST be able to manage a display name, general area, short biography, availability, and category interests.

Acceptance criteria:

- A worker can update only their own profile.
- Self-declared interests are visibly distinct from verified Work Proof.
- Beginner eligibility is calculated by category and cannot be edited manually.
- Private contact and address data are not exposed through the public profile.

### FR-011 — Employer profile [P0]

An employer MUST be able to manage a display or business name, employer type, general area, and short description.

Acceptance criteria:

- An employer can update only their own profile.
- Completed-job, verified-opportunity, badge, and credit values are derived from system records.
- The interface never accepts a client-supplied credit balance or verification count.

### FR-019 — Marketplace configuration [P0]

An active administrator MUST be able to manage the pilot areas, job categories,
and Wage Guidelines required by marketplace operations.

Acceptance criteria:

- Only active administrators can create marketplace configuration records.
- Only active administrators can deactivate and reactivate existing marketplace
  configuration records.
- Pilot areas can be activated for onboarding, job publishing, and discovery.
- Categories can be activated for worker interests, jobs, and First Opportunity rules.
- Wage Guidelines are configured per active pilot area, active category, and wage unit.
- Wage Guideline values include minimum and recommended reference amounts.

### FR-020 — Job drafting and publishing [P0]

An active employer MUST be able to create a draft and publish a job containing:

- title, category, description, and task scope;
- general area and a separately stored full address;
- start time and estimated duration;
- positive integer wage amount in Indonesian rupiah;
- wage unit: `hour`, `day`, or `job`;
- payment method and timing outside Rintara;
- provided and required tools;
- risk level and First Opportunity option; and
- application deadline.

Acceptance criteria:

- Only the owning employer can edit a draft or publish it.
- Publishing rejects missing required fields, non-positive wages, past
  deadlines, an `applicationDeadline` that is not earlier than
  `startsAt - 24 hours`, and disallowed categories.
- Public job output never contains the full address.
- A published job is immutable except for valid lifecycle operations; changed terms require cancellation and a new job.
- A First Opportunity job publishes only when its category is allowed and its wage is compliant.
- If no worker is selected by `startsAt - 24 hours`, the expiry workflow marks
  the job `expired`, rejects remaining submitted applications, and writes
  notifications and audit history atomically.

### FR-021 — Wage Guidelines [P0]

An administrator MUST be able to manage wage guidance by area, category, wage unit, minimum reference amount, recommended amount, source, effective dates, and simulation status.

Acceptance criteria:

- A job receives `compliant`, `below`, or `unavailable` wage status on the server.
- A First Opportunity job requires `compliant` status.
- Simulated data is clearly labeled in admin and employer interfaces.
- Guidance is described as a reference, not a legal minimum, unless legally validated.

### FR-022 — Public job discovery [P0]

Users MUST be able to browse published jobs and filter by category, general area, wage range, and First Opportunity status.

Acceptance criteria:

- Results are paginated and sorted deterministically.
- Active boosts rank before non-boosted jobs; items in the same group sort by publication time descending.
- Expired, cancelled, filled, hidden, deadline-passed, and draft jobs do not appear in public discovery.
- Listing and detail views have loading, empty, error, and retry states.
- Anonymous responses contain no full address, private contact detail, or internal moderation data.

### FR-030 — Submit and withdraw an application [P0]

An active worker MUST be able to submit one short application note to an
eligible published job, withdraw it before acceptance, and resubmit the same
application with a replacement note while the job still accepts applications.

Acceptance criteria:

- The database prevents more than one application per worker per job.
- Resubmission reactivates the withdrawn record, replaces its note, refreshes
  its submission time and eligibility snapshot, and does not create a second
  application row.
- Application rejects a closed, deadline-passed, filled, expired, cancelled, or
  worker-owned job.
- At or after `applicationDeadline`, a new submission returns
  `JOB_NOT_AVAILABLE`.
- Passing `applicationDeadline` does not prevent the owner from reviewing or
  accepting an existing submitted application before the selection cutoff.
- A First Opportunity application is accepted only when the worker has no non-revoked verified Work Proof in that category.
- The application cannot propose or modify a wage.
- Withdrawal is allowed only while status is `submitted`.
- Rejected and accepted applications cannot be resubmitted.

### FR-031 — Review applicants [P0]

The job owner MUST be able to review applications and the relevant Rintara Passport of each applicant.

Acceptance criteria:

- Employer A cannot access applicants for Employer B's job.
- Passport access exists only while the employer is reviewing an application to their own job.
- Revoked proof is excluded from verified history.
- The interface clearly labels First Opportunity eligibility for the job category.

### FR-032 — Accept one worker [P0]

The job owner MUST be able to accept exactly one submitted application through the transactional `acceptApplication` operation.

Acceptance criteria:

- Role, ownership, account status, job status, the selection cutoff derived
  from `startsAt`, and category eligibility are revalidated inside the
  operation using server time.
- At or after `startsAt - 24 hours`, acceptance returns
  `JOB_NOT_AVAILABLE` and leaves the job, applications, agreement,
  notifications, and audit records unchanged.
- Concurrent acceptance requests result in exactly one accepted application.
- The selected application becomes `accepted`, other submitted applications become `rejected`, and the job becomes `filled` atomically.
- Exactly one pending Mini Agreement is created from a snapshot of accepted terms.
- A failure rolls back every state change, notification, and audit record in the transaction.

### FR-040 — Mini Agreement [P0]

Acceptance MUST create a Mini Agreement snapshot containing the parties, job category and title, tasks, general area and private address, schedule, duration, wage, payment terms, tools, cancellation policy, and First Opportunity eligibility at acceptance.

Acceptance criteria:

- Worker and employer confirm independently and in any order.
- Agreement becomes `active` only after both confirmation timestamps exist.
- Exactly one scheduled work session is created when the agreement first becomes active.
- Repeated or concurrent confirmation creates no duplicate work session, notification, or audit side effect.
- Terms cannot be edited after creation; cancellation requires a domain operation and reason.
- Only the two parties and authorized administrators can view the full agreement.

### FR-041 — Check-in [P0]

For an active agreement, the employer MUST be able to generate a single-use six-digit check-in code with a 15-minute lifetime, and the accepted worker MUST be able to use it.

Acceptance criteria:

- The code is stored as a cryptographic hash, never plaintext.
- Expired, used, or invalid codes are rejected, with a maximum of five failed attempts per issued code.
- Successful check-in records the timestamp, marks the work session `checked_in`, and moves the job to `in_progress` atomically.
- Neither an unrelated user nor a party to a different agreement can use the code.

### FR-042 — Check-out [P0]

The accepted worker MUST upload one private result photo after a successful
check-in before checking out, and MAY add an optional completion note.

Acceptance criteria:

- The worker may upload or replace one JPG, PNG, or WebP result photo of at
  most 5 MB only while the session is `checked_in`.
- The server normalizes the photo without embedded metadata and stores it in
  private object storage.
- The worker must attest that they have permission to photograph the area and
  that the selected image excludes people and private information.
- Only the related worker, related employer, and authorized admin can read the
  photo; it never appears in public jobs or Passport.
- Check-out is allowed exactly once, only from `checked_in`, and only when the
  session has an evidence record.
- The work session records a server timestamp and becomes `checked_out`.
- Employer receives an in-app request to verify completion.

### FR-043 — Verify completion and issue Work Proof [P0]

The employer MUST be able to verify a checked-out session through the atomic and idempotent `verifyCompletion` operation.

Acceptance criteria:

- An active related report blocks completion verification.
- The operation marks the session `verified`, agreement `completed`, and job `completed` in one transaction.
- Exactly one verified Work Proof is created for the agreement.
- Repeated calls return the existing successful result and create no duplicate proof or credit.
- Notifications and audit records are written consistently with the outcome.

### FR-044 — Rintara Passport [P0]

The system MUST provide a Passport derived from a worker's non-revoked Work Proof records.

Acceptance criteria:

- The worker can view all their proof records.
- An authorized employer sees only the applicant Passport context needed for their own job.
- Passport entries display category, job title, completion date, general area, and verification state.
- Users cannot create, edit, or mark a Work Proof as verified.

### FR-050 — Issue Opportunity Credit [P0]

A valid First Opportunity completion SHOULD issue one Opportunity Credit to the employer in the same completion transaction.

Acceptance criteria:

- Issuance requires eligibility captured at acceptance, a compliant wage, verified completion, no active report, and no previous credit for the source job.
- One source job can issue at most one credit.
- An employer can hold at most three active credits.
- If the balance is already three, completion and Work Proof issuance succeed, but no credit is created; the reason is audited.
- The “Opportunity Giver” badge is derived after the first non-revoked credit is earned.

### FR-051 — Redeem credit for a boost [P0]

An employer MUST be able to redeem one active credit to boost one of their published jobs for 24 hours.

Acceptance criteria:

- Credit ownership, status, expiry, job ownership, job visibility, and job status are validated in one transaction.
- A credit can be redeemed once and creates one boost record.
- The target must be a visible published job, and a job with an active boost cannot receive another overlapping boost in the MVP.
- Expired or revoked credits cannot be redeemed.
- Repeated requests with the same idempotency key do not consume another credit.

### FR-060 — Reports [P0]

An authenticated user MUST be able to report a relevant job, agreement, or user using a defined reason and optional factual description.

Acceptance criteria:

- Reports are limited to resources the reporter may legitimately see or participate in.
- Duplicate spam submissions are rate-limited.
- An open or reviewing report related to an agreement blocks completion verification.
- The reporter can see the current report status but not private moderator notes.

### FR-061 — Minimum moderation [P0]

An administrator MUST be able to review reports, hide jobs, suspend users, cancel unfinished workflows, revoke Work Proof or credits when justified, and record a reason.

Acceptance criteria:

- Every action checks admin role on the server.
- Status transitions and reasons are persisted with an audit record.
- Revoking proof updates category eligibility on the next read.
- Revoking a redeemed credit can deactivate its active boost.
- Admin actions do not hard-delete lifecycle or audit evidence.

### FR-045 — Confirm external cash payment receipt [P0]

After verified completion of a cash job, the related Employer MUST be able to
record that cash was given and the related Worker MUST be able to record whether
it was received. Rintara MUST NOT hold, move, or guarantee the funds.

Acceptance criteria:

- The operation is unavailable for non-cash jobs or unfinished work.
- Employer marking creates at most one confirmation per agreement and starts an
  exact 48-hour response deadline using server time.
- Worker may confirm `received` or `not received`; a `not received` response
  prevents automatic confirmation and notifies the Employer.
- Only an unanswered `awaiting_worker` record becomes `auto_confirmed` after
  the deadline through bounded, authenticated, concurrency-safe maintenance.
- Worker may correct `auto_confirmed` to `not received`; Employer may re-mark
  after `not received`, starting a new deadline.
- Every change writes safe notifications and audit entries transactionally.
- Cash confirmation never blocks Work Proof or Opportunity Credit issuance.

### FR-070 — In-app notifications [P0]

The system MUST persist notifications for application, agreement, attendance,
completion, cash payment confirmation, proof, credit, boost, and report events.

Acceptance criteria:

- A user can list only their notifications and mark them read.
- Notification payloads contain safe identifiers and short copy, not secrets or full addresses.
- Revalidation or light polling is sufficient; dedicated realtime infrastructure is not required.

### FR-071 — Audit trail [P0]

Critical lifecycle, reward, wage-guideline, account, and moderation operations MUST create immutable audit entries.

Acceptance criteria:

- Each entry records actor where available, action, entity, timestamp, request correlation ID, and safe metadata.
- Passwords, tokens, plaintext codes, and unnecessary personal data are never logged.
- Audit creation participates in the same transaction as the critical mutation when consistency requires it.

## 3. Non-Functional Requirements

### NFR-001 — Security [P0]

- Every private operation MUST enforce authentication, active account status, role, ownership, and relationship on the server.
- Input MUST be validated at the server boundary.
- Database queries MUST be parameterized through the data-access layer.
- Sign-in, job creation, application, code verification, and reporting SHOULD be rate-limited.
- Production MUST use HTTPS and secure cookie settings.

### NFR-002 — Privacy [P0]

- Full addresses MUST remain outside all public projections, rendered HTML, metadata, logs, and notification copy.
- The MVP MUST NOT store government identity documents, bank details, continuous GPS, private chat, or payment-card data.
- Data returned to each role MUST be minimized to the current task.

### NFR-003 — Reliability and consistency [P0]

- Acceptance, agreement activation, completion, cash payment confirmation, and credit redemption MUST be transactional.
- Agreement confirmation, completion, and redemption MUST be idempotent.
- Foreign keys, unique indexes, check constraints, and restricted deletes MUST protect critical invariants.
- Failed multi-write operations MUST leave no partial business state.

### NFR-004 — Performance and scalability [P0]

- Public core pages SHOULD target LCP at or below 2.5 seconds under representative mobile testing.
- Large lists MUST be paginated.
- Critical discovery, application, proof, notification, and report queries MUST use verified indexes.
- Web processes SHOULD remain stateless and use PostgreSQL connection pooling.
- Transactions MUST remain short and avoid network calls while holding locks.

No concurrency, uptime, or throughput claim may be published without measured evidence and provider assumptions.

### NFR-005 — Accessibility and compatibility [P0]

- Primary flows MUST support keyboard navigation, semantic markup, visible focus, form labels, useful errors, and non-color status indicators.
- Core content SHOULD meet WCAG 2.2 AA contrast expectations.
- Touch targets SHOULD be at least 44 by 44 CSS pixels.
- Core flows MUST work on current Chromium, Firefox, and Safari-class mobile browsers.

### NFR-006 — Observability and recovery [P0]

- Critical errors SHOULD produce structured logs without sensitive data.
- Production database backups MUST follow the selected provider's supported policy.
- Local/test seed/reset procedures MUST be deterministic and isolated from real
  data. They MUST refuse preview, demo, production, and remote PostgreSQL
  targets.
- Health and deployment state SHOULD be verifiable without exposing application secrets.

### NFR-007 — Maintainability [P0]

- Domain rules MUST live outside React components.
- Database schema changes MUST use reviewed repository migrations.
- TypeScript MUST use strict type checking.
- New state-changing behavior MUST include relevant tests and documentation updates.

## 4. Required Test Scenarios

### Unit and domain

- First Opportunity eligibility is independent per category.
- Below-guideline jobs cannot be First Opportunity jobs.
- Invalid state transitions are rejected.
- Suspended users cannot mutate data.
- Credits cannot be issued or redeemed twice.

### Integration and database

- Duplicate application constraint.
- Concurrent acceptance produces one winner.
- Acceptance creates one agreement and rejects remaining applications atomically.
- Acceptance at or after the selection cutoff returns
  `JOB_NOT_AVAILABLE` without changing workflow or side-effect records.
- Completion creates one Work Proof and at most one credit.
- A forced write failure rolls back the entire transaction.
- Public job projection excludes private address fields.

### Manual release smoke

1. Employer-to-worker golden path through Work Proof and credit redemption.
2. Employer B cannot access or modify Employer A's job and applicants.
3. Anonymous users cannot obtain a full address.
4. A worker experienced in category A remains eligible in category B.
5. Admin processes one report and the associated lifecycle block behaves correctly.

## 5. Traceability

| Product capability | Requirements | Primary specification |
| --- | --- | --- |
| First Opportunity | FR-020, FR-021, FR-030, FR-050 | `docs/product/BUSINESS_RULES.md` |
| Hiring and agreement | FR-032, FR-040 | `docs/product/USER_FLOW.md`, `docs/engineering/API.md` |
| Attendance and completion | FR-041–FR-044 | `docs/product/BUSINESS_RULES.md`, `docs/engineering/DATABASE.md` |
| Credit and boost | FR-050–FR-051 | `docs/product/BUSINESS_RULES.md`, `docs/engineering/DATABASE.md` |
| Moderation | FR-060–FR-061 | `docs/product/USER_FLOW.md`, `docs/engineering/API.md` |
| Security and scaling | NFR-001–NFR-007 | `docs/engineering/ARCHITECTURE.md` |

## 6. Out-of-Scope Requirement Guard

Do not create requirements for bidding, payment processing, escrow, chat, automatic matching, Fast Rematch, direct worker search, continuous GPS, multi-worker jobs, identity verification, or native mobile applications during the MVP. A proposal to add one of these features requires PRD change control.
