# ADR-002: Use Managed PostgreSQL as the System of Record

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** `docs/engineering/DATABASE.md`, `docs/engineering/ARCHITECTURE.md`

## Context

Rintara contains relational workflows with strict invariants: one application per worker/job, one accepted worker, immutable agreement snapshots, one Work Proof per agreement, one credit per qualifying source job, and idempotent redemption.

These operations must remain correct under concurrent web requests. The data model also needs filtered discovery, audit history, moderation relationships, and reliable migrations.

## Decision Drivers

- ACID transactions and row-level concurrency controls.
- Foreign keys, checks, and partial unique indexes.
- Relational querying and predictable migrations.
- Managed backups and connection pooling.
- Broad operational knowledge and provider portability.

## Options Considered

### Managed PostgreSQL

Provides required relational constraints, transactions, indexing, and mature tooling while outsourcing infrastructure operations.

### Document database

Flexible documents would simplify some snapshots but make relational invariants, joins, and multi-record transactions less natural.

### Backend-as-a-service-specific database APIs

They can accelerate development but may couple domain and realtime behavior to one provider. Rintara needs PostgreSQL semantics without requiring provider-specific database APIs.

## Decision

Use managed PostgreSQL as Rintara's sole business system of record for the MVP.

- Business state is stored in PostgreSQL.
- Critical invariants are backed by constraints and transactions.
- Provider-specific realtime/storage/database SDKs are not baseline dependencies.
- Authentication-provider tables may exist as required, but Rintara domain identity links through a stable external subject.

The concrete managed provider is selected separately in ADR-011.

## Rationale

PostgreSQL directly supports the consistency and query needs of Rintara's golden path. Keeping standard PostgreSQL as the contract preserves provider choice and avoids introducing another authoritative datastore.

## Consequences

### Positive

- Strong integrity and transactional workflow.
- Powerful indexes and query planning.
- Clear backup/export model.
- Easier concurrency testing with real database behavior.

### Negative and trade-offs

- Schema and migration discipline are mandatory.
- Connection limits can constrain serverless deployments if pooling is misconfigured.
- Scaling writes requires more care than adding a cache or document store.

### Follow-up

- Select a provider supporting pooled runtime and controlled migration connections.
- Test backup restoration before pilot data.
- Monitor slow queries and pool saturation.

## Security, Privacy, and Data Impact

Database credentials are secrets and separated by environment and purpose. Public query code uses allowlisted projections. Full addresses are separated from public job data under ADR-008.

## Operational Impact

Migrations run as a controlled deployment step. Application processes use pooled connections. Provider backup, region, retention, and restore capabilities must be verified before selection.

## Validation

- Migrations build the schema from empty PostgreSQL.
- Concurrency tests prove one acceptance/proof/credit outcome.
- Query plans support critical discovery and workflow lookups.
- Backup restore is tested in isolation.

## Review Triggers

- Measured workload exceeds supported provider limits.
- A new data type has requirements PostgreSQL cannot meet economically.
- Multi-region write availability becomes a validated requirement.
- Regulations require a different storage boundary.
