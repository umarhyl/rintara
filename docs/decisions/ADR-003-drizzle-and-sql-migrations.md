# ADR-003: Use Drizzle with Repository-Managed SQL Migrations

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** ADR-002, `docs/engineering/DATABASE.md`

## Context

The application needs type-safe data access while retaining direct control over PostgreSQL features such as partial unique indexes, row locks, conditional updates, query plans, and transaction boundaries.

Schema changes must be reviewable and reproducible from source control.

## Decision Drivers

- TypeScript integration.
- Transparent SQL and PostgreSQL feature access.
- Reviewable migrations.
- Low runtime abstraction cost.
- Ability to use explicit parameterized SQL for complex operations.

## Options Considered

### Drizzle plus explicit SQL

Provides typed schema/query support while keeping SQL concepts visible and allowing direct SQL when necessary.

### Heavier ORM with generated client

Offers strong developer tooling but may make provider-specific SQL, partial indexes, or locking patterns less direct.

### Handwritten SQL only

Maximizes control but increases mapping, typing, and repetitive query work across standard operations.

## Decision

Use Drizzle ORM for schema and normal parameterized data access, with explicit parameterized SQL where PostgreSQL-specific control or clearer query behavior is required.

All production schema changes use committed repository migrations. Do not treat schema push as the normal production deployment mechanism.

## Rationale

This approach combines TypeScript ergonomics with direct access to the database behavior Rintara needs. It avoids hiding concurrency-sensitive operations behind generic CRUD abstractions.

## Consequences

### Positive

- Shared TypeScript schema types.
- Reviewable generated or handwritten migration SQL.
- Straightforward escape hatch for row locking, partial indexes, and query tuning.

### Negative and trade-offs

- Contributors must understand both Drizzle and PostgreSQL.
- Generated migrations still require human review.
- Type safety does not replace authorization or runtime validation.

### Follow-up

- Establish migration naming and execution scripts.
- Add integration tests for PostgreSQL-specific features.
- Document any explicit SQL with rationale and query-plan evidence where performance-sensitive.

## Security, Privacy, and Data Impact

All queries remain parameterized. Raw SQL built from user-controlled strings is prohibited. Explicit DTOs prevent raw row serialization.

## Operational Impact

Migration tooling needs a controlled direct connection where required by the selected provider. Applied migrations are immutable; changes use a new migration.

## Validation

- Empty-database migration succeeds.
- Upgrade migration succeeds from the previous release schema.
- Required partial indexes and constraints exist.
- Integration tests use the same PostgreSQL semantics.

## Review Triggers

- Drizzle blocks a required supported PostgreSQL feature.
- Migration tooling becomes unreliable or incompatible with deployment.
- The team changes the primary application language or database.
