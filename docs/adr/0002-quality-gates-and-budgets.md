# ADR 0002: Introduce CI quality gates and engineering budgets

## Status

Accepted

## Date

2026-04-24

## Decision Drivers

- Prevent silent regressions in a multi-app workspace.
- Keep oversized files and bundle growth visible and actionable.
- Provide deterministic pre-push quality enforcement.

## Context

Repository growth increased the likelihood of regressions, monolithic files, and performance drift. Prior checks were inconsistent and did not clearly communicate why pushes failed.

## Decision

Adopt and enforce the following quality gates:

- hygiene: `npm run check:repo-hygiene`
- file size budgets: `npm run check:file-budgets`
- resume contract validation: `npm run validate:resume:strict`
- formatting: `npm run format:check`
- typing: `npm run typecheck`
- lint: `npm run lint`
- tests: `npm run test`

Use `npm run prepr` as the full local readiness gate before handoff/push.

## Enforcement and Validation

- `scripts/check-file-budgets.mts` remains authoritative for line-count budgets.
- `scripts/check-bundle-budget.mts` remains authoritative for bundle budgets.
- Oversized files should be reduced through extraction before raising budgets; exact-budget entries require explicit justification.
- Pre-push output must show the failing step and rerun command.

## Consequences

### Positive

- Faster root-cause isolation when checks fail.
- Ongoing pressure toward smaller modules and safer refactors.
- Better predictability of merge/push quality.

### Tradeoffs

- More frequent early failures during large refactors.
- Maintenance overhead for budget tuning as architecture evolves.

## Follow-up

- Periodically tighten exact-budget thresholds after extractions land.
- Keep pre-push and CI messages explicit and developer-friendly.
- Add route-level budget reporting where useful.
