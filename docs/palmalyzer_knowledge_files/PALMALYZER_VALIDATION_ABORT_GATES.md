# Validation, Abort Conditions, and Output Gate

## Line validation rule
Before accepting the Final Overlay, visually compare each colored line against the underlying crease.
Reject it if it does not appear to hug the photographed crease.
A viewer should feel the overlay was traced directly from the crease pixels rather than estimated.

## Mandatory Trace Validation and Retry Rule
The Final Overlay must pass a strict visual validation step before it is allowed to be produced.

For each traced line:
- Visually inspect the full polyline against the enhanced crease structure (normally Panel 2).
- Confirm the line sits on the darkest part of the crease valley for the majority of its length.
- Confirm curvature changes are matched by corresponding anchor points.

Reject a trace if:
- the line drifts off the crease valley
- the line crosses broad blank skin with no nearby crease evidence
- the line follows an assumed template instead of the visible crease
- the line uses long smooth segments that ignore curvature
- the line appears mostly invented rather than anchored to real fragments

If any traced line fails validation:
- discard the overlay
- do not output the image
- restart from the crease inspection stage

Controlled approximation is allowed only for short gap bridges between believable fragments.

## Controlled Approximation Rule
Template-driven placement remains forbidden. However, short extrapolated connectors are allowed when:
- nearby visible anchors support direction and curvature continuity
- the connector stays in the likely crease corridor on Gray/Gray Unsharp
- the bridge length is minimal and reattaches to visible crease promptly

If these conditions are not met, trim or omit the uncertain section.
Accuracy still takes priority over completeness.

## Final Overlay Presentation Rule
Final Overlay is always Line Map mode.
- Never place traced lines on top of the hand image.
- Preserve traced coordinates exactly on the line-map canvas.

## Major/Minor Coverage Gate
Before final output, attempt validated tracing for all major and minor line classes
defined in `PALMALYZER_TRACING_RULES.md`.
- Include every segment that passes validation.
- Do not drop a line class if partial segments are valid.
- A fully blank line map is allowed only when zero segments across all major+minor
  line classes pass validation after retry.

## Mandatory Abort Conditions (must retry)
Abort tracing and retry if:
- TS panel is dominated by speckle noise rather than crease fragments
- crease contrast is too weak to confidently trace
- line validation rule fails
- overlay appears misaligned when compared with Panel 2
- too many gap bridges are required to sustain a believable line path

When aborting:
- regenerate enhancement panels
- adjust thresholds or filtering
- attempt tracing again
- never deliver a visibly incorrect overlay

## Output Gate Rule (final inspection)
Before producing the Final Overlay, perform a final human-style inspection:
“Would a viewer believe this line was manually traced from visible crease evidence, with only minimal bridging where visibility breaks?”
If no: discard and retrace.
