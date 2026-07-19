# ADR-009: Keep Payment Execution Outside Rintara for the MVP

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** `docs/product/PRD.md`, `docs/product/BUSINESS_RULES.md`

## Context

Rintara must show a fair wage and record payment method/timing in the Mini Agreement. Executing payments or escrow would introduce regulated financial data, provider integration, failure/reconciliation flows, refunds, disputes, fees, and materially different security obligations.

The MVP's differentiator is verified first-opportunity experience and employer incentives, not payment processing.

## Decision Drivers

- Competition delivery window.
- Avoid storing financial credentials.
- Keep focus on the opportunity-to-proof loop.
- Avoid implying payment guarantee or escrow protection.
- Reduce legal, security, and operational complexity.

## Options Considered

### Record terms; payment outside Rintara

Rintara stores wage, unit, method description, and timing in the agreement. Parties execute payment externally.

### Payment-gateway integration

Rintara initiates payment but must handle provider callbacks, failure, reconciliation, and support.

### Escrow/platform wallet

Offers stronger payment workflow but introduces the highest financial, regulatory, security, and operational burden.

## Decision

For the MVP, Rintara does not hold, route, initiate, verify, guarantee, or reconcile payment.

Rintara records:

- fixed wage amount and unit;
- outside-platform payment method description; and
- agreed payment timing.

User-facing copy clearly states that payment happens outside Rintara.

## Rationale

This preserves transparency while avoiding a second product and risk domain that would jeopardize the core MVP.

## Consequences

### Positive

- No bank/card/wallet data.
- No payment callbacks, ledger, reconciliation, refund, or escrow state.
- Smaller security and support surface.

### Negative and trade-offs

- Rintara cannot prove that payment occurred.
- Parties resolve payment execution outside the platform.
- Rintara cannot offer escrow protection or payment guarantees.

### Follow-up

- Avoid copy suggesting payment protection.
- Reports may record a general terms mismatch, but Rintara does not mediate funds.
- Remove all legacy Midtrans, escrow, wallet, and balance assumptions.

## Security, Privacy, and Data Impact

Do not collect bank accounts, cards, payment tokens, wallet identifiers, or proof-of-payment files. Free-text fields should warn users not to enter financial credentials.

## Operational Impact

No payment provider, financial reconciliation, payout operations, or refund support is needed for MVP.

## Validation

- Schema and API contain no payment credential, escrow, wallet, transaction, or payout model.
- Product copy states the outside-platform boundary.
- Golden path completes without a payment integration.

## Review Triggers

Any proposal for gateway payment, escrow, wallet, fee, subscription, payout, refund, or payment verification requires a new PRD, legal/security analysis, and superseding ADR.
