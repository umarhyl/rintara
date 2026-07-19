# Contributing to Rintara

This guide defines how contributors change Rintara safely and keep product, code, database, tests, and documentation aligned.

## 1. Before Starting

1. Read `AGENTS.md`.
2. Read the product and technical documents relevant to the task.
3. Confirm the requirement IDs and business rules being changed.
4. Inspect existing code, migrations, tests, scripts, and repository conventions.
5. Check whether an ADR already governs the decision.
6. Identify authorization, privacy, concurrency, schema, UI-state, and test impact.

If the requested behavior conflicts with the PRD or an accepted ADR, do not implement it silently. Start change control or propose a superseding ADR.

## 2. Scope and Issue Definition

Primary workstream owners are:

| Owner | Responsibility |
| --- | --- |
| Umar — Backend Engineer | Database, domain/API, authentication, authorization, backend tests, and deployment operations |
| Zaki — Frontend Engineer | Screens, forms, responsive behavior, client interactions, accessibility, and frontend tests |
| Catur — Product Manager | Scope, requirements, acceptance decisions, product documentation, and demo sign-off |

Testing and golden-path delivery are shared responsibilities. Bring cross-boundary changes to every affected owner before implementation diverges.

A task should state:

- user or operational problem;
- requirement IDs;
- current and desired behavior;
- in-scope and out-of-scope work;
- affected roles and resources;
- security/privacy impact;
- schema, API, UI, and test impact; and
- release-gate impact.

Prefer one complete vertical slice over multiple disconnected partial layers.

## 3. Branches and Commits

- Use short-lived branches from the current integration branch.
- Keep commits focused and reviewable.
- Do not mix feature work with unrelated dependency upgrades or large refactors.
- Preserve unrelated changes in a dirty working tree.
- Never commit secrets, real personal data, database dumps, or generated credentials.

Suggested commit subjects:

```text
feat(jobs): validate first-opportunity wage eligibility
fix(applications): prevent concurrent double acceptance
docs(adr): record authentication approach
test(credits): cover idempotent redemption
```

The repository may adopt a different established convention; do not reformat history during unrelated work.

## 4. Code Changes

- Use strict TypeScript and existing repository patterns.
- Keep React components free of duplicated domain rules.
- Validate all server input.
- Derive identity, role, and ownership from trusted server context.
- Use named domain commands rather than arbitrary status updates.
- Add database constraints for critical invariants.
- Keep network calls outside database transactions.
- Return explicit safe DTOs instead of raw database rows.

Follow `docs/engineering/ARCHITECTURE.md`, `docs/engineering/API.md`, and `docs/engineering/DATABASE.md` for detailed boundaries.

## 5. Database Changes

Every schema change must include:

- a new committed migration;
- explicit foreign-key delete behavior;
- required indexes and constraints;
- rollback or forward-recovery consideration;
- representative fixture/seed updates;
- integration tests; and
- synchronized database and API documentation.

Do not modify an already-applied migration. Do not run destructive commands against an unverified database target.

## 6. Testing Expectations

Run the narrowest relevant test during development, then the repository-required checks before review.

Changes to protected operations require tests for:

- unauthenticated access;
- wrong role;
- correct role but wrong owner or unrelated party;
- inactive account;
- invalid input and state;
- successful authorized path; and
- concurrency or retries when the operation can race.

See `docs/engineering/TESTING.md` for the full strategy.

## 7. Documentation Changes

Update documentation in the same change as behavior.

| Change | Documents to update |
| --- | --- |
| Product scope or priority | PRD, roadmap, and affected specifications |
| Requirement or acceptance criteria | Requirements and test references |
| Domain rule or state | Business rules, database, API, user flow, and UI as applicable |
| Schema/index/transaction | Database, architecture, and API |
| Command/query/error | API and relevant flow/requirements |
| Screen/copy/navigation | User flow and UI/UX design |
| Deployment/security/test process | Relevant engineering or operations guide |
| New technical decision | New ADR and ADR index |

Accepted ADRs are immutable historical records. Supersede them with a new ADR instead of rewriting their decision.

## 8. Pull Request Description

Every pull request should include:

- summary and user impact;
- requirement IDs and related ADRs;
- schema/migration impact;
- security and privacy assessment;
- screenshots for meaningful UI changes;
- tests actually run and results;
- deployment or rollback notes; and
- known limitations or follow-up work.

Do not write “all tests pass” if only a subset was run.

## 9. Review Checklist

- [ ] Scope matches the PRD.
- [ ] Business rules are centralized.
- [ ] Server-side authorization covers role and relationship.
- [ ] Public output excludes private address and sensitive fields.
- [ ] Transactions and idempotency protect multi-write operations.
- [ ] Database constraints back critical invariants.
- [ ] UI includes loading, empty, validation, error, and retry behavior.
- [ ] Accessibility basics are covered.
- [ ] Tests include negative paths and concurrency where relevant.
- [ ] Documentation and ADRs are synchronized.
- [ ] No excluded MVP feature or stale terminology was introduced.

## 10. Feature Freeze

After the freeze defined in `docs/delivery/ROADMAP.md`, accept only release-blocking fixes involving security, privacy, authorization, data integrity, golden-path accessibility, measured performance, documentation consistency, or demo reliability.
