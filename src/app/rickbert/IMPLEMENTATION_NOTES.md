# IMPLEMENTATION_NOTES

## Parser assumptions

- A full production script is detected by `### Panel N` headings.
- Panel parsing supports `Scene:` and `Dialogue:` sections with bullet lines in `**Speaker:** text` format.
- Speaker qualifiers in parentheses are preserved (for example, Alvin remote qualifier).
- If no panel script is provided, parser enters Standard mode and generates a default structured strip spec.

## Validation boundaries

- The validator enforces format/script/character/visual/readability/style categories.
- It catches panel count/layout mismatches, missing title (when required), missing speakers, missing required props/labels/windows/nameplates, Alvin-remote requirements, and likely bubble overflow.
- Style gate blocks forbidden drift terms (diagram/stick-figure/wireframe/storyboard/etc.).
- Validation is deterministic against `ComicStripSpec` + extracted preflight requirements.

## Rendering tradeoffs

- Renderer uses vector primitives and reusable presets (no AI bitmap generation).
- Character visuals are intentionally flat/simplified for consistency and speed.
- Bubble placement is speaker-anchored with basic clamping; full collision resolution is deferred.
- Office backgrounds are sparse and low-detail to prioritize dialogue legibility.

## Portfolio integration support

- Domain contracts are centralized in Zod schemas and can be reused across apps.
- Layout engine and rendering components are decoupled from the studio shell.
- Zustand store is app-specific, while parser/validation/rendering logic is UI-agnostic and extractable into a shared package.
- Final image generation is isolated behind a feature client wrapper, so the OpenAI integration can be swapped or moved into shared infra later.
