# ADR 0005: Separate portfolio setup command dispatch from command logic

## Status

Accepted

## Date

2026-04-24

## Decision Drivers

- Reduce complexity in setup/update script entrypoints.
- Improve testability by isolating command behavior.
- Enable safe feature additions without bloating a single script.

## Context

The setup workflow previously concentrated command parsing, branching, and execution in a large entry file. This made maintenance harder and increased risk when adding new command modes.

## Decision

Use command registry + dedicated command modules:

- command modules under `scripts/portfolio-setup/commands/`
- dispatch/orchestration through a command runner
- shared utility helpers separated from command entrypoints

Keep command contracts explicit and composable.

## Enforcement and Validation

- New command functionality should land in command modules, not inline in entry scripts.
- Command option parsing should be deterministic and covered by tests.
- Required checks:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`

## Consequences

### Positive

- Clear command boundaries and lower review complexity.
- Better unit-test targeting for command behavior.
- Easier progressive extraction from legacy script paths.

### Tradeoffs

- Slight boilerplate overhead for simple commands.
- Temporary adapter layers while old paths are migrated.

## Follow-up

- Continue reducing `scripts/portfolio-setup.mts` size by extracting remaining logic.
- Keep command registry documentation aligned with implemented commands.
