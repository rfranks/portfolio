# Rickbert Studio (`/rickbert`)

Rickbert Studio is a browser-based comic strip production app for the RICKBERT workplace series.

It converts three inputs:
- master system prompt
- reference markdown docs
- strip request/script

Into five outputs:
1. parsed internal comic spec
2. checklist-based preflight validation report
3. rendered comic strip on `react-konva`
4. PNG export
5. reusable rendering/domain architecture for portfolio integration

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open:
   - [http://localhost:3000/rickbert](http://localhost:3000/rickbert)
4. Enter your OpenAI API key at startup when prompted.

## Architecture

Implementation is isolated under:
- `src/rickbert-studio`

Primary folders:
- `app/`: app bootstrap (`RickbertStudioApp`)
- `studio/`: multi-pane shell UI and toolbar actions
- `schemas/` + `models/`: Zod + TypeScript domain contracts
- `parser/`: script-to-spec transformation
- `validation/`: preflight checklist engine
- `rendering/`: layout engine and render settings
- `comic/`: reusable Konva primitives/components
- `store/`: Zustand studio state/actions
- `export/`: PNG export utility
- `features/finalRender/`: client integration for OpenAI final-image rendering
- `samples/`: seeded prompt/docs/ambient-scribe script fixtures
- `samples/references/`: exact local reference markdown snapshots used as dev fixtures
- `domain/` + `rules/` + `utils/`: canonical characters, style rules, helpers

## Key Design Decisions

- Parsing, validation, and rendering are separated and do not depend on UI state.
- Production mode preserves script dialogue line-by-line from panel scripts.
- Style constraints and anti-diagram/stick-figure checks are implemented as functional validation.
- Konva components are composable (`ComicPanel`, `CharacterSprite`, `SpeechBubble`, `VideoWindow`, etc.) for reuse in a future shared package.
- `rendering/layoutEngine.ts` isolates panel geometry so layout changes are independent of drawing code.
- A two-stage render flow is supported: structured outline render first, then optional OpenAI-powered Final Render (browser direct call) using the outline image plus prompt/spec as locked inputs.
- Final Render includes a `Use outline guide` toggle; leaving it off generally produces less placeholder-style bias.

## Future Extension Ideas

- Bubble collision and overlap-avoidance pass
- Per-panel inspector with drag-and-drop anchor controls
- JSON import/export for `ComicStripSpec`
- Post-validation auto-layout refinement
- Package extraction of `src/rickbert-studio/comic` + `rendering` as shared module
