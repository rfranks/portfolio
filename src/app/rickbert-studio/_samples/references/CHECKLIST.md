# CHECKLIST — Production Compliance and Validation (Revised)

## Purpose
This document exists to prevent the GPT from treating hard production constraints like soft creative guidance.

Use this checklist whenever generating a comic strip image.

If any required item fails, the output is not compliant and must be regenerated rather than returned.

---

## Why the style sometimes collapses into stick figures / diagrams
This failure happens when the image-generation prompt is too vague (a summary instead of a production-spec), or when the model drifts into "layout/wireframe" thinking.

### Root causes
1. The image prompt becomes a high-level summary
   - The model sends something like "a comic about confusion" instead of panel-by-panel production specs.
2. Fallback rendering mode is not explicitly forbidden
   - Without strong negatives, the renderer may choose a "diagram" style.
3. No style compliance gate exists
   - The output is accepted based on dialogue/layout only, even if the art style is wrong.

### Core fix
Treat house style as a hard production constraint and add explicit anti-fallback checks.

---

## Instruction hierarchy
Apply these rules in this order:
1. Explicit user instructions override all defaults
2. Locked panel-by-panel scripts override creative interpretation
3. Production constraints override stylistic convenience
4. Defaults apply only when the user has not specified otherwise

### Hard rule
If the user explicitly requests:
- a specific panel count
- a specific layout
- a specific title
- exact dialogue
- exact character placements
- exact props / labels / windows / signage
- a specific style constraint (including house style)

then those items are mandatory and may not be compressed, merged, omitted, paraphrased, reassigned, or substituted.

---

## Required preflight extraction
Before generating, extract and lock the following from the user request:

- Requested number of panels
- Requested layout
- Whether output must be one image or multiple files
- Required title
- Panel-by-panel scene content
- Exact dialogue per panel
- Speaker assignment per line
- Required characters per panel
- Required props / labels / visual callouts
- Required name tags / desk plates / remote windows / signage
- Any explicit style constraints
- Any explicit do-not-change rules

### NEW: Prompt completeness lock (preflight)
Before calling the image tool, confirm the image prompt contains:
- Layout + panel count + title requirement
- Panel-by-panel breakdown (1..N) including who appears, where, and what’s visible
- Verbatim dialogue with speaker attribution
- Required labels/name tags/nameplates/remote tiles
- House style requirements
- Anti-fallback negatives (see below)

If any are missing, do not generate yet—tighten the prompt first.

---

## Exact script lock rule
If the user supplies a complete panel-by-panel script, switch from story generation mode to production rendering mode.

### In production rendering mode:
- Do not invent new beats
- Do not condense panels
- Do not merge scenes
- Do not paraphrase dialogue
- Do not reassign lines to different speakers
- Do not omit props, tags, windows, or labels named by the user
- Do not alter panel order

Render the script faithfully.

---

## Panel layout enforcement
Panel layout is a hard constraint, not a style preference.

If the user provides 6 panels, the output must be:
- one single comic image
- landscape orientation unless otherwise specified
- exactly 6 panels
- arranged in 2 rows of 3

### Never allowed
- Returning 3 panels instead of 6
- Combining scripted panels into one
- Dropping a panel
- Reordering panels
- Splitting the strip into multiple images unless explicitly requested

---

## User override rule
Any explicit user specification overrides the default strip format immediately and completely.

Examples:
- Default may be 3 panels, but if the user requests 6 panels, it becomes a 6-panel job
- Default may be "choose characters," but if the user specifies panel-by-panel characters, those are locked
- Default may be "write dialogue," but if the user supplies exact dialogue, preserve it exactly

---

# Acceptance checklist before returning the image

Before accepting output, verify every item below.

## A) Format compliance
- [ ] Output is one image only
- [ ] Correct overall orientation (landscape unless requested otherwise)
- [ ] Correct title present if requested (RICKBERT at top if required)
- [ ] Correct total panel count
- [ ] Correct layout arrangement (3=1x3, 6=2x3)

## B) Script compliance
- [ ] All panels from the user’s script are represented
- [ ] Panel order matches the script exactly
- [ ] Dialogue is present in every scripted panel
- [ ] Dialogue is readable
- [ ] Dialogue matches the user’s wording verbatim when exact text was supplied
- [ ] Dialogue is assigned to the correct speaker
- [ ] No panel’s meaning was merged into another panel

## C) Character compliance
- [ ] Correct characters appear in the correct panels
- [ ] Character designs remain consistent across all panels
- [ ] Facial features, wardrobe shorthand, silhouettes remain identifiable
- [ ] Remote characters appear remotely when required (video window / monitor tile)

## D) Visual detail compliance
- [ ] Required props are present
- [ ] Required labels / signage / title cards are present
- [ ] Required name tags are visible
- [ ] Required desk nameplates are visible
- [ ] Required monitor / video-call windows are visible
- [ ] Special named objects/devices are correctly labeled (spelling matches)

## E) Readability compliance
- [ ] Text is crisp and human-readable
- [ ] Speech bubbles are not overcrowded
- [ ] Panel composition is readable at a glance
- [ ] No important text is cut off or garbled

## F) STYLE COMPLIANCE (NEW HARD GATE)
This section is mandatory. If any box fails, the output is not compliant.

### House style present
- [ ] Linework matches house style (clean, consistent outlines—not sketchy)
- [ ] Color/palette matches house style (office-safe, muted/pastel—not neon/flat-diagram)
- [ ] Shading/backgrounds match house style (minimal but comic, not blank template)
- [ ] Lettering feels like comic lettering (not UI labels / not infographic text blocks)

### NO DIAGRAM / NO STICK-FIGURE / NO STORYBOARD (HARD FAIL IF PRESENT)
- [ ] Not stick figures
- [ ] Not infographic / diagram / wireframe
- [ ] Not storyboard thumbnail / animatic
- [ ] Not vector-icon minimalist template
- [ ] Not photoreal / 3D / cinematic

If any of the above forbidden styles appear: regenerate.

---

## Failure handling
If any checklist item fails:
- Do not accept the output
- Do not silently proceed
- Do not pretend the output complied

Instead:
1. Identify what failed (be specific: "style collapsed to diagram mode," "panel 4 dialogue paraphrased," etc.)
2. Tighten the prompt around the failed requirement (add missing panel-by-panel details; add anti-fallback negatives)
3. Regenerate using locked requirements
4. Re-run the checklist

---

## Operating mode selection
### If the user gives only a premise
Use standard strip-creation behavior.

### If the user gives a full panel-by-panel script
Use production rendering mode:
- no rewriting
- no condensation
- no improvising
- no creative substitution
- only faithful visual execution

---

## Final rule
Never return a comic image until the requested structure, script, layout, required visual details, and style compliance have all been validated against this checklist.
