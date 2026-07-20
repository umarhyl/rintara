# AGENTS.md — Rintara Engineering Guide

This file applies to the entire Rintara repository. It is written for AI coding agents and human contributors. Its purpose is to keep implementation aligned with the product, safe under concurrency, reviewable, and deliverable within the MVP deadline.

## 1. Mission

Build the smallest reliable Rintara MVP that proves this loop:

```text
Employer publishes a fair First Opportunity job
-> eligible worker applies
-> employer accepts exactly one worker
-> both confirm an immutable Mini Agreement
-> worker checks in and checks out
-> employer verifies completion
-> Rintara issues one Work Proof
-> eligible employer receives one Opportunity Credit
-> employer redeems it for a 24-hour job boost
```

If a change does not protect, complete, or materially improve this loop, it is probably not P0.

## 2. Documentation Authority

Read the relevant documents before changing code.

| Document | Read it when changing |
| --- | --- |
| `docs/product/PRD.md` | Product scope, priority, goals, metrics, or release decisions |
| `docs/product/REQUIREMENTS.md` | Acceptance criteria, test coverage, or non-functional behavior |
| `docs/product/BUSINESS_RULES.md` | Eligibility, lifecycle, reward, moderation, and invariants |
| `docs/product/USER_FLOW.md` | Navigation, steps, recovery, and user-visible consequences |
| `docs/design/UI_UX_DESIGN.md` | Layout, copy, components, responsive behavior, and accessibility |
| `docs/engineering/ARCHITECTURE.md` | Module boundaries, deployment, security, caching, and scaling |
| `docs/engineering/DATABASE.md` | Tables, constraints, indexes, transactions, and migrations |
| `docs/engineering/ERD.md` | Entities, relationships, cardinalities, and data-model invariants |
| `docs/engineering/API.md` | Queries, commands, DTOs, validation, errors, and idempotency |
| `docs/delivery/ROADMAP.md` | Sequencing, feature freeze, risks, and release gates |

Precedence:

1. Latest explicit team decision.
2. `docs/product/PRD.md` for product scope and priority.
3. `docs/product/BUSINESS_RULES.md` for domain behavior.
4. `docs/product/REQUIREMENTS.md` for acceptance criteria.
5. Relevant technical specification for implementation details.

Do not silently resolve contradictions. Report the conflict and update all affected documents in the same change. Code is not automatically correct merely because it already exists.

## 3. Locked Product Decisions

- Product name is **Rintara**, not Karivo.
- Roles are `worker`, `employer`, and `admin`.
- Use **Employer**, not Client, in code and documentation.
- One account has one active MVP role.
- Beginner status is calculated per category from non-revoked verified Work Proof.
- A worker never self-declares First Opportunity eligibility.
- Applications contain a short note; there is no wage bidding.
- Job wage and terms are visible before application.
- One job accepts exactly one worker in the MVP.
- Acceptance creates an immutable agreement snapshot.
- Payment method/timing is recorded, but payment happens outside Rintara.
- One agreement has at most one work session and one Work Proof.
- A qualifying First Opportunity completion creates at most one credit.
- An employer can hold at most three active credits.
- One credit gives one owned published job a 24-hour boost.
- Rintara Passport is a read model over Work Proof, not editable user content.
- Full job address is private until one worker is accepted.
- PostgreSQL is the system of record.

## 4. Explicitly Out of Scope

Do not implement, scaffold, prepare hidden database fields for, or describe as MVP:

- bidding, auctions, counteroffers, or wage negotiation;
- payments, escrow, Midtrans, wallets, bank accounts, or transaction fees;
- realtime chat, video calls, SMS, email, or WhatsApp integration;
- Fast Rematch, AI matching, worker scoring, or recommendations;
- direct worker search by employers;
- identity documents, selfies, background checks, or work-evidence uploads;
- continuous GPS, live maps, or geofencing;
- multiple accepted workers per job;
- high-risk or licensed categories;
- native mobile applications;
- microservices or event-streaming infrastructure;
- legal or financial dispute resolution; or
- subscriptions and monetization.

Do not create “future-proof” abstractions for excluded features unless the current MVP genuinely requires the abstraction. Speculative code is scope creep.

## 5. Terminology and Language

- Code identifiers, commits, technical documentation, schemas, and tests use English.
- End-user copy follows `docs/design/UI_UX_DESIGN.md`; default product copy is clear Indonesian unless the team explicitly changes localization strategy.
- Use exact domain names: `FirstOpportunity`, `MiniAgreement`, `WorkSession`, `WorkProof`, `OpportunityCredit`, `JobBoost`, and `WageGuideline`.
- Never use `Client`, `Bid`, `Escrow`, `FastRematch`, or `Karivo` as current-domain names.
- “Verified” is reserved for system-issued Work Proof or an explicitly verified workflow state.
- An Opportunity Credit is not money; never format it as currency or call it a balance that can be withdrawn.

Run a repository search for stale terminology when touching related code or documentation.

## 6. Technology Baseline

- Next.js App Router
- React
- TypeScript with strict checking
- Supabase Managed PostgreSQL through standard PostgreSQL connections
- Drizzle ORM plus explicit parameterized SQL where appropriate
- Repository-approved validation/form libraries
- Supabase Auth through the approved Next.js SSR integration
- Unit/domain tests, PostgreSQL integration tests, and Playwright E2E

Deploy the application on Vercel and use Supabase Managed PostgreSQL and Supabase Auth as accepted in ADR-011 and ADR-012. Business data access uses Drizzle or explicit parameterized PostgreSQL; do not introduce Supabase Data API, Realtime, Storage, or Edge Functions as a second business-state path without an approved architecture decision.

Use the repository's existing package manager and scripts. Do not switch package manager, formatter, test framework, or component system during an unrelated task.

## 7. Architecture Rules

### 7.1 Modular monolith

Keep one Next.js application and one PostgreSQL database. Separate concerns in code:

- presentation: routes, pages, components, forms;
- application/domain: commands, policies, state transitions, transactions;
- queries: authorized read models and DTOs;
- data access: schema, repositories/query helpers, migrations;
- infrastructure: auth integration, observability, rate limiting.

Do not place business rules in React components, middleware alone, or database callbacks that are invisible to application tests.

### 7.2 Dependency direction

- UI may depend on typed application contracts.
- Application/domain may depend on repository interfaces and domain types.
- Data access implements persistence details.
- Domain code must not import React, route modules, or client-only code.
- React components must not import the database client or raw schema.
- Cross-feature access goes through intentional public modules, not deep relative imports.

### 7.3 Server-only boundaries

Mark database, auth, secrets, domain commands, and private queries as server-only using the repository convention.

Never import server-only modules into a Client Component. Never expose environment secrets through `NEXT_PUBLIC_*` variables.

## 8. Next.js Rules

- Use Server Components by default.
- Add `"use client"` only for components that require browser state, effects, or event APIs.
- Keep Client Components small and pass serializable safe props.
- Do not fetch initial page data with `useEffect` when a Server Component can load it.
- Server Actions are transport adapters: parse input, establish context, call a named command, map the result, and revalidate affected views.
- Use Route Handlers only for a true HTTP boundary; do not duplicate Server Action and Route Handler logic.
- Use `loading.tsx`, `error.tsx`, not-found behavior, and suspense intentionally.
- Private pages and queries must opt out of shared public caching.
- Revalidate the narrowest affected paths/tags after mutations.
- Do not depend on middleware or layout redirects as the only authorization control.

## 9. Domain Operation Rules

The frontend must invoke named operations such as:

- `publishJob`
- `submitApplication`
- `withdrawApplication`
- `acceptApplication`
- `confirmAgreement`
- `generateCheckInCode`
- `checkIn`
- `checkOut`
- `verifyCompletion`
- `redeemOpportunityCredit`
- `createReport`
- `resolveReport`

Never expose or call generic operations such as:

- `updateStatus(entity, status)`
- `setVerified(id, true)`
- `setCreditBalance(userId, value)`
- unrestricted `updateJob` after publication

Each command must:

1. parse and normalize input;
2. authenticate;
3. verify active account status;
4. authorize role and resource relationship;
5. validate the current state and domain preconditions;
6. execute required writes transactionally;
7. return a safe typed DTO or typed error;
8. create notifications/audit records when specified; and
9. trigger only necessary cache revalidation.

## 10. Required State Machines

Do not invent new states without updating `docs/product/BUSINESS_RULES.md`, `docs/engineering/DATABASE.md`, `docs/engineering/API.md`, flows, UI, migrations, and tests.

```text
Job:
draft -> published -> filled -> in_progress -> completed
draft -> cancelled
published -> expired | cancelled
filled/in_progress -> cancelled only through authorized workflow
```

```text
Application:
submitted -> accepted | rejected | withdrawn
```

```text
Agreement:
pending_confirmation -> active -> completed
pending_confirmation/active -> cancelled through authorized workflow
```

When the second party confirmation activates an agreement, create exactly one scheduled work session in the same transaction.

```text
Work session:
scheduled -> checked_in -> checked_out -> verified
```

```text
Credit:
earned -> redeemed | expired | revoked
redeemed -> revoked through authorized moderation
```

```text
Report:
open -> reviewing -> resolved | rejected
```

An active report blocks relevant completion; do not add a `disputed` status to unrelated entities as a shortcut.

## 11. Transaction and Concurrency Rules

### 11.1 `acceptApplication`

Must execute in one PostgreSQL transaction:

1. validate employer and ownership;
2. lock/conditionally protect the published job;
3. re-evaluate First Opportunity category eligibility;
4. accept one submitted application;
5. reject remaining submitted applications;
6. transition job to `filled`;
7. create one agreement snapshot;
8. write notifications and audit;
9. commit.

The database partial unique index for one accepted application per job is mandatory. A disabled button is not concurrency control.

### 11.2 `verifyCompletion`

Must be atomic and idempotent:

- require the employer party, checked-out session, active agreement, in-progress job, and no active report;
- transition session, agreement, and job;
- create exactly one Work Proof;
- conditionally create at most one credit;
- write notifications and audit;
- return the existing successful result on a retry.

Completion must still succeed when the employer already has three active credits. Audit the skipped issuance.

### 11.3 `redeemOpportunityCredit`

Must be transactional and idempotent:

- require an idempotency key;
- validate credit and job ownership/status/visibility;
- claim one credit exactly once;
- reject an overlapping active boost without consuming the credit;
- create exactly one 24-hour boost;
- store the safe result and audit it.

### 11.4 General transaction rules

- Keep transactions short.
- Do not call network services while holding locks.
- Use unique/check/FK constraints as the final safety boundary.
- Map expected constraint conflicts to typed domain errors.
- Test rollback by forcing an intermediate write failure.

## 12. PostgreSQL Rules

- Use UUID primary keys.
- Use `timestamptz` and store UTC.
- Use positive `bigint` for rupiah; never floating-point.
- Commit every schema change as a migration.
- Do not run uncontrolled schema push against production.
- Do not edit an already-applied migration; create a new migration.
- Foreign keys must state intentional delete behavior.
- Lifecycle, proof, credit, report, and audit records use status/revocation, not destructive repair.
- Public job queries must not join `job_private_details`.
- Public discovery must require published lifecycle state, visible moderation state, and a future application deadline.
- Passport is queried from `work_proofs`; never create an editable Passport table.
- Do not persist a client-controlled credit counter or employer badge boolean.
- Growing lists require stable pagination and supporting indexes.
- Verify critical queries with PostgreSQL query plans using representative data.

Required uniqueness includes:

- application `(job_id, worker_id)`;
- one accepted application per job;
- agreement by application and job;
- work session by agreement;
- Work Proof by agreement;
- Opportunity Credit by source job;
- job boost by credit; and
- idempotency key by actor, operation, and key.

## 13. Authentication and Authorization

Create central helpers with clear intent, for example:

- `requireUser()`
- `requireActiveUser()`
- `requireRole(role)`
- `requireJobOwner(jobId)`
- `requireAgreementParty(agreementId)`
- `requireAdmin()`

Names may follow repository conventions, but checks must be centralized and testable.

Rules:

- Identity comes from the validated server session.
- Current role and account status come from trusted server data.
- Ignore/reject caller-supplied owner ID, user ID, role, verification state, or credit amount.
- Check both role and relationship; `employer` alone cannot access another employer's job.
- Return safe not-found behavior where existence itself is sensitive.
- Test guessed IDs and cross-account access directly against server operations.

## 14. Privacy and Security

### 14.1 Data minimization

Do not collect or store:

- government identity documents;
- bank accounts or payment cards;
- continuous GPS;
- full birth dates;
- private chat;
- work-evidence photos; or
- secrets in user content.

### 14.2 Full address

- Store it separately from public job data.
- Never include it in public list/detail DTOs, metadata, logs, analytics, notifications, or error messages.
- Return it only to the job owner, accepted worker through the agreement context, and authorized admin.
- Add negative tests for anonymous, unrelated worker, and unrelated employer access.

### 14.3 Check-in code

- Generate with a cryptographically secure source.
- Store only a strong hash, expiry, failed-attempt count, and used timestamp.
- Display plaintext only in the immediate generation result.
- Expire after 15 minutes, allow at most five failed attempts, and invalidate on replacement/use.
- Never log the code or request body containing it.

### 14.4 General web security

- Validate all server input.
- Use parameterized queries.
- Escape user content; raw HTML requires approved sanitization.
- Follow the auth solution's CSRF and cookie guidance.
- Rate-limit sign-in, job creation, applications, check-in attempts, and reports.
- Keep secrets in environment configuration.
- Use safe structured logs with request IDs and no unrestricted payloads.

## 15. API and DTO Rules

- Treat all action and route input as `unknown` until parsed.
- Return explicit DTOs, never raw ORM rows.
- Public DTOs use allowlists and cannot include private fields.
- Use stable application error codes from `docs/engineering/API.md`.
- Do not expose raw database/provider messages.
- List defaults are bounded; maximum page size is 50 unless an approved requirement states otherwise.
- Cursor values are opaque and deterministic.
- Reuse with the same idempotency key and different input must fail.
- Commands return the state needed by the UI but not unrelated internal data.

## 16. UI and Accessibility Rules

- Follow `docs/product/USER_FLOW.md` and `docs/design/UI_UX_DESIGN.md` before inventing a screen.
- Use Server Components by default and limit client JavaScript.
- Body text is at least 16 CSS pixels.
- Touch targets should be at least 44 by 44 CSS pixels.
- Use semantic HTML, visible focus, programmatic labels, and useful validation messages.
- Do not communicate status using color alone.
- Dialogs require accessible labeling, focus management, escape behavior, and focus return.
- Preserve valid input after recoverable failures.
- Prevent accidental duplicate submissions in the UI, while retaining server idempotency.
- Respect `prefers-reduced-motion`.
- Test narrow mobile, representative desktop, keyboard navigation, and zoom.

Every primary screen must cover:

- loading;
- empty;
- validation;
- success;
- recoverable error and retry;
- forbidden/not found;
- unavailable/expired;
- pending/submitting; and
- concurrent server-state change.

## 17. Performance and Scalability Rules

- Do not make unmeasured throughput or uptime claims.
- Keep web instances stateless.
- Use pooled PostgreSQL connections appropriate to the deployment platform.
- Paginate every list that can grow.
- Avoid N+1 queries and unbounded joins.
- Cache anonymous content only with a clear invalidation plan.
- Never cache private user data in a shared public cache.
- Optimize measured bottlenecks before adding infrastructure.
- Do not introduce Redis, queues, read replicas, partitioning, or microservices without evidence and an approved architecture decision.
- Keep network calls outside database transactions.

## 18. Testing Requirements

### 18.1 Unit/domain tests

Cover:

- category-specific First Opportunity eligibility;
- wage compliance;
- allowed and rejected transitions;
- active-credit cap and badge derivation;
- report completion block;
- validation boundaries and error mapping.

### 18.2 PostgreSQL integration tests

Use real PostgreSQL behavior for:

- duplicate applications;
- concurrent acceptance with exactly one winner;
- agreement/work session/proof/credit uniqueness;
- atomic completion and rollback;
- credit cap serialization;
- idempotent and conflicting redemption;
- public projections excluding full address;
- delete restrictions and revocation behavior.

Do not substitute an in-memory database for transaction-sensitive tests.

### 18.3 Authorization tests

For each private operation, test as applicable:

- anonymous user;
- wrong role;
- correct role but wrong owner;
- correct role but unrelated party;
- suspended account;
- authorized owner/party.

### 18.4 End-to-end tests

Required scenarios:

1. Complete golden path through Work Proof and credit boost.
2. Employer B cannot access Employer A's job or applicants.
3. Anonymous and unrelated users cannot obtain a full address.
4. Worker experienced in category A remains eligible in category B.
5. Admin processes a report and the completion block changes correctly.

### 18.5 Test discipline

- Use deterministic clocks where time affects status, expiry, or boost duration.
- Use synthetic data.
- Assert stable outcomes and error codes, not incidental implementation messages.
- A bug fix includes a regression test unless technically impossible; document why if omitted.

## 19. Implementation Workflow for Agents

### Before editing

1. Read this file and the relevant specifications.
2. Inspect existing code, migrations, scripts, and tests; do not assume the repository is empty.
3. Check the working tree and preserve unrelated user changes.
4. State the requirement IDs and business rules affected.
5. Identify authorization, privacy, transaction, migration, UI-state, and test impact.
6. If a product decision is genuinely missing and would change behavior, stop and request direction.

### While editing

1. Make the smallest coherent vertical change.
2. Reuse established repository patterns.
3. Keep domain rules centralized.
4. Add constraints before relying on application checks.
5. Update tests alongside behavior.
6. Update every affected document in the same change.
7. Avoid opportunistic refactors that expand review scope.

### Before finishing

1. Review the diff for stale terminology and accidental scope additions.
2. Run the narrowest relevant tests, then repository-required typecheck/lint/build checks.
3. Run migration and integration checks when schema or transactions changed.
4. Verify negative authorization and public/private projection behavior.
5. Exercise loading, error, and retry states for UI work.
6. Report changed files, behavior, validation performed, and remaining risks.

Do not claim a test passed unless it was actually run. Distinguish “not run” from “not applicable.”

## 20. Documentation Synchronization

Update documentation when code changes these concerns:

| Change | Required documents |
| --- | --- |
| Product scope or priority | `docs/product/PRD.md`, `docs/delivery/ROADMAP.md`, then affected specs |
| Acceptance criteria | `docs/product/REQUIREMENTS.md` and relevant test references |
| Eligibility/invariant/state | `docs/product/BUSINESS_RULES.md`, `docs/engineering/DATABASE.md`, `docs/engineering/API.md`, flows/UI as applicable |
| Schema/entity relationship/index/transaction | `docs/engineering/DATABASE.md`, `docs/engineering/ERD.md`, `docs/engineering/ARCHITECTURE.md`, `docs/engineering/API.md` |
| Query/command/error | `docs/engineering/API.md`, `docs/product/USER_FLOW.md`, affected requirements |
| Route/screen/copy | `docs/product/USER_FLOW.md`, `docs/design/UI_UX_DESIGN.md` |
| Architecture/provider/deployment | `docs/engineering/ARCHITECTURE.md`, README/environment docs |
| Timeline/release gate | `docs/delivery/ROADMAP.md` and PRD change control if scope changes |
| Agent workflow | `AGENTS.md` |

Do not duplicate detailed rules into more documents than necessary. Link to the authoritative file and keep summaries consistent.

## 21. Migration and Seed Safety

- Never run destructive commands against an unverified database target.
- Never assume an environment variable points to development.
- Demo reset must refuse the production environment by default.
- Use synthetic names, addresses, and account data.
- Destructive migrations require explicit approval, backup, and rollout plan.
- Do not erase user data to fix an application state bug.
- Seed scripts must be deterministic and idempotent where practical.

## 22. Git and Change Safety

- Preserve unrelated edits in a dirty working tree.
- Do not use destructive reset or checkout commands unless explicitly requested and the exact target is confirmed.
- Keep commits focused when asked to commit.
- Do not commit secrets, local environment files, generated credentials, database dumps, or real personal data.
- Do not change lockfiles unless dependency changes require it.
- Do not upgrade framework or major dependencies during unrelated feature work.
- Generated migration files are reviewed as source code.

## 23. Feature Freeze Rules

The MVP feature freeze begins at the end of July 27, 2026, as defined in `docs/delivery/ROADMAP.md`.

After freeze, accept only:

- release-blocking defects;
- security, privacy, authorization, or data-integrity fixes;
- golden-path accessibility fixes;
- measured performance blockers;
- documentation/submission consistency; and
- demo reliability work.

Reject new features, new infrastructure, new states, and speculative abstractions after freeze.

## 24. Agent Stop Conditions

Stop and ask for a team decision when:

- two authoritative documents conflict and the correct product behavior is not inferable;
- a request adds an out-of-scope feature or changes a locked product decision;
- a destructive migration or data deletion is required;
- an authentication, database, or hosting provider change is proposed without an approved superseding ADR;
- a legal wage claim or sensitive data collection is proposed;
- a change would weaken authorization, transactionality, privacy, or auditability;
- production credentials or real personal data appear in the workspace; or
- completing the task requires external authority not provided by the request.

Do not stop for routine implementation choices that follow existing patterns and stay inside documented scope.

## 25. Definition of Done for an Agent Task

An implementation task is complete only when:

- [ ] Behavior matches the relevant requirement IDs and business rules.
- [ ] Authentication, role, ownership, and relationship checks are server-side.
- [ ] Required transaction, idempotency, and database constraints are present.
- [ ] Public/private DTOs expose only approved fields.
- [ ] Happy path, invalid input, invalid state, and negative authorization are covered.
- [ ] Concurrency behavior is tested when the operation can race.
- [ ] UI work includes mobile, desktop, accessibility, loading, empty, error, and retry states.
- [ ] Schema changes include migration and representative seed/test updates.
- [ ] Documentation is synchronized.
- [ ] Relevant tests and checks were run and their actual results reported.
- [ ] No stale Karivo, Client, bidding, escrow, chat, payment, Fast Rematch, or unapproved Supabase Data API/Realtime/Storage/Edge Function assumptions were introduced.
- [ ] No secrets, private addresses, codes, or sensitive request bodies were logged or exposed.

## 26. Final Review Question

Before submitting any change, ask:

> Does this make the Rintara golden path more correct, secure, understandable, testable, or releasable without expanding the approved MVP?

If the answer is no, remove the change or start formal change control.
