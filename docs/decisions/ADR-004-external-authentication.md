# ADR-004: Use Mature External Authentication

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** `docs/engineering/SECURITY_MODEL.md`, ADR-012

## Context

Rintara needs registration, sign-in, sign-out, session security, and account recovery. Building password storage, reset tokens, session rotation, OAuth/OIDC protocol handling, and abuse protection would create substantial security risk and distract from the product's core workflow.

The specific provider has not yet been selected.

## Decision Drivers

- Security of credential and session primitives.
- Fast Next.js integration.
- Server-side session verification.
- Role and domain-account synchronization.
- Preview and production environment isolation.
- Reasonable portability and export path.

## Options Considered

### Mature external provider/library

Delegate credential and session primitives while Rintara retains domain authorization in PostgreSQL.

### Custom email/password authentication

Provides full control but requires secure password, recovery, verification, session, rate-limit, and breach response implementation.

### Authentication embedded in a broader backend platform

May accelerate setup but can increase coupling between auth, database, realtime, and hosting choices.

## Decision

Use a mature Next.js-compatible external authentication solution. Rintara will not implement password hashing, reset-token protocols, session signing/rotation, or OAuth protocol primitives itself.

Rintara stores a stable external subject on `users.auth_subject` and owns domain role, account status, profiles, ownership, and authorization in PostgreSQL.

Concrete provider selection is deferred to ADR-012.

## Rationale

Authentication primitives are high-risk commodity infrastructure. Externalizing them reduces implementation risk while preserving Rintara's ability to enforce product-specific authorization independently.

## Consequences

### Positive

- Faster secure baseline.
- Maintained credential/session implementation.
- Less sensitive data stored by Rintara.

### Negative and trade-offs

- Provider availability, pricing, and limits become dependencies.
- Callback/session behavior requires provider-specific testing.
- Migration to another provider may require account linking or user action.

### Follow-up

- Accept ADR-012 with verified current provider information.
- Document callback URLs and environment isolation.
- Test inactive-account behavior even with a valid provider session.

## Security, Privacy, and Data Impact

Rintara minimizes synchronized auth data and never logs provider tokens or callback payloads. Provider authentication does not grant resource authorization; every domain operation checks current Rintara role/status/relationship.

## Operational Impact

Provider status and key rotation procedures become part of incident readiness. Separate tenants/keys are required across environments where supported.

## Validation

- Session cannot be forged through request fields.
- Wrong-role, cross-owner, and suspended-user tests pass.
- Callback configuration is verified in preview and production.
- Secrets are absent from client bundles and logs.

## Review Triggers

- Provider security or availability becomes unacceptable.
- Pricing exceeds approved limits.
- Required login methods or data residency are unsupported.
- Provider migration becomes necessary.
