# Shared Component Conventions

`src/components/shared` follows a domain-first structure:

- `content`: text-heavy renderers and content wrappers
- `media`: reusable image/video presentation components
- `loading`: progress/thinking/timer experiences
- `visualization`: diagrams, timelines, and data visuals
- `controls`: small reusable interaction/display controls

## Naming Rules

- Domain folders are lowercase (`content`, `media`, `loading`, etc.).
- Shared component files use `PascalCase.tsx` directly in their domain folder
  (`loading/CircularTimer.tsx`, `visualization/Timeline.tsx`, etc.).
- Avoid per-component `index.tsx` folders in shared domains.
- Each domain exposes an `index.ts` barrel.
- `src/components/shared/index.ts` re-exports all domain barrels for app-level imports.

## Import Rules

Preferred app import style:

```ts
import { MarkdownContent, ImageLightbox, Diagram } from "@/components/shared";
```

Optional domain-scoped import when needed:

```ts
import { ImageLightbox, VideoLightbox } from "@/components/shared/media";
```
