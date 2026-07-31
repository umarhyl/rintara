# Rintara Security Policy

## 1. Reporting a Vulnerability

Do not disclose a suspected vulnerability through a public issue, pull request, discussion, demo account, or shared screenshot.

Report it privately to the project maintainers through the team's approved private communication channel. Include:

- affected environment and feature;
- vulnerability category;
- minimal reproduction steps;
- expected and observed behavior;
- potential impact;
- whether personal data or credentials may be involved; and
- suggested mitigation, if known.

Do not include real credentials, full addresses, authentication tokens, check-in codes, or unrelated personal data in the report. The team must define a concrete private contact method before public launch.

## 2. Supported Versions

During the MVP, only the current production deployment and current mainline release candidate receive security fixes. Preview and local environments are not supported as public services and must use synthetic data.

## 3. Security Priorities

Rintara treats these as release-blocking:

- authentication bypass;
- cross-account or cross-role resource access;
- exposure of full work addresses or private agreement details;
- duplicate acceptance, Work Proof, credit, or redemption caused by concurrency;
- ability to forge verification, eligibility, credits, or admin status;
- SQL injection, stored cross-site scripting, CSRF against protected mutations, or secret leakage;
- plaintext check-in code storage or logging;
- unsafe production reset/migration behavior; and
- exposure of government IDs, bank data, or other data the MVP must not collect.

## 4. Security Boundaries

- The browser is untrusted.
- Identity comes from a validated server session.
- Role and account status come from trusted server data.
- Ownership and party relationship are verified for every private resource.
- PostgreSQL constraints and transactions are the final integrity boundary.
- Full addresses exist only in private projections.
- Check-in codes are short-lived, single-use, attempt-limited, and stored using an approved one-way/keyed construction.

Detailed controls and threat analysis are in `docs/engineering/SECURITY_MODEL.md`.

## 5. Data Minimization

The MVP must not collect:

- government identity documents or selfies;
- bank-account or payment-card details;
- continuous GPS location;
- private chat;
- full birth dates; or
- background-check records.

One private result photo per work session is collected as approved in ADR-013.
It is normalized without embedded metadata, stored in private object storage,
and served only to the related worker, employer, or authorized admin. It is
excluded from public projections and Passport.

Payment happens outside the platform. Do not ask users to place payment credentials in job descriptions, application notes, reports, or agreement fields.

## 6. Secret Handling

- Store secrets only in approved local/deployment secret management.
- Commit a `.env.example` with names and safe descriptions, never values.
- Never expose server secrets through `NEXT_PUBLIC_*` variables.
- Rotate any credential that appears in logs, commits, screenshots, chat, or issue trackers.
- Use separate credentials for local, preview, and production environments.
- Apply least-privilege database credentials and restrict migration credentials to deployment operations.

## 7. Dependency and Supply-Chain Safety

- Use the committed lockfile.
- Review new dependencies for maintenance, license, transitive risk, and actual need.
- Avoid dependencies that duplicate a platform or standard-library capability for a small task.
- Do not perform broad major-version upgrades during release hardening.
- Address critical reachable vulnerabilities before release or record an approved mitigation.

## 8. Safe Testing

- Use synthetic accounts, addresses, jobs, and reports.
- Run security tests only against environments the team controls.
- Do not perform destructive, denial-of-service, or high-volume testing against production.
- Keep vulnerability evidence private and minimize retained sensitive data.

## 9. Incident Handling

Follow `docs/operations/INCIDENT_RESPONSE.md` for containment, evidence preservation, notification, recovery, and post-incident review.
