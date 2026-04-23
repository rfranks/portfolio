# Husky hooks

- `pre-commit`: runs `npm run precommit` (lint-staged + prettier/eslint on staged files)
- `pre-push`: runs `npm run prepush` (full local quality gate with step-by-step failure reporting)
- `pre-merge-commit`: runs `npm run prepr` as an additional PR-ready gate

There is no native Git `pre-pr` hook, so `prepr` is enforced via `pre-push` and exposed as a manual script.
