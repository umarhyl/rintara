# Rintara Deployment Guide

> **Version:** 1.0  
> **Date:** July 18, 2026  
> **Status:** Vercel and Supabase MVP baseline

## 1. Purpose

This guide defines a safe deployment process for the Next.js application on
Vercel, Supabase Managed PostgreSQL, and the private Supabase Storage path
approved in ADR-013. Provider-specific region, plan, limits, and restore
evidence remain production-readiness gates.

## 2. Environment Model

| Environment | Purpose | Data policy |
| --- | --- | --- |
| Local | Development and automated tests | Synthetic data in developer-controlled database |
| Review | Manually triggered preview or acceptance review | Synthetic data, isolated credentials, no production integration |
| Production | Public MVP and live demo | Controlled synthetic demo data plus legitimate pilot data under approved policy |

Never point local or review reset/seed commands at production.

## 3. Provider Requirements

### Vercel application platform

- supports the selected Next.js version and runtime;
- supports secure environment variables and preview isolation;
- supports server-side execution required by auth and database access;
- exposes deployment logs and health state;
- supports custom domain/HTTPS where required; and
- documents concurrency and execution limits.

### Supabase Managed PostgreSQL

- compatible PostgreSQL major version;
- pooled application connections and a direct migration connection when needed;
- automated backups and documented restore procedure;
- encrypted transport and storage controls;
- region acceptable for pilot data policy;
- query/connection observability; and
- a tested export/exit path.

### Supabase private object storage

- private `work-completion-evidence` bucket;
- 5 MB object limit and normalized `image/webp` allowlist;
- server-only service-role access;
- storage usage/error visibility and an unattached-object cleanup procedure;
- no public bucket URLs or client-bundled administrative credential; and
- retention/deletion policy approved before long-lived public-user storage.

## 4. Configuration Contract

The final `.env.example` should document names without values. Expected categories include:

| Configuration | Sensitivity | Purpose |
| --- | --- | --- |
| Application base URL | Public | Canonical redirects and links |
| Pooled database URL | Secret | Runtime queries |
| Direct database URL | Secret | Controlled migrations if provider requires it |
| Authentication secrets/keys | Secret | Session and provider integration |
| Supabase service-role key | Secret | Server-only private completion-evidence object access |
| Authentication callback URL | Public/config | Provider redirect configuration |
| Check-in code pepper/key | Secret | Protect low-entropy code verification data |
| Rate-limit configuration | Mixed | Abuse control |
| Log level/release identifier | Non-secret | Operations and correlation |
| Local/test seed safety flag | Non-secret | Explicitly enable synthetic local/test fixtures |
| Maintenance secret | Secret | Authenticate bounded expiry operations |
| Release identifier | Non-secret | Identify the deployed build in shallow health responses |

Rules:

- No secret uses a `NEXT_PUBLIC_*` name.
- Local, preview, and production use different credentials.
- Migration credentials are not exposed to normal client bundles or public logs.
- Secrets are rotated after accidental disclosure.
- `NEXT_PUBLIC_SUPABASE_URL` and the publishable key may be exposed only as intended by Supabase Auth; database passwords, direct/pooler URLs, service-role keys, and code peppers remain server-only secrets.
- `RINTARA_APP_URL` is the canonical origin used to build `/auth/callback`; each environment must allowlist that callback in its isolated Supabase project.
- Production must set `RINTARA_ENV=production`; startup/build access to the
  runtime database configuration fails instead of falling back to a placeholder
  when `DATABASE_URL` is missing.
- Keep `CHECK_IN_CODE_PEPPER` stable and secret. Rotating it invalidates every
  outstanding 15-minute check-in code, so employers must generate replacement
  codes after a rotation.
- `SUPABASE_SERVICE_ROLE_KEY` is required only on the server. Rotate it
  immediately if exposed; never prefix it with `NEXT_PUBLIC_`.
- Seed commands are limited to loopback local/test databases and refuse
  preview, demo, production, and every remote database. Prepare remote demo
  accounts and jobs through the normal application flows.

## 5. Build Requirements

Before deployment:

- install dependencies from the committed lockfile;
- use the declared Node/package-manager versions;
- run strict type checking and lint;
- run required unit/integration tests;
- create the production build;
- verify migrations against an isolated database; and
- verify required environment names without printing values.

Builds must not depend on production data being available at build time unless explicitly designed and documented.

## 6. Migration Strategy

- Migrations are committed, ordered, and reviewed.
- Deployment runs migrations as a controlled step, not concurrently from every application instance.
- Vercel runtime instances use a Supabase pooled connection appropriate to serverless traffic.
- Migration tools use the Supabase direct PostgreSQL connection when reachable from the controlled migration environment, or another Supabase-supported connection explicitly verified for migrations.
- Transaction-mode pooling does not support prepared statements; configure the selected PostgreSQL driver accordingly when that mode is used.
- Backward-compatible expand/migrate/contract changes are preferred when a deployment may run mixed versions.
- Destructive changes require backup, explicit approval, and forward-recovery plan.
- Do not edit an applied migration.

For the MVP, favor additive schema changes and status transitions over destructive cleanup.

## 7. Deployment Sequence

1. Confirm approved commit/release candidate and freeze status.
2. Review migration diff and backup/restore readiness.
3. Run automated checks.
4. Create or verify a recent production backup.
5. Apply migrations once using controlled credentials.
6. Deploy the application build.
7. Run health and smoke tests.
8. Monitor errors, database connections, latency, and critical commands.
9. Record release identifier, migration version, operator, and outcome.

If the platform deploys application before migration, design the change for both schema versions or reverse the safe order according to the specific migration plan.

## 8. Production Smoke Test

Use synthetic smoke accounts and avoid changing real workflows.

- [ ] Public landing, discovery, and one job detail load.
- [ ] Hidden/private fields are absent from anonymous output.
- [ ] Worker and employer sign-in/role routing work.
- [ ] Authorized dashboards load.
- [ ] A safe create/read action reaches PostgreSQL.
- [ ] Notifications query is private to the current user.
- [ ] Health endpoint returns minimal expected output.
- [ ] Worker uploads one valid result photo after check-in; unrelated users
  cannot read it; replacement stops after checkout.
- [ ] The `work-completion-evidence` bucket remains private and upload/download
  failures are visible in operational logs without photo contents.
- [ ] Logs show release identifier and no secrets/PII.

Run the full demo only in the approved demo dataset/environment.

## 9. Rollback and Forward Recovery

### Application-only defect

Redeploy the previous compatible application release. Confirm its compatibility with the current schema before rollback.

### Migration defect

Prefer a forward corrective migration when data has already changed. Use backup restore only when the impact and recovery point are understood and approved.

### Security or privacy defect

Contain first: disable the affected route/feature, suspend compromised credentials, restrict access, or temporarily remove the deployment. Follow `docs/operations/INCIDENT_RESPONSE.md`.

Never use an unreviewed destructive database command as an emergency shortcut.

## 10. Backup and Restore

Before production launch, record:

- backup frequency and retention;
- point-in-time recovery availability;
- restore target and responsible operator;
- last successful restore test;
- expected recovery point and recovery time; and
- procedure for verifying integrity after restore.

A backup is not considered operationally useful until a restore has been tested in an isolated environment.

## 11. Scheduled Operations

The MVP may need protected scheduled operations for:

- marking unfilled jobs expired at the selection cutoff 24 hours before
  `starts_at`;
- marking elapsed boosts ended; and
- deleting expired idempotency keys according to policy.

Public queries must remain correct even if a maintenance job is delayed: they
still filter deadline-passed jobs and elapsed boosts by server time.
`acceptApplication` must independently reject a selection-cutoff-passed job
even while its persisted status is still `published`.

Scheduled endpoints require authentication/secret validation, idempotency, bounded work, logs without sensitive payloads, and safe retries.
Configure the platform scheduler to call
`GET /api/maintenance/expire-jobs` with the bearer maintenance secret. The
schedule must run frequently enough that selection-cutoff state does not remain
stale during the pilot.

The committed Vercel configuration runs this operation daily at `17:00 UTC`
(`00:00 Asia/Jakarta`) so it remains compatible with the Hobby plan. Set
`CRON_SECRET` to a random value of at least 32 bytes in the Vercel Production
environment; Vercel sends it automatically as a bearer token. Manual schedulers
may instead use `RINTARA_MAINTENANCE_SECRET`.

## 12. Connection and Scaling Controls

- Use pooled runtime connections sized below provider limits.
- Avoid opening a new pool per request.
- Keep transactions short.
- Paginate growing lists.
- Monitor pool saturation and slow queries.
- Scale application instances only after ensuring aggregate database connections remain safe.
- Optimize queries/indexes before adding replicas or caches.

## 13. Demo Deployment Safety

- Use synthetic users and addresses.
- Reset requires an explicit environment allowlist and must refuse production by default.
- Keep demo passwords/credentials outside source control.
- Prepare two isolated browser sessions.
- Verify credit and report seed state immediately before rehearsal.

See `docs/operations/DEMO_RUNBOOK.md`.

## 14. Provider Readiness Block

Before production release, record the actual Supabase region and plan, Vercel and Supabase limits, selected runtime and migration connection modes, authentication callbacks, environment isolation, and a tested backup/restore procedure. Backup availability and retention vary by Supabase plan, so do not promise a recovery capability that has not been verified for the configured project.

Automatic Vercel builds are limited to the `main` production branch. Pushes to `dev` and other branches do not build automatically; Umar may trigger an isolated review deployment manually when milestone acceptance requires one.
