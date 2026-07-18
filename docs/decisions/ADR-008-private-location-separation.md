# ADR-008: Separate Private Work Location from Public Job Data

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** `docs/engineering/DATABASE.md`, `docs/engineering/SECURITY_MODEL.md`

## Context

Workers need a general area to decide whether a job is relevant, but a full work address may identify a home, small business, or sensitive location. The full address is needed only after one worker is accepted and both parties review the agreement.

Keeping public and private fields in the same general-purpose row/DTO increases the risk of accidental serialization, caching, metadata exposure, or logging.

## Decision Drivers

- Privacy by default.
- Clear authorization boundary.
- Testable public projections.
- Full agreement information for accepted parties.
- Low implementation complexity.

## Options Considered

### Separate `job_private_details` record

Public job queries never join the private table. Authorized agreement/owner queries load it explicitly.

### Same job table with careful field omission

Simpler schema but makes accidental row serialization more dangerous and harder to detect structurally.

### No address storage

Strong privacy but prevents Rintara from providing a complete accepted agreement and arrival information.

## Decision

Store full address and arrival instructions in one-to-one `job_private_details`, separate from public `jobs` data.

Public pages show only an approved general-area label. Full address is returned only to:

- the owning employer;
- the accepted worker through the agreement context; and
- an authorized administrator performing moderation.

The accepted agreement snapshot contains the address so terms cannot change silently.

## Rationale

Physical separation reduces accidental leakage and makes public queries easier to audit. It follows data-minimization and least-privilege principles without removing needed agreement functionality.

## Consequences

### Positive

- Public queries can structurally avoid private data.
- Authorization intent is explicit.
- Easier negative privacy tests.

### Negative and trade-offs

- Authorized owner/agreement queries require an additional join.
- Snapshot and source private data must be handled consistently.
- Database/provider access still requires strong operational controls.

### Follow-up

- Use explicit DTO allowlists.
- Keep addresses out of logs, notifications, metadata, analytics, and caches.
- Add response/page-source tests for unrelated actors.

## Security, Privacy, and Data Impact

The address is relationship-private. Provider encryption at rest and encrypted transport are required. Application-level encryption may be reconsidered if threat/regulatory requirements expand.

## Operational Impact

Operators should not inspect addresses during routine support. Backups contain private location data and inherit its protection requirements.

## Validation

- Public query modules do not join `job_private_details`.
- Anonymous/unrelated actors cannot obtain the address through UI, response, metadata, cache, or logs.
- Accepted worker and owner can view the same immutable snapshot value.

## Review Triggers

- Public maps or geospatial search enter approved scope.
- Continuous or precise location is proposed.
- Regulatory requirements demand application-level encryption or different retention.
