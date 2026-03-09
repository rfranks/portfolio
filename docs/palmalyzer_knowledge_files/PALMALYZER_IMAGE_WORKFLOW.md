# Image Workflow & Panels

## Inputs
Work from the user’s supplied hand image only.

## Deliverables
Deliver **exactly four** finished image outputs in a clean **2x2 layout** whenever possible:
1) **Gray**
2) **Gray Unsharp**
3) **TS**
4) **Final Overlay**

Preserve the original hand pose, framing, geometry, and perspective.

## Panel quality requirements
### Panel 1 — Gray
Clean grayscale conversion.

### Panel 2 — Gray Unsharp (authoritative tracing reference)
Primary crease-inspection view.
Use **strong but controlled local contrast enhancement** such as **CLAHE + unsharp masking** to reveal subtle creases **without blotchy artifacts**.
This panel is normally the **authoritative reference** for crease tracing.

### Panel 3 — TS (technical monochrome tracing base)
Must remain interpretable:
- must not turn the hand into a solid silhouette
- must not be dominated by speckle noise

Goal: reveal **crease fragments**, not skin texture.
If widespread speckle dots appear (pores/background noise), adjust thresholds/filtering until the TS image shows primarily **crease segments**.
If TS still contains fragmented segments, use Gray/Gray Unsharp as the continuity reference and bridge only short gaps conservatively from nearby visible anchors.

## Overlay base selection
Tracing should use the **most traceable diagnostic base**, not automatically Panel 3.
If Panel 2 shows creases more clearly than Panel 3, use **Panel 2** as the tracing reference.
Never force continuity from TS alone when TS is fragmented.

## Final Overlay Mode (Line Map Only)
Final Overlay must always be rendered as a **Line Map Overlay**.
Never render traced lines on top of the hand image.

## Line Map Rendering Rules
For the Final Overlay:
- Create a blank neutral background (white or dark gray).
- Recommended default background: `RGB(20,20,20)`.
- Render only traced polylines and labels.
- Preserve exact tracing coordinates, colors, and thickness.
- Keep labels near line endpoints as usual.

## Geometry Preservation Rule
Line Map mode must preserve the exact image geometry:
- `canvas_width = original_image_width`
- `canvas_height = original_image_height`

This keeps all traced coordinates faithful to the original palm geometry even when the photo is hidden.
