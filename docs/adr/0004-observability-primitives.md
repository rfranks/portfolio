# ADR 0004: Add lightweight observability primitives for client apps

## Status

Accepted

## Context

The project needed a low-friction way to capture runtime failures and basic performance signals without introducing heavy telemetry infrastructure.

## Decision

Introduce lightweight utilities:

- `src/utils/observability/logger.ts`
- `src/utils/observability/perf.ts`
- root `src/app/error.tsx`
- route telemetry component in shared monitoring

## Consequences

- Pros: better debugging context during iterative development.
- Pros: gives baseline instrumentation without vendor lock-in.
- Tradeoff: console-based telemetry only; no remote sink by default.

## Follow-up

Add optional exporter hook for remote telemetry ingestion when needed.
