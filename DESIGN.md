---
name: Rintara
description: Marketplace kerja lokal dengan ketentuan jelas dan jejak kerja tepercaya.
appearance: light-only
colors:
  forest: "#1C7C54"
  mint: "#73E2A7"
  chalk: "#DEF4C6"
  deep-forest: "#1B512D"
  leaf: "#B1CF5F"
  background: "#F6F8F6"
  foreground: "#10251B"
  card: "#FFFFFF"
  muted: "#EEF2EE"
  muted-foreground: "#4B6253"
  border: "#D9E1DA"
  input: "#AAB9AD"
  opportunity-soft: "#F0F7DF"
  success-soft: "#E7F7EC"
  sidebar-foreground: "#32473A"
  sidebar-accent: "#E7F3EB"
  sidebar-accent-foreground: "#17462D"
  destructive: "#B42318"
typography:
  display:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  compact: "8px"
  control: "10px"
  surface: "12px"
  editorial: "48px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.card}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
    padding: "16px"
  hero-search-panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
    padding: "16px"
    minimumFieldHeight: "48px"
  job-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
    padding: "20px"
  status-opportunity:
    backgroundColor: "{colors.opportunity-soft}"
    textColor: "{colors.deep-forest}"
    rounded: "{rounded.compact}"
    padding: "4px 8px"
    height: "24px"
  public-nav-active:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.deep-forest}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  dashboard-nav-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
---

# Design System: Rintara

## Overview

**Creative North Star: "Kerja Lokal dalam Pandangan"**

Rintara is a light-only local-work marketplace with one recognizable public
gateway and calm operational workspaces. The homepage makes work tangible with
a joined Forest search panel and documentary photography. The dedicated
`/jobs` route owns published-job comparison.

The design uses green-tinted tonal grouping, compact controls, Figtree
typography, and restrained elevation. It avoids decorative dividers,
marketplace spectacle, fake proof, and motion that delays content.

**Key characteristics:**

- Understand the offer, search, learn the mechanism, then act.
- One landing scene and one separate authentication portrait, each
  route-specific.
- Published-job listings exist only on `/jobs`.
- Tonal grouping before ornamental lines or repeated containers.
- A geometric green Rintara **R**, with Mint inverse treatment on Deep Forest.
- One intentional light appearance with no appearance switch.

## Color

Forest is the operational primary. Deep Forest carries the homepage editorial
panel and inverse identity rail. Chalk, Mint, and pale green surfaces separate
concepts without excessive borders. Leaf emphasizes First Opportunity only
when paired with readable text.

Neutral canvas, ink, input, and border values remain green-tinted. Destructive
red is reserved for errors and destructive actions. Status never relies on
color alone.

**The Tonal Grouping Rule.** Prefer a background-role change and spacing over
another horizontal line. Keep borders where they define a field, row,
dialog/sheet boundary, or interactive floating surface.

## Typography

Figtree is the sole product family. Headings orient tasks rather than filling
the viewport. Body text remains at least 16px with readable line height.
Wages, times, counts, and codes use tabular numerals.

Do not introduce decorative serif emphasis, tracked uppercase eyebrows, or
multiple display families.

## Identity

The Rintara mark is a geometric green **R** built from direct strokes. It is
paired with the wordmark on public and operational navigation. On Deep Forest,
the mark becomes Mint and the wordmark becomes white.

Do not restore the previous three-node route mark or repeat logo strokes as
background vectors.

## Public homepage

The homepage is a marketplace gateway, not a duplicate job feed.

- One joined responsive composition anchors the hero.
- A Forest search panel occupies the left side while
  `public/visuals/rintara-local-work-v2.webp` occupies the adjacent right side.
- A labeled white GET search card sits inside the Forest panel and sends `q`
  and `location` to `/jobs`.
- Active categories and city/regency areas provide real entry points without
  unsupported popularity labels or counts.
- A compact factual row explains visible terms, address privacy, and the path
  to Work Proof without invented social proof.
- One joined Worker/Employer gateway gives each audience a concise description
  and direct link to its dedicated public guide without adding client-side tab
  state.
- First Opportunity is explained on `/for-workers` as paid work with
  category-specific eligibility.
- An asymmetric three-part composition explains comparison, Mini Agreement,
  and the path to Work Proof.
- Worker and role-aware Employer actions close the page.

There are no homepage job rows, testimonials, employer logos, rankings,
metrics, fake dashboards, pricing, talent search, or payment features.

## Public navigation

At the top of the page, the public header is a centered lightly frosted row
capped at the 80rem public content width. Across the first 220 CSS pixels of
scroll, it progressively becomes a stronger translucent blurred floating bar
with compact height, width, padding, border, and structural shadow.

Desktop navigation stays beside the logo with five direct links: **Untuk
pekerja**, **Untuk pemberi kerja**, **Kategori kerja**, **Cara kerja**, and
**Mengapa Rintara**. Each opens its own route rather than a homepage anchor or
an audience dropdown. Registration remains the dedicated **Daftar** action.
Active routes use a Chalk tonal background and `aria-current`. Mobile keeps
the same order in a single sheet list. The condensation must not hide the
primary route or menu.

## Public guidance pages

`/for-workers`, `/for-employers`, `/categories`, and `/why-rintara` extend the
same public visual world without duplicating the job feed.

- Role guides use an asymmetrical field-guide composition: one decisive
  proposition, the information relevant to that role, a sequential workflow,
  and a real next action.
- `/categories` renders active reference data only. It never invents counts,
  popularity, demand, or category descriptions.
- `/why-rintara` explains product facts and boundaries: visible terms, private
  addresses, Mini Agreement, Work Proof, Passport, qualifying credit, and
  out-of-platform payment.
- These pages remain Server Components except for existing bounded actions and
  recoverable route error UI.

## Job discovery and operational surfaces

`/jobs` owns job rows, filters, sort explanation, pagination, loading, empty,
error, and retry states. Desktop uses a sticky 20rem filter rail that contains
long labels without overlapping results; mobile uses a sheet. Wage fields
format clean digits as Indonesian Rupiah while preserving digit-only queries.
Public job DTOs never include the full address.

Dashboards use a neutral sidebar, compact page headers, calm rows, description
lists, and timelines. Growing lists remain bounded and paginated.

## Authentication and onboarding

Sign-in and registration share the split entry composition:

- `public/visuals/rintara-auth-work-v1.webp` occupies the portrait panel;
- the inverse identity sits above it on desktop;
- the focused form remains plain rather than card-heavy; and
- mobile uses a short reserved-height crop before the form.

The photograph contains no overlay copy, link, testimonial, or fake UI.

Role selection and Worker/Employer profile onboarding remain image-free and
operational. They use the narrow 10.5rem Deep Forest identity rail and centered
bordered form. Registration progress remains Akun, Peran, Profil.

## Shape and elevation

Use 8px for compact semantic labels, 10px for controls, and 12px for ordinary
surfaces. The 48px editorial corner is reserved for the homepage Forest
silhouette. Full rounding is reserved for circular avatars.

Operational Rintara surfaces are flat at rest. Structural shadow is allowed
for floating navigation/search, overlays, menus, fixed mobile actions, and the
selected leading surface inside a landing composition. Do not use glass,
decorative blur, neon glow, gradient text, or repeated resting-card lift.

## Motion

State feedback uses roughly 150 to 200ms color, border, opacity, or transform
transitions. Public-header condensation follows the opening scroll position
through one frame-throttled update and does not run an ambient animation loop.
Content, authentication forms, cards, and below-fold sections remain visible
without entrance choreography.

Respect `prefers-reduced-motion`. Do not add scroll reveal, list stagger,
parallax, particles, pointer tracking, ambient loops, canvas, or WebGL.

## Accessibility and product boundaries

- Keep controls at least 44px and body text at least 16px.
- Use semantic markup, persistent labels, visible focus, useful errors, and
  non-color status labels.
- Preserve valid form input after recoverable errors.
- Prevent accidental duplicate submission without replacing server
  idempotency.
- Keep full address, applicant data, contact data, codes, provider errors,
  report notes, and moderation state private.
- Do not add bidding, wage negotiation, escrow, payments, chat, identity
  documents, continuous GPS, worker search, AI matching, or multiple accepted
  workers.
- Do not copy Upwork branding, wording, ranking, social mechanics, pricing, or
  features.
