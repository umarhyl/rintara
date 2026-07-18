# ADR-006: Protect Critical Domain Operations Transactionally

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** `docs/product/BUSINESS_RULES.md`, `docs/engineering/DATABASE.md`, `docs/engineering/API.md`

## Context

Rintara's differentiating workflow changes several related records in one user action. Concurrent or retried requests could otherwise accept two workers, issue duplicate proof/credits, consume a credit twice, or leave partial state.

Client-side button disabling and application pre-checks cannot protect database integrity.

## Decision Drivers

- Exactly one accepted worker per job.
- Exactly one Work Proof per agreement.
- At most one Opportunity Credit per source job.
- Safe retry after network timeout.
- No partial lifecycle, notification, or audit state.
- Clear conflict behavior under concurrency.

## Options Considered

### PostgreSQL transactions, constraints, and idempotency

Execute each critical command in one short transaction with row protection or conditional writes and final unique/check constraints.

### Application checks only

Simpler initially but vulnerable to races between read and write.

### Asynchronous eventual-consistency workflow

Could improve decoupling but adds queue/outbox, compensation, and delayed-result complexity unsupported by MVP needs.

## Decision

The following are transactional domain operations:

- `acceptApplication`;
- agreement activation when the second party confirms;
- successful check-in state change;
- `verifyCompletion`; and
- `redeemOpportunityCredit`.

Use PostgreSQL constraints as the final invariant boundary. Completion and redemption are idempotent; redemption uses an explicit idempotency key. Transactions remain short and contain no external network calls.

## Rationale

The operations are naturally relational and must present one committed outcome. PostgreSQL provides the simplest reliable consistency mechanism within the modular monolith.

## Consequences

### Positive

- Correct state under concurrent requests.
- Safe retries and clear conflict errors.
- Notifications/audit align with committed business state.

### Negative and trade-offs

- Commands require careful lock ordering and integration tests.
- Long transactions can reduce throughput if implemented poorly.
- External side effects require later outbox/job design if introduced.

### Follow-up

- Add real PostgreSQL concurrency and rollback tests.
- Document lock/conditional-update patterns in code.
- Monitor slow transactions and deadlocks.

## Security, Privacy, and Data Impact

Authorization and eligibility are revalidated inside the protected operation. Request input cannot set verification, credit, or owner fields.

## Operational Impact

Database pool and statement timeouts must support short transactions. Do not automatically retry unknown non-idempotent failures without a defined contract.

## Validation

- Two acceptance requests produce one winner.
- Repeated completion produces one proof and at most one credit.
- Repeated redemption consumes one credit.
- Forced intermediate failure rolls back all writes.

## Review Triggers

- Critical side effects move outside PostgreSQL.
- A service boundary separates records participating in one transaction.
- Measured contention requires a different serialization strategy.
