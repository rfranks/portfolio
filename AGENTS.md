# AGENTS.md

## Purpose

This file defines how agentic coding tools should work in this repository so they preserve the existing architecture, quality gates, and performance profile.

## Architectural North Star

- Data-driven UI and routing from `resumeData.json` contracts.
- Contract-first TypeScript and schema validation before UI behavior.
- Feature orchestration in hooks/controllers; rendering in small section/components.
- Reusable shared primitives for media, diagrams, pan/zoom, telemetry, and paging.
- Progressive hardening via budgets, lint/type/test/a11y checks, and migration governance.

## Repository Patterns To Preserve

### 0) Code placement and visibility boundaries

- App-private code belongs under each app folder using underscore-prefixed internal modules:
  - `src/app/<app-name>/_components`
  - `src/app/<app-name>/_hooks`
  - `src/app/<app-name>/_utils`
  - `src/app/<app-name>/_types`
  - `src/app/<app-name>/_consts`
  - `src/app/<app-name>/_theme`
- Treat underscore-prefixed app folders as private implementation details for that app surface.
- If a module is reused across apps or portfolio surfaces, promote it out of app-private folders into global shared locations:
  - UI primitives/composites -> `src/components/shared`
  - reusable hooks -> `src/hooks`
  - reusable utilities -> `src/utils`
  - reusable type contracts -> `src/types`
  - reusable constants/tokens/config -> `src/consts`
- Promotion rule: do not duplicate logic across two app-private folders; extract shared behavior once it has a second stable consumer.

### 0.1) Top-level `src/*` separation principles

- `src/app`:
  - Route entrypoints, page/layout wiring, and app-local orchestration.
  - App-private internals stay in underscore folders under each app (`_components`, `_hooks`, `_utils`, `_types`, `_consts`, `_theme`).
- `src/components`:
  - React component composition only.
  - `src/components/shared`: globally reusable, cross-app UI components.
  - `src/components/portfolio`: portfolio-domain components (can depend on shared, should not become a generic utility bucket).
- `src/hooks`:
  - Reusable hooks, especially cross-feature interaction/state patterns.
  - Prefer moving reusable hooks out of component folders into `src/hooks`.
- `src/utils`:
  - Runtime helper logic and adapters (network, telemetry, parsers, mappers, formatters).
  - Avoid storing type declarations here; colocate types in `src/types`.
- `src/types`:
  - Type contracts and interfaces only (no business/runtime logic).
  - Canonical source for shared DTOs, contracts, and cross-layer API types.
- `src/consts`:
  - Static constants, tokens, schema definitions, configuration maps, and enum-like literal sets.
  - Avoid embedding mutable runtime state here.
- `src/themes`:
  - Theme system and design-system theme composition (MUI theme registry, palette/typography/shape tokens).
  - Keep visual tokens centralized; do not scatter theme constants across feature components.
- Rule of thumb:
  - UI rendering -> `components`
  - stateful reusable behavior -> `hooks`
  - pure/helper runtime logic -> `utils`
  - compile-time contracts -> `types`
  - static config/tokens -> `consts`
  - design language/theme -> `themes`

### 0.2) Shared component conventions

- `src/components/shared` is domain-first:
  - `content`, `media`, `loading`, `visualization`, `controls`, etc.
- Keep shared component files as `PascalCase.tsx` in the domain folder.
- Prefer barrel exports from domain `index.ts` and `src/components/shared/index.ts`.
- Preferred imports:
  - `import { Diagram, MediaCycler } from "@/components/shared";`
  - domain-scoped imports only when needed.

### 1) Contract-first data model

- Source of truth: `public/personal/data/resumeData.json`.
- Validate shape with `src/consts/resumeDataSchema.ts`.
- Evolve shape through versioned migrations in `src/utils/data/migrations/resumeDataMigrations.ts`.
- Validate and lint content through `scripts/validate-resume-data.mts`.
- Never add new UI-only fields without schema + migration + validation coverage.

### 2) Presentation pages are data-driven

- Presentation routes are generated from project slugs and project type in:
  - `src/components/portfolio/projectPageData.ts`
  - `src/app/[projectSlug]/page.tsx`
- Do not hardcode presentation project slug lists in page components.
- Section availability/order should be resolved from presentation config, not component-local constants.

### 3) Controller + section decomposition

- `ProjectPresentation` acts as orchestrator, not a monolith.
- Put section state, deep-link synchronization, pager behavior, and audio into hooks under:
  - `src/components/portfolio/project-presentation/hooks/`
- Keep section UI focused in:
  - `src/components/portfolio/project-presentation/sections/`

### 4) Shared media stack separation

- `MediaCycler` uses a controller/render-shell/metadata-shell pattern.
- Renderer-level logic belongs in:
  - `src/components/shared/media/media-cycler/renderers/`
  - registry: `rendererRegistry.ts`
- New media behavior should be integrated via typed contracts first:
  - `src/types/media/*`
  - `src/types/components/shared/*`

### 5) Visualization decomposition and reusable viewport engine

- Diagram concerns are split into:
  - `DiagramCanvas`, `DiagramToolbar`, `DiagramCodePanel`, exports hooks.
- Pan/zoom interaction should flow through shared hook primitives:
  - `src/hooks/html/usePanZoomViewport.ts`
- Any new zoomable surface (image/pdf/diagram variants) should reuse this interaction model.

### 6) Typed observability event bus

- Use typed telemetry constants/contracts:
  - `src/consts/observability/*`
  - `src/types/observability/*`
  - `src/utils/observability/*`
- Emit events via typed helpers, not ad-hoc string events.
- Keep timeline/replay semantics consistent with `NavigationTelemetry`.

### 7) PathForger pipeline architecture

- Keep pipeline execution declarative:
  - stage modules
  - orchestration state machine
  - transition/policy map
- Files:
  - `src/app/pathforger/_utils/pipeline/stageModules.ts`
  - `src/app/pathforger/_utils/pipeline/orchestrationStateMachine.ts`
  - `src/app/pathforger/_utils/pipeline/orchestrationPolicyMap.ts`
- New stage work must include transition validity, retry/cancel policy, and progress-state compatibility.

### 8) Extract consts/types/utils out of component files

- Avoid heavy local constants/types/utils in component modules.
- Place them in domain folders under `src/consts`, `src/types`, `src/utils`, or feature `_types/_utils`.
- Keep components mostly composition/render logic.

## Agentic Change Workflow

### Step 1: Identify affected contracts

Before editing UI behavior, identify whether changes require updates to:

- schema (`resumeDataSchema.ts`)
- migrations (`resumeDataMigrations.ts`)
- typed contracts (`src/types/**`)
- validator scripts/tests

### Step 2: Change smallest stable layer first

Apply in this order when applicable:

1. Types/contracts
2. Schema/migration/validation
3. Controller/hooks
4. Rendering components
5. Styles/tokens
6. Tests

### Step 3: Keep modules small and composable

- Prefer extraction over extending already-budgeted files.
- Avoid re-introducing monoliths in `ProjectPresentation`, `MediaCycler`, `Diagram`, or PathForger pipeline entrypoints.

### Step 4: Add or update tests with behavior

At minimum, update relevant tests when touching:

- schema/migrations: `src/tests/resumeDataSchema.test.ts`
- media behavior: `src/tests/MediaCycler.integration.test.tsx`
- hydration-sensitive diagram behavior: `src/tests/Diagram.hydration.test.tsx`
- presentation routing/deep links: contract tests under `src/tests/*routing*.test.ts`
- accessibility impacts: tests under `src/tests/accessibility/`

### Step 5: Run quality gates

Run targeted first, then full gate:

- `npm run check:repo-hygiene`
- `npm run check:file-budgets`
- `npm run validate:resume:strict`
- `npm run format:check`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- Full: `npm run prepr`

### Step 6: Command cadence (repo sanctity)

- After every meaningful code action (file edit/add/move):
  - `npm run check:file-budgets`
- After each completed change slice (feature/refactor chunk):
  - `npm run check:repo-hygiene`
  - `npm run format:check`
  - `npm run typecheck`
  - `npm run lint`
- After any `resumeData.json`, schema, migration, or presentation-contract change:
  - `npm run validate:resume:strict`
- After accessibility-sensitive pager/media/dialog changes:
  - `npm run test:a11y`
- Before commit/push/handoff:
  - `npm run prepr`
- If a command fails, fix forward immediately; do not stack unrelated edits on top of a failing baseline.

### Step 6.1: Required command matrix by change type

Use this matrix as the minimum required verification set.

| Change type                                                           | Required commands                                                                         | Optional/when needed                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Pure UI/layout/styling in existing component                          | `npm run check:file-budgets`, `npm run format:check`, `npm run typecheck`, `npm run lint` | `npm run test` if interaction behavior changed                           |
| Pager/media/gesture/input behavior                                    | `npm run check:file-budgets`, `npm run typecheck`, `npm run lint`, `npm run test`         | `npm run test:a11y` for keyboard/focus/dialog changes                    |
| Shared component API changes (`src/components/shared/**`)             | `npm run check:file-budgets`, `npm run typecheck`, `npm run lint`, `npm run test`         | `npm run check:bundle-budget` for heavy media/visualization impacts      |
| Hook/controller/orchestration refactors                               | `npm run check:file-budgets`, `npm run typecheck`, `npm run lint`, `npm run test`         | `npm run typecheck:strict` when tightening contracts                     |
| `resumeData.json` content-only edits                                  | `npm run validate:resume:strict`                                                          | `npm run test` when content affects routing/selection logic              |
| Schema/contract/migration edits (`resumeDataSchema`/migrations/types) | `npm run validate:resume:strict`, `npm run typecheck`, `npm run lint`, `npm run test`     | `npm run typecheck:strict` for stricter policy additions                 |
| Routing/deep-link/project presentation contract changes               | `npm run typecheck`, `npm run lint`, `npm run test`, `npm run validate:resume:strict`     | `npm run check:bundle-budget` if lazy boundaries or route chunks changed |
| Telemetry/observability changes                                       | `npm run typecheck`, `npm run lint`, `npm run test`                                       | capture/update health snapshots when relevant                            |
| Script/tooling/CI checks (`scripts/**`, hooks, budgets)               | `npm run typecheck`, `npm run lint`, `npm run test`, `npm run check:repo-hygiene`         | run affected script directly (example: `npm run check:file-budgets`)     |
| Pre-push readiness (any significant branch)                           | `npm run prepr`                                                                           | `npm run build` only when user asks or release-critical                  |

### Step 7: Expensive checks policy

- Do **not** run `npm run build` by default during normal refactors.
- Run `npm run build` (and bundle checks) only when:
  - explicitly requested by the user, or
  - validating a release-critical change.
- If running build-level checks, include:
  - `npm run build`
  - `npm run check:bundle-budget`
  - optional: `npm run analyze:bundle`

## Required Guardrails

- No direct OpenAI request logic in feature apps; use shared clients:
  - `src/utils/openai/client.ts`
  - `src/utils/network/httpClient.ts`
- No hardcoded presentation slugs where contracts already provide lookup/index helpers.
- No untyped window event names for telemetry/shortcuts.
- No schema-breaking `resumeData` changes without migration/changelog/governance update.
- No bypass of file budgets by silent growth; prefer extraction.
- Keep Turbopack/Webpack config parity safe in `next.config.ts` (avoid reintroducing config mismatch warnings).
- Do not leave generated health snapshot artifacts dirty without explicitly deciding whether to keep or ignore them.

## Performance and Bundle Rules

- Lazy-load heavy media/rendering libs by media intent and section transitions.
- Prefer registry-based prefetch (`rendererRegistry.ts`) and route-aware prefetch planners.
- Use visualization tokens/constants rather than ad-hoc timing/zoom values.

## Accessibility and Input Rules

- Preserve keyboard parity for pagers/media controls.
- Preserve small-screen behavior contracts (selected value readability, control visibility rules).
- Preserve gesture behavior through shared viewport hook calibration and caps.

## Documentation Rules For Agents

When introducing a significant architecture change:

- Update or add an ADR under `docs/adr/`.
- Keep ADR concise: context, decision, consequences, follow-up.
- If schema-related, update changelog/version governance in `resumeDataSchema.ts`.

## Quick Playbooks

### Add a new presentation project

1. Add project entry in `resumeData.json` with `type: "presentation"` and presentation config.
2. Ensure diagrams/demo/overview fields satisfy schema.
3. Run `npm run validate:resume:strict`.
4. Verify deep-link index generation via `projectPageData.ts` helpers.

### Add a new media type behavior

1. Extend media type contracts in `src/types/media/*`.
2. Add renderer + registry integration under `media-cycler/`.
3. Wire telemetry action contracts if needed.
4. Add MediaCycler integration tests.

### Add a new PathForger pipeline stage

1. Add stage module.
2. Register transition in orchestration state machine map.
3. Add stage policy (retry/cancel/recover).
4. Ensure progress messaging and abort behavior are consistent.
5. Add/update pipeline tests.

## ADR Gap Backlog (Recommended)

These are not blockers for coding, but should be documented as ADRs when touched next:

- Shared interactive viewport abstraction strategy across diagram/image/pdf.
- Presentation deep-link state restore contract and precedence rules.
- MediaCycler controller/renderer contract boundaries and extension policy.
- Telemetry event taxonomy and sampling policy evolution.
