# ADR 0006: Phase in stricter TypeScript policy with dedicated config

## Status

Accepted

## Context

Immediate strict-mode escalation across all apps would be disruptive given current code volume and mixed maturity.

## Decision

Add `tsconfig.strict.json` and `typecheck:strict` to support incremental hardening while keeping existing workflow stable.

## Consequences

- Pros: teams can chip away at strictness debt in planned slices.
- Pros: avoids blocking deploys while still creating a measurable path to stricter typing.
- Tradeoff: two typecheck profiles to maintain short term.

## Follow-up

Promote strict config flags to primary config once error count is near zero.
