# Refactor Roadmap (Engineering Debt)

## Goal

Reduce oversized modules and implicit coupling while keeping behavior stable.

## Priority order

1. `src/app/talentforge/_components/ApplicationBoard.tsx`
2. `src/app/warbirds/_hooks/useGameEngine.ts`
3. `src/app/talentforge/_utils/dataStore.ts`
4. `src/app/pathforger/_utils/pipeline.ts`
5. `scripts/portfolio-setup.mts`

## Tactics

- Extract pure helpers first (`*Utils.ts`, `*Selectors.ts`, `*Mappers.ts`).
- Move stateful orchestration into dedicated hooks.
- Keep presentation components under 300-500 lines.
- Keep command entrypoints thin; move mode internals to command modules.

## Guardrails

- `npm run check:file-budgets` must pass.
- Add test coverage for extracted helpers before moving orchestration logic.
- Preserve existing behavior before UX-level changes.
