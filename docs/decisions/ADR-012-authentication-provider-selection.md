# ADR-012: Select the Authentication Provider

- **Status:** Proposed
- **Date:** 2026-07-18
- **Decision deadline:** Before protected production routes and demo-account finalization
- **Deciders:** Technical lead and security reviewer
- **Related:** ADR-004, `docs/engineering/SECURITY_MODEL.md`

## Context

ADR-004 accepts the use of mature external authentication but deliberately does not choose a vendor/library. A concrete selection is needed for registration, sessions, callbacks, test accounts, environment isolation, and account recovery.

Provider capabilities, pricing, framework support, and limits can change. The decision must use current official documentation and a small proof of integration.

## Decision Drivers

- Supported Next.js App Router integration.
- Secure server-side session verification.
- Email/password or approved login method for pilot users.
- Recovery and session revocation.
- Preview and production environment isolation.
- Stable external subject for `users.auth_subject`.
- Testability in PostgreSQL integration and Playwright E2E.
- Rate limits, abuse controls, logs, data handling, export, and cost.
- Minimal coupling to database/hosting provider.

## Options to Evaluate

Evaluate current mature options in these categories:

- hosted identity provider;
- maintained authentication library with team-operated data/session storage; and
- platform-integrated authentication only if it does not force unrelated database/realtime architecture.

Do not implement custom password/session primitives as an option; ADR-004 rejects that approach.

## Required Evaluation Matrix

| Dimension | Required evidence |
| --- | --- |
| Framework support | Current official Next.js integration and server-side session model |
| Security | Cookie/session behavior, recovery, revocation, key rotation, CSRF guidance |
| User lifecycle | Registration, sign-out, suspended/deleted Rintara account behavior |
| Environment isolation | Separate keys/tenants/callbacks for local, preview, production |
| Testing | Deterministic test accounts or supported test strategy |
| Data model | Stable subject, minimal synchronized attributes, export/deletion path |
| Operations | Status visibility, logs, incident process, rate limits |
| Cost and limits | Expected pilot usage and overage behavior |
| Portability | Migration effort and account-linking implications |

## Decision Required

Before acceptance, record:

- selected provider/library and current version/integration path;
- approved login methods;
- session and cookie strategy;
- callback URLs per environment;
- mapping from external subject to Rintara user;
- onboarding/resume behavior after partial profile creation;
- suspension/deletion enforcement;
- E2E test-account strategy;
- secret rotation and incident procedure;
- expected cost/limits; and
- rejected alternatives.

No concrete provider is selected by this proposed ADR.

## Temporary Implementation Boundary

- Keep domain authorization independent of auth-provider role claims.
- Model `users.auth_subject` as the stable integration key.
- Centralize session-to-Rintara-context conversion.
- Do not add provider-specific fields throughout domain tables.
- Do not finalize `.env.example` provider variables until selection.

## Security, Privacy, and Data Impact

Minimize synchronized identity attributes. Provider tokens, callback payloads, and secrets must not enter application logs. A valid provider session does not bypass Rintara account status, role, ownership, or relationship checks.

## Validation

The proof of integration must demonstrate:

- registration/sign-in/sign-out;
- secure server session retrieval;
- role onboarding and resume after partial failure;
- suspended Rintara account rejection despite valid auth session;
- cross-account authorization tests;
- preview/production callback separation;
- Playwright test-account flow; and
- secret absence from client build and logs.

## Review Triggers

- Provider pricing/limits or supported integration changes materially.
- Security incident or unacceptable outage.
- Required login method, residency, export, or deletion is unsupported.
- Native/mobile clients become approved scope.
