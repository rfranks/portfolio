# ADR 0004: Add lightweight observability primitives for client apps

## Status

Accepted

## Date

2026-04-24

## Decision Drivers

- Need actionable debugging signals without heavy vendor lock-in.
- Consistent telemetry vocabulary across navigation/media/pager/interaction surfaces.
- Support local diagnostics and replay workflows.

## Context

As interactive surfaces expanded (pagers, media, diagrams, gestures), regressions became hard to diagnose from logs alone. A lightweight, typed telemetry baseline was needed to support performance and behavior debugging.

## Decision

Adopt shared observability primitives:

- logging/perf utilities in `src/utils/observability/*`
- event constants in `src/consts/observability/*`
- event payload contracts in `src/types/observability/*`
- route and interaction emitters in shared monitoring components (`NavigationTelemetry` and related instrumentation)

Telemetry events should be typed and emitted through shared helpers, not ad-hoc string literals.

## Enforcement and Validation

- No new stringly-typed telemetry event names in feature components.
- Keep payloads minimal and avoid sensitive user data in event payloads.
- Required checks:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
- Health snapshots and replay-lite exports should stay schema-compatible.

## Consequences

### Positive

- Better regression triage and performance diagnosis.
- Lower cognitive load from unified event naming.
- Improved debuggability for gesture/media issues.

### Tradeoffs

- Additional maintenance for event contracts.
- Potential event noise if sampling/verbosity is not tuned.

## Follow-up

- Continue consolidating to a typed telemetry event bus.
- Add/maintain replay viewer compatibility and route-level performance summaries.
