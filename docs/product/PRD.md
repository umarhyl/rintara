# Rintara Product Requirements Document

> **Version:** 3.1
> **Date:** July 27, 2026
> **Status:** MVP implementation baseline  
> **Product:** Informal Job Portal and Local Service Network  
> **Primary stack:** Next.js App Router, TypeScript, PostgreSQL  
> **Tagline:** Skills deserve an opportunity.

## 1. Purpose and Authority

This document defines Rintara's product direction, MVP scope, target users, success criteria, and release boundaries. Detailed specifications are intentionally separated into the documents below.

| Document | Authority |
| --- | --- |
| `docs/product/PRD.md` | Product goals, scope, priorities, and release decisions |
| `docs/product/REQUIREMENTS.md` | Testable functional and non-functional requirements |
| `docs/product/BUSINESS_RULES.md` | Domain definitions, invariants, eligibility, and state transitions |
| `docs/product/USER_FLOW.md` | Complete user journeys and recovery paths |
| `docs/design/UI_UX_DESIGN.md` | Information architecture, screen behavior, accessibility, and content rules |
| `docs/engineering/ARCHITECTURE.md` | System boundaries, deployment, security, and scaling strategy |
| `docs/engineering/DATABASE.md` | PostgreSQL schema, constraints, indexes, and transaction design |
| `docs/engineering/ERD.md` | Canonical entities, relationships, cardinalities, and data-model invariants |
| `docs/engineering/API.md` | Server-side application contracts, authorization, inputs, and errors |
| `docs/delivery/ROADMAP.md` | Delivery order, release gates, and post-MVP sequencing |
| `AGENTS.md` | Repository instructions for AI coding agents and contributors |

Precedence when documents conflict:

1. The latest explicit team decision.
2. `docs/product/PRD.md` for product scope and priorities.
3. `docs/product/BUSINESS_RULES.md` for domain behavior.
4. `docs/product/REQUIREMENTS.md` for acceptance criteria.
5. The relevant technical document for implementation details.

A conflict is a documentation defect. Do not silently choose one interpretation; update every affected document in the same change.

## 2. Executive Summary

Rintara is a local job platform for informal workers, with special emphasis on people who do not yet have verified experience in a job category. It turns a first opportunity into portable, verifiable work history.

Rintara addresses the experience paradox:

> Workers need experience to be trusted, but need trust to receive their first experience.

The MVP proves one connected product loop:

1. An employer publishes a transparent, fairly paid job.
2. An eligible worker applies without bidding on the wage.
3. The employer accepts exactly one worker.
4. Rintara creates an immutable Mini Agreement.
5. Attendance, one private result photo, and completion are confirmed.
6. Rintara issues one verified Work Proof to the worker's Rintara Passport.
7. For a valid First Opportunity job, the employer earns one Opportunity Credit.
8. For cash jobs, the parties record external payment receipt confirmation.
9. The employer can redeem the credit for a 24-hour job boost.

Payments happen outside Rintara in the MVP. Rintara records the agreed wage,
payment method, and payment timing, but does not hold, move, or guarantee
funds. For completed cash jobs, it may additionally record the Employer's
statement that cash was given and the Worker's receipt response. An unanswered
receipt request is recorded as automatically confirmed after 48 hours.

## 3. Problem Statement

### 3.1 Worker problems

- Entry-level work often requires prior experience.
- Informal work history is difficult to prove.
- Tasks, schedules, and wages are frequently unclear until late in the process.
- Rating-led marketplaces favor workers who already have transaction history.
- Users with limited digital literacy or connectivity need a short, lightweight flow.

### 3.2 Employer problems

- A worker without history is difficult to assess.
- Formal recruitment is excessive for short, local jobs.
- Informal agreements can change or become disputed because terms are scattered across private messages.
- Employers receive no direct product benefit for taking a fair chance on a new worker.

### 3.3 Product opportunity

Rintara replaces the negative loop:

```text
No verified experience -> rarely selected -> no work -> still no verified experience
```

with:

```text
First Opportunity -> clear agreement -> verified completion -> Work Proof -> stronger next application
```

## 4. Vision and Value Proposition

### Vision

Make a first work experience easier to obtain, safer to perform, and more valuable for a worker's future.

### Worker value proposition

Receive a fair chance without existing proof, work under clear terms, and carry verified evidence into the next opportunity.

### Employer value proposition

Hire local workers through a structured process and receive a useful incentive for providing a fair first opportunity.

### Unique selling proposition

Rintara converts a first job into verified reputation while rewarding employers who create fair access.

The differentiation is the complete loop—not an isolated badge:

```text
First Opportunity -> Mini Agreement -> verified work -> Rintara Passport -> Opportunity Credit
```

## 5. Target Users

### Worker

Primary segments include first-time job seekers, students and recent graduates, informal workers whose experience is undocumented, career switchers entering a new category, and people seeking short-term local work.

Core needs:

- nearby jobs with clear terms;
- a short application process;
- no requirement for verified experience on eligible jobs;
- visible wage, duties, and schedule before applying;
- credible proof after successful completion;
- a reporting path when something goes wrong.

### Employer

Primary segments include micro and small businesses, shops, cafés, workshops, local event organizers, households, and community groups that need short-term help.

Core needs:

- publish a clear job quickly;
- review relevant worker history;
- document the accepted terms;
- confirm attendance and completion;
- receive a meaningful benefit for creating a first opportunity.

### Administrator

Administrators maintain wage guidelines, moderate jobs and accounts, process reports, revoke fraudulent rewards, and review audit history. Rintara administrators do not provide legal dispute resolution or guarantee work quality.

## 6. Product Principles

1. **Evidence over claims.** Self-declared skills are labeled as such; only system-issued Work Proof is verified.
2. **Beginner status is category-specific.** Experience in one category does not disqualify a worker from a First Opportunity in another.
3. **Wage before application.** “Contact us for wage” is not allowed.
4. **No unpaid trials.** A First Opportunity is not permission to reduce wages unfairly or request free work.
5. **Private details stay private.** Public pages show only a general area, never the full work address.
6. **Rewards follow verified outcomes.** Credits are not issued for posting, accepting, or checking in.
7. **The server owns state.** Clients invoke domain operations and cannot patch lifecycle statuses directly.
8. **Collect less data.** The MVP does not store identity documents, bank accounts, continuous GPS, or private chat.
9. **One screen, one primary action.** Language and navigation must remain understandable to non-technical users.

## 7. MVP Goals

The MVP must:

- complete the golden path from job creation to credit redemption;
- compute First Opportunity eligibility from verified Work Proof, not self-declaration;
- present tasks, wage, schedule, area, and payment terms before application;
- protect private addresses and cross-account resources;
- prevent duplicate acceptance, proof issuance, and credit issuance under concurrency;
- provide minimum reporting, moderation, notifications, and auditability;
- work reliably on representative mobile and desktop browsers;
- be deployable and demonstrable with deterministic seed data.

## 8. MVP Scope

### 8.1 P0 — required for release

| Capability | Outcome |
| --- | --- |
| Authentication and role onboarding | One active role: `worker`, `employer`, or `admin` |
| Worker and employer profiles | Appropriate public and private information for each role |
| Job creation and publishing | Transparent terms, wage validation, private address separation |
| Wage Guidelines | Category-, area-, and unit-specific reference values |
| Job discovery | Public listing, details, filters, pagination, and active boost ranking |
| Applications | One concise application per worker per job; no wage bidding |
| Worker acceptance | Exactly one accepted worker and one agreement per job |
| Mini Agreement | Immutable snapshot confirmed independently by both parties |
| Attendance and result evidence | Short-lived check-in code, one private result photo, and worker check-out |
| Verified completion | Atomic completion, Work Proof issuance, and optional credit issuance |
| Cash payment confirmation | Post-completion external-payment statements with a 48-hour response window |
| Rintara Passport | Read model derived from verified Work Proof records |
| Opportunity Credit and boost | Maximum three active credits; one credit gives one job a 24-hour boost |
| Reports and moderation | Minimum report queue and audited admin actions |
| In-app notifications | PostgreSQL-backed notifications using revalidation or light polling |
| Audit log | Trace critical lifecycle, reward, and moderation operations |

Detailed acceptance criteria are in `docs/product/REQUIREMENTS.md`.

### 8.2 P1 — only after P0 is stable

- Two-sided reviews, limited to one review per party per agreement.
- Job bookmarks.
- Scheduled reminders.
- Data-saver mode and PWA install support.
- Shareable Passport with explicit visibility controls.
- Profile images through controlled object storage.
- Expanded credit history and analytics.

### 8.3 Explicitly out of scope

- Bidding, auctions, or wage negotiation.
- Payment processing, escrow, Midtrans, wallets, platform balances, or transaction fees.
- Real-time chat, video calls, email, SMS, or WhatsApp integration.
- Fast Rematch, automatic matching, AI scoring, or recommendations.
- Direct worker search by employers.
- Identity-document storage or background checks.
- Continuous GPS tracking or interactive maps.
- More than one accepted worker per job.
- High-risk or licensed job categories.
- Native mobile applications, microservices, and event-streaming infrastructure.
- Legal or financial dispute mediation.

## 9. Pilot Boundaries

- One pilot city or regency.
- Five low-risk categories:
  - shop helper;
  - light packing and warehouse helper;
  - event helper;
  - light cleaning;
  - simple administration and data entry.
- One job has one accepted worker.
- One agreement has one work session.
- Payment is completed outside the platform.
- A worker's full Passport is visible only to the worker and to an employer reviewing that worker's application for the employer's own job.

Electrical work, working at height, heavy machinery, medical work, unverified childcare, hazardous materials, and licensed services cannot be marked as First Opportunity jobs.

## 10. Core Product Decisions

| Topic | MVP decision |
| --- | --- |
| Product name | Rintara |
| Employer terminology | Use “Employer,” never “Client” in domain code or product copy |
| Beginner status | Calculated per category from non-revoked verified Work Proof |
| Wage interaction | Fixed and visible; applications do not change it |
| Payment | Executed outside Rintara; terms and bounded cash receipt confirmation are recorded |
| Job capacity | One accepted worker per job |
| Hiring cutoffs | `applicationDeadline` closes new applications; employer selection closes 24 hours before `startsAt` |
| First Opportunity badge | Derived after the employer earns the first non-revoked credit |
| Credit issuance | At most one per qualifying completed job |
| Credit balance | At most three active credits per employer |
| Credit use | One published job receives a 24-hour boost |
| Passport | A read model over Work Proof, not a separately editable profile section |
| Realtime | Not required; database notifications plus revalidation/polling are sufficient |
| Completion evidence | One private result photo is required after check-in and before check-out; it is excluded from Passport |

## 11. Success Measures

### North-star metric

**Number of verified First Opportunity completions.**

### Supporting product metrics

- First Opportunity fill rate.
- Median time to a worker's first Work Proof.
- Job completion and report rates.
- Percentage of published jobs that meet wage guidance.
- Employer repeat participation.
- Percentage of workers who receive a later job after their first Work Proof.
- Opportunity Credit redemption rate.

### MVP quality gates

- The golden path passes on the release candidate.
- No known critical authorization defect remains open.
- No full address or private contact detail appears in public output.
- Required P0 behavior works on the production deployment.
- Acceptance, completion, and credit redemption concurrency tests pass.

Account counts, page views, and job posts without completion are not sufficient impact claims.

## 12. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Scope expands before the deadline | Reject out-of-scope features and trade any new P0 item against an existing one |
| Two workers are accepted concurrently | Transaction, conditional update or row lock, and partial unique index |
| Private address leaks | Separate private record/projection and test anonymous output |
| Wage guidance is misleading | Show source, effective date, and simulated status; do not present internal values as law |
| Rewards are abused | Outcome-only issuance, source-job uniqueness, balance cap, audit trail, and admin revocation |
| Auth is enforced only in UI | Server-side session, role, ownership, and relationship checks with negative tests |
| Demo deployment fails | Deploy early, use deterministic seeds, rehearse reset, and prepare a backup recording |

## 13. Decisions and Open Items

Resolved provider decisions:

| Decision | Approved choice |
| --- | --- |
| Application hosting | Vercel, with `main` as the production branch |
| Managed PostgreSQL | Supabase Managed PostgreSQL through standard PostgreSQL connections |
| Authentication | Supabase Auth with server-validated cookie-based SSR |

The detailed constraints and remaining production-readiness checks are in [ADR-011](../decisions/ADR-011-managed-platform-selection.md) and [ADR-012](../decisions/ADR-012-authentication-provider-selection.md).

These product/data decisions remain open and require explicit team approval:

| Decision | Temporary default |
| --- | --- |
| Pilot location | One city or regency represented by seeded data |
| Wage data source | Validated source or clearly labeled simulation data |
| Cancellation wording | Simple policy stored in the agreement snapshot |
| Credit expiration | No expiration for the competition demo; production policy remains open |

## 14. MVP Definition of Done

- [x] Public production URL is accessible.
- [x] Registration, sign-in, sign-out, role onboarding, and account-status checks work.
- [x] Employer can publish a transparent job and worker can discover and apply to it.
- [x] Employer can accept exactly one worker under concurrent requests.
- [x] Both parties can confirm the Mini Agreement.
- [x] Check-in, check-out, and completion verification work.
- [x] Completion creates exactly one Work Proof.
- [x] Passport eligibility changes independently per category.
- [x] A qualifying completion issues at most one credit and a credit creates one 24-hour boost.
- [x] Reports and minimum admin moderation work.
- [x] Private addresses and cross-account resources are protected.
- [ ] Required unit, integration, and authorization tests pass, and the release smoke checklist is rehearsed.
- [ ] Mobile and desktop flows include loading, empty, validation, error, success, and retry states.
- [x] Demo seed and reset procedures cannot affect real production data.
- [x] Repository documentation, proposal, interface, and code use Rintara terminology and the same MVP scope.

## 15. Change Control

Every proposed P0 change must state:

1. the user problem being solved;
2. impact on the deadline and golden path;
3. affected schema, API, UI, and tests;
4. which current P0 item will be reduced or removed; and
5. explicit team approval.

After the feature-freeze date in `docs/delivery/ROADMAP.md`, only critical bugs, security, accessibility, data integrity, and submission consistency may change the release candidate.

Approved exception on July 31, 2026: add bounded post-completion cash receipt
statements and 48-hour automatic confirmation under ADR-014. User value is a
shared acknowledgement after external cash payment. Impact is one table, two
party commands, one maintenance batch, work-screen UI, notifications/audit,
and regression coverage. No payment processing or current P0 capability is
removed; this exception does not authorize further financial scope.
