# ADR 0003: Versioned migration framework for resume data

## Status

Accepted

## Context

`resumeData.json` evolves over time. Without explicit migration strategy, schema changes risk breaking static snapshots and updater workflows.

## Decision

Add migration framework under `src/utils/data/migrations/resumeDataMigrations.ts` with:

- explicit `schemaVersion`
- linear version upgrades
- centralized transform logic applied before schema parse

## Consequences

- Pros: safe forward evolution of data shape.
- Pros: cleaner updater/validator behavior across schema revisions.
- Tradeoff: requires migration maintenance with each breaking data change.

## Follow-up

Mirror migration framework for other persisted app datasets where schema drift is expected.
