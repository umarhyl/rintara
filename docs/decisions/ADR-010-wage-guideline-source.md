# ADR-010: Select and Govern the Wage Guideline Source

- **Status:** Proposed
- **Date:** 2026-07-18
- **Decision deadline:** Before final production seed and public wage claims
- **Deciders:** Product lead, data owner, security/privacy reviewer
- **Related:** `docs/product/BUSINESS_RULES.md`, `docs/engineering/DATABASE.md`

## Context

First Opportunity jobs require a compliant Wage Guideline status. Rintara must therefore map an area, category, and wage unit to a defensible reference value.

An unsupported internal number could mislead workers and jurors, especially if presented as a legal minimum. Available official wage data may not map directly to short informal tasks or all units.

The competition demo can use simulation data only when it is visibly labeled and never described as law.

## Decision Drivers

- Credibility and traceability.
- Appropriate area/category/unit coverage.
- Effective date and update process.
- Legal wording and source limitations.
- Low data-collection/privacy risk.
- Ability to seed deterministically for the demo.

## Options Considered

### Validated authoritative/public source

Use an official or otherwise defensible source and document how values map into Rintara categories and units.

Benefits: strongest credibility and traceability. Risks: source may be coarse, outdated, legally nuanced, or not directly comparable to short jobs.

### Expert/partner-curated reference

Use a documented methodology with local labor/community input.

Benefits: better fit to informal categories. Risks: validation, bias, governance, and update burden.

### Clearly labeled simulation data

Use synthetic reference values solely for competition demonstration.

Benefits: deterministic and fast. Risks: no production validity and potentially misleading if labeling is weak.

## Proposed Decision

Use this hierarchy:

1. Prefer a validated source with recorded title, URL/reference, effective date, area, category/unit mapping, and limitations.
2. If a valid production source is not ready by the competition deadline, use simulation data only in the demo environment with `is_simulated = true` and prominent labeling.
3. Do not launch a real public pilot with simulation data governing First Opportunity eligibility without explicit product/data approval.

The UI must say “Rintara reference” rather than “legal minimum” unless legal validation supports the stronger statement.

This remains proposed until the actual source and mapping methodology are reviewed.

## Acceptance Evidence

The decision record must be updated with:

- source owner and authority;
- exact source/version/effective date;
- pilot area coverage;
- mapping from source categories to Rintara categories;
- unit conversion methodology, if any;
- treatment of duration, tools, and task complexity;
- limitations and approved user-facing wording;
- update/review schedule; and
- example validation against seeded jobs.

## Consequences of the Proposal

### Positive

- Preserves honesty during the competition.
- Creates a path from simulation to governed production data.
- Keeps source metadata in the schema and interface.

### Negative and trade-offs

- First Opportunity coverage may be limited where no valid guideline exists.
- Simulation labeling may weaken the demo claim but is more credible than false authority.
- Production launch requires additional data work.

## Security, Privacy, and Data Impact

Prefer public/aggregate source data. Do not ingest worker-level wage records or personal data for the MVP.

## Operational Impact

Admin workflow must support effective dates, source metadata, simulation state, and controlled replacement without overlapping active records.

## Validation

- Every active guideline has source label, effective date, unit, and simulation state.
- UI displays approved wording and simulation labels.
- First Opportunity publishing is blocked when status is below or unavailable.

## Review Triggers

- Pilot area/category expansion.
- Source methodology or legal interpretation changes.
- Evidence that guideline values systematically misrepresent real work.
