# Rintara MVP Delivery Roadmap

> **Version:** 3.0  
> **Plan date:** July 18, 2026  
> **Submission target:** July 31, 2026  
> **Scope authority:** `docs/product/PRD.md`

## 1. Delivery Strategy

The schedule prioritizes one reliable end-to-end product loop over feature count. Work is sequenced by dependency and risk:

```text
Identity and schema
-> jobs and applications
-> agreement and attendance
-> completion and proof
-> credit and boost
-> moderation, hardening, and demo
```

No phase is complete because pages exist. Each exit criterion requires authorization, error states, database constraints, and relevant tests.

## 2. Release Principles

- P0 is fixed by `docs/product/PRD.md`; P1 begins only after the release candidate passes.
- Build vertical slices that reach the database and UI rather than isolated mock screens.
- Test high-risk transactions early.
- Deploy before the final days.
- Use synthetic deterministic demo data.
- Stop adding features after feature freeze.
- A newly requested P0 item must remove or reduce another P0 item and receive explicit approval.

## 2.1 Team Ownership

| Owner | Primary responsibility | Shared quality responsibility |
| --- | --- | --- |
| Umar — Backend Engineer | PostgreSQL/Drizzle, migrations, domain commands, API contracts, Supabase Auth integration, authorization, backend tests, Vercel/Supabase operations | Security, data integrity, integration support, deployment and demo reliability |
| Zaki — Frontend Engineer | App Router screens, forms, responsive UI, client interactions, loading/error/retry states | Accessibility, UI tests, public/private rendering checks, demo interface |
| Catur — Project Manager | Scope, requirements, terminology, acceptance decisions, pilot/Wage Guideline coordination | Acceptance testing, documentation consistency, demo script and release sign-off |

Testing is shared: Umar owns domain, PostgreSQL integration, concurrency, and server authorization coverage; Zaki owns component, browser, responsive, and accessibility coverage; Catur owns acceptance scenarios and release evidence. Each owner reviews cross-boundary changes that affect their responsibility.

## 3. Milestone Plan

### Milestone 0 — Documentation and decision lock

**Date:** July 18

**Status:** Completed on July 19, 2026 for repository-controlled documentation and decision lock.

Deliverables:

- English documentation package aligned to Rintara;
- approved terminology, P0 boundaries, and out-of-scope list;
- explicit owners for auth, database, product flow, UI, test, and demo decisions;
- pilot location and Wage Guideline data decision tracked;
- Vercel, Supabase Managed PostgreSQL, and Supabase Auth recorded in accepted ADR-011 and ADR-012.

Exit criteria:

- No active document describes Karivo, bidding, escrow, payments, chat, Supabase-specific realtime behavior, or Fast Rematch as MVP scope.
- Team can explain the golden path and category-specific eligibility.

### Milestone 1 — Foundation

**Dates:** July 18–20

**Status:** Completed on July 21, 2026 for milestone-2-ready foundation. Full P0 golden-path acceptance remains tracked by Milestones 2-5.

Deliverables:

- Next.js project baseline and strict TypeScript configuration;
- authentication integration and role onboarding;
- PostgreSQL schema, migrations, and isolated seed command;
- server auth/authorization helpers;
- core domain types, state-transition policies, and validation schemas;
- base layout, tokens, navigation, and shared form/status components;
- CI checks for lint, typecheck, tests, and build.

High-risk tests started here:

- wrong-role and cross-account authorization;
- duplicate application constraint;
- public job projection excludes private address.

Exit criteria:

- Worker and employer can sign in and reach role-specific dashboards.
- Migrations run from an empty database.
- A Vercel review deployment is reachable when required for acceptance; non-`main` branches do not deploy automatically.
- No secret or synthetic full address leaks into public output.

Foundation evidence:

- CI runs lint, typecheck, unit tests, migration check, production build, and PostgreSQL integration tests.
- Manual release smoke testing covers the browser walkthrough; it is not a Milestone 1 CI requirement.

### Milestone 2 — Job marketplace vertical slice

**Dates:** July 21–23

**Status:** Completed on July 24, 2026 for the repository-controlled marketplace
vertical slice. Transactional acceptance and agreement remain tracked by
Milestone 3.

Deliverables:

- worker and employer profiles;
- admin-managed pilot areas, categories, and Wage Guidelines;
- job draft, review, publish, and cancel;
- public discovery, filters, pagination, and detail;
- application submit, withdraw, worker application list, and employer applicant
  list;
- authorized applicant Passport view;
- named query and command contracts from `docs/engineering/API.md`.

Exit criteria:

- Employer publishes compliant general and First Opportunity jobs.
- Public users cannot access a full address.
- Worker eligibility is evaluated per category.
- Duplicate, late, ineligible, and cross-role applications are rejected safely.

Milestone 2 evidence:

- PostgreSQL integration tests cover worker/employer profiles, admin
  configuration, compliant general and First Opportunity publishing,
  application rules, applicant Passport access, and public-address redaction.
- Public jobs, employer jobs, worker applications, applicant lists, Passport
  history, and admin configuration use bounded deterministic cursors.
- Unit tests, PostgreSQL integration tests, typecheck, lint, schema check, and
  production build pass for the completed repository state.

### Milestone 3 — Acceptance and agreement

**Date:** July 24

**Status:** In progress as of July 25, 2026.

The core acceptance and agreement slice is implemented across backend, App
Router UI, authorization, and presentation integration. Selection-cutoff
enforcement and final acceptance evidence remain open.

Deliverables:

- transactional `acceptApplication`;
- selection-cutoff-aware acceptance using server time;
- partial unique accepted-application constraint;
- rejection of remaining applications;
- immutable agreement snapshot;
- two-party confirmation and authorized agreement view;
- notifications and audit entries for the slice.

Exit criteria:

- Passing `applicationDeadline` blocks new submissions but not selection of
  existing submitted applications.
- Acceptance at or after `startsAt - 24 hours` returns
  `JOB_NOT_AVAILABLE` without writes.
- Concurrent acceptance test produces exactly one winner.
- Forced failure rolls back job, applications, agreement, notification, and audit writes.
- Both parties can confirm in either order.
- Full address is visible only to the parties after acceptance.

Milestone 3 evidence:

- PostgreSQL integration tests cover concurrent acceptance, forced rollback,
  both confirmation orders, repeated and concurrent confirmation, and exactly
  one scheduled work session.
- Authorized agreement reads return the immutable accepted snapshot only to
  either party or admin; unrelated and inactive accounts are rejected safely.
- Public projections, agreement notifications, and audit metadata exclude the
  private address.
- Agreement activation, notifications, and audit writes share one transaction.
- Employer applicant review calls `acceptApplication`, requires explicit
  confirmation, blocks duplicate submit while pending, and routes to the
  pending Mini Agreement on success.
- Worker and employer agreement pages call `getAgreement`, render immutable
  accepted terms including the authorized full address, show both party
  confirmation states, and call `confirmAgreement` for the allowed party action.
- Worker applications and role-specific notification feeds include authorized
  entry points to Mini Agreement destinations.
- `bun typecheck`, `bun lint`, `bun test`, and production `bun run build` passed
  for the previously implemented core state; required checks must run again
  after selection-cutoff enforcement is implemented.

Remaining closure:

- enforce publish spacing with validation and a database constraint, then use
  the derived selection cutoff in `acceptApplication` and unfilled-job expiry;
- cover submission after `applicationDeadline` plus acceptance before, exactly
  at, and after the selection cutoff in PostgreSQL;
- update deterministic seed and test fixtures for the 24-hour spacing rule;
- capture Catur's two-party acceptance evidence and product sign-off.

### Milestone 4 — Attendance, completion, and Passport

**Dates:** July 25–26

**Status:** Implementation completed on July 25, 2026.

The attendance and completion slice is complete across named server operations,
authorized work-session UI, Work Proof issuance, Passport read-model update,
and active-report completion blocking. PostgreSQL integration coverage is in
`tests/integration/work-attendance.test.ts`; run it with the local test
database available.

Deliverables:

- check-in code generation, hashing, expiry, attempt limit, and replacement;
- worker check-in and check-out;
- atomic/idempotent `verifyCompletion`;
- unique Work Proof issuance;
- conditional Opportunity Credit issuance with source-job uniqueness and active
  cap;
- worker Passport update;
- active-report completion block.

Exit criteria:

- Invalid, expired, reused, and cross-agreement codes fail safely.
- Repeated completion calls produce one proof.
- Worker becomes experienced only in the completed category.
- Golden path works through Passport on preview deployment.

Milestone 4 evidence:

- `generateCheckInCode` stores only an scrypt hash, expiry, failed-attempt
  count, and used timestamp; plaintext is returned only in the immediate
  generation result.
- `checkIn` validates worker party, active agreement, code expiry, failed
  attempts, reuse state, and atomically transitions session and job.
- `checkOut` records one worker completion note and moves the session to
  `checked_out`.
- `verifyCompletion` requires the employer party, checked-out session, active
  agreement, in-progress job, and no active report; it completes session,
  agreement, and job while issuing exactly one Work Proof and conditionally
  issuing one Opportunity Credit.
- Worker and employer work pages call `getWorkView` and render only allowed
  actions for the current session state.
- `bun typecheck`, `bun lint`, unit tests, and production `bun run build`
  passed for the completed Milestone 4 implementation state.

### Milestone 5 — Opportunity Credit, boost, and minimum moderation

**Date:** July 27

**Status:** Implementation completed on July 25, 2026. Local validation must be
run with the PostgreSQL test database available.

The reward and moderation slice is complete across employer credit redemption,
24-hour job boosts, public boosted ordering, report submission, admin report
processing, and moderated Work Proof/Credit/Boost revocation behavior.
PostgreSQL integration coverage is in
`tests/integration/opportunity-credit-moderation.test.ts`; run it with the
local test database available.

Deliverables:

- credit redemption and earned-credit lifecycle hardening;
- derived Opportunity Giver badge;
- idempotent credit redemption and 24-hour boost;
- boosted discovery ordering;
- user report submission;
- admin report queue and required moderation actions;
- proof/credit/boost revocation behavior.

Exit criteria:

- One qualifying job produces at most one credit.
- Completion succeeds when credit cap is reached.
- Failed or conflicting boost does not consume credit.
- Active report blocks completion and resolved/rejected report releases the block as appropriate.
- Full P0 golden path passes end to end.

Milestone 5 evidence:

- `redeemOpportunityCredit` is employer-only, idempotent by actor/operation/key,
  validates credit ownership and target job state, rejects active boost
  conflicts before consuming a credit, and creates one 24-hour boost atomically.
- Employer Opportunity Credits renders active credit count, derived Opportunity
  Giver state, redeemable credits, and eligible published jobs from authorized
  server queries.
- Public job discovery orders active boosts before normal published ordering.
- `createReport`, `adminStartReportReview`, and `adminResolveReport` validate
  relationships and admin role server-side, audit state changes, and revalidate
  affected surfaces.
- Admin moderation pages are data-backed and expose explicit actions for
  hide/cancel job, suspend user, revoke Work Proof, revoke Credit, and
  deactivate Boost. Revoking a redeemed credit deactivates its active boost in
  the same moderated workflow.

## 4. Feature Freeze

**Feature freeze begins at the end of July 27.**

Allowed after freeze:

- release-blocking bugs;
- security, privacy, authorization, and data-integrity fixes;
- accessibility defects in the golden path;
- performance fixes supported by measurement;
- documentation and copy consistency;
- demo reliability improvements.

Not allowed after freeze:

- P1 features;
- redesigned navigation without a release blocker;
- new roles, statuses, categories, or reward types;
- payment, bidding, chat, matching, portfolio upload, or location features;
- infrastructure migration without a critical blocker.

## 5. Hardening and Release

### July 28 — Security and integrity

- Complete authorization matrix tests.
- Review every public/private DTO.
- Run transaction rollback and concurrency tests.
- Review rate limits and secret handling.
- Inspect migrations, foreign keys, deletes, and production connection limits.
- Confirm logs contain no sensitive fields.

### July 29 — UX, accessibility, and performance

- Test representative mobile and desktop layouts.
- Keyboard-test every golden-path action and dialog.
- Verify labels, errors, focus, contrast, and non-color statuses.
- Measure public core pages and fix major layout shifts or oversized assets.
- Validate loading, empty, error, retry, unavailable, and concurrent-refresh states.

### July 30 — Release candidate and rehearsal

- Deploy release candidate.
- Run production smoke tests with synthetic demo accounts.
- Verify database backup and rollback procedures.
- Run deterministic seed/reset in the correct non-sensitive environment.
- Rehearse four-to-five-minute live demo with two sessions.
- Prepare screenshots, architecture explanation, README, proposal references, and backup recording.
- Fix only release blockers after the candidate is tagged.

### July 31 — Submission

- Run final smoke and security checks.
- Confirm public URL, account access, demo data, and backup material.
- Verify repository and submission use Rintara naming and current scope.
- Submit before the administrative deadline buffer.
- Do not introduce new features.

## 6. Release Gates

### Gate A — Build and schema

- [ ] Clean install and production build succeed.
- [ ] Migration from empty database succeeds.
- [ ] Seed runs only against an approved environment.
- [ ] Typecheck, lint, and automated test commands pass.

### Gate B — Product flow

- [ ] Employer can publish a compliant First Opportunity job.
- [ ] Eligible worker can apply.
- [ ] Exactly one worker can be accepted.
- [ ] Agreement, check-in, check-out, and completion work.
- [ ] Passport receives one proof.
- [ ] Employer receives and redeems one credit.

### Gate C — Security and privacy

- [ ] Anonymous and wrong-role access is rejected.
- [ ] Cross-employer resource access is rejected.
- [ ] Full address is absent from public HTML, metadata, responses, and logs.
- [ ] No secrets, codes, or unrestricted request bodies are logged.
- [ ] Suspended accounts cannot mutate resources.

### Gate D — Consistency and concurrency

- [ ] Duplicate application is blocked.
- [ ] Concurrent acceptance has one winner.
- [ ] Repeated completion creates one proof and at most one credit.
- [ ] Repeated redemption does not consume another credit.
- [ ] Forced transaction failure leaves no partial state.

### Gate E — Experience and demo

- [ ] Core mobile and desktop flows are usable.
- [ ] Required accessibility checks pass.
- [ ] Error and recovery states are implemented.
- [ ] Live demo completes within five minutes.
- [ ] Reset and backup recording are ready.

The MVP is releasable only when all five gates pass or an explicit documented waiver is approved for a non-critical item.

## 7. Risk Register

| Risk | Early signal | Response |
| --- | --- | --- |
| Authentication integration slips | Private routes still mocked after July 20 | Reduce UI polish, lock provider, implement shared auth helpers first |
| Schema churn blocks vertical slices | Multiple unreviewed migration rewrites | Freeze core entities and require schema impact review |
| Acceptance race remains untested | Only button-disable protection exists | Prioritize real PostgreSQL concurrency test |
| UI and domain states diverge | Components patch status strings | Replace with named commands and server-returned allowed actions |
| Wage source is unresolved | First Opportunity seed has unsupported values | Use clearly labeled simulation data and disclose it |
| Deployment fails late | Local-only golden path after July 27 | Deploy every milestone and run preview smoke tests |
| Scope expands | Chat/payment/matching tasks enter active board | Remove them immediately or initiate PRD change control |
| Demo relies on manual database repair | Flow cannot reset predictably | Build an isolated deterministic reset before rehearsal |

## 8. Workstream Coordination

Each task should identify:

- owner from the team ownership table;
- requirement IDs;
- affected business rules;
- schema/API/UI impact;
- test responsibility;
- dependency and reviewer; and
- release-gate impact.

Parallel work is safe only across clear module boundaries. Schema and domain-contract changes are merged before dependent UI code or are coordinated in the same change.

## 9. Post-MVP Roadmap

Only after production feedback and P0 stability:

### Phase 1 — Trust and retention

- two-sided reviews;
- bookmarks and reminders;
- shareable Passport privacy controls;
- richer credit history;
- data-saver and PWA support.

### Phase 2 — Operational maturity

- measured notification job processing;
- deeper moderation tooling;
- analytics based on consent and data minimization;
- documented retention and support operations;
- load testing based on observed usage patterns.

### Phase 3 — Evaluated expansion

Potential new categories, multi-worker staffing, verified organizations, payment support, matching, or native applications require new research, risk analysis, architecture decisions, and a revised PRD. They are not automatic extensions of the MVP.

## 10. Roadmap Change Rule

A roadmap change must identify the user value, deadline impact, dependencies, removed or delayed work, new risks, and approver. Changing a date without changing scope or capacity is not a valid mitigation.
