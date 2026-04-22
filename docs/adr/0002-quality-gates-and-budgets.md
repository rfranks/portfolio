# ADR 0002: Introduce CI quality gates and engineering budgets

## Status

Accepted

## Context

The repository has grown into a multi-app mono-repo style workspace with large files and increasing risk of regressions.

## Decision

Add and enforce:

- `typecheck` and `lint`
- test execution in deploy pipeline
- repository hygiene checks (`.DS_Store` guard)
- file line-count budgets (`scripts/check-file-budgets.mts`)
- bundle size budgets (`scripts/check-bundle-budget.mts`)

## Consequences

- Pros: catches regressions before deploy.
- Pros: creates pressure to split oversized files.
- Tradeoff: CI may fail more often initially while debt is reduced.

## Follow-up

Tune file/bundle thresholds as refactors land; tighten progressively.
