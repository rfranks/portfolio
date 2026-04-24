# ADR 0006: Phase in stricter TypeScript policy with dedicated config

## Status

Accepted

## Date

2026-04-24

## Decision Drivers

- Improve correctness and refactor safety without halting delivery.
- Provide measurable strictness progress in a large mixed-maturity codebase.
- Reduce reliance on permissive fallback typing patterns.

## Context

Immediate strict-mode enforcement across all apps was disruptive due to existing legacy patterns. A phased approach was needed to keep momentum while steadily reducing typing debt.

## Decision

Use staged strictness with dedicated configs:

- base workflow: `npm run typecheck`
- strict track: `npm run typecheck:strict`
- strict profile configuration in `tsconfig.strict.json`

Apply stricter rules progressively by domain/module while keeping baseline typecheck green.

## Enforcement and Validation

- New shared contracts should be strict-first.
- Avoid introducing `any` in new code; prefer explicit discriminated unions and typed helpers.
- Required checks:
  - `npm run typecheck`
  - `npm run lint`
- Incremental milestones should be reflected by shrinking strict-check error surface.

## Consequences

### Positive

- Better editor feedback and runtime defect prevention.
- Safer large refactors with stronger compile-time guarantees.
- Team can progress in slices without full-blocking rollout.

### Tradeoffs

- Dual-config maintenance overhead in the interim.
- Some modules remain partially hardened until migration completes.

## Follow-up

- Promote strict settings into primary config once strict backlog is near zero.
- Keep strictness work visible in refactor backlogs and ADR updates when policy changes.
