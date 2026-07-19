# ADR-005: Use Server Actions for Internal Commands

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** `docs/engineering/API.md`, ADR-001

## Context

Rintara is one Next.js application without a public third-party API requirement. Interactive forms and commands need a typed server boundary, while some integrations and operational endpoints require standard HTTP routes.

Duplicating internal logic across Server Actions and REST endpoints would increase drift and authorization risk.

## Decision Drivers

- Minimal internal transport code.
- Co-location with App Router forms and revalidation.
- Central domain-command reuse.
- Explicit HTTP boundaries where genuinely needed.
- No premature public API commitment.

## Options Considered

### Server Actions plus limited Route Handlers

Use Server Actions for first-party interactive mutations and Route Handlers for auth callbacks, health, scheduled operations, or intentionally exposed HTTP endpoints.

### REST API for every operation

Creates a uniform HTTP surface but adds endpoint boilerplate, serialization, and potential duplicate internal use without an external consumer.

### GraphQL or RPC framework

Provides rich contracts but adds tooling and a new runtime/interface layer unnecessary for current scope.

## Decision

- Server Components call authorized query functions directly.
- First-party interactive mutations use thin Server Actions.
- Route Handlers exist only for real HTTP boundaries.
- Both transports call the same application/domain commands.
- No public third-party API is promised in the MVP.

Server Actions and Route Handlers do not contain business rules beyond transport parsing, context creation, command invocation, safe result mapping, and cache revalidation.

## Rationale

This is the smallest interface surface for a single Next.js product while keeping domain logic transport-independent and testable.

## Consequences

### Positive

- Less duplicated endpoint code.
- Direct integration with forms and revalidation.
- Central authorization and domain behavior.

### Negative and trade-offs

- External/mobile clients cannot assume a supported public API.
- Server Action framework behavior must be understood and tested.
- Transport boundaries can become blurred if commands are not separated cleanly.

### Follow-up

- Keep contracts documented in `docs/engineering/API.md`.
- Add an ADR before exposing a stable public API.
- Use safe DTOs and stable domain error codes regardless of transport.

## Security, Privacy, and Data Impact

Every Server Action and Route Handler validates session and input server-side. Route/layout protection and hidden UI controls are not authorization. Private responses must not use shared public caches.

## Operational Impact

Health and scheduled endpoints require minimal output, authentication as applicable, bounded execution, and monitoring. They must not expose provider or schema internals.

## Validation

- Domain commands can be tested without Next.js transport.
- No command has divergent Server Action and Route Handler logic.
- Negative authorization tests call the server boundary directly.

## Review Triggers

- A supported mobile or third-party client is approved.
- External API versioning becomes a requirement.
- Framework constraints prevent reliable command execution.
