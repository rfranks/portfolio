# Palmalyzer Tracing Rules (Authoritative)

This document defines how to trace palm lines so overlays stay faithful to
the photographed creases while still handling fragmented visibility.

## Core goal

Trace the real crease flow from the photo. Prefer line placement that hugs
visible crease valleys and only use approximation to bridge short missing
sections between believable neighboring fragments.

## Coverage target (major + minor lines)

Always attempt to trace all standard lines where evidence allows.

Major lines:

- Life
- Head
- Heart

Minor lines:

- Fate
- Sun (Apollo)
- Mercury

For each line class, include any segment that passes crease-hugging validation,
even if the full line is not continuously visible.

## Key principle

Accuracy is still higher priority than completeness, but controlled
approximation is allowed when it keeps the trace close to visible evidence.

## Pipeline steps

1. Enhance contrast on grayscale input (typically CLAHE + mild smoothing + unsharp).
2. Build a technical tracing view (TS) that highlights crease fragments over texture.
3. Extract or manually identify crease segments in the palm region.
4. Place dense anchors directly on visible valley centers.
5. Connect anchors with crease-hugging polylines.
6. Bridge short gaps conservatively when the local line path is strongly implied.

## Dense anchor rule

- Use many short segments rather than long smooth strokes.
- Add anchor points at each local bend, fork, fade, or reappearance.
- Keep anchor spacing tighter in curved zones and near branch points.

## Controlled approximation rule

When segments branch heavily, break into short fragments, or blend into texture:

- Approximate as necessary, but hug as close as possible to adjacent visible crease evidence.
- Extrapolate from the nearest confirmed anchors using local tangent and curvature continuity.
- Use typical Life/Head/Heart flow only as a weak tiebreaker, never as a standalone template.
- Keep bridge spans short; re-lock to visible crease as soon as it reappears.

Do not:

- draw long template arcs across broad blank skin
- force full-length lines when evidence is too weak
- replace observed geometry with idealized palmistry shapes

## Gap-bridging limits

Bridge a gap only if all are true:

- visible fragments exist on both sides, or one side with very strong directional continuity
- the inferred segment maintains plausible local direction and curvature
- the bridge stays inside the likely crease corridor seen in Gray/Gray Unsharp

If these are not met, shorten the line or omit the uncertain section.

## Line inclusion rule

Do not use an all-or-nothing rule per line class.

- If a full line cannot be validated, keep the validated segments.
- Prefer partial but accurate traces over dropping a line class entirely.
- Only omit a line class when no segment for that class passes validation.

## Expected output

A correct overlay should:

- align tightly to photographed crease valleys for most of each line
- show conservative short bridges only where fragmentation prevents continuous visibility
- avoid obvious drift, oversmoothing, and template-like placement

The final result should look manually traced from the photo, with minimal,
defensible extrapolation where necessary.
