# Rintara System Architecture

> **Version:** 3.0  
> **Date:** July 18, 2026  
> **Status:** MVP technical baseline  
> **Product scope:** `PRD.md`  
> **Domain behavior:** `BUSINESS_RULES.md`

## 1. Architecture Goals

The architecture must make Rintara's golden path reliable without creating operational complexity the MVP does not need.

Primary goals:

- ship a coherent, testable product quickly;
- protect authorization and private addresses at the server boundary;
- preserve lifecycle invariants under concurrent requests;
- scale web traffic horizontally without redesigning the product;
- keep the database as the durable source of truth;
- remain understandable to the full team during technical review.

Non-goals include microservices, event streaming, realtime chat, payment infrastructure, continuous location tracking, and multi-region active-active deployment.

## 2. Baseline Stack

| Layer | Decision |
| --- | --- |
| Web application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS and accessible UI primitives already approved by the repository |
| Forms and validation | React Hook Form with Zod, or an equivalent established repository pattern |
| Application server | Next.js Server Components, Server Actions, and limited Route Handlers |
| Database | Managed PostgreSQL |
| Data access | Drizzle ORM plus explicit SQL where transaction or query-plan control is needed |
| Authentication | Mature Next.js-compatible provider/library; no custom password or session implementation |
| Deployment | Vercel or another platform that correctly supports the selected Next.js runtime |
| Testing | Unit/domain tests, PostgreSQL integration tests, and Playwright end-to-end tests |

Provider names are deliberately not hard-coded. The managed PostgreSQL provider must support pooled connections, migrations, backups, and the required PostgreSQL features.

## 3. System Context

```mermaid
flowchart TD
    U["Worker, Employer, Admin"] --> W["Next.js Web Application"]
    W --> A["Authentication Provider"]
    W --> P["Managed PostgreSQL"]
    O["Operations and Monitoring"] --> W
    O --> P
```

Rintara is a modular monolith:

- one deployable Next.js application;
- one PostgreSQL database;
- one authentication integration;
- no internal network boundary between UI and domain services;
- clear code-level boundaries so modules can be extracted later only if evidence justifies it.

## 4. Runtime Responsibilities

### 4.1 Browser

The browser handles navigation, accessible interactions, form state, optimistic affordances only where safe, and rendering of already-authorized data. It is untrusted.

The browser must not decide:

- user identity, role, or account status;
- resource ownership;
- First Opportunity eligibility;
- Wage Guideline compliance;
- lifecycle transitions;
- proof or credit issuance; or
- whether a private address may be returned.

### 4.2 Next.js presentation layer

Server and Client Components handle layouts, page composition, metadata, loading and error boundaries, input collection, and safe data presentation.

Presentation code calls named queries or domain commands. It does not execute free-form status updates or contain duplicate business rules.

### 4.3 Domain layer

The server domain layer owns:

- session and active-account checks;
- role, ownership, and relationship authorization;
- input normalization and validation;
- eligibility calculations;
- state transition validation;
- transaction orchestration;
- idempotency;
- notification creation; and
- audit creation.

### 4.4 Data-access layer

The data-access layer owns parameterized queries, row projections, transactions, row locks or conditional writes, pagination, and mapping database errors to typed domain errors.

### 4.5 PostgreSQL

PostgreSQL owns durable data, referential integrity, uniqueness, check constraints, indexes, and the final concurrency safety boundary.

Application validation improves error quality; it does not replace database constraints.

## 5. Recommended Repository Boundaries

Adapt names only when an existing repository convention is already stronger.

```text
src/
  app/                    # routes, layouts, pages, loading/error boundaries
  components/             # shared presentational components
  features/
    auth/
    profiles/
    jobs/
    applications/
    agreements/
    work-sessions/
    passport/
    credits/
    reports/
    admin/
  server/
    auth/                  # session and authorization helpers
    db/                    # client, schema, migrations, query helpers
    domain/                # commands, policies, transactions
    queries/               # authorized read models and DTO projections
    validation/            # shared server schemas
    observability/         # safe logs and request correlation
  lib/                     # framework-neutral utilities
tests/
  unit/
  integration/
  e2e/
```

Rules:

- Server-only modules must use the repository's server-only guard.
- React components never import database schema or client instances.
- Domain commands do not import React or route modules.
- Features may share domain types through explicit public modules, not deep cross-feature imports.

## 6. Request and Mutation Flow

### Query flow

```text
Page or Server Component
-> authorized query function
-> session/relationship check when private
-> database projection
-> safe DTO
-> render
```

### Mutation flow

```text
Form or client interaction
-> Server Action or Route Handler
-> parse and validate input
-> authenticate and authorize
-> execute named domain command
-> transaction and constraints
-> safe result/error
-> revalidate affected views
```

Never accept `userId`, `role`, `ownerId`, `verified`, `creditAmount`, or arbitrary `status` when the server can derive it.

## 7. Transaction Boundaries

The following operations require database transactions:

### `acceptApplication`

- validate employer and job ownership;
- protect the job from concurrent acceptance;
- re-evaluate First Opportunity eligibility;
- accept one application and reject the others;
- mark the job filled;
- create one agreement snapshot;
- write notifications and audit record.

### `verifyCompletion`

- protect agreement/session/job from duplicate completion;
- verify no active report blocks the workflow;
- mark session, agreement, and job complete;
- create one Work Proof;
- conditionally issue one Opportunity Credit;
- write notifications and audit record.

### `redeemOpportunityCredit`

- claim an eligible credit exactly once;
- validate the published target job and ownership;
- reject overlapping active boost;
- create the 24-hour boost;
- write notification and audit record.

Transactions must be short. Do not call external authentication, messaging, storage, analytics, or other network services while holding locks.

## 8. Read Models and Privacy Boundaries

Use distinct projections instead of returning table-shaped objects everywhere.

| Projection | Intended audience | Must exclude |
| --- | --- | --- |
| Public job card | Anyone | Full address, contacts, applicant data, moderation fields |
| Public job detail | Anyone | Full address, contacts, internal wage source notes, applicant data |
| Worker application detail | Applicant | Other applicants, employer private administration data |
| Employer applicant view | Owning employer | Worker data unrelated to the application |
| Agreement detail | Two parties/admin | Data unrelated to the agreement |
| Passport owner view | Worker | Internal audit/moderation metadata |
| Passport applicant view | Owning employer | Private worker data beyond verified work context |

Full work addresses live in `job_private_details` and appear only in authorized agreement projections.

## 9. Rendering and Caching

- Public marketing content may be statically rendered or cached.
- Public job discovery may use short revalidation and tag-based invalidation after publish, cancellation, expiry, completion, or boost changes.
- Personalized dashboards, agreements, applicant lists, notifications, reports, and admin pages must not use shared public caches.
- Authorization must run before any private data enters a cacheable response.
- Cache correctness is more important than avoiding a database read for the MVP.

## 10. Scalability Strategy

### MVP baseline

- stateless Next.js instances;
- PostgreSQL connection pooling sized for the deployment platform;
- cursor or stable page pagination for every growing list;
- indexes verified against critical queries;
- short transactions and bounded result sets;
- no global mutable memory for sessions, credits, or counters;
- asynchronous/non-critical work deferred until after the core transaction when needed.

### Scale when evidence requires it

1. Optimize slow queries and remove N+1 access.
2. Add or adjust indexes using query plans and production-like data.
3. Cache anonymous discovery results with safe invalidation.
4. Move scheduled and non-critical notification work to a durable job mechanism.
5. Add read replicas only for measured read pressure and after resolving consistency expectations.
6. Partition or archive large audit/notification tables only after real growth warrants it.
7. Extract a service only when independent scaling, ownership, or reliability requirements justify the operational cost.

Next.js plus PostgreSQL can scale well beyond the competition MVP. The first likely constraints are inefficient queries, excess database connections, unbounded lists, and missing cache discipline—not the absence of microservices.

## 11. Security Architecture

### Authentication and authorization

- Validate the session in every private query and command.
- Load current role and status from PostgreSQL or trusted synchronized auth data.
- Enforce role plus resource ownership or party relationship.
- Route/layout protection is a UX layer, not a security boundary.
- Include negative authorization tests for cross-account resource IDs.

### Web controls

- Validate with server-side schemas.
- Use parameterized queries.
- Follow the auth provider's CSRF protection model.
- Escape user content; raw HTML requires an approved sanitizer.
- Rate-limit abuse-prone commands.
- Use secure, HTTP-only, same-site cookies as supported by the auth solution.
- Keep production secrets in deployment configuration, never source control or client bundles.

### Data minimization

Do not collect government IDs, bank accounts, card data, continuous GPS, full birth dates, or private chat in the MVP. Do not include full addresses, tokens, plaintext check-in codes, or private moderator notes in logs.

## 12. Reliability and Failure Handling

- Domain errors are typed and safe for display or mapping.
- Unexpected errors receive a request correlation ID and safe structured log.
- Database constraint failures map to stable conflict errors, not raw SQL messages.
- Notifications are stored in PostgreSQL; their creation is transactional where the notification represents a committed critical state.
- Client retries must not duplicate completion or redemption.
- Time comparisons use server time and UTC storage.

## 13. Observability

Minimum signals:

- request or command name;
- duration and result class;
- correlation ID;
- unexpected error code;
- slow database query signal;
- failed authorization count without personal data;
- deployment health.

Never log passwords, session tokens, check-in codes, full addresses, application notes, or unrestricted request bodies.

## 14. Deployment Environments

| Environment | Purpose | Data rule |
| --- | --- | --- |
| Local | Development and tests | Local or isolated development database |
| Preview | Review and acceptance | Synthetic data only; separate credentials |
| Production | Public MVP and live demo | Managed backups, least-privilege credentials, controlled seed |

Required configuration categories include database connection, authentication secrets and callbacks, application base URL, rate-limit configuration if used, and observability configuration. Environment names are documented in the repository README without secret values.

Database migrations run as a controlled deployment step. Application instances must not race to run migrations on startup.

## 15. Testing Architecture

- Domain policy tests use deterministic clocks and fixtures.
- Integration tests run against real PostgreSQL behavior, not an in-memory substitute for transaction-sensitive paths.
- Concurrency tests cover acceptance, completion, and credit redemption.
- Query tests verify public/private projections.
- Playwright covers the golden path and required authorization scenarios.
- Seed data creates two employers, multiple workers with category-specific history, compliant and non-compliant jobs, credits, and a report scenario.

## 16. Architecture Decision Guardrails

The following changes require an explicit architecture decision and PRD impact review:

- adding a second database or cache as a source of truth;
- introducing microservices, queues, or event streaming;
- replacing PostgreSQL or Next.js;
- adding payment or chat infrastructure;
- storing sensitive identity or location data;
- adding public APIs for third-party consumers; or
- weakening transaction or authorization boundaries for speed.
