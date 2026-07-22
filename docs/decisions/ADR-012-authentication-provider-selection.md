# ADR-012: Use Supabase Auth

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** Umar (BE), Zaki (FE), Catur (PM)
- **Related:** ADR-004, `docs/engineering/SECURITY_MODEL.md`

## Context

ADR-004 accepts the use of mature external authentication. The repository is already configured with Supabase SSR packages and project environment variables, so the team selected Supabase Auth for registration, sessions, callbacks, and account recovery.

Provider capabilities, pricing, framework support, and limits can change. The decision must use current official documentation and a small proof of integration.

## Decision Drivers

- Supported Next.js App Router integration.
- Secure server-side session verification.
- Email/password or approved login method for pilot users.
- Recovery and session revocation.
- Preview and production environment isolation.
- Stable external subject for `users.auth_subject`.
- Testability in PostgreSQL integration and manual release smoke testing.
- Rate limits, abuse controls, logs, data handling, export, and cost.
- Minimal coupling to database/hosting provider.

## Options Considered

The team considered mature options in these categories:

- hosted identity provider;
- maintained authentication library with team-operated data/session storage; and
- platform-integrated authentication only if it does not force unrelated database/realtime architecture.

Do not implement custom password/session primitives as an option; ADR-004 rejects that approach.

## Evaluation Matrix

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

## Decision

- Use Supabase Auth through `@supabase/supabase-js` and `@supabase/ssr` with cookie-based Next.js SSR.
- Use the Supabase Auth user ID as `users.auth_subject`; Rintara PostgreSQL remains authoritative for role, account status, profiles, ownership, and authorization.
- Validate identity on the server using the current Supabase SSR guidance. Do not trust the user object returned by `getSession()` as authorization evidence; use verified claims or a fresh server-confirmed user lookup as appropriate.
- Centralize conversion from Supabase identity to the Rintara `RequestContext`.
- Keep provider-specific code inside the authentication infrastructure module rather than spreading Supabase fields through domain tables.
- Isolate callback URLs, keys, test accounts, and credentials between local, review, and production environments.
- Do not use Supabase role metadata as a substitute for Rintara authorization checks.

Official implementation references:

- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase SSR client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)

## Production Readiness Items

Provider choice is closed. Before protected production routes and demo accounts are finalized, Umar must document and verify:

- approved login methods enabled in the Supabase project;
- callback and redirect URLs for each environment;
- onboarding resume behavior after partial profile creation;
- suspended/deleted Rintara account enforcement despite a valid Supabase session;
- release smoke test-account strategy;
- session revocation, key rotation, and incident procedure; and
- selected-plan rate limits, cost, and relevant hard limits.

Missing production-readiness evidence blocks release but does not reopen provider selection.

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
- release smoke test-account flow; and
- secret absence from client build and logs.

## Review Triggers

- Provider pricing/limits or supported integration changes materially.
- Security incident or unacceptable outage.
- Required login method, residency, export, or deletion is unsupported.
- Native/mobile clients become approved scope.
