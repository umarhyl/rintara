# ADR-001: Use a Next.js Modular Monolith

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** `docs/engineering/ARCHITECTURE.md`, `docs/product/PRD.md`

## Context

Rintara must deliver a competition MVP by July 31, 2026. The product has one web interface, one primary database, a small team, and a tightly connected golden path. Its lifecycle operations require strong consistency more than independent service scaling.

Splitting the product into separate frontend and multiple backend services would add deployment, authentication, observability, API versioning, and distributed-consistency work before the product loop is proven.

## Decision Drivers

- Short delivery window.
- One team and one product workflow.
- Strong consistency for acceptance, completion, proof, and credits.
- Server-rendered public pages and interactive authenticated flows.
- Low operational overhead and straightforward local development.
- Ability to scale web instances horizontally later.

## Options Considered

### Next.js modular monolith

One Next.js App Router application contains presentation, application/domain, authorized query, and data-access modules with explicit code boundaries.

### React SPA plus separate backend

Vite/React frontend and a separate API service would create a clear process boundary but duplicate deployment, session, contract, and local-environment complexity.

### Microservices

Independent services could scale separately but add distributed transactions, service authentication, messaging, and operational burden unsupported by MVP evidence.

## Decision

Use one Next.js App Router application as a modular monolith with one PostgreSQL database.

Code must separate:

- routes/pages/components;
- domain commands and policies;
- authorized read models;
- database access and migrations; and
- infrastructure integration.

These are module boundaries, not network services.

## Rationale

The modular monolith minimizes delivery and operational risk while preserving clear internal ownership. Next.js supports public rendering and server-side application operations in the same deployable unit. PostgreSQL transactions remain local to one server-side operation.

## Consequences

### Positive

- One build, deployment, session boundary, and local workflow.
- Direct typed calls between presentation and application layers.
- Straightforward transaction orchestration.
- Easier end-to-end testing and demo setup.

### Negative and trade-offs

- Poor module discipline could create a tangled codebase.
- All modules share a deployment cadence.
- CPU- or long-running background work is not a strength of normal request execution.

### Follow-up

- Enforce dependency direction in `AGENTS.md`.
- Keep non-critical scheduled work bounded and separately invoked.
- Measure bottlenecks before extracting any service.

## Security, Privacy, and Data Impact

One server boundary simplifies consistent session, authorization, DTO, and logging controls. It also makes accidental cross-module imports possible, so server-only guards and explicit private projections are mandatory.

## Operational Impact

Operate one web deployment plus managed PostgreSQL and authentication integration. Scaling web instances must account for aggregate database connection limits.

## Validation

- Production build and preview deployment succeed.
- Golden path executes without internal HTTP calls.
- Domain modules remain independent of React.
- Web instances do not store authoritative mutable state in process memory.

## Review Triggers

- A module has independently measured scaling or availability needs.
- Multiple teams require independent releases.
- Background processing becomes large or reliability-critical.
- Regulatory or security boundaries require process isolation.

Extraction requires a new ADR and migration plan.
