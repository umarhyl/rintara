# Rintara Entity Relationship Diagram

> **Version:** 1.0  
> **Date:** July 19, 2026  
> **Status:** Canonical MVP logical ERD  
> **Product authority:** `docs/product/PRD.md`  
> **Domain authority:** `docs/product/BUSINESS_RULES.md`  
> **Column specification:** `docs/engineering/DATABASE.md`

## 1. Scope

This document visualizes the PostgreSQL model required by the Rintara MVP. The model is split into three views so keys and cardinalities remain readable:

1. identity and reference data;
2. hiring and verified-work lifecycle; and
3. rewards, moderation, notifications, audit, and idempotency.

Authentication-provider tables are excluded because the provider is still an open ADR. Rintara links an authenticated identity through `users.auth_subject`.

## 2. Identity and Reference Data

```mermaid
erDiagram
    direction LR

    user ||--o| workerProfile : "has worker profile"
    user ||--o| employerProfile : "has employer profile"
    area o|--o{ area : "contains"
    area ||--o{ workerProfile : "locates"
    area ||--o{ employerProfile : "locates"
    workerProfile ||--o{ workerInterest : "declares"
    category ||--o{ workerInterest : "classifies"
    area ||--o{ wageGuideline : "scopes"
    category ||--o{ wageGuideline : "guides"
    user ||--o{ wageGuideline : "creates"

    user["users"] {
        uuid id PK
        text authSubject UK
        enum role
        enum status
        datetime deletedAt "nullable"
    }
    workerProfile["worker_profiles"] {
        uuid userId PK, FK
        uuid areaId FK
        text displayName
        text bio "nullable"
        text availabilityNote "nullable"
    }
    employerProfile["employer_profiles"] {
        uuid userId PK, FK
        uuid areaId FK
        text displayName
        enum employerType
        text description "nullable"
    }
    area["areas"] {
        uuid id PK
        uuid parentId FK "nullable"
        enum level
        text code UK
        text name
        bool isActive
    }
    category["categories"] {
        uuid id PK
        text slug UK
        text name
        enum riskLevel
        bool firstOpportunityAllowed
        bool isActive
    }
    workerInterest["worker_interests"] {
        uuid workerId PK, FK
        uuid categoryId PK, FK
    }
    wageGuideline["wage_guidelines"] {
        uuid id PK
        uuid areaId FK
        uuid categoryId FK
        enum unit
        bigint minimumAmount
        bigint recommendedAmount
        text sourceLabel
        bool isSimulated
        date effectiveFrom
        date effectiveTo "nullable"
        bool isActive
        uuid createdBy FK
    }
```

Important rules:

- A user has one role and only the matching role profile.
- `worker_interests` is self-declared and never counts as verified experience.
- Beginner status is calculated from non-revoked Work Proof per worker and category.
- Employer credit balance and Opportunity Giver badge are derived, not profile columns.
- Active Wage Guidelines must not overlap for the same area, category, unit, and effective period.

## 3. Hiring and Verified-Work Lifecycle

```mermaid
erDiagram
    direction LR

    employerProfile ||--o{ job : "publishes"
    area ||--o{ job : "locates"
    category ||--o{ job : "classifies"
    job ||--|| jobPrivateDetail : "protects location"
    workerProfile ||--o{ application : "submits"
    job ||--o{ application : "receives"
    application ||--o| agreement : "creates when accepted"
    job ||--o| agreement : "has accepted terms"
    user ||--o{ agreement : "participates in"
    agreement ||--o| workSession : "activates"
    workSession ||--o| workCompletionEvidence : "requires before checkout"
    agreement ||--o| workProof : "produces"
    user ||--o{ workProof : "earns or verifies"
    category ||--o{ workProof : "proves experience in"

    user["users"] {
        uuid id PK
        enum role
        enum status
    }
    workerProfile["worker_profiles"] {
        uuid userId PK, FK
        uuid areaId FK
        text displayName
    }
    employerProfile["employer_profiles"] {
        uuid userId PK, FK
        uuid areaId FK
        text displayName
    }
    area["areas"] {
        uuid id PK
        text name
        enum level
    }
    category["categories"] {
        uuid id PK
        text slug UK
        enum riskLevel
        bool firstOpportunityAllowed
    }
    job["jobs"] {
        uuid id PK
        uuid employerId FK
        uuid categoryId FK
        uuid areaId FK
        text title
        bigint wageAmount
        enum wageUnit
        enum wageStatus
        bool isFirstOpportunity
        datetime startsAt
        datetime applicationDeadline
        enum status
        enum visibility
        uuid hiddenBy FK "nullable"
    }
    jobPrivateDetail["job_private_details"] {
        uuid jobId PK, FK
        text fullAddress
        text arrivalInstructions "nullable"
    }
    application["applications"] {
        uuid id PK
        uuid jobId FK
        uuid workerId FK
        text note
        bool eligibleAtSubmission
        enum status
        datetime submittedAt "refreshed on resubmission"
        datetime decidedAt "nullable"
        datetime withdrawnAt "nullable, cleared on resubmission"
    }
    agreement["agreements"] {
        uuid id PK
        uuid applicationId FK, UK
        uuid jobId FK, UK
        uuid workerId FK
        uuid employerId FK
        json termsSnapshot
        int snapshotVersion
        bool isFirstOpportunity
        enum wageStatus
        datetime workerConfirmedAt "nullable"
        datetime employerConfirmedAt "nullable"
        enum status
    }
    workSession["work_sessions"] {
        uuid id PK
        uuid agreementId FK, UK
        enum status
        text checkInCodeHash "nullable"
        datetime codeExpiresAt "nullable"
        int failedAttempts
        datetime checkedInAt "nullable"
        datetime checkedOutAt "nullable"
        datetime verifiedAt "nullable"
        uuid verifiedBy FK "nullable"
    }
    workCompletionEvidence["work_completion_evidence"] {
        uuid id PK
        uuid workSessionId FK, UK
        text storagePath UK
        text mimeType
        int byteSize
        text sha256
        uuid uploadedBy FK
        datetime uploadedAt
    }
    workProof["work_proofs"] {
        uuid id PK
        uuid agreementId FK, UK
        uuid workerId FK
        uuid employerId FK
        uuid categoryId FK
        text jobTitleSnapshot
        text areaLabelSnapshot
        bigint wageAmountSnapshot
        enum verificationStatus
        datetime completedAt
        datetime issuedAt
        uuid revokedBy FK "nullable"
    }
```

### Lifecycle cardinalities

| Parent | Child | Cardinality | Business meaning |
| --- | --- | --- | --- |
| Employer | Job | 1:N | An employer may publish multiple jobs |
| Job | Private detail | 1:1 | Full address is separated from public data |
| Job | Application | 1:N | A job may receive multiple applications |
| Worker | Application | 1:N | A worker may apply to multiple jobs |
| Application | Agreement | 1:0..1 | Only an accepted application creates an agreement |
| Job | Agreement | 1:0..1 | One accepted worker per MVP job |
| Agreement | Work session | 1:0..1 | Created once when both parties confirm |
| Work session | Completion evidence | 1:0..1 | Required after check-in and before checkout |
| Agreement | Work Proof | 1:0..1 | Created only after verified completion |

Rintara Passport is a read model over `work_proofs`; there is no editable `passports` table.

## 4. Rewards, Moderation, and Operations

```mermaid
erDiagram
    direction LR

    user ||--o{ opportunityCredit : "owns"
    job ||--o| opportunityCredit : "earns as source"
    job o|..o{ opportunityCredit : "receives redemption"
    opportunityCredit ||--o| jobBoost : "funds"
    job ||--o{ jobBoost : "is boosted by"
    user ||--o{ report : "submits"
    job o|..o{ report : "is reported in"
    agreement o|..o{ report : "is reported in"
    user o|..o{ report : "is reported or moderates"
    user ||--o{ notification : "receives"
    user o|..o{ auditLog : "acts in"
    user ||--o{ idempotencyKey : "owns"

    user["users"] {
        uuid id PK
        enum role
        enum status
    }
    job["jobs"] {
        uuid id PK
        uuid employerId FK
        bool isFirstOpportunity
        enum wageStatus
        enum status
        enum visibility
    }
    agreement["agreements"] {
        uuid id PK
        uuid jobId FK, UK
        uuid workerId FK
        uuid employerId FK
        bool isFirstOpportunity
        enum status
    }
    opportunityCredit["opportunity_credits"] {
        uuid id PK
        uuid employerId FK
        uuid sourceJobId FK, UK
        enum status
        datetime earnedAt
        datetime expiresAt "nullable"
        datetime redeemedAt "nullable"
        uuid targetJobId FK "nullable"
        datetime revokedAt "nullable"
        uuid revokedBy FK "nullable"
    }
    jobBoost["job_boosts"] {
        uuid id PK
        uuid creditId FK, UK
        uuid jobId FK
        datetime startsAt
        datetime endsAt
        enum status
        datetime revokedAt "nullable"
    }
    report["reports"] {
        uuid id PK
        uuid reporterId FK
        enum reason
        uuid jobId FK "nullable"
        uuid agreementId FK "nullable"
        uuid reportedUserId FK "nullable"
        enum status
        uuid moderatorId FK "nullable"
        text moderatorNote "nullable"
    }
    notification["notifications"] {
        uuid id PK
        uuid recipientId FK
        text type
        text title
        text entityType "nullable"
        uuid entityId "nullable"
        datetime readAt "nullable"
        datetime createdAt
    }
    auditLog["audit_logs"] {
        uuid id PK
        uuid actorId FK "nullable"
        text action
        text entityType
        uuid entityId
        text requestId
        json metadata
        datetime createdAt
    }
    idempotencyKey["idempotency_keys"] {
        uuid id PK
        uuid actorId FK
        text operation
        text key
        text requestHash
        json responsePayload "nullable"
        datetime completedAt "nullable"
        datetime expiresAt
    }
```

Important rules:

- One First Opportunity job issues at most one credit through unique `source_job_id`.
- A redeemed credit targets a visible published job owned by the same employer.
- `job_boosts.credit_id` is unique, and active boosts may not overlap for one job.
- The maximum three active credits is enforced transactionally, not with a profile counter.
- A report references at least one job, agreement, or reported user.
- Active reports block relevant completion without adding a `disputed` lifecycle status.
- Notification and audit entity references are controlled polymorphic values, not foreign keys.
- Idempotency is unique by `(actor_id, operation, key)`.

## 5. Critical Foreign Keys

| Table | Foreign keys |
| --- | --- |
| `worker_profiles` | `user_id -> users.id`, `area_id -> areas.id` |
| `employer_profiles` | `user_id -> users.id`, `area_id -> areas.id` |
| `worker_interests` | `worker_id -> worker_profiles.user_id`, `category_id -> categories.id` |
| `wage_guidelines` | `area_id -> areas.id`, `category_id -> categories.id`, `created_by -> users.id` |
| `jobs` | `employer_id -> employer_profiles.user_id`, `category_id -> categories.id`, `area_id -> areas.id` |
| `job_private_details` | `job_id -> jobs.id` |
| `applications` | `job_id -> jobs.id`, `worker_id -> worker_profiles.user_id` |
| `agreements` | `application_id -> applications.id`, `job_id -> jobs.id`, both parties to `users.id` |
| `work_sessions` | `agreement_id -> agreements.id`, optional verifier to `users.id` |
| `work_proofs` | `agreement_id -> agreements.id`, worker/employer to `users.id`, category to `categories.id` |
| `opportunity_credits` | employer/revoker to `users.id`, source/target to `jobs.id` |
| `job_boosts` | `credit_id -> opportunity_credits.id`, `job_id -> jobs.id` |
| `reports` | reporter/moderator/reported user to `users.id`, optional job/agreement targets |
| `notifications` | `recipient_id -> users.id` |
| `audit_logs` | optional `actor_id -> users.id` |
| `idempotency_keys` | `actor_id -> users.id` |

## 6. Constraints Beyond Cardinality

| Invariant | Database/domain enforcement |
| --- | --- |
| Positive wage | `CHECK (jobs.wage_amount > 0)` |
| Application deadline leaves preparation time | `CHECK (jobs.application_deadline < jobs.starts_at - interval '24 hours')` |
| One application per worker/job | `UNIQUE (job_id, worker_id)` |
| One accepted worker per job | Partial unique index on accepted applications |
| One agreement per application and job | Unique constraints on both foreign keys |
| One session/proof per agreement | Unique agreement foreign keys |
| One credit per source job | Unique source job foreign key |
| One boost per credit | Unique credit foreign key |
| Maximum three active credits | Employer-scoped completion transaction |
| No overlapping job boost | Redemption transaction plus time/status index |
| Report has a target | Check requiring at least one target foreign key |
| Same idempotency key cannot change input | Unique key plus request-hash comparison |
| Critical history is retained | Restricted deletes and revocation/cancellation status |

## 7. Derived Product Models

| Product concept | Derived from |
| --- | --- |
| Rintara Passport | Authorized non-revoked `work_proofs` query |
| Beginner status | Absence of verified Work Proof for worker and category |
| Active credit balance | Owned `earned` credits that have not expired |
| Opportunity Giver badge | At least one non-revoked lifetime credit |
| Active boost | Current time within boost window and status not revoked |
| Public job detail | Safe projection that never joins private address data |

Do not create editable Passport rows, stored beginner flags, mutable credit counters, or badge booleans.

## 8. Transaction Boundaries

- `acceptApplication` accepts one worker, rejects remaining applications, fills the job, and creates one agreement snapshot atomically.
- Expiring an unfilled job rejects its submitted applications and writes
  notifications and audit history atomically.
- The second agreement confirmation activates it and creates one work session atomically.
- One work session has at most one private completion-evidence metadata row.
- Checkout requires that metadata row; the binary object remains in private
  storage and is not part of Passport.
- `verifyCompletion` completes session/agreement/job, creates one Work Proof, and conditionally creates one credit atomically and idempotently.
- `redeemOpportunityCredit` consumes one credit and creates one 24-hour boost atomically and idempotently.

Unique constraints are the final safety boundary; UI button states and preflight reads are not concurrency control.
