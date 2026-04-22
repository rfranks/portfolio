# ADR 0001: Centralize OpenAI client access in shared utilities

## Status

Accepted

## Context

Multiple feature apps were calling OpenAI endpoints directly with duplicated URL/header/error parsing logic. This increased drift risk, made key handling inconsistent, and made retries/timeouts uneven.

## Decision

Create shared OpenAI client utilities in `src/utils/openai/client.ts` and route app call-sites through it. Keep client-side usage for static hosting compatibility.

## Consequences

- Pros: consistent endpoint handling, easier model/version updates, simpler auditing.
- Pros: one place for timeout/retry policy.
- Tradeoff: still browser-side key usage in static deployment mode.

## Follow-up

If deployment model changes, swap shared client internals to server proxy routes without changing most feature call-sites.
