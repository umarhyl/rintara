# Rintara Deployment Guide

> **Version:** 1.0  
> **Date:** July 18, 2026  
> **Status:** Provider-neutral MVP baseline

## 1. Purpose

This guide defines a safe deployment process for the Next.js application and managed PostgreSQL database. Concrete provider commands must be added only after the proposed platform ADR is accepted.

## 2. Environment Model

| Environment | Purpose | Data policy |
| --- | --- | --- |
| Local | Development and automated tests | Synthetic data in developer-controlled database |
| Preview | Pull-request and acceptance review | Synthetic data, isolated credentials, no production integration |
| Production | Public MVP and live demo | Controlled synthetic demo data plus legitimate pilot data under approved policy |

Never point local or preview reset/seed commands at production.

## 3. Provider Requirements

### Application platform

- supports the selected Next.js version and runtime;
- supports secure environment variables and preview isolation;
- supports server-side execution required by auth and database access;
- exposes deployment logs and health state;
- supports custom domain/HTTPS where required; and
- documents concurrency and execution limits.

### Managed PostgreSQL

- compatible PostgreSQL major version;
- pooled application connections and a direct migration connection when needed;
- automated backups and documented restore procedure;
- encrypted transport and storage controls;
- region acceptable for pilot data policy;
- query/connection observability; and
- a tested export/exit path.

## 4. Configuration Contract

The final `.env.example` should document names without values. Expected categories include:

| Configuration | Sensitivity | Purpose |
| --- | --- | --- |
| Application base URL | Public | Canonical redirects and links |
| Pooled database URL | Secret | Runtime queries |
| Direct database URL | Secret | Controlled migrations if provider requires it |
| Authentication secrets/keys | Secret | Session and provider integration |
| Authentication callback URL | Public/config | Provider redirect configuration |
| Check-in code pepper/key | Secret | Protect low-entropy code verification data |
| Rate-limit configuration | Mixed | Abuse control |
| Log level/release identifier | Non-secret | Operations and correlation |
| Demo-seed safety flag | Non-secret | Explicitly enable controlled demo behavior |

Rules:

- No secret uses a `NEXT_PUBLIC_*` name.
- Local, preview, and production use different credentials.
- Migration credentials are not exposed to normal client bundles or public logs.
- Secrets are rotated after accidental disclosure.
- Do not add provider-specific names to this document until the provider ADR is accepted.

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
- Application instances use pooled connections; migration tools may use a provider-approved direct connection.
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

- marking deadline-passed jobs expired;
- marking elapsed boosts ended; and
- deleting expired idempotency keys according to policy.

Public queries must remain correct even if a maintenance job is delayed: they still filter deadline-passed jobs and elapsed boosts by server time.

Scheduled endpoints require authentication/secret validation, idempotency, bounded work, logs without sensitive payloads, and safe retries.

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

## 14. Provider Decision Block

Do not finalize commands, regions, pricing, connection modes, auth callbacks, backup promises, or uptime claims until `docs/decisions/ADR-011-managed-platform-selection.md` is accepted with verified provider documentation.
