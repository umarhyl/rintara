# ADR-011: Select Application Hosting and Managed PostgreSQL Providers

- **Status:** Proposed
- **Date:** 2026-07-18
- **Decision deadline:** Before production deployment and final environment documentation
- **Deciders:** Technical lead and operations owner
- **Related:** ADR-001, ADR-002, `docs/engineering/DEPLOYMENT.md`

## Context

The architecture requires a Next.js-compatible application platform and managed PostgreSQL. The documents intentionally avoid naming a provider because pricing, limits, regions, connection modes, and product capabilities change over time.

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

## Candidate Categories

Evaluate current offerings in at least these categories using authoritative provider documentation at decision time:

- integrated Next.js hosting plus an independently managed PostgreSQL provider;
- a general application platform with managed PostgreSQL; and
- another compatible combination approved by the technical lead.

Do not select a provider based on popularity or a stale feature comparison.

## Proposed Evaluation Matrix

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

## Decision Required

Before changing status to Accepted, record:

- selected application platform;
- selected PostgreSQL provider and region;
- pooled and migration connection strategy;
- backup/restore commitment verified from current documentation;
- environment separation;
- expected cost and hard limits;
- deployment and rollback commands/procedures; and
- reasons rejected candidates were not chosen.

No provider is selected by this proposed ADR.

## Temporary Implementation Boundary

Until accepted:

- use standard Next.js and PostgreSQL interfaces;
- avoid provider-specific realtime, storage, database, or edge APIs;
- keep provider-specific code behind infrastructure modules;
- do not publish uptime, backup, or scale claims; and
- keep deployment instructions provider-neutral.

## Security, Privacy, and Data Impact

Provider selection must verify region, encryption, access control, incident/backup responsibilities, data export/deletion, and secret isolation. Do not place production data into a free/shared environment without reviewing its terms and controls.

## Validation

Run a proof of deployment that demonstrates:

- production Next.js build;
- auth callback compatibility once ADR-012 is resolved;
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
