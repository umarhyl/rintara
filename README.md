# Rintara

Rintara is a local informal-work platform designed to turn a fair first opportunity into verified work history. An employer publishes transparent work, accepts one eligible worker, confirms attendance and completion, and Rintara issues Work Proof while rewarding a qualifying employer with an Opportunity Credit.

## MVP Golden Path

```text
Publish job
-> apply
-> accept one worker
-> confirm Mini Agreement
-> check in and check out
-> verify completion
-> issue Work Proof
-> issue and redeem Opportunity Credit
```

Payments are recorded as agreement terms but take place outside Rintara during the MVP.

## Technology Baseline

- Next.js App Router
- React and TypeScript
- PostgreSQL as the source of truth
- Drizzle ORM with repository-managed SQL migrations
- Mature external authentication integration
- Unit, PostgreSQL integration, and Playwright end-to-end tests

Provider-specific decisions that remain open are tracked as proposed ADRs under `docs/decisions/`.

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

## Development Script Contract

Use the package manager selected by the repository lockfile. The implementation repository should expose these scripts or document their approved equivalents:

| Script | Purpose |
| --- | --- |
| `dev` | Start local development |
| `build` | Create the production build |
| `lint` | Run static style and correctness checks |
| `typecheck` | Run strict TypeScript checking |
| `test` | Run fast unit/domain tests |
| `test:integration` | Run tests against isolated PostgreSQL |
| `test:e2e` | Run Playwright golden-path tests |
| `db:migrate` | Apply committed migrations |
| `db:seed` | Load synthetic development/demo data |

Do not invent commands in deployment instructions. Update this table when the actual repository scripts are established.

## Setup Checklist

1. Install the runtime and package manager versions declared by the repository.
2. Install dependencies using the existing lockfile.
3. Create local environment configuration from the committed example file.
4. Provision an isolated development PostgreSQL database.
5. Run committed migrations.
6. Load synthetic seed data.
7. Start the development server.
8. Run unit and integration tests before opening a pull request.

Secret values, provider-specific callbacks, and concrete commands belong in the implementation repository's `.env.example` and deployment configuration after the proposed provider ADRs are accepted.

## MVP Scope Guard

The MVP does not include bidding, payments, escrow, chat, AI matching, Fast Rematch, direct worker search, continuous GPS, identity-document storage, multi-worker jobs, or microservices.

Any scope change must follow the change-control section of `docs/product/PRD.md` and update all affected specifications.

## Contributing and Security

- Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before changing code or documentation.
- Follow [`SECURITY.md`](./SECURITY.md) for vulnerability reporting.
- AI agents and automated contributors must follow [`AGENTS.md`](./AGENTS.md).

## Status

The documentation describes the competition MVP baseline dated July 18, 2026, with a submission target of July 31, 2026. Proposed ADRs remain non-authoritative until explicitly accepted.
