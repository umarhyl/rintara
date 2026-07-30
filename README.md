# Rintara

Rintara is a local informal-work platform designed to turn a fair first opportunity into verified work history. An employer publishes transparent work, accepts one eligible worker, confirms attendance and completion, and Rintara issues Work Proof while rewarding a qualifying employer with an Opportunity Credit.

## MVP Golden Path

```text
Publish job
-> apply
-> accept one worker
-> confirm Mini Agreement
-> check in
-> upload one private result photo and check out
-> verify completion
-> issue Work Proof
-> issue and redeem Opportunity Credit
```

Payments are recorded as agreement terms but take place outside Rintara during the MVP.

## Technology Baseline

- Next.js App Router
- React and TypeScript
- Supabase Managed PostgreSQL as the source of truth
- Drizzle ORM with repository-managed SQL migrations
- Supabase Auth with server-side session validation
- Private Supabase Storage for one normalized completion photo per work session
- Vercel deployment with `main` as the production branch
- Unit tests, PostgreSQL integration tests, and manual release smoke testing

Vercel, Supabase Managed PostgreSQL, Supabase Auth, and the narrowly bounded
private completion-evidence Storage path are accepted in ADR-011, ADR-012, and
ADR-013. Project-specific production-readiness evidence such as region, plan
limits, backup restore, connection sizing, callbacks, storage privacy, and test
accounts must still be recorded before release.

## Documentation

Start with [the documentation index](./docs/README.md).

| Need | Document |
| --- | --- |
| Product scope | [`docs/product/PRD.md`](./docs/product/PRD.md) |
| Acceptance criteria | [`docs/product/REQUIREMENTS.md`](./docs/product/REQUIREMENTS.md) |
| Domain behavior | [`docs/product/BUSINESS_RULES.md`](./docs/product/BUSINESS_RULES.md) |
| User journeys | [`docs/product/USER_FLOW.md`](./docs/product/USER_FLOW.md) |
| UI and accessibility | [`docs/design/UI_UX_DESIGN.md`](./docs/design/UI_UX_DESIGN.md) |
| System design | [`docs/engineering/ARCHITECTURE.md`](./docs/engineering/ARCHITECTURE.md) |
| PostgreSQL design | [`docs/engineering/DATABASE.md`](./docs/engineering/DATABASE.md) |
| Application contracts | [`docs/engineering/API.md`](./docs/engineering/API.md) |
| Delivery plan | [`docs/delivery/ROADMAP.md`](./docs/delivery/ROADMAP.md) |
| Agent rules | [`AGENTS.md`](./AGENTS.md) |

## Repository Layout

```text
.
├── AGENTS.md
├── CONTRIBUTING.md
├── SECURITY.md
├── README.md
├── docs/
│   ├── README.md
│   ├── product/
│   ├── design/
│   ├── engineering/
│   ├── delivery/
│   ├── operations/
│   ├── decisions/
│   └── assets/
├── src/
├── tests/
└── migrations/
```

Application directories may follow the exact module structure documented in `docs/engineering/ARCHITECTURE.md`. Do not create empty application directories only to match this example.

## Development Commands

Use Bun 1.3.14 as declared in `package.json` and `bun.lock`:

| Script | Purpose |
| --- | --- |
| `dev` | Start local development |
| `build` | Create the production build |
| `lint` | Run static style and correctness checks |
| `typecheck` | Run strict TypeScript checking |
| `test` | Run fast unit/domain tests |
| `test:integration` | Run tests against isolated PostgreSQL |
| `db:check` | Validate committed Drizzle migration consistency |
| `db:migrate` | Apply committed migrations |
| `db:seed` | Load synthetic local/test development data |

Run them with `bun run <script>`. Database schema lives under `server/db/schema/`, committed migrations live under `drizzle/`, and database operations enforce the environment guards documented in `.env.example`.

## Setup Checklist

1. Install the runtime and Bun version declared by the repository.
2. Install dependencies with `bun install --frozen-lockfile`.
3. Create local environment configuration from the committed example file.
4. Provision an isolated development PostgreSQL database.
5. Run committed migrations.
6. Load synthetic seed data only into a loopback local/test database. Prepare
   remote demo accounts and jobs through the normal application flows.
7. Start the development server.
8. Run unit and integration tests before opening a pull request.

Secret values never belong in documentation or source control. Required variable names, provider callbacks, and approved commands belong in `.env.example` and deployment documentation without real values.

## Continuous Integration

GitHub Actions runs two required jobs for pushes and pull requests targeting
`dev` or `main`:

- `Quality`: frozen dependency install, lint, typecheck, unit tests, Drizzle
  migration check, and production build.
- `Integration`: PostgreSQL integration tests against a disposable PostgreSQL
  16 service container.

The integration job uses synthetic test-only credentials declared in the
workflow. It does not receive Supabase or production database credentials.

## MVP Scope Guard

The MVP does not include bidding, payments, escrow, chat, AI matching, Fast Rematch, direct worker search, continuous GPS, identity-document storage, multi-worker jobs, or microservices.

Any scope change must follow the change-control section of `docs/product/PRD.md` and update all affected specifications.

## Contributing and Security

- Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before changing code or documentation.
- Follow [`SECURITY.md`](./SECURITY.md) for vulnerability reporting.
- AI agents and automated contributors must follow [`AGENTS.md`](./AGENTS.md).

## Status

The documentation describes the competition MVP baseline dated July 18, 2026, with a submission target of July 31, 2026. ADR-010 remains proposed; ADR-011 and ADR-012 are accepted provider decisions with production-readiness checks still open.
