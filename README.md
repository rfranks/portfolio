# Portfolio Monorepo

Production portfolio platform built with Next.js App Router, TypeScript, MUI, and a growing set of interactive apps and presentation experiences.

This repository is intentionally architecture-driven:

- data contracts first (`resumeData.json` + schema + migrations),
- shared cross-app primitives for media/visualization/interaction,
- strict quality gates (budgets, lint, typecheck, tests, a11y),
- ADR-backed engineering decisions.

## What This Repo Contains

### Core portfolio surfaces

- Home portfolio experience with section pagers, command palette, telemetry, and panelized content.
- Project presentation routes driven by project contract data (`type: "presentation"` projects).
- Shared content/media/diagram components used across portfolio and project pages.

### Interactive apps (`src/app/*`)

- `blackjack`
- `pathforger`
- `warbirds`
- `zombiefish`
- `talentforge`
- `ai-shenanigans`
- `bookworm`
- `dna`
- `rickbert-studio`
- plus additional app routes (`blasteroids`, `petly`, etc.)

### Engineering support routes

- `/health` local quality snapshot dashboard
- `/replay` session replay-lite JSON viewer

## Repository Layout

```text
src/
  app/                         # routes + app-local internals
    <app>/
      _components/             # app-private UI
      _hooks/                  # app-private hooks
      _utils/                  # app-private runtime utilities
      _types/                  # app-private types
      _consts/                 # app-private constants/tokens
      _theme/                  # app-private theming (when needed)
  components/
    portfolio/                 # portfolio-domain components
    shared/                    # cross-app reusable components
  hooks/                       # reusable hooks (cross-feature)
  utils/                       # reusable runtime helpers/adapters
  types/                       # shared type contracts
  consts/                      # shared constants/tokens/schema maps
public/
  personal/data/resumeData.json
docs/adr/                      # architecture decision records
scripts/                       # quality checks + tooling
```

Private app modules live in underscore-prefixed folders. If logic gains cross-app reuse, promote it into `src/components/shared`, `src/hooks`, `src/utils`, `src/types`, or `src/consts`.

## Architecture Principles

1. **Contract-first data model**
   - Source of truth: `public/personal/data/resumeData.json`
   - Schema: `src/consts/resumeDataSchema.ts`
   - Migrations: `src/utils/data/migrations/resumeDataMigrations.ts`
   - Validation: `scripts/validate-resume-data.mts`

2. **Data-driven presentation pages**
   - Project contracts and deep-link index helpers in `src/components/portfolio/projectPageData.ts`
   - Route generation from project slugs (`src/app/[projectSlug]/page.tsx`)

3. **Controller + renderer separation**
   - Presentation orchestration in hooks (`useProjectPresentationController`, `useDeepLinkState`, `useSectionAudio`)
   - Section rendering in dedicated section components
   - Media stack split into controller + render/metadata shells + renderer registry

4. **Shared interaction primitives**
   - Pan/zoom and viewport behavior via shared hooks (`src/hooks/html/usePanZoomViewport.ts`)
   - Shared game simulation/runtime primitives under `src/utils/game/*`

5. **Typed observability**
   - Typed telemetry channels/actions/events in `src/consts|types|utils/observability`
   - Session replay-lite pipeline + replay viewer route

## ADRs

Current accepted ADR set:

- 0001 OpenAI client centralization
- 0002 Quality gates and budgets
- 0003 Resume data migration framework
- 0004 Observability primitives
- 0005 CLI command architecture
- 0006 TypeScript hardening phases

See `docs/adr/README.md` for ADR format and expectations.

## Development

### Prerequisites

- Node.js 20+
- npm 11+

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Key scripts

```bash
# Formatting
npm run format
npm run format:check

# Quality gates
npm run check:repo-hygiene
npm run check:asset-integrity
npm run check:file-budgets
npm run check:bundle-budget
npm run validate:resume:strict
npm run typecheck
npm run lint
npm run test
npm run test:a11y

# Full readiness gate
npm run prepr

# Search index artifact
npm run build:search-index
```

## Quality and CI Guardrails

- Pre-commit: lint-staged (`npm run precommit`)
- Pre-push: multi-step quality pipeline (`npm run prepush`)
- File budgets: `scripts/check-file-budgets.mts`
- Bundle budgets: `scripts/check-bundle-budget.mts`
- Health snapshots written to `public/personal/data/health/`

Important: this repository intentionally enforces file-size and bundle budgets. Prefer extraction and composition over raising budgets.

## Static Search Index

Command palette actions are generated from:

- live route-aware actions,
- static project/skills/technology/slide/diagram index actions.

Static artifact generation:

- script: `scripts/build-search-index.mts`
- output: `public/personal/data/search/static-search-index.json`
- consumer: `src/components/portfolio/layout/AppBar.tsx` (with safe runtime fallback)

## Data Contract Governance

When adding/changing resume/project fields:

1. Update schema (`resumeDataSchema.ts`)
2. Add migration (`resumeDataMigrations.ts`) if shape changed
3. Update validation (`validate-resume-data.mts`)
4. Update tests (`resumeDataSchema.test.ts` + relevant contract tests)
5. Run `npm run validate:resume:strict`

## Asset Integrity

Asset references (`/assets/*`, `/personal/*`, `/apps/*`) are checked by:

- `scripts/check-asset-integrity.mts`

This helps catch missing files (for example game powerup sprites) before push/deploy.

## Notes for Agentic Coding Tools

- Use `AGENTS.md` as the operational contract for refactors, quality cadence, and placement rules.
- Follow the required command matrix in `AGENTS.md` (`Step 6.1`) by change type.
- Avoid introducing app-private duplication; promote stable shared logic after the second consumer.
