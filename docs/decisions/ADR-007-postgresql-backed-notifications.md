# ADR-007: Use PostgreSQL-Backed In-App Notifications

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Rintara team
- **Related:** `docs/engineering/API.md`, `docs/engineering/ARCHITECTURE.md`

## Context

Workers and employers need updates for applications, agreements, attendance, completion, proof, credits, boosts, and reports. The MVP does not require chat or guaranteed instant delivery.

Adding a realtime service, message broker, or push-notification platform would expand infrastructure and failure modes during a short delivery window.

## Decision Drivers

- Durable notification history.
- Consistency with committed business state.
- Private per-recipient access.
- Low operational complexity.
- Acceptable UX with revalidation or bounded polling.

## Options Considered

### PostgreSQL notifications with revalidation/polling

Store notification rows in the same database and load them through private queries. Refresh after known mutations and through light bounded polling where needed.

### Dedicated realtime subscription service

Provides lower latency but adds provider coupling, subscriptions, authorization, connection management, and operational complexity.

### Email/SMS/WhatsApp delivery

Useful for reach but introduces external providers, personal contact data, delivery policy, cost, and abuse/compliance concerns outside MVP scope.

## Decision

Store in-app notifications in PostgreSQL. Use normal Next.js revalidation after mutations and optional light bounded polling on the notification center or indicator.

No dedicated realtime, push, email, SMS, or messaging infrastructure is required for the MVP.

Notifications representing a critical committed state are created consistently with the domain transaction.

## Rationale

The MVP needs correctness and visibility, not millisecond delivery. PostgreSQL provides durable recipient-scoped records with no extra source of truth.

## Consequences

### Positive

- Simple data and authorization model.
- Notification history survives reconnects.
- Critical notification state matches business transactions.

### Negative and trade-offs

- Updates may not appear instantly without refresh/polling.
- Polling adds recurring reads.
- Browser/system push is unavailable.

### Follow-up

- Bound polling interval and page size.
- Index recipient/unread/time queries.
- Keep copy free of full addresses, codes, and private moderator notes.

## Security, Privacy, and Data Impact

Notification queries always scope to the current recipient. Payloads use controlled types, safe entity identifiers, and short copy; they do not embed sensitive domain objects.

## Operational Impact

Monitor table growth and query latency. Archive or retention policy is deferred until real volume exists.

## Validation

- Users cannot read or mark another user's notification.
- Critical events create exactly the documented notifications.
- Refresh/polling does not leak private data through shared cache.

## Review Triggers

- Measured UX requires lower latency.
- Mobile/web push becomes approved scope.
- Notification volume creates material database load.
- A durable background job system is adopted for another justified need.
