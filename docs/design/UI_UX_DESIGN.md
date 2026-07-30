# Rintara UI/UX Design Guidelines

> **Version:** 3.6
>
> **Date:** July 26, 2026
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

| Use                                    | Avoid in user-facing copy |
| -------------------------------------- | ------------------------- |
| Employer / Pemberi kerja               | Client                    |
| Apply / Lamar                          | Bid, bidding              |
| Wage / Upah                            | Price offer               |
| First Opportunity / Kesempatan Pertama | Unpaid trial              |
| Mini Agreement / Kesepakatan Kerja     | Escrow contract           |
| Work Proof / Bukti Kerja               | Self-verified certificate |
| Rintara Passport / Paspor Rintara      | Editable portfolio        |
| Opportunity Credit / Kredit Kesempatan | Cash balance              |
| Boost                                  | Guaranteed placement      |

Content rules:

- Use short active sentences.
- Explain unfamiliar terms beside first use.
- Do not promise guaranteed employment, payment, safety, or worker quality.
- Do not describe internal Wage Guidelines as legal minimum wages without validation.
- Do not imply that Opportunity Credits have cash value.

## 4. Visual Direction

Rintara's visual character is a practical job-marketplace workspace: compact,
credible, and ready to use. It avoids both corporate recruitment stiffness and
gamified marketplace pressure.

### Color system

The brand palette is Forest `#1C7C54`, Mint `#73E2A7`, Chalk `#DEF4C6`,
Deep Forest `#1B512D`, and Leaf `#B1CF5F`. Rintara intentionally ships one
light appearance; there is no dark-mode or appearance switch.

| Semantic role      | Value     | Use                                         |
| ------------------ | --------- | ------------------------------------------- |
| `background`       | `#F6F8F6` | Page canvas                                 |
| `foreground`       | `#10251B` | Primary text                                |
| `card`             | `#FFFFFF` | Solid panels and fields                     |
| `muted`            | `#EEF2EE` | Secondary surfaces                          |
| `muted-foreground` | `#4B6253` | Secondary text                              |
| `primary`          | `#1C7C54` | Primary actions, active navigation, focus   |
| `secondary`        | `#DEF4C6` | Calm supporting emphasis                    |
| `border`           | `#D9E1DA` | Necessary separators and component outlines |
| `input`            | `#AAB9AD` | Field boundaries                            |
| `opportunity`      | `#B1CF5F` | First Opportunity emphasis                  |
| `destructive`      | `#B42318` | Errors and destructive actions              |
| `sidebar`          | `#FFFFFF` | Neutral role navigation                     |
| `sidebar-accent`   | `#E7F3EB` | Current role destination                    |

Validate actual text/background combinations for WCAG 2.2 AA. First
Opportunity, boost, completion, warning, and error states always include
readable text; color is never the only signal.

### Typography

- Use Figtree through `next/font` with system sans-serif fallbacks.
- Base body text is at least 16 CSS pixels.
- Body line height targets 1.5 or greater.
- Use no more than four clear typographic levels per screen.
- Route headings top out around 2.75rem; headings orient the task rather than
  dominating the viewport.
- Numeric wage receives strong emphasis near the job title.
- Use tabular numerals for wages, times, counts, and check-in codes.
- Do not introduce a decorative serif, mixed-family emphasis, or repeated
  uppercase wide-tracked eyebrows.

### Shape and elevation

- Use the implemented compact radius system: approximately 8 pixels for badges
  and small controls, 10 pixels for buttons and fields, and 12 pixels for
  cards, search groups, and panels.
- Do not use 2xl/3xl radii for ordinary product surfaces. The landing's
  editorial Forest silhouette is a deliberate branded exception.
- Reserve full rounding for circular avatars. Status badges use the compact
  radius rather than pills.
- Use spacing and tonal layers before borders or shadows. Repeated ornamental
  dividers are removed when a background shift can explain grouping.
- Resting operational cards are flat. Reserve structural elevation for
  dialogs, sheets, menus, the condensing header, the contained hero search
  panel, sticky actions, and the selected leading surface inside a landing
  composition.
- Do not use glass panels, broad backdrop blur, luminous outer glow, or
  decorative gradients to create hierarchy. The single condensed public
  header is the only approved bounded translucent-blur surface.

### Kerja Lokal dalam Pandangan visual system

The creative north star is **Kerja Lokal dalam Pandangan**: a marketplace
workspace that makes local work tangible while keeping real opportunities,
comparable terms, and the next action before unsupported promotion.

- The light-only public homepage is Persuade-mode and search-led. Its hero is
  one joined split composition: a Deep Forest search panel on the left and a
  documentary local-work photograph on the right.
- The labeled task-and-area GET search sits inside the Forest panel and sends
  visitors to `/jobs`.
- The homepage then exposes factual information safeguards, active categories
  and city/regency areas, a compact gateway to dedicated Worker and Employer
  guides, an asymmetric explanation of Rintara's agreement-to-proof
  mechanism, and role-aware actions.
- Published-job rows appear only on `/jobs`. Do not duplicate the discovery
  feed, counts, loading state, or empty state on the homepage.
- The landing asset is `public/visuals/rintara-local-work-v2.webp`; its
  reserved responsive frame and meaningful alt text prevent layout shift.
- Job discovery is the signature utility layout. Desktop uses a sticky 20rem
  filter rail beside compact job rows; mobile moves filters into a sheet and
  keeps the list single-column.
- Job rows prioritize category and semantic status, title, employer, area,
  schedule, duration, wage, and one detail action. First Opportunity and boost
  labels remain explicit; list position never creates a featured status. The
  wage and unit sit directly in the row with typographic emphasis, without a
  nested tonal panel, redundant fixed-wage label, or decorative direction
  arrow.
- Job detail uses a dense decision header. Title, employer, task summary, wage,
  area, schedule, duration, deadline, and privacy context precede the
  application action.
- Sign-in and registration use the separate portrait asset
  `public/visuals/rintara-auth-work-v1.webp` in a stable split layout. The
  image is separate from a plain focused form column and becomes a short
  reserved-height crop on mobile. Both entry routes share the same persistent
  frame, so changing mode replaces only the form panel and never reinitializes
  the documentary image.
- Role selection and Worker/Employer profile onboarding remain operational:
  they use the narrow 10.5rem Deep Forest identity rail and a centered bordered
  form without documentary imagery.
- Role dashboards use a neutral semantic sidebar on desktop, a four-item
  bottom navigation on mobile, compact page headers, and calm rows or
  timelines for work in progress.
- The dashboard header stays compact and contains a notification control only
  when that role has a notification route, followed by one circular account
  menu. Profile and notification destinations are not repeated in the primary
  sidebar. Nested workflow routes resolve to one longest matching parent so
  two navigation rows are never highlighted together.
- The Worker dashboard prioritizes an accepted application's Mini Agreement,
  then recent public jobs and the Worker's latest application activity. The
  Employer dashboard prioritizes one actionable owned job, then recent jobs
  and Opportunity Credit context. These are operational summaries backed by
  server data, not decorative metric cards.
- Job create and edit screens use the workspace content padding only once.
  Form sections stay in one column through laptop widths and gain a compact
  review rail only on wide screens. Field borders communicate affordance;
  section grouping uses tonal surfaces instead of repeated dividers.
- The green geometric Rintara **R** is the product identity. It may use the
  Mint inverse treatment on Deep Forest, but route vectors are not repeated as
  decoration.
- The public header begins as a centered lightly frosted row capped at the
  public content width and progressively condenses into a stronger translucent
  blurred floating bar across the first 220 CSS pixels of scroll. Its height,
  maximum width, padding, radius, gap, background opacity, blur, border, and
  shadow interpolate together without hiding the primary route or mobile menu.
- Interaction feedback runs for roughly 150-300 ms and uses transform,
  opacity, color, or border.
- Documentary images do not enter automatically or drive parallax.
- Pages, authentication forms, cards, and content below the viewport are
  visible immediately. Do not add automatic entrance, list stagger,
  scroll-reveal observers, parallax, infinite loops, pointer tracking, or
  mouse-following effects.
- Do not add particle fields, cosmic scenes, decorative canvas, WebGL
  ambience, static route-vector backgrounds, or fake animated dashboards.
- Under `prefers-reduced-motion`, collapse the header and other nonessential
  transitions while preserving content, hierarchy, and focus behavior.

### External layout references

- The implemented `app/page.tsx` composition is the current approved landing
  reference.
- Upwork-like marketplace hierarchy informed information sequencing only.
- Do not copy its brand, wording, ranking model, social mechanics, or features.
- Do not add fake metrics, testimonials, customer/employer logos, availability
  claims, or payment-processing features. Payment method and timing may be
  recorded, but payment remains outside Rintara.

## 5. Information Architecture

### Public

- `/`
- `/for-workers`
- `/for-employers`
- `/categories`
- `/why-rintara`
- `/jobs`
- `/jobs/[id]`
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
- `/worker/reports`

### Employer

- `/employer/dashboard`
- `/employer/jobs/new`
- `/employer/jobs/[id]`
- `/employer/jobs/[id]/applicants`
- `/employer/agreements/[id]`
- `/employer/work/[id]`
- `/employer/opportunity-credits`
- `/employer/notifications`
- `/employer/reports`

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

- Compact public header with the geometric Rintara identity, collapsible
  audience groups for **Untuk pekerja** and **Untuk pemberi kerja**, then
  direct access to **Kategori kerja**, **Cara kerja**, and **Mengapa Rintara**.
- A signed-in account exposes the same circular profile dropdown beside the
  public navigation sheet; the account dropdown is not nested inside that
  sheet.
- Role-specific bottom navigation with three to five destinations.
- Primary page action may use a sticky bottom action area when it does not cover content.
- Filters use a sheet/drawer with visible applied-filter count.

### Desktop

- Public navigation remains on one line immediately after the Rintara
  identity. **Untuk pekerja** and **Untuk pemberi kerja** are compact menu
  triggers; **Kategori kerja**, **Cara kerja**, and **Mengapa Rintara** remain
  direct links. Audience menus contain only canonical job filters, their
  dedicated guide, or precise anchors owned by that guide. They do not repeat
  the three direct destinations. Triggers and child links use visible active
  states without routing through homepage query/hash navigation.
- Across the opening scroll distance, the public header progressively
  condenses into a centered translucent blurred floating bar. Signed-out
  **Masuk** and **Daftar** remain reachable so condensation never removes a
  focused control.
- Once signed in, **Masuk** and **Daftar** become one 44px circular profile
  trigger. Its menu is derived from trusted account role and profile state and
  never exposes a different role's private destinations.
- Persistent role navigation uses a neutral semantic sidebar with one clear
  active row.
- Main content uses a readable maximum width.
- Employer and admin lists may use tables only when responsive alternatives exist.
- Details and contextual actions may use a two-column layout without separating required information from the action.

## 7. Core Components

### Job row

Required information:

- title and category;
- wage amount and unit;
- general area;
- schedule/date;
- First Opportunity label when applicable;
- active boost label when applicable; and
- status only in authenticated owner contexts.

The title and detail action may link to the job. Do not create competing nested
controls or make hover the only indication of interactivity.

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

### Public navigation and identity

Use the green geometric Rintara **R** with the wordmark. Public desktop
navigation sits immediately after it with audience menu triggers for workers
and employers, followed by direct links to `/categories`, `/how-it-works`, and
`/why-rintara`. Worker and employer overview routes remain the first item in
their respective menu. **Daftar** remains the sole registration destination
in the header. Active state uses `aria-current` on destination links and a
readable Chalk tonal fill on the active audience trigger rather than an
ornamental bottom rule. The header may condense into a translucent blurred
floating bar after scrolling. Mobile exposes the same audience groups as
native disclosure sections inside the existing sheet, with the three direct
destinations kept separate below them.

For an authenticated account, replace the rectangular workspace action with a
single 44px circular profile trigger. Use the current profile display name to
derive at most two initials; if the profile is incomplete or unavailable, use
the neutral account icon instead of inventing a photograph. The dropdown is a
compact overlay aligned to the trigger and begins with display name plus the
readable role/status. A ready Worker sees dashboard, applications, Passport,
and profile. A ready Employer sees dashboard, job publishing, owned jobs,
Opportunity Credit, and profile. Admin receives only its minimal operational
shortcuts. Onboarding and restricted states expose only their safe recovery
route. Keep **Keluar dari akun** separated at the end, show pending feedback,
block duplicate activation, and retain a visible retryable error if it fails.
On narrow screens the profile trigger sits beside—not inside—the public
navigation sheet.

### Authentication and onboarding shell

Sign-in and registration use the portrait documentary split. The image remains
separate from the form and has no overlay copy, links, testimonial, or fake
interface. **Masuk** and **Daftar** are two focused states of one persistent
authentication surface, selected through a compact segmented control above the
form. One solid selection pill moves horizontally between the two labels using
a 260 ms transform transition, then completes the prefetched route change;
reduced-motion removes both the movement and its navigation delay without
changing state clarity. Both segments retain the canonical `/sign-in` and
`/register` URLs, while the shared layout preserves the image, email draft,
validated destination, and native browser history. Current-password and
new-password drafts remain separate, and the alternate segment is unavailable
during submission. Role selection and profile onboarding use the image-free
operational shell. Both preserve form recovery, duplicate-submission
prevention, and registration progress.

If registration returns an ambiguous existing-account or pending-confirmation
outcome, replace the form with a neutral **Lanjutkan dengan email ini** state.
Do not claim that the address is registered or that a message was definitely
sent. Keep the submitted email visible and provide two 44px-minimum actions:
**Masuk ke akun**, preserving the validated destination, and **Pulihkan kata
sandi**. The shared authentication state carries the email to either route
without placing it in the URL.

The sign-in password label includes a **Lupa kata sandi?** link. Recovery and
new-password screens reuse the same documentary frame without the
Masuk/Daftar segmented control. The recovery success message never confirms
whether an account exists. Invalid or expired links provide a direct,
keyboard-accessible action to request a new link.

### Appearance and motion

Rintara exposes one light appearance and no appearance switch. State feedback
uses short color, border, opacity, or transform transitions. Public-header
condensation is mapped to the first 220 CSS pixels of scroll and scheduled at
most once per animation frame; it is disabled for reduced-motion users. No
page, card, form, or below-fold section waits for an entrance animation.

## 8. Screen Specifications

Employer jobs, My Applications, applicant lists, Passport history, and admin
configuration lists use bounded forward pagination. Counts are explicitly
page-local, opaque cursors are never displayed, and each next link preserves
the other active filters or list cursors.

### 8.1 Landing page

Primary task: persuade a visitor that Rintara represents tangible local work,
then send a task-and-area query into the dedicated `/jobs` discovery route.

Required sections:

- a joined responsive hero with a left Forest search panel and a documentary
  image beside it;
- a labeled task-and-area GET search inside the Forest panel;
- a concise factual safeguard row for visible terms, address privacy, and Work
  Proof;
- active category and area entry links when reference data is available;
- one joined static gateway linking to the dedicated Worker and Employer
  guides;
- an asymmetric three-part explanation of comparison, Mini Agreement, and
  Work Proof;
- Worker and role-aware Employer actions; and
- footer disclosure that payment occurs outside the platform.

Do not display invented impact metrics.

The landing uses `public/visuals/rintara-local-work-v2.webp`; do not turn it
into a gallery or replace real reference data with invented content. Published
jobs and their loading, empty, error, filtering, and pagination states appear
only on `/jobs`. The homepage has no decorative preview, fake job, particle
field, fake dashboard, social-proof block, or scroll cue.

#### Public guidance and directory pages

- `/for-workers` shows comparable pre-application information, the
  application-to-proof sequence, paid First Opportunity rules with
  category-specific eligibility, and private-address behavior.
- `/for-employers` shows publishing requirements, acceptance of exactly one
  worker, Mini Agreement, completion verification, qualifying Opportunity
  Credit behavior, and payment outside Rintara. It never offers direct worker
  search.
- `/categories` renders only active categories and pilot city/regency areas
  returned by public reference queries. Links preserve their filters in
  `/jobs`; empty and recoverable error states remain explicit.
- `/why-rintara` explains verified product facts and boundaries without
  testimonials, metrics, guarantees, or invented evidence.

### 8.2 Job discovery

- Search/filter controls are easy to clear.
- Active filters appear as removable chips or a readable summary.
- The desktop filter rail contains long category labels and both wage fields
  within its 20rem track; no control may overlap the results column.
- Wage inputs format clean digits as Indonesian Rupiah while typing, for
  example `500000` becomes `Rp 500.000`. Navigation and server queries continue
  to receive digit-only values.
- An inverted wage range is rejected beside the two wage fields without
  discarding either value; invalid filter URLs expose a clear-filter recovery.
- Desktop uses a sticky 20rem filter rail and compact job rows; mobile moves the
  filters into a sheet without changing their query meaning.
- Sort behavior is understandable; boost is labeled, not disguised as organic ranking.
- Pagination/loading does not duplicate or reorder cards unexpectedly.
- The next-results action preserves search and every active filter.
- Empty results suggest removing filters.

### 8.3 Job detail

Use a dense decision header. Above the primary action, show title, employer,
wage and unit, general area, schedule, duration, application deadline, a task
summary, and First Opportunity context when applicable.

Full address is replaced with a privacy notice such as “The complete address is shown only to the accepted worker.”

Worker action states:

- apply;
- view submitted application;
- open the Mini Agreement for an accepted application;
- view recorded rejected or withdrawn history without offering another form;
- ineligible for this First Opportunity category;
- job unavailable;
- sign in to apply; and
- loading plus a retryable read error while the private application state is
  checked.

**My applications** uses two server-driven segments: **Aktif** for submitted
and accepted applications, and **Riwayat** for rejected and withdrawn
applications. Filtering precedes cursor pagination, the next-page link retains
the selected segment, and every displayed count is labeled as page-local. A
job title is forward-linked only while its public detail remains available.

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

Draft and publish failures stay on the form and preserve every valid value.
Expected validation failures use inline field messages plus a specific summary
such as **Draf belum tersimpan** or **Pekerjaan belum diterbitkan**; do not
describe them as connection failures. Move focus to the first invalid field.
Use connection-recovery copy only when the Server Action request itself rejects.
If active area or category reference data is empty, show a blocking unavailable
state and disable both actions. A checked First Opportunity option must always
remain operable so the employer can clear it after related inputs change.

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
- Static copy and non-editable surfaces use the default cursor with no visible
  text caret. The text cursor and visible caret appear only on text-entry
  controls or explicitly editable content; links and other actionable controls
  retain the appropriate pointer cursor.
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
- Keep the landing and authentication images route-specific and optimized;
  neither is required to understand or operate its adjacent form.
- Do not require profile images. Require exactly one private result photo after
  check-in and before checkout; keep the upload island bounded and show
  progress, validation, replacement-before-checkout, and retry states.
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
- one private result photo is required before checkout, stripped of embedded
  metadata, and visible only to the related parties and authorized admin;
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
