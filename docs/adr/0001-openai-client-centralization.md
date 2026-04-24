# ADR 0001: Centralize OpenAI client access in shared utilities

## Status

Accepted

## Date

2026-04-24

## Decision Drivers

- Consistent timeout/retry/cancel behavior across apps.
- One place for request profile defaults and error normalization.
- Reduced drift risk from ad-hoc `fetch` logic in feature code.
- Safer future migration path (proxy/server-side routing) without mass call-site rewrites.

## Context

Feature apps previously called OpenAI endpoints directly with duplicated endpoint/header/body parsing logic. This caused inconsistent retries, uneven abort handling, and difficult debugging when a stage was canceled or timed out.

## Decision

All OpenAI requests must go through shared wrappers:

- `src/utils/openai/client.ts`
- `src/utils/network/httpClient.ts`

Feature code may build prompts/payloads, but network execution, retry policy, timeout policy, and error normalization live in shared client layers.

## Enforcement and Validation

- No direct `fetch("https://api.openai.com/...")` in app feature folders.
- Request profile selection must use shared typed profiles (no inline retry/timeout magic numbers at call-sites).
- Required checks after changes:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` (for changed request orchestration paths)
- PathForger and other pipeline stages must honor abort/cancel from shared client contract.

## Consequences

### Positive

- Uniform network behavior and predictable retries/cancel semantics.
- Easier instrumentation and incident debugging.
- Lower cost to evolve API versions/models.

### Tradeoffs

- Slight indirection for feature developers.
- Shared client changes carry cross-app blast radius and need stricter validation.

## Follow-up

- Add/maintain focused tests for retry, abort, timeout, and status mapping behavior.
- If deployment model changes, migrate shared client internals to server proxy without changing feature call-sites.
