# Portfolio Setup Wizard

This repo now uses exactly two setup commands:

- `npm run init`
- `npm run update`

## `npm run init`
Use right after forking.

What it does:
- Clears personalized assets from `public/apps/` and `public/personal/*` content folders.
- Replaces `public/favicon.ico` with `public/favicon.ico.default` (generic favicon).
- Runs an interactive wizard to:
  - capture your basic profile fields,
  - scaffold starter projects,
  - scaffold starter AI shenanigans,
  - optionally generate route skeletons in `src/app/<slug>/`.

## `npm run update`
Use any time after init.

What it does:
- Interactive edit wizard (no destructive reset) for:
  - add/replace projects,
  - add/replace AI shenanigans,
  - add/edit/remove experience entries,
  - add/edit/remove education entries,
  - add/edit/remove recognition snippets,
  - add/edit/remove recommendations,
  - view/set/delete any nested `resumeData.json` path (metadata editor),
  - move assets into `public/apps/<slug>/...` buckets (`images`, `videos`, `js`, `wasm`, etc.) with optional resume data path ref updates,
  - edit summary/contact basics.

## Scoped Asset Rules
The wizard intentionally limits asset pick-lists to scoped folders:

- Project assets:
  - `public/apps/<app-slug>/images`
  - `public/apps/<app-slug>/videos`

- AI shenanigan assets:
  - `public/personal/images/ai-shenanigans/<shenanigan-slug>`

If no files are detected, the wizard prints a hint telling you where to move files.
