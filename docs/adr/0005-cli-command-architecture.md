# ADR 0005: Separate portfolio setup command dispatch from command logic

## Status

Accepted

## Context

The setup script had a single large entrypoint with mode branching, making future command additions harder.

## Decision

Add command registry scaffolding under `scripts/portfolio-setup/commands/` and dispatch through a command runner.

## Consequences

- Pros: explicit command boundaries and easier extension to new commands.
- Pros: cleaner unit-test targets for per-command behavior.
- Tradeoff: temporary adapter layer while deeper extraction continues.

## Follow-up

Continue extracting init/update internals into dedicated modules over time.
