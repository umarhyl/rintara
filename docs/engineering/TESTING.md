# Rintara Testing Strategy

> **Version:** 1.0  
> **Date:** July 18, 2026  
> **Status:** MVP testing baseline

## 1. Objectives

Testing must provide evidence that Rintara's golden path is correct, private data remains private, and critical operations remain consistent under retries and concurrency.

Priority order:

1. authorization and privacy;
2. lifecycle and database integrity;
3. golden-path behavior;
4. error and recovery behavior;
5. accessibility and representative performance;
6. non-critical visual polish.

Passing component tests does not compensate for missing PostgreSQL transaction or end-to-end coverage.

## 2. Test Layers

| Layer | Purpose | Typical scope |
| --- | --- | --- |
| Static checks | Catch type, import, and style defects | TypeScript, lint, build |
| Unit/domain | Verify deterministic policies and transitions | Eligibility, wage status, state guards, error mapping |
| Integration | Verify real PostgreSQL behavior and server contracts | Constraints, transactions, projections, authorization |
| End to end | Verify user-visible journeys in a deployed-like application | Golden path, cross-account denial, moderation |
| Accessibility | Verify keyboard, semantics, labels, focus, and contrast | Core pages and dialogs |
| Performance | Identify measured release blockers | Public landing, discovery, and job detail |

## 3. Test Environments

### Unit

- No network or shared database.
- Deterministic clock and identifiers where applicable.
- Fast enough for local watch mode and every CI run.

### Integration

- Real isolated PostgreSQL matching the supported production major version.
- A unique database/schema per test worker or a serialization strategy that prevents cross-test interference.
- Migrations applied from an empty database before the suite.
- Transaction-sensitive tests must not use SQLite or an in-memory substitute.

### End to end

- Production-like Next.js build where practical.
- Synthetic worker, employer, and admin accounts.
- Isolated database with deterministic seed and reset.
- Authentication test strategy approved for the selected provider.
- No real email, SMS, payment, or personal data.

## 4. Fixture Model

The canonical fixture set should include:

- Employer A and Employer B.
- Worker New with no Work Proof.
- Worker Mixed with Work Proof in category A but none in category B.
- Worker Experienced with proof in the target category.
- Active and suspended accounts.
- Compliant, below-guideline, and unavailable-guideline jobs.
- General and First Opportunity jobs.
- Submitted applications from multiple workers.
- Pending and active agreements.
- Checked-in and checked-out sessions.
- Employer with zero, two, and three active credits.
- Published job with and without an active boost.
- Open and resolved report scenarios.

Use stable lookup labels in tests instead of relying on insertion order.

## 5. Unit and Domain Tests

### First Opportunity

- No verified proof in category: eligible.
- Verified proof in the category: ineligible.
- Verified proof in another category: still eligible.
- Revoked proof in the category: eligible.
- Eligibility changes when proof is issued or revoked.

### Wage Guidelines

- Equal to minimum reference: compliant.
- Above minimum: compliant.
- Below minimum: below.
- No active exact area/category/unit match: unavailable.
- First Opportunity publishing rejects below and unavailable statuses.
- Simulated guidance retains the simulation label.

### State transitions

- Every documented transition succeeds from the correct state.
- Skipped, reversed, or terminal-state transitions fail.
- Report status remains separate from workflow state.
- Agreement activates only after both confirmations.
- Work session is created once at activation.

### Credits and boosts

- Non-First Opportunity completion produces no credit.
- Qualifying completion produces one credit below the cap.
- Cap of three skips issuance without failing completion.
- Badge derives from non-revoked lifetime credit.
- Redeemed, expired, or revoked credit cannot be used.
- Boost duration is exactly 24 hours using server time.

## 6. PostgreSQL Integration Tests

### Constraints

- Duplicate `(job_id, worker_id)` application fails.
- Partial unique index allows only one accepted application per job.
- Agreement is unique by application and job.
- Work session and Work Proof are unique by agreement.
- Opportunity Credit is unique by source job.
- Job Boost is unique by credit.
- Wage amount and guideline values reject invalid ranges.
- Restricted deletes preserve lifecycle evidence.

### Acceptance transaction

Run two concurrent acceptance requests for different applications to one job. Assert:

- one request succeeds;
- one receives a stable conflict;
- one application is accepted;
- all other submitted applications are rejected;
- job is filled;
- one agreement exists; and
- expected notifications/audit rows exist once.

Force a failure after an intermediate write and assert the transaction leaves the original state intact.

### Agreement activation

Confirm each party in both orders and concurrently. Assert one active agreement and one scheduled work session.

### Completion transaction

Run repeated and concurrent verification. Assert:

- one verified session;
- completed agreement and job;
- one Work Proof;
- at most one credit;
- deterministic retry result; and
- no partial state after a forced failure.

Repeat at active credit counts zero, two, and three and with an active report.

### Credit redemption

Run repeated requests with:

- same idempotency key and same input;
- same key and different input;
- different keys racing for one credit;
- two credits targeting one already-boosted job; and
- hidden, filled, expired, or foreign-owned target jobs.

Assert no unintended credit consumption or overlapping boost.

### Projections

Serialize public job cards/details and assert absence of:

- full address and arrival instructions;
- private contact data;
- applicant notes and identities;
- moderator notes;
- check-in code hash; and
- unrestricted internal metadata.

## 7. Authorization Test Matrix

For each private query or command, test applicable rows:

| Actor | Expected result |
| --- | --- |
| Anonymous | Unauthenticated |
| Wrong role | Forbidden |
| Correct role, wrong owner | Forbidden or safe not found |
| Correct role, unrelated party | Forbidden or safe not found |
| Suspended account | Account inactive |
| Authorized owner/party | Success when other preconditions pass |
| Admin | Only explicitly documented moderation access |

At minimum, cover jobs, applicant lists, Passport views, agreements, private addresses, attendance, notifications, reports, credits, and admin actions.

## 8. Required End-to-End Scenarios

### E2E-001 — Golden path

Employer publishes a compliant First Opportunity job; eligible worker applies; employer accepts; both confirm; worker checks in and out; employer verifies; worker sees Work Proof; employer receives and redeems a credit.

### E2E-002 — Cross-employer isolation

Employer B cannot view or mutate Employer A's draft, private address, applicants, agreement, or credits using copied identifiers.

### E2E-003 — Address privacy

Anonymous user, unrelated worker, and unrelated employer cannot obtain the full address through UI, response, page source, metadata, or predictable URL.

### E2E-004 — Category-specific eligibility

Worker with verified category A history can apply to category B First Opportunity but not category A First Opportunity.

### E2E-005 — Report block

Relevant report becomes open, completion is blocked, admin reviews and resolves/rejects it, and the documented next action becomes available.

## 9. Accessibility Verification

Automated tools assist but do not replace manual checks.

For the golden path, verify:

- logical keyboard order;
- visible focus;
- heading hierarchy;
- programmatic form labels and errors;
- dialog labeling, focus trap, escape, and focus return;
- status not conveyed by color alone;
- announcements for meaningful asynchronous changes;
- 200% zoom/reflow and narrow mobile layout;
- touch-target sizing; and
- representative contrast against approved tokens.

## 10. Performance Verification

Measure production builds with representative mobile conditions and seeded volume.

Focus on:

- landing page;
- public discovery;
- public job detail;
- query count and N+1 behavior;
- response size and private-field exclusion;
- image/font weight; and
- layout stability.

The public-page LCP target is at or below 2.5 seconds under the documented test conditions. Record the conditions with any claim.

Use PostgreSQL query plans for critical discovery, applicant, proof, credit, notification, and report queries. Do not publish load claims without a repeatable load-test specification and results.

## 11. Script Contract

The repository exposes these Bun scripts:

```text
test
test:integration
test:e2e
typecheck
lint
build
```

CI must use the repository lockfile and declared runtime version. Concrete package-manager commands belong in the root README after the implementation repository establishes them.

Run unit tests with `bun run test` and PostgreSQL integration tests with `bun run test:integration`. Integration tests require a dedicated disposable `TEST_DATABASE_URL` and `RINTARA_ENV=test`; they skip rather than fall back to a development or production database when that URL is absent.

Pull requests and pushes targeting `dev` or `main` run `.github/workflows/ci.yml`.
The `Quality` job performs a frozen Bun install, lint, typecheck, unit tests,
`bun run db:check`, and a production build. The separate `Integration` job uses
a disposable PostgreSQL 16 service container with synthetic credentials and
does not receive development or production database URLs.

## 12. CI Release Gates

### Pull request

- install from lockfile;
- typecheck;
- lint;
- unit/domain tests;
- build;
- migration validation; and
- targeted integration tests for changed critical modules.

### Release candidate

- full integration suite;
- required E2E suite;
- authorization and privacy suite;
- accessibility checks;
- production build smoke test;
- migration from empty database;
- migration from the previous release schema; and
- deterministic demo rehearsal.

## 13. Coverage Policy

Do not optimize for a single percentage. Require meaningful branch coverage of critical rules and risk-based evidence.

Every bug fix should include a regression test. If a test is technically impossible, document the reason, manual verification, and follow-up risk.

## 14. Flaky Test Policy

- Do not blindly retry a failing test until green.
- Identify whether the failure is product, test, timing, environment, or data isolation.
- Quarantine only with an owner, issue, reason, and expiry date.
- A quarantined critical authorization, transaction, or golden-path test blocks release.
