# ADR-011: Use Vercel and Supabase Managed PostgreSQL

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** Umar (BE), Zaki (FE), Catur (PM)
- **Related:** ADR-001, ADR-002, `docs/engineering/DEPLOYMENT.md`

## Context

The architecture requires a Next.js-compatible application platform and managed PostgreSQL. The team has connected the repository to Vercel and provisioned Supabase for PostgreSQL and authentication.

Selection affects connection pooling, migration access, backups, preview isolation, observability, cost, and operational recovery.

## Decision Drivers

- Correct support for the selected Next.js runtime.
- Pooled PostgreSQL connections suitable for deployment concurrency.
- Direct/controlled migration access.
- Backup and tested restore capability.
- Region and data-handling suitability.
- Preview/production isolation.
- Clear limits, monitoring, support, and predictable MVP cost.
- Standard PostgreSQL export and low exit friction.

## Options Considered

The team considered these provider categories:

- integrated Next.js hosting plus an independently managed PostgreSQL provider;
- a general application platform with managed PostgreSQL; and
- another compatible combination approved by the technical lead.

The selected combination preserves standard Next.js and PostgreSQL interfaces while fitting the existing repository setup.

## Evaluation Matrix

| Dimension | Required evidence |
| --- | --- |
| Next.js compatibility | Supported runtime/build behavior and documented limits |
| Connection model | Pooling method, connection caps, serverless compatibility |
| Migrations | Safe direct or provider-approved migration connection |
| Backups | Frequency, retention, point-in-time options, restore procedure |
| Region | Available region and pilot data implications |
| Security | Encryption, secret management, access controls, audit capabilities |
| Preview isolation | Separate config/data and predictable preview behavior |
| Observability | Logs, metrics, slow-query and connection visibility |
| Cost | Expected demo/pilot cost and overage behavior |
| Portability | Standard dump/export and migration path |

## Decision

- Deploy the Next.js application on Vercel.
- Use Supabase Managed PostgreSQL as the sole business system of record.
- Use a pooled Supabase connection for Vercel runtime traffic. Supabase documents transaction-mode Supavisor as appropriate for serverless and other temporary clients.
- Use the direct PostgreSQL connection for controlled migrations and `pg_dump` when the execution environment can reach it; otherwise use a provider-supported migration connection verified before release.
- Access Rintara business tables through Drizzle and explicit parameterized SQL. Do not use the Supabase Data API, Realtime, Storage, or Edge Functions as an additional business-state path unless a later accepted ADR approves it.
- Configure Vercel to track `main` as the production branch. Automatic builds are production-only; review deployments from other branches are triggered manually when required.
- Keep local, review, and production credentials isolated.

Official implementation references:

- [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Supabase PostgreSQL connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)

## Production Readiness Items

Provider choice is closed. Before production release, Umar must record and verify:

- actual Supabase project region and PostgreSQL major version;
- selected plan, runtime pool mode, connection caps, and pool sizing;
- direct or approved migration connection reachability from the controlled migration environment;
- backup frequency/retention for the selected plan and one isolated restore test;
- Vercel and Supabase environment-variable separation;
- expected cost and relevant hard limits; and
- concrete deployment, migration, rollback, and recovery procedures.

Missing production-readiness evidence blocks release but does not reopen provider selection.

## Security, Privacy, and Data Impact

The production-readiness review must verify region, encryption, access control, incident/backup responsibilities, data export/deletion, and secret isolation. Supabase backup availability and retention vary by plan; no backup or point-in-time recovery claim may be made until the selected project plan is checked. Do not place production data into a free/shared environment without reviewing its terms and controls.

## Validation

Run a proof of deployment that demonstrates:

- production Next.js build;
- Supabase Auth callback compatibility under accepted ADR-012;
- pooled runtime queries;
- controlled migration;
- golden-path smoke test;
- connection behavior under representative concurrency; and
- isolated backup restore.

## Review Triggers

- Material pricing/limit change.
- Missing region or compliance need.
- Repeated availability or connection incidents.
- Provider deprecation or lock-in blocks required architecture.
