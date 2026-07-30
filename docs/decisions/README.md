# Rintara Architecture Decision Records

Architecture Decision Records document significant decisions, their context, alternatives, consequences, and review triggers.

## Status Definitions

| Status | Meaning |
| --- | --- |
| Proposed | Under review; not yet authoritative |
| Accepted | Approved and required for relevant implementation |
| Deprecated | Retained for history but discouraged for new work |
| Superseded | Replaced by a newer ADR |
| Rejected | Considered and explicitly not selected |

Accepted ADRs are historical records. Do not rewrite their decision after implementation changes. Create a new ADR and mark the old one superseded.

## Register

| ADR | Status | Decision |
| --- | --- | --- |
| [ADR-001](./ADR-001-nextjs-modular-monolith.md) | Accepted | Use a Next.js modular monolith for the MVP |
| [ADR-002](./ADR-002-postgresql-system-of-record.md) | Accepted | Use managed PostgreSQL as the system of record |
| [ADR-003](./ADR-003-drizzle-and-sql-migrations.md) | Accepted | Use Drizzle with repository-managed SQL migrations |
| [ADR-004](./ADR-004-external-authentication.md) | Accepted | Use mature external authentication; do not build auth primitives |
| [ADR-005](./ADR-005-server-actions-and-route-handlers.md) | Accepted | Use Server Actions internally and Route Handlers only for real HTTP boundaries |
| [ADR-006](./ADR-006-transactional-domain-operations.md) | Accepted | Protect critical lifecycle operations with transactions, constraints, and idempotency |
| [ADR-007](./ADR-007-postgresql-backed-notifications.md) | Accepted | Use PostgreSQL-backed in-app notifications without dedicated realtime infrastructure |
| [ADR-008](./ADR-008-private-location-separation.md) | Accepted | Separate full work addresses from public job data |
| [ADR-009](./ADR-009-out-of-platform-payments.md) | Accepted | Keep payment execution outside Rintara for the MVP |
| [ADR-010](./ADR-010-wage-guideline-source.md) | Proposed | Select and govern the Wage Guideline source |
| [ADR-011](./ADR-011-managed-platform-selection.md) | Accepted | Use Vercel and Supabase Managed PostgreSQL |
| [ADR-012](./ADR-012-authentication-provider-selection.md) | Accepted | Use Supabase Auth |
| [ADR-013](./ADR-013-private-work-completion-evidence.md) | Accepted | Require one private result photo before worker check-out |

## When to Create an ADR

Create an ADR when a decision:

- has long-lived architecture, data, security, or operational consequences;
- changes a technology or provider baseline;
- creates a new source of truth or trust boundary;
- changes transaction, consistency, privacy, or deployment strategy;
- introduces a material dependency or infrastructure service;
- resolves a meaningful disagreement between viable options; or
- supersedes an accepted ADR.

Do not create ADRs for routine implementation details that follow existing documents and patterns.

## Process

1. Copy `ADR_TEMPLATE.md` to the next number and descriptive slug.
2. Set status to Proposed.
3. State the decision, not only the topic.
4. Describe real alternatives and consequences.
5. Link affected product and engineering documents.
6. Obtain explicit approval from the responsible team members.
7. Change status to Accepted or Rejected and record the date.
8. Update implementation and all affected documentation.

## Numbering and Naming

```text
ADR-NNN-short-decision-title.md
```

Numbers are never reused. A superseding ADR receives a new number.
