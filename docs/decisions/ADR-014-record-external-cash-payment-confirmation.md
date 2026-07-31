# ADR-014: Record Bounded External Cash Payment Confirmation

- **Status:** Accepted
- **Date:** 2026-07-31
- **Deciders:** Rintara team
- **Supersedes:** ADR-009 only where it prohibited attributed receipt statements
- **Related:** `docs/product/PRD.md`, `docs/product/BUSINESS_RULES.md`, `docs/engineering/DATABASE.md`

## Context

ADR-009 correctly keeps payment execution outside Rintara, but completed cash
jobs need a small shared record of whether the Employer says cash was given and
whether the Worker says it was received. This request was explicitly approved
through post-freeze change control. It must not become payment processing,
independent verification, evidence upload, or financial dispute resolution.

## Decision

Keep all payment execution outside Rintara. For a completed cash job only:

- the related Employer may record that cash was given;
- the related Worker may record received or not received;
- an unanswered Employer mark becomes eligible for `auto_confirmed` at the
  exact 48-hour deadline and is persisted by the next bounded authenticated
  daily maintenance run on Vercel Hobby;
- a Worker may correct an automatic result to not received; and
- all changes are transactional, notified, and audited.

The record is unique per agreement and contains only status and server
timestamps. It is an attributed party/system statement, not proof that funds
moved and not a Rintara guarantee. It never blocks completion, Work Proof, or
Opportunity Credit.

## Alternatives Considered

### Keep only agreement terms

Preserves the smallest scope but leaves the parties without a shared
post-completion acknowledgement.

### Upload payment proof

Rejected. It adds sensitive media, storage, authenticity, retention, and
moderation obligations.

### Gateway, escrow, wallet, or reconciliation

Rejected for the reasons in ADR-009 and remains outside the MVP.

## Consequences

### Positive

- Gives both parties a visible, auditable cash-receipt state.
- Does not collect financial credentials or introduce a payment provider.
- A not-received Worker response cannot be overwritten by automation.

### Negative and trade-offs

- Statements can be inaccurate and Rintara cannot prove payment occurred.
- Hourly maintenance is an operational dependency.
- Rintara does not mediate disagreement or guarantee payment.

## Security, Privacy, and Data Impact

Do not collect bank accounts, cards, payment tokens, wallet IDs, receipts, or
proof-of-payment files. Authorization requires the exact agreement party.
Notifications and audit metadata contain no address or financial credential.

## Validation

- Database uniqueness and timestamp/state checks pass.
- Authorization tests reject anonymous, wrong-role, and unrelated users.
- Integration tests cover received, not received, retry, 48-hour automatic
  confirmation, and correction after automatic confirmation.
- User copy always states that payment occurs outside Rintara.

## Review Triggers

Any gateway, escrow, wallet, payout, refund, fee, evidence upload, independent
verification, dispute resolution, or non-cash expansion requires a new PRD,
legal/security analysis, and superseding ADR.
