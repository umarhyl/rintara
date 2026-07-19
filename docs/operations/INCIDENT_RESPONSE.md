# Rintara Incident Response Runbook

> **Version:** 1.0  
> **Date:** July 18, 2026  
> **Status:** MVP operational baseline

## 1. Purpose

This runbook defines how the team detects, contains, investigates, recovers from, and learns from incidents affecting Rintara security, privacy, data integrity, or availability.

It is not a legal notification policy. The team must obtain appropriate guidance before a public pilot involving real personal data.

## 2. Incident Categories

- Authentication or session compromise.
- Unauthorized cross-account access.
- Full-address or agreement-data exposure.
- Forged or duplicated acceptance, proof, credit, or boost.
- Data loss or corruption.
- Secret or credential disclosure.
- Malicious content or stored XSS.
- Production deployment outage.
- Unsafe migration, seed, or reset.
- Third-party authentication/database/platform outage.

## 3. Severity

| Severity | Definition | Examples |
| --- | --- | --- |
| SEV-1 Critical | Active or likely material compromise, broad private-data exposure, destructive corruption, or full production loss during critical use | Auth bypass, public full-address leak, production reset, leaked production database credential |
| SEV-2 High | Significant feature/security failure with limited scope or reliable workaround | Cross-employer access to one resource class, duplicate accepted worker, completion integrity failure |
| SEV-3 Medium | Degraded non-critical behavior or contained defect without confirmed sensitive exposure | Notifications unavailable, admin queue delayed, one browser flow broken |
| SEV-4 Low | Minor operational issue with negligible impact | Copy defect, cosmetic status mismatch |

When uncertain, start at the higher reasonable severity and downgrade with evidence.

## 4. Roles

Assign named people before launch:

- **Incident lead:** owns decisions and timeline.
- **Technical lead:** investigates and coordinates containment/recovery.
- **Security/privacy lead:** assesses exposure and notification obligations.
- **Communications owner:** provides approved internal/external updates.
- **Scribe:** records timestamps, actions, evidence, and decisions.

One person may hold multiple roles in a small team, but incident lead and scribe responsibilities must remain explicit.

## 5. Response Process

### 5.1 Detect and declare

1. Record reporter, time, environment, release, and observable symptoms.
2. Create a private incident record.
3. Assign initial severity and incident lead.
4. Preserve request IDs and relevant logs without copying unnecessary personal data.

### 5.2 Contain

Choose the least destructive effective action:

- disable or gate the affected command/route;
- hide affected public data;
- suspend compromised accounts;
- revoke/rotate credentials;
- block a release or roll back compatible application code;
- restrict database access; or
- temporarily take the service offline.

Do not delete evidence or run unreviewed data repair.

### 5.3 Assess scope

Determine:

- first and last known occurrence;
- affected users, roles, resources, and environments;
- data classes accessed or modified;
- whether exploitation is confirmed, possible, or ruled out;
- relevant release and migration versions;
- provider involvement; and
- integrity of audit and backup data.

### 5.4 Eradicate and recover

- fix the root cause, not only the visible symptom;
- add a regression test;
- rotate affected credentials;
- repair data through reviewed scripts/migrations;
- restore from backup only with understood recovery-point impact;
- deploy using the normal controlled process; and
- run focused security, integrity, and smoke checks.

### 5.5 Communicate

Internal updates state facts, unknowns, current impact, actions, owner, and next update trigger. Avoid speculation and copied sensitive data.

External/user communication must be approved by the incident lead and privacy/legal owner. Do not promise timelines or conclusions not supported by evidence.

### 5.6 Close and learn

Close only when:

- containment is stable;
- recovery is verified;
- affected credentials/data are handled;
- monitoring shows no recurrence;
- required communication is complete; and
- follow-up owners and deadlines exist.

## 6. Scenario Playbooks

### Full-address exposure

1. Remove the affected public projection/page/cache.
2. Identify which addresses, users, and time range were exposed.
3. Purge safe caches and verify page source/metadata/logs.
4. Fix projection allowlist and add negative tests.
5. Assess notification obligations privately.

### Credential or secret leak

1. Revoke/rotate immediately.
2. Search source history, logs, screenshots, CI artifacts, and communication channels.
3. Remove exposure without rewriting shared history destructively unless coordinated.
4. Review access logs for misuse.
5. Replace dependent credentials if the blast radius is uncertain.

### Duplicate acceptance/proof/credit

1. Disable the affected command if duplication can continue.
2. Preserve database rows and request IDs.
3. Identify missing transaction, idempotency, or constraint control.
4. Reconcile through a reviewed script with audit entries; do not delete rows manually.
5. Add concurrency regression tests.

### Unsafe migration or reset

1. Stop all related jobs/deployments.
2. Block writes if continued mutation increases loss.
3. Preserve current database and logs.
4. Determine last valid backup/recovery point.
5. Choose forward repair or restore with explicit data-loss assessment.
6. Fix environment guards before re-enabling automation.

### Authentication provider outage

1. Confirm provider status through authoritative channels.
2. Avoid repeated configuration changes without evidence.
3. Preserve existing sessions according to provider security guidance.
4. Communicate sign-in limitations without exposing provider internals.
5. Verify callbacks and session behavior after recovery.

## 7. Evidence Handling

- Keep incident records private and access-limited.
- Prefer request IDs, row IDs, and time ranges over copied payloads.
- Redact full addresses, tokens, codes, and free text.
- Record who collected evidence, when, and from which environment.
- Do not put sensitive evidence in public issues or normal pull requests.

## 8. Post-Incident Review

Complete a blameless review for SEV-1 and SEV-2 and for repeated SEV-3 incidents.

Template:

- summary and impact;
- detection method;
- timeline;
- root and contributing causes;
- what worked and failed;
- containment and recovery decisions;
- data/security assessment;
- corrective actions with owners/dates;
- documentation/ADR changes; and
- measurable prevention/detection improvements.

Do not use “human error” as a root cause without identifying the missing system guard.

## 9. Readiness Checklist

- [ ] Private incident channel and contact method exist.
- [ ] Incident roles are assigned.
- [ ] Production release and request IDs are observable.
- [ ] Provider support/status contacts are documented privately.
- [ ] Credential rotation procedures are known.
- [ ] Backup restore has been tested.
- [ ] Feature/route containment options are known.
- [ ] Security and privacy escalation owner is assigned.
- [ ] Post-incident template is available.
