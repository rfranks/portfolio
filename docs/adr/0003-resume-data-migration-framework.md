# ADR 0003: Versioned migration framework for resume data

## Status

Accepted

## Date

2026-04-24

## Decision Drivers

- Preserve backward compatibility for evolving `resumeData.json`.
- Keep schema changes explicit, testable, and safe across route/content features.
- Avoid ad-hoc one-off transforms hidden inside UI code.

## Context

`public/personal/data/resumeData.json` is the primary content contract for portfolio and presentation pages. Shape changes can break routing, pagers, media rendering, and validation unless migrations are explicit and ordered.

## Decision

Use a versioned migration pipeline:

- schema source: `src/consts/resumeDataSchema.ts`
- migration chain: `src/utils/data/migrations/resumeDataMigrations.ts`
- validation/linting: `scripts/validate-resume-data.mts`

Every breaking or structural data shape change must:

1. increment schema version,
2. add a linear migration step,
3. update validation behavior/tests.

## Enforcement and Validation

- No UI component may assume new fields without schema support.
- Deprecated legacy fields should warn first, then migrate/remove on scheduled timeline.
- Required checks:
  - `npm run validate:resume:strict`
  - `npm run typecheck`
  - `npm run test` (schema/migration tests)
- Contract tests should cover presentation route/deep-link compatibility when schema changes affect sections/media.

## Consequences

### Positive

- Predictable content evolution and safer deploys.
- Better resilience for static content updates.
- Easier governance for deprecations.

### Tradeoffs

- Additional maintenance for migration steps.
- Slightly slower iteration when data shape changes are frequent.

## Follow-up

- Maintain migration changelog/version notes in schema comments and validator output.
- Expand contract tests for deep-link validity and required section/media constraints.
