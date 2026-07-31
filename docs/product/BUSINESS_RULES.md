# Rintara Business Rules

> **Version:** 3.0  
> **Date:** July 18, 2026  
> **Status:** Normative MVP domain specification  
> **Scope authority:** `docs/product/PRD.md`

## 1. Domain Terms

| Term | Definition |
| --- | --- |
| First Opportunity | A published job open to workers with no non-revoked verified Work Proof in its category, provided the job passes category, risk, and wage rules |
| Beginner worker | A worker with no qualifying Work Proof in the relevant category; this is calculated, never self-declared |
| Wage Guideline | A reference value by area, category, and unit; it is not presented as a legal minimum unless legally validated |
| Selection cutoff | The fixed point 24 hours before `starts_at`; the last boundary for accepting an existing submitted application |
| Mini Agreement | The immutable operational terms snapshot created when one application is accepted |
| Work Session | The single attendance and completion record for an agreement |
| Work Completion Evidence | One private normalized result photo required after check-in and before check-out |
| Work Proof | System-issued evidence of a verified completed job |
| Rintara Passport | A read model composed from a worker's Work Proof records |
| Opportunity Credit | A non-transferable employer reward for a qualifying First Opportunity completion |
| Job Boost | A 24-hour increase in visibility for one published job after one credit redemption |
| Active report | A report in `open` or `reviewing` status that applies to the relevant workflow |

## 2. Roles and Account Status

- Every account has one role: `worker`, `employer`, or `admin`.
- Account status is `active`, `suspended`, or `deleted`.
- Only active accounts may execute protected business operations.
- A role is read from the database after session validation, never from request input.
- Role changes are administrative and out of the normal MVP flow.
- Deletion is logical. Critical jobs, agreements, proof, rewards, reports, and audit records are retained according to policy.

## 3. Authorization Matrix

| Operation | Worker | Employer | Admin | Anonymous |
| --- | ---: | ---: | ---: | ---: |
| View public published jobs | Yes | Yes | Yes | Yes |
| Manage own profile | Yes | Yes | Yes | No |
| Create/publish job | No | Own only | Moderation only | No |
| Apply/withdraw | Own only | No | No | No |
| Review applicants | No | Own jobs only | Moderation only | No |
| Confirm agreement | Own agreements | Own agreements | Moderation only | No |
| Check in/check out | Accepted worker only | No | Exceptional moderation only | No |
| Upload/view completion evidence | Own session | Related agreement | Authorized moderation | No |
| Generate check-in code | No | Job owner only | Exceptional moderation only | No |
| Verify completion | No | Job owner only | Exceptional moderation only | No |
| View full address | Accepted worker | Job owner | Authorized moderation | No |
| Redeem credit | No | Own credit and job | Revoke only | No |
| Process reports | No | No | Yes | No |

UI visibility does not grant permission. Every rule is enforced in the server domain layer.

## 4. First Opportunity Eligibility

### 4.1 Worker eligibility

A worker is eligible for category `C` when no record satisfies all conditions below:

```text
work_proof.worker_id = current worker
AND work_proof.category_id = C
AND work_proof.verification_status = verified
```

Revoked proof does not count. Experience in another category does not affect eligibility.

### 4.2 Job eligibility

A job may be marked First Opportunity only when:

- its category permits First Opportunity;
- its risk classification is low;
- its Wage Guideline status is `compliant`;
- its wage amount, unit, area, tasks, and schedule are explicit; and
- it does not request unpaid trial work.

If no applicable Wage Guideline exists, status is `unavailable` and First Opportunity publishing is blocked for the MVP.

### 4.3 Revalidation points

Eligibility is calculated:

1. when the worker opens or submits an application;
2. again inside `acceptApplication`; and
3. captured immutably in the agreement at acceptance.

The acceptance calculation is authoritative. If the worker gained qualifying proof after applying, a First Opportunity application can no longer be accepted.

## 5. Wage Rules

- Wage amount is a positive integer in Indonesian rupiah.
- Allowed units are `hour`, `day`, and `job`.
- Public jobs always show the amount and unit.
- Application input cannot alter the wage.
- Guideline status is:
  - `compliant` when the job amount is at or above the applicable reference minimum;
  - `below` when it is below the reference minimum;
  - `unavailable` when no active guideline matches.
- General jobs may be published below an internal guideline only if the UI shows the `below` warning; they cannot be First Opportunity jobs.
- Simulated guidance is labeled as simulation data and is not described as law.

## 6. Lifecycle State Machines

### 6.1 Job

```text
draft -> published -> filled -> in_progress -> completed
  |       |    |
  |       |    +-> expired
  |       +------> cancelled
  +--------------> cancelled

filled or in_progress -> cancelled only through an authorized cancellation operation
```

Rules:

- Only the owner can publish a valid draft.
- Published job terms are immutable; cancel and recreate to change them.
- A job becomes `filled` only through successful application acceptance.
- A job becomes `in_progress` only through valid check-in.
- A job becomes `completed` only through verified completion.
- A job may be published only when `application_deadline` is strictly earlier
  than the selection cutoff at `starts_at - 24 hours`.
- `application_deadline` closes public discovery and new applications only.
  Existing submitted applications remain reviewable and selectable by the
  owner until the selection cutoff.
- Public discovery treats a deadline-passed published job as unavailable even if the persisted expiry transition has not run yet.
- Application acceptance uses server time as the cutoff and is permitted only
  while `now < starts_at - 24 hours`. At or after that selection cutoff,
  `acceptApplication` returns `JOB_NOT_AVAILABLE` without changing the job,
  applications, agreement, notifications, or audit records, even if the
  persisted job status is still `published`.
- At or after the selection cutoff, a scheduled task or authorized operation
  expires an unfilled published job, rejects its remaining submitted
  applications, notifies affected workers, and writes audit history in one
  transaction.
- Employer may cancel a draft or unfilled published job. Filled or in-progress cancellation requires an authorized administrative workflow and reason.
- Cancelling an unfilled published job rejects its submitted applications and creates notifications and audit history in the same transaction.
- Moderation visibility is separate from lifecycle status. A hidden job remains available to its owner/admin but is excluded from public discovery and new applications.

### 6.2 Application

```text
submitted -> accepted
          -> rejected
          -> withdrawn
withdrawn -> submitted
```

Only a withdrawn application may return to `submitted`, and only while the job
still accepts applications. Resubmission replaces the note, refreshes the
submission timestamp and category eligibility snapshot, and reuses the same
application record. Accepted and rejected applications remain terminal.
Acceptance rejects all other submitted applications for the same job in the
same transaction.

### 6.3 Agreement

```text
pending_confirmation -> active -> completed
pending_confirmation/active -> cancelled through an authorized workflow
```

Worker and employer confirmation timestamps are independent. The agreement becomes active only after both exist. The snapshot does not mutate after creation.

The transition to `active` creates exactly one scheduled work session in the same transaction.

### 6.4 Work session

```text
scheduled -> checked_in -> checked_out -> verified
```

Every agreement has at most one session. Skipping states is prohibited.
While the session is `checked_in`, the accepted worker may upload or replace
exactly one private result photo. The photo becomes immutable when the session
leaves `checked_in`, and `checked_out` requires the evidence record.

### 6.5 Opportunity Credit

```text
earned -> redeemed
       -> expired
       -> revoked
redeemed -> revoked through authorized moderation
```

`redeemed`, `expired`, and `revoked` cannot be redeemed again. Administrative revocation is the only transition allowed from `redeemed` and preserves its redemption history.

### 6.6 Job Boost

```text
scheduled/active -> ended
                 -> revoked
```

A boost is active when `starts_at <= now < ends_at` and status is not revoked. One job cannot have overlapping active boosts in the MVP.

### 6.7 Report

```text
open -> reviewing -> resolved
                  -> rejected
```

An active report blocks only the relevant risky transitions; it does not add ambiguous `disputed` states to job, agreement, or session records.

## 7. Job and Application Invariants

- A worker can submit at most one application per job.
- A worker may submit at most ten applications per rolling minute.
- An employer may create at most ten job drafts per rolling minute.
- A job can have at most one accepted application.
- An employer cannot apply to jobs through an employer account.
- A worker cannot apply to a job that is not `published` or whose deadline has passed.
- A worker cannot apply to their own resource under any role confusion scenario.
- Only the job owner can view the full applicant list or accept a submitted
  applicant before the selection cutoff.
- Acceptance creates exactly one agreement and never calls an external network service while holding database locks.
- Terms used for hiring come from the accepted job snapshot, not future job reads.

## 8. Mini Agreement Rules

The snapshot contains:

- job, worker, and employer identifiers;
- title, category, and task scope;
- general area and full work address;
- scheduled start and estimated duration;
- wage amount and unit;
- payment method and timing outside Rintara;
- tools supplied and required;
- cancellation wording;
- Wage Guideline status; and
- First Opportunity eligibility at acceptance.

Rules:

- Only the two parties and authorized admin can view the complete snapshot.
- Full address becomes visible to the accepted worker only after acceptance.
- Confirmation does not change agreement terms.
- Retrying an existing confirmation returns the current state without another work session, notification, or audit write.
- A cancelled agreement cannot be reactivated.

## 9. Attendance Rules

- Check-in requires an active agreement.
- Employer creates a six-digit code with a 15-minute lifetime.
- Store only a strong hash, expiry, issue time, attempt count, and used time.
- A code is single use and allows at most five failed attempts.
- Code comparison and attempt changes happen on the server.
- Successful check-in records server time and transitions session and job atomically.
- Check-out is performed once by the accepted worker after check-in.
- Continuous GPS is not collected.

## 10. Completion and Work Proof Rules

Completion verification requires:

- authenticated active employer who owns the job;
- `checked_out` session;
- active agreement and `in_progress` job;
- no active report related to the job or agreement; and
- an idempotency-safe transaction.

The transaction:

1. locks or conditionally protects the workflow records;
2. verifies every precondition;
3. marks the session `verified`;
4. marks agreement and job `completed`;
5. inserts exactly one Work Proof;
6. attempts qualifying credit issuance;
7. creates notifications and audit records; and
8. commits as one unit.

Work Proof rules:

- one agreement creates at most one proof;
- proof is created only by the completion domain operation;
- proof is verified by system workflow, not user input;
- revocation requires admin role, a reason, and audit history;
- revoked proof is retained but excluded from eligibility and Passport verified totals.

## 11. Opportunity Credit Rules

A credit is issued only when:

- the agreement captured `is_first_opportunity = true` at acceptance;
- Wage Guideline status captured at acceptance was `compliant`;
- the work completed through the verified workflow;
- there is no active report;
- no credit exists for the source job; and
- the employer has fewer than three active credits.

Additional rules:

- one source job produces at most one credit;
- a credit is owned by one employer and is not transferable;
- the active balance counts `earned` credits that are not expired;
- if the balance cap is reached, completion still succeeds and the skipped issuance is audited;
- the Opportunity Giver badge is derived from the existence of at least one non-revoked lifetime credit record;
- credit expiration is nullable for the MVP demo until a production policy is approved.

## 12. Credit Redemption and Boost Rules

Redemption requires an `earned`, unexpired, non-revoked credit and a visible `published` job owned by the same employer.

The transaction:

1. validates idempotency key, account, ownership, and current states;
2. locks or conditionally claims the credit;
3. verifies that the job has no overlapping boost;
4. marks the credit `redeemed` with timestamp and target job;
5. creates a boost from server time until exactly 24 hours later;
6. creates notification and audit records; and
7. commits as one unit.

Discovery ranks currently boosted jobs before non-boosted jobs. Boosting does not change eligibility, wage rules, or moderation priority.

## 13. Report and Moderation Rules

Allowed report reasons include suspicious job, task or wage mismatch, absence, unsafe behavior, spam, and other policy violation.

- A reporter must be authenticated and have a legitimate relationship with or visibility of the target.
- `open` and `reviewing` reports are active.
- An active job/agreement report blocks completion verification.
- Admin actions require a factual reason and immutable audit record.
- Admin may hide a job, suspend an account, cancel an unfinished workflow, revoke proof, revoke credit, and deactivate a related active boost.
- Rejected or resolved reports no longer block completion unless a separate administrative restriction remains.
- Reports and lifecycle evidence are not hard-deleted through normal
  application flows. Binary completion evidence follows its separately
  approved retention policy.
- A reporter may submit at most three reports per rolling minute and may not
  create a duplicate active report for the same target.
- A normal worker or employer cannot report an arbitrary standalone user; the
  target user must be connected through a visible job or agreement.
- Proof, credit, and boost identifiers selected during moderation must belong
  to the report's job, agreement, or reported user.

## 14. Notifications and Audit

- Notifications are private to their recipient.
- Notifications may contain entity IDs and safe summaries, but not full addresses, codes, tokens, or sensitive moderator notes.
- Critical audit actions include publish/cancel job, application acceptance, agreement confirmation, check-in/out, completion, proof issuance/revocation, credit issue/redeem/revoke, report moderation, user suspension, and Wage Guideline changes.
- Audit metadata must be structured and minimized.

## 15. Database-Enforced Invariants

At minimum, PostgreSQL enforces:

- unique application by `(job_id, worker_id)`;
- at most one accepted application per job through a partial unique index;
- unique agreement by application and job;
- unique work session by agreement;
- unique completion evidence by work session and unique private storage path;
- unique Work Proof by agreement;
- unique Opportunity Credit by source job;
- unique boost by credit and no overlapping active boost through transactional validation;
- positive wage values;
- valid foreign-key relationships; and
- restricted deletion for lifecycle and audit records.

The exact schema and index definitions are in `docs/engineering/DATABASE.md`.

## 16. Idempotency and Concurrency

- `acceptApplication` uses a database transaction plus row locking, conditional update, or an equivalent safe pattern.
- `verifyCompletion` returns the existing success result if the same completed agreement is requested again.
- `redeemOpportunityCredit` requires an idempotency key scoped to employer and operation.
- Unique constraints are the final safety boundary; application checks alone are insufficient.
- External calls, email, or file uploads must never occur while transactional rows are locked.

## 17. Prohibited Domain Shortcuts

- Do not expose generic `updateStatus` operations.
- Do not calculate beginner status from profile fields.
- Do not store Passport as a user-editable table.
- Do not issue credits at job publication, application, acceptance, or check-in.
- Do not let UI code decide authorization or final eligibility.
- Do not hard-delete records to repair state.
- Do not introduce bidding, escrow, payments, chat, AI matching, or multi-worker behavior under an existing domain name.
