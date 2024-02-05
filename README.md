# Snaplet Monorepo

Pre-requisites:

- Install [Nix](https://github.com/DeterminateSystems/nix-installer#usage) and optionally [direnv](https://github.com/nix-community/nix-direnv#with-nix-profile)
- If you use infisical for managing your `.env` files:
  - run `infisical login`
  - run `infisical init`
  - take a look at the `.env.example` files to fill your secrets
  - run `pnpm env:pull` to create/update all the `.env` files

Opiniated TypeScript monorepo architecture including:

- [x] Stable system dependencies (Nix/Devenv)
- [x] Pure ESM packages
- [x] Fast package manager (Pnpm)
- [x] Type-checking (TypeScript)
- [x] Lint (ESLint)
- [x] Format (Prettier)
- [x] Task runner (Turborepo)
- [x] Monorepo lint (Knip)
- [x] Unit/Integration tests (Vitest)
- [x] Components/E2E tests (Playwright)
- [x] Storybook
- [x] Stories tests (a11y included)
- [x] Vite web app
- [x] CLI app
- [x] API backend
- [x] Shared core/SDK
- [x] GitHub Action for tests
- [x] Renovate for dependencies updates
- [x] Environment variables management with infisical
- [ ] Use Bun
- [ ] GitHub Action for deployments
- [ ] GitHub Action for previews
- [ ] Design-system / UI library
- [ ] Changesets for versioning and publishing packages
- [ ] Observability (Opentelemetry/Grafana Tempo)