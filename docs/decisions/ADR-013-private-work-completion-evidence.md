# ADR-013: Require Private Work Completion Evidence

- **Status:** Accepted
- **Date:** 2026-07-27
- **Deciders:** Umar (product and architecture approval)
- **Related:** ADR-002, ADR-005, ADR-006, ADR-009, ADR-011

## Context

The team decided that a worker must provide one result photo after check-in
before check-out becomes available. The photo supports the employer's
completion review; it does not move money, replace employer verification, or
become public Passport content.

This reverses the earlier MVP exclusion for work-evidence uploads and requires
a bounded object-storage path with explicit privacy and lifecycle rules.

## Decision Drivers

- Require tangible completion evidence before check-out.
- Keep full-resolution user media out of PostgreSQL.
- Prevent public or cross-account access.
- Remove embedded location and camera metadata.
- Preserve PostgreSQL as the authority for workflow state and ownership.
- Avoid external storage calls while holding PostgreSQL locks.

## Options Considered

### Store image bytes in PostgreSQL

This keeps one provider but increases database size, backup cost, and query
risk. It was rejected.

### Use public object URLs

This is operationally simple but fails the relationship-authorization and
privacy requirements. It was rejected.

### Use a private Supabase Storage bucket

This reuses the selected managed platform, keeps binary data outside business
tables, and permits a server-only adapter to enforce domain authorization.

## Decision

- Use a private Supabase Storage bucket named
  `work-completion-evidence`.
- Accept one JPG, PNG, or WebP input up to 5 MB only after the accepted worker
  checks in.
- Decode and re-encode the input server-side as bounded WebP without copied
  metadata.
- Require the worker to attest permission and absence of people or private
  information before each upload.
- Store only the private object path, normalized MIME type, size, SHA-256,
  uploader, and timestamps in PostgreSQL.
- Permit replacement only while the work session remains `checked_in`.
- Require the PostgreSQL evidence record before `checkOut` may transition the
  session.
- Serve media only through an authenticated Route Handler after worker,
  employer, or admin relationship authorization.
- Keep evidence out of public jobs and Rintara Passport.
- Keep payments outside Rintara under ADR-009.

The Storage service-role credential is server-only. It must never use a
`NEXT_PUBLIC_*` name, enter browser bundles, or be logged.

## Rationale

PostgreSQL remains the system of record for whether evidence exists and whether
checkout is allowed. Storage contains only private binary objects. A random new
path is uploaded before the short metadata transaction; the transaction locks
the work session and atomically swaps the authoritative pointer. Failed
transactions trigger compensating object deletion, while successful
replacement deletes the previous object on a best-effort basis.

## Consequences

### Positive

- Checkout has a server-enforced evidence prerequisite.
- Embedded EXIF/location metadata is not retained.
- Photos are not publicly addressable.
- Replacement and checkout serialize on the work-session row.

### Negative and trade-offs

- Production requires a Supabase service-role secret.
- Storage availability becomes part of the completion workflow.
- A failed compensating deletion can leave an unattached private object that
  operations may need to clean up.
- Image decoding adds bounded CPU and memory work to the application runtime.

### Neutral or follow-up

- Monitor upload errors, processing time, storage usage, and unattached-object
  cleanup needs.
- Define retention/deletion policy before retaining real public-user photos
  longer than the pilot requires.

## Security, Privacy, and Data Impact

Photos may still contain people, household items, documents, or other private
details even after metadata removal. UI copy instructs workers to exclude
people and personal information. Authorization is rechecked on every upload
and download. The bucket remains private and the service-role key remains
server-only.

## Operational Impact

Deployment must configure `SUPABASE_SERVICE_ROLE_KEY`. The application creates
or verifies the bounded private bucket when first needed. Database migration
`0004_work_completion_evidence` must run before the feature is used.

## Validation

- Unit-test format, size, normalization, and metadata removal.
- PostgreSQL-test the checkout prerequisite and one-evidence uniqueness.
- Test unrelated-worker denial and both-party access.
- Manually verify replacement before checkout, lock after checkout, private
  media access, and production bucket privacy.

## Review Triggers

- Evidence becomes optional, supports multiple files, or includes video.
- Storage cost, upload failures, or runtime image processing exceed pilot
  limits.
- Legal/privacy review requires explicit consent, shorter retention, or
  deletion.
- Payment execution moves into Rintara.

## Supersession

None.
