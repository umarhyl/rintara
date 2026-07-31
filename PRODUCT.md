# Product
<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Summary

Rintara is an Indonesian local-work marketplace for fair, short, entry-level opportunities. It connects workers who need credible first experience with employers who need dependable local help. The product turns completed work into a system-issued Work Proof and rewards qualifying employers with an Opportunity Credit that can boost one published job for 24 hours.

## Primary Users

- Workers looking for transparent local jobs and a trustworthy first work record.
- Employers publishing fair jobs, reviewing applicants, agreeing on terms, and verifying completed work.
- Administrators moderating reports, users, categories, areas, and wage guidance.

## Core Loop

An employer publishes a fair First Opportunity job. An eligible worker applies with a short note. The employer accepts exactly one worker. Both parties confirm an immutable Mini Agreement. The worker checks in and checks out. The employer verifies completion. Rintara issues one Work Proof and, when eligible, one Opportunity Credit that can be redeemed for a 24-hour boost.

## Positioning

Rintara is not a generic job board. Its defining mechanism is a clear chain from fair opportunity to verified experience. Public terms reduce uncertainty before application, the Mini Agreement records the commitment, and the Rintara Passport presents system-issued proof rather than self-written claims.

## Operating Context

- Mobile-first use on representative low and mid-range devices.
- Low-bandwidth connections must remain usable.
- Indonesian end-user copy.
- Public locations stay approximate until a worker is accepted.
- Payment method and timing may be recorded, but payment happens outside Rintara.
- Business data is PostgreSQL-backed and all sensitive authorization remains server-side.

## Current Capabilities

- Public landing page, role guidance, category directory, product explanation,
  and job discovery.
- Sign-up, sign-in, sign-out, and account recovery states.
- Worker or Employer role selection.
- Worker and Employer onboarding.
- Role-specific navigation and dashboards.
- Worker applications and Rintara Passport.
- Employer job management, applicant review, agreement flow, completion verification, and Opportunity Credit redemption.
- Admin operational views.

## Scope Constraints

- No bidding, wage negotiation, escrow, payments, chat, identity documents, continuous GPS, worker search, AI matching, or multiple accepted workers per job.
- One account has one active MVP role.
- Full job address remains private outside the authorized agreement context.
- Work Proof is system-issued and not editable profile content.
- UI changes must preserve existing route, validation, mutation, authorization, privacy, and idempotency behavior.

## Brand Commitments

- Product name: Rintara.
- Voice: clear, respectful, direct, and encouraging without hype.
- Primary palette: Forest `#1C7C54`, Mint `#73E2A7`, Chalk `#DEF4C6`, Deep Forest `#1B512D`, and Leaf `#B1CF5F`.
- Preserve the green geometric Rintara **R** logo.
- Rintara uses one intentional light appearance. Do not expose a dark-mode or
  appearance switch.
- The durable visual world is a job-marketplace workspace: neutral and
  green-tinted tonal surfaces, Forest actions, compact rows, and gently
  squared controls.
- Tonal grouping and spacing replace repeated ornamental divider lines.
- The landing page is a Persuade-mode gateway led by a working search, not by
  claims. A Forest search panel sits directly beside a documentary local-work
  photograph and contains the task-and-area GET search.
- The homepage introduces factual information safeguards, active categories
  and areas, a compact Worker/Employer gateway, and Rintara's
  agreement-to-proof mechanism. Detailed role guidance lives on
  `/for-workers` and `/for-employers`; published-job listings remain
  exclusively on `/jobs`.
- Public navigation uses five direct destinations: **Untuk pekerja**,
  **Untuk pemberi kerja**, **Kategori kerja**, **Cara kerja**, and **Mengapa
  Rintara**. They resolve to `/for-workers`, `/for-employers`, `/categories`,
  `/how-it-works`, and `/why-rintara`; the header does not depend on homepage
  query/hash navigation or nested audience menus.
- The public header progressively condenses from a contained lightly frosted
  row into a stronger translucent blurred floating bar across the first 220
  CSS pixels of scroll.
- Sign-in, recovery, and password reset use a compact image-free
  authentication frame. Registration reuses its compact logo-and-return
  header above a route-owned Mint, Chalk, and Forest ellipse canvas without
  adopting the shared form frame. Its Peran step presents Employer first and
  Worker second with equal Mint graphic panels; the Akun step uses an opaque
  white surface, while Profil retains the narrow Forest identity rail.
- Role dashboards use a neutral sidebar and operational content density.
- Motion is limited to interaction state, loading feedback, sheets/dialogs,
  the public header's measured condensation, and one short registration-entry
  reveal. There is no staggered entrance, scroll-reveal choreography, or heavy
  motion system.
- Avoid generic SaaS spectacle, decorative cosmic effects, excessive cards, giant headings, oversized radii, artificial social proof, and ornamental motion.

## Design Principles

1. Put real opportunities and next actions before decoration.
2. Make wages, time, location, status, and consequences easy to scan.
3. Organize the product as a search-compare-act workspace, using hierarchy and whitespace before adding containers.
4. Treat forms and operational dashboards as calm tools, not marketing surfaces.
5. Let Work Proof and agreement states feel official without imitating government bureaucracy.
6. Use motion only to orient the registration entry, explain a state change, or acknowledge interaction; content remains visible without animation.

## Design Evidence and Boundaries

- The landing documentary asset is
  `public/visuals/rintara-local-work-v2.webp`.
- The registration ellipse composition is the committed local asset
  `public/visuals/rintara-register-curves.svg`.
- The implemented homepage composition in `app/page.tsx` is the current
  approved design reference.
- Upwork-like homepage hierarchy is composition inspiration only; do not copy its brand, wording, visual identity, ranking claims, social mechanics, or features.
- Do not invent metrics, testimonials, logos, demand claims, social proof, or payment capabilities. Payment remains outside Rintara.
- `DESIGN.md` owns reusable visual rules. `.impeccable/surfaces/app-page-tsx.md` owns landing-specific strategy.

## Accessibility and Quality

- Primary touch targets are at least 44 by 44 CSS pixels.
- Forms use persistent labels, visible focus, useful validation, preserved valid input, and duplicate-submission protection.
- Status never relies on color alone.
- Keyboard navigation and representative mobile and desktop layouts are required.
- Motion respects `prefers-reduced-motion`.
- Loading, empty, submitting, recoverable error, retry, forbidden, unavailable, and concurrent-state outcomes remain supported.

## Evidence Sources

- Product scope and priorities: `docs/product/PRD.md`
- Acceptance criteria: `docs/product/REQUIREMENTS.md`
- Domain invariants: `docs/product/BUSINESS_RULES.md`
- Routes and recovery: `docs/product/USER_FLOW.md`
- Existing UI contracts: `docs/design/UI_UX_DESIGN.md`
- Security and boundaries: `docs/engineering/ARCHITECTURE.md`
- Current repository code, tests, migrations, and deterministic seed data

No user testimonials, customer logos, usage metrics, or performance claims are established product evidence.
