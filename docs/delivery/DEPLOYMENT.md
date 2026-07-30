# Deployment and Environment Strategy

This document details the deployment pipeline, Vercel configuration, and manual review process for the Rintara MVP. 
Following this procedure guarantees stability in the production environment by enforcing isolated databases and strict quality checks.

## 1. Environments & Environment Variables

Rintara maintains strict isolation between development, testing, and production environments. Never share database clusters or credentials across these environments.

### Local Development (`.env.local`)
- **Vercel Env**: Handled locally via `.env.local`
- **Database**: Connects to the local development Supabase project.
- **Variables**: `DATABASE_URL` (local connection),
  `NEXT_PUBLIC_SUPABASE_URL` (local API),
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (local publishable key), and the
  server-only `SUPABASE_SERVICE_ROLE_KEY` when testing private completion
  evidence.

### Automated Testing (`ci.yml`)
- **Environment**: Handled by GitHub Actions and defined in the `integration` job.
- **Database**: Spin up a transient `postgres:16` service container explicitly for tests.
- **Variables**: Uses `TEST_DATABASE_URL` specifically. Fails if `DATABASE_URL` points to a live non-test server.

### Vercel Production
- **Branch**: `main`
- **Database**: Connects to the managed Supabase Production project (via connection pooling for Drizzle).
- **Variables**: `DATABASE_URL` must point to the production database pool.
  All Next.js and Supabase environment variables must use production values.
  `SUPABASE_SERVICE_ROLE_KEY` is required server-side for the ADR-013 private
  evidence bucket and must never be exposed to client code or logs.
- **Vercel Configuration**: 
  - Production Branch: `main`
  - Ensure development/preview keys are strictly separated in Vercel's Environment Variables settings dashboard.

## 2. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) guarantees code quality on PRs and pushes to `main` and `dev`.
The pipeline includes:
- **Quality Job**: Validates Typescript (`typecheck`), Linting (`eslint`), Unit tests (`bun test`), Drizzle Schema (`db:check`), and performs a Next.js test `build`.
- **Integration Job**: Runs the backend constraints and authorization logic against a live, isolated test PostgreSQL database.

Browser release smoke testing is manual and uses the approved release-candidate or demo environment; it is not part of the default CI pipeline.

## 3. Deployment Review Process

Vercel is configured to **ignore automatic deployments from the `dev` branch**. You will see "Canceled by Ignored Build Step" in Vercel. This is intentional.

To deploy to production:

1. **Feature Merge**: Developers commit to feature branches and merge them into `dev` via Pull Requests.
2. **Quality Assurance**: 
   - Verify that the GitHub Actions checks pass on `dev`.
   - Zaki and Catur execute manual smoke tests against local or temporary environments (Dashboard routing, onboarding flow, sign-in logic).
3. **Release Pull Request**: Create a PR from `dev` to `main`.
4. **Final CI & Sign-off**:
   - Ensure the PR to `main` passes all automated CI checks.
   - Obtain product sign-off from Catur.
5. **Merge to Main**: 
   - Merge the PR (use "Squash and merge" or "Create a merge commit").
   - Vercel will automatically trigger a production deployment upon detecting the merge to `main`.
6. **Production Verification**: 
   - Zaki performs a production smoke test to guarantee variables and connections are live.
