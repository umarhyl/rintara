# Rintara Documentation Index

This directory is the entry point for Rintara product, design, engineering, delivery, operational, and decision documentation.

## 1. Source-of-Truth Order

1. Latest explicit team decision.
2. `docs/product/PRD.md` for product scope and priority.
3. `docs/product/BUSINESS_RULES.md` for domain behavior.
4. `docs/product/REQUIREMENTS.md` for acceptance criteria.
5. Relevant technical specification or accepted ADR for implementation details.

If documents conflict, treat it as a defect. Do not silently choose an interpretation. Update every affected document in the same change.

## 2. Product

| Document | Purpose |
| --- | --- |
| [`product/PRD.md`](./product/PRD.md) | Vision, target users, MVP scope, success metrics, risks, and change control |
| [`product/REQUIREMENTS.md`](./product/REQUIREMENTS.md) | Testable functional and non-functional requirements |
| [`product/BUSINESS_RULES.md`](./product/BUSINESS_RULES.md) | Domain definitions, state machines, invariants, and reward rules |
| [`product/USER_FLOW.md`](./product/USER_FLOW.md) | Worker, employer, administrator, error, and recovery flows |

## 3. Design

| Document | Purpose |
| --- | --- |
| [`design/UI_UX_DESIGN.md`](./design/UI_UX_DESIGN.md) | Information architecture, screens, copy, responsive behavior, and accessibility |

## 4. Engineering

| Document | Purpose |
| --- | --- |
| [`engineering/ARCHITECTURE.md`](./engineering/ARCHITECTURE.md) | System boundaries, module structure, scaling, security, and deployment model |
| [`engineering/DATABASE.md`](./engineering/DATABASE.md) | ERD, PostgreSQL schema, constraints, indexes, projections, and transactions |
| [`engineering/API.md`](./engineering/API.md) | Queries, commands, DTOs, authorization, errors, caching, and idempotency |
| [`engineering/TESTING.md`](./engineering/TESTING.md) | Test layers, fixtures, required scenarios, and CI gates |
| [`engineering/DEPLOYMENT.md`](./engineering/DEPLOYMENT.md) | Environments, configuration, migrations, rollout, smoke tests, and rollback |
| [`engineering/SECURITY_MODEL.md`](./engineering/SECURITY_MODEL.md) | Trust boundaries, threat model, data classification, and control checklist |

## 5. Delivery and Operations

| Document | Purpose |
| --- | --- |
| [`delivery/ROADMAP.md`](./delivery/ROADMAP.md) | Milestones, feature freeze, risks, and release gates |
| [`operations/DEMO_RUNBOOK.md`](./operations/DEMO_RUNBOOK.md) | Deterministic live-demo setup, timing, reset, and fallback |
| [`operations/INCIDENT_RESPONSE.md`](./operations/INCIDENT_RESPONSE.md) | Severity, containment, recovery, communication, and postmortem process |

## 6. Architecture Decisions

The ADR register, template, and decision records are under [`decisions/`](./decisions/README.md).

Accepted ADRs are implementation constraints. Proposed ADRs record an unresolved choice and must not be treated as approved.

## 7. Repository Governance

- [`../AGENTS.md`](../AGENTS.md) — AI-agent and contributor implementation rules.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution and review workflow.
- [`../SECURITY.md`](../SECURITY.md) — private vulnerability reporting and security policy.

## 8. Documentation Maintenance

- Use English for technical documentation and identifiers.
- Use relative Markdown links.
- Prefer one authoritative location for a detailed rule and link to it elsewhere.
- Include version/date/status metadata where a document is release-sensitive.
- Update code and documentation in the same change.
- Add an ADR for decisions with material, long-lived architectural consequences.
- Never rewrite the decision of an accepted ADR; supersede it with a new ADR.

The canonical system specifications live under `docs/engineering/`. Files under `docs/system/` are retained only as legacy compatibility copies and must not be edited or treated as authoritative.

## 9. Diagram and Image Assets

Mermaid diagrams should remain near the text they explain. Store external images and reusable diagram source files under [`assets/`](./assets/README.md) only when inline Markdown is insufficient.
