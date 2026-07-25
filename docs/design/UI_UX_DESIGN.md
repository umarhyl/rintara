# Rintara UI/UX Design Guidelines

> **Version:** 3.1
>
> **Date:** July 19, 2026
>
> **Status:** MVP experience and interface baseline
>
> **Flows:** `docs/product/USER_FLOW.md`

## 1. Experience Objectives

Rintara must feel clear, fair, and trustworthy to people who may have limited marketplace experience, digital confidence, screen size, or connectivity.

The interface should help users answer five questions quickly:

1. What work is required?
2. Where and when will it happen?
3. How much and how will I be paid?
4. What is my next action?
5. What proof or consequence follows that action?

The MVP optimizes for successful completion of the golden path, not time spent in the application.

## 2. Design Principles

1. **Clarity before density.** Prefer short sections, direct labels, and progressive disclosure.
2. **Fairness is visible.** Wage, task, schedule, and First Opportunity rules are never hidden behind a call to action.
3. **Privacy is explained.** Label the full address as visible only to the accepted worker.
4. **Status is explicit.** Use text and icon in addition to color.
5. **Consequences precede confirmation.** Explain acceptance, completion, cancellation, and credit redemption before the final action.
6. **Recovery is part of the flow.** Errors state what happened, what remains safe, and the next step.
7. **Low bandwidth is a normal case.** Avoid heavy visual assets and unnecessary client-side JavaScript.
8. **Mobile first, not mobile only.** Core screens remain efficient on desktop for employers and admins.

## 3. Language and Terminology

Repository documentation and code identifiers use English. Default end-user copy uses clear Indonesian unless the team approves another localization strategy.

| Use | Avoid in user-facing copy |
| --- | --- |
| Employer / Pemberi kerja | Client |
| Apply / Lamar | Bid, bidding |
| Wage / Upah | Price offer |
| First Opportunity / Kesempatan Pertama | Unpaid trial |
| Mini Agreement / Kesepakatan Kerja | Escrow contract |
| Work Proof / Bukti Kerja | Self-verified certificate |
| Rintara Passport / Paspor Rintara | Editable portfolio |
| Opportunity Credit / Kredit Kesempatan | Cash balance |
| Boost | Guaranteed placement |

Content rules:

- Use short active sentences.
- Explain unfamiliar terms beside first use.
- Do not promise guaranteed employment, payment, safety, or worker quality.
- Do not describe internal Wage Guidelines as legal minimum wages without validation.
- Do not imply that Opportunity Credits have cash value.

## 4. Visual Direction

Rintara's visual character is practical, optimistic, and credible. The product should avoid both corporate recruitment stiffness and gamified marketplace pressure.

### Provisional color tokens

| Token | Value | Use |
| --- | --- | --- |
| `primary-700` | `#1D4ED8` | Primary action, active navigation |
| `primary-50` | `#EFF6FF` | Informational backgrounds |
| `opportunity-600` | `#B45309` | First Opportunity emphasis with accessible text treatment |
| `opportunity-50` | `#FFFBEB` | Opportunity surface |
| `success-700` | `#15803D` | Verified/completed status |
| `danger-700` | `#B91C1C` | Destructive action and critical error |
| `neutral-950` | `#0F172A` | Main text |
| `neutral-600` | `#475569` | Secondary text |
| `neutral-200` | `#E2E8F0` | Borders and dividers |
| `surface` | `#FFFFFF` | Main surface |

Validate actual text/background combinations for WCAG 2.2 AA. Do not use opportunity amber as the sole status signal or as small text on white without contrast verification.

### Typography

- Use a performant system or approved variable sans-serif font.
- Base body text is at least 16 CSS pixels.
- Body line height targets 1.5 or greater.
- Use no more than four clear typographic levels per screen.
- Numeric wage receives strong emphasis near the job title.

### Shape and elevation

- Moderate corner radius, consistent across fields, cards, and dialogs.
- Use borders and spacing before shadows.
- Reserve elevation for dialogs, menus, and sticky action surfaces.
- Avoid decorative gradients or motion that competes with task information.

### Jejak visual system

The product uses a restrained **Jejak/Rute** motif to connect Opportunity, Agreement, and Work Proof without turning the workflow into a game.

- Prefer open editorial composition, dividers, and connected timelines over repeating equal cards on every screen.
- Use elevation only for interactive or sticky surfaces; informational groups may sit directly on the page.
- A custom three-node route mark represents the product. Do not substitute emoji or generic sparkle artwork.
- Light and dark themes must preserve the same information hierarchy and expose an animated, accessible theme switch.
- Desktop public navigation follows immediately after the Rintara identity instead of floating at the viewport center; account actions remain aligned at the opposite edge.
- Hero and authentication backgrounds use a lightweight Canvas 2D field of dotted route orbits on capable devices. Light mode uses saturated ink-like particles while dark mode uses brighter cosmic particles, and both preserve readable space beneath text.
- Fine pointers quickly displace and enlarge nearby particles with a bounded convex response. Coarse pointers, data-saving mode, `prefers-reduced-motion`, and very-low-power hardware receive a static CSS particle layer without allocating a canvas buffer; offscreen or hidden canvases pause entirely.
- The landing eyebrow is a compact animated opportunity label without a leading rule or underline. Agreement and Passport proof artifacts sit in one non-overlapping row and remain readable at narrow widths.
- Keep the particle field isolated to prominent hero/authentication surfaces. Its adaptive budget is at most 30 frames per second on a typical device and 24 frames per second on lower-power hardware; device-pixel density and particle count are capped further on compact or constrained devices. Do not add WebGL or a motion library solely for ambience.
- Initial interface motion is finite and task feedback remains responsive at 260–360 ms. Do not fade the entire public page or dashboard on entry; authentication may use a 560 ms transform-only entrance. Do not add static decorative route-line SVG layers; the landing eyebrow sheen plays once, while continuous ambience is limited to the adaptive particle field and one subtle desktop-only hero-card float.
- Content below the initial public viewport reveals once as it enters view, using a scoped observer and a 760 ms vertical-rise and opacity transition. Repeated items may stagger by 90 ms, capped at 270 ms, so a long list never feels delayed. Dashboards do not receive a broad automatic reveal; use explicit motion only when it clarifies a state change.
- Scroll reveal is progressive enhancement: content is visible by default, keyboard focus reveals its containing section immediately, and an item stays visible after its first reveal. Do not hide primary content while waiting for JavaScript.
- Animate `transform` and `opacity` for ambience. Do not continuously animate every status or notification marker.
- On narrow viewports, slow-update displays, or when reduced transparency is requested, render translucent surfaces without backdrop-filter blur. Slow-update displays also skip non-essential authentication entrance and eyebrow motion. Keep the visual hierarchy intact when these effects are removed.
- The theme slider remains functional on every tier, but its full-root reveal falls back to a simple color change for data-saving, slow-update, reduced-motion, or lower-power devices.
- Under `prefers-reduced-motion`, remove drifting, drawing, floating, and theme-reveal animation while preserving all content and intended opacity.

## 5. Information Architecture

### Public

- `/`
- `/jobs`
- `/jobs/[id]`
- `/first-opportunity`
- `/how-it-works`
- authentication pages

### Worker

- `/worker/dashboard`
- `/worker/profile`
- `/worker/applications`
- `/worker/agreements/[id]`
- `/worker/work/[id]`
- `/worker/passport`
- `/worker/notifications`

### Employer

- `/employer/dashboard`
- `/employer/jobs/new`
- `/employer/jobs/[id]`
- `/employer/jobs/[id]/applicants`
- `/employer/agreements/[id]`
- `/employer/work/[id]`
- `/employer/opportunity-credits`
- `/employer/notifications`

### Admin

- `/admin`
- `/admin/reports`
- `/admin/jobs`
- `/admin/users`
- `/admin/wage-guidelines`
- `/admin/audit-logs`

Navigation is role-specific after sign-in. Do not show inaccessible role destinations merely to reject users after a click.

## 6. Global Layout Patterns

### Mobile

- Compact header with product identity and notification access.
- Role-specific bottom navigation with three to five destinations.
- Primary page action may use a sticky bottom action area when it does not cover content.
- Filters use a sheet/drawer with visible applied-filter count.

### Desktop

- Persistent role navigation in header or side rail.
- Main content uses a readable maximum width.
- Employer and admin lists may use tables only when responsive alternatives exist.
- Details and contextual actions may use a two-column layout without separating required information from the action.

## 7. Core Components

### Job card

Required information:

- title and category;
- wage amount and unit;
- general area;
- schedule/date;
- First Opportunity label when applicable;
- active boost label when applicable; and
- status only in authenticated owner contexts.

The entire card may be clickable, but nested controls must remain keyboard and screen-reader safe.

### Status badge

Always includes readable text. Pair color with icon/shape where useful. Use the exact vocabulary from `docs/product/BUSINESS_RULES.md` only in internal/admin views; translate lifecycle states into friendly user copy elsewhere.

### Wage Guideline panel

Show:

- offered wage;
- reference range/value and unit;
- `compliant`, `below`, or `unavailable` explanation;
- source label and effective date;
- simulation label when applicable.

Never imply legal certification unless validated.

### First Opportunity panel

Explain that eligibility is category-specific and calculated from verified Work Proof. Do not show a self-declaration toggle for workers.

### Step indicator

Use for job creation and the work lifecycle. It must include text labels and not rely on color.

### Confirmation dialog

Use only for consequential actions: publish, accept worker, cancel workflow, verify completion, redeem credit, or admin sanction. Include the concrete outcome and a specific action label.

### Empty state

State what is empty and offer one relevant action. Avoid decorative illustrations that increase page weight without improving understanding.

## 8. Screen Specifications

Employer jobs, My Applications, applicant lists, Passport history, and admin
configuration lists use bounded forward pagination. Counts are explicitly
page-local, opaque cursors are never displayed, and each next link preserves
the other active filters or list cursors.

### 8.1 Landing page

Primary message: Rintara helps workers turn a fair first opportunity into verified experience.

Required sections:

- worker and employer value propositions;
- how the opportunity-to-proof loop works;
- visible link to current jobs;
- explanation that payments occur outside the platform;
- safety/privacy summary; and
- distinct calls to find work or post work.

Do not display invented impact metrics.

### 8.2 Job discovery

- Search/filter controls are easy to clear.
- Active filters appear as removable chips or a readable summary.
- Sort behavior is understandable; boost is labeled, not disguised as organic ranking.
- Pagination/loading does not duplicate or reorder cards unexpectedly.
- The next-results action preserves search and every active filter.
- Empty results suggest removing filters.

### 8.3 Job detail

Above the primary action, show title, wage, unit, area, schedule, task scope, employer summary, and First Opportunity eligibility context.

Full address is replaced with a privacy notice such as “The complete address is shown only to the accepted worker.”

Worker action states:

- apply;
- view submitted application;
- ineligible for this First Opportunity category;
- job unavailable;
- sign in to apply.

### 8.4 Job creation

Use a short multi-section form or steps. Save draft explicitly; do not promise autosave unless it is implemented and tested.

The review screen groups:

- public job information;
- private-after-acceptance information;
- wage and First Opportunity validation; and
- final publish consequence.

The applicable Wage Guideline shows its reference range, source label, and a
clear simulation label when applicable; it is not described as a legal minimum.
The schedule section shows both the application deadline and the derived
selection cutoff 24 hours before the start time. The cutoff is display-only,
not another employer input.

### 8.5 Applicant list

- Make category eligibility visible but not the sole decision content.
- Show aggregate proof counts in the list; full proof history opens on a
  separate authorized Passport screen only while the application is submitted.
- Accept action requires confirmation and explains that all other applications will be rejected.
- After the application deadline, explain that new applications are closed but
  existing submitted applicants remain selectable until the displayed
  selection cutoff.
- If the server reports that the selection cutoff passed, explain that
  selection is closed and refresh to the authoritative unavailable state; show
  `expired` after the expiry workflow persists it.
- After a concurrency conflict, refresh to the server state.

### 8.6 Mini Agreement

Use a stable summary format, not an editable form. Visually separate:

- parties;
- work and location;
- schedule;
- wage/payment terms;
- tools and cancellation wording; and
- confirmation history.

Each party sees their own confirmation state and the other party's state.

### 8.7 Work screen

Present the current lifecycle step and only the allowed next action.

- Employer: generate code, then later verify completion.
- Worker: enter code, then check out.
- Code entry supports numeric keyboards, paste, clear error, and expiry guidance.
- Never display the previous plaintext code after leaving the generation result.

### 8.8 Worker profile

- Load the current worker's private profile; never display placeholder identity or contact data.
- Use active city/regency and category reference options, with clear recovery when a saved option becomes unavailable.
- Category interests are checkboxes and are explicitly labeled as self-declared.
- Per-category experience status is read-only and comes only from verified Work Proof.
- Preserve valid input on failure and expose pending, field-error, recoverable-error, and success states.

### 8.9 Employer profile

- Load only the current employer's private profile and system-derived achievement values.
- Offer only active city/regency options. If the saved area becomes inactive, explain the change and require a replacement before saving.
- Never expose editable verification, completed-job, badge, or credit counters.

### 8.10 Rintara Passport

- Lead with verified work categories and chronological proof entries.
- Each entry shows category, job title, general area, dates, and verification state.
- Self-declared interests appear in profile, not as proof.
- Revoked proof is not counted as verified; the owner may see a neutral explanation.
- Applicant Passport history is cursor-paginated and links back to the owning
  job's applicant list.
- Do not show an edit or upload-proof action.

### 8.11 Opportunity Credits

- Distinguish active credit count from lifetime First Opportunities.
- State the maximum active balance of three.
- Explain “one credit = one published job boosted for 24 hours.”
- Credit selection and job selection remain visible before confirmation.
- Show exact boost end time after redemption.
- Never use currency symbols or “withdraw” language.

### 8.12 Reports and admin

User report form uses defined reasons and factual guidance. It must not promise a specific resolution time unless an operational SLA exists.

Admin report screen shows target context, lifecycle state, relevant audit history, and explicit action checkboxes/buttons. Destructive actions require reason and confirmation.

Admin marketplace configuration provides:

- separate forms for categories, pilot city/regency areas, and Wage Guideline
  versions;
- source and simulation labels for each guideline;
- explicit active/nonactive status controls with audit feedback; and
- independently paginated summaries so advancing one configuration list does
  not reset the other two.

## 9. Forms and Validation

- Labels remain visible; placeholders are examples, not labels.
- Mark optional fields explicitly.
- Validate on submit and, where helpful, after blur; do not show errors before the user interacts.
- Place field errors near fields and provide a form-level summary for long forms.
- Preserve valid fields after failure.
- Disable duplicate submission while a request is pending, but do not rely on the disabled button for idempotency.
- Use appropriate mobile input modes for wage, code, date, and time.
- Text inputs, selects, menu items, checkboxes, and radios keep a practical 44 CSS pixel interaction area without reducing body text below 16 CSS pixels.
- Never accept formatted currency strings directly in domain logic; normalize safely at the boundary.

## 10. Accessibility Requirements

- Full keyboard access for navigation, dialogs, filters, forms, and tables.
- Visible focus with sufficient contrast.
- Semantic headings with one logical page title.
- Programmatic labels and described errors.
- Status changes announced through appropriate live regions without excessive interruption.
- Dialog focus trap, initial focus, escape behavior, and focus return.
- Touch targets at least 44 by 44 CSS pixels where practical.
- Content and controls meet WCAG 2.2 AA contrast targets.
- Motion respects `prefers-reduced-motion`.
- Icons never carry meaning without accessible text.

## 11. Responsive and Low-Bandwidth Requirements

- Design and test at narrow mobile width first, then tablet and desktop.
- Avoid horizontal scrolling except intentional data tables with an accessible alternative.
- Use responsive images only where images add product value.
- Do not require profile images or proof images for the golden path.
- Prefer Server Components and limit client JavaScript to interactive islands.
- Avoid autoplay media and large animation libraries.
- Loading states should show structure without causing major layout shifts.
- A mobile job-detail action dock may stay visible while the application section is offscreen, but must become hidden and non-interactive when the application section or footer enters view.

## 12. Privacy and Safety Copy

Required explanations:

- full address visibility after acceptance;
- payment occurs outside Rintara;
- Wage Guidelines are references unless legally validated;
- First Opportunity is not unpaid work;
- Work Proof is issued after employer-verified completion;
- reports pause relevant completion while under review.

Do not expose applicant notes, full addresses, check-in codes, private report notes, contact details, or account-status reasons in public metadata or screenshots.

## 13. State Checklist

Every feature design and implementation must cover:

- loading;
- empty;
- validation;
- success;
- recoverable error;
- unavailable/expired;
- forbidden/not found;
- concurrent refresh conflict; and
- submitted/disabled action state.

## 14. UX Quality Gate

A screen is ready for release when:

- its primary user and task are clear;
- required information appears before the consequential action;
- public/private information follows the authorization model;
- mobile and desktop layouts are usable;
- keyboard and screen-reader basics pass;
- all state checklist conditions are implemented;
- product terminology matches this document; and
- the screen's actions map to named contracts in `docs/engineering/API.md`.
