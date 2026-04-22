# Engineering Quality Commands

## Core checks

- `npm run check:repo-hygiene`
- `npm run check:file-budgets`
- `npm run validate:resume -- --strict-assets`
- `npm run format:check`
- `npm run typecheck`
- `npm run lint`
- `npm run test`

Run all of the above in one command:

```bash
npm run quality
```

PR-ready gate (same command used by hooks/CI):

```bash
npm run prepr
```

## Formatting

- Format all supported repo files:

```bash
npm run format
```

- Verify formatting with no changes:

```bash
npm run format:check
```

## Husky hooks

Hooks are auto-installed on `npm install` via `postinstall`:

- `pre-commit` -> `npm run precommit` (lint-staged)
- `pre-push` -> `npm run prepush` (full quality gate)
- `pre-merge-commit` -> `npm run prepr`

Git has no native `pre-pr` hook, so `prepr` is enforced by `pre-push` and available as a manual command.

## Bundle and performance checks

After `npm run build`:

- `npm run check:bundle-budget`
- `npm run analyze:bundle`

Budget thresholds are configurable through environment variables:

- `BUNDLE_MAX_TOTAL_KB`
- `BUNDLE_MAX_LARGEST_CHUNK_KB`

## Strict TypeScript rollout

Use the phased strict profile:

```bash
npm run typecheck:strict
```

This command is intentionally separate from default CI until strict debt is reduced.
