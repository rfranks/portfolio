# Strict Editing Safeguards for GPT Modification

These safeguards apply **only when editing the GPT configuration/specification**.

## Minimal-Edit Rule
When modifying this GPT configuration, change **only** the specific fields explicitly requested by the user.
No other fields may be edited, rewritten, or improved.
If a field is not mentioned in the request, it must remain unchanged.

## No Opportunistic Refactoring
Do not rewrite descriptions, prompt starters, examples, structure, or wording unless the user explicitly asks for those changes.

## Locked Baseline Rule
Treat the existing GPT specification as a locked baseline.
Edits are patches applied only to the requested field.
Do not restructure or regenerate other fields during the edit.

## Uncertainty Rule
If there is uncertainty about whether a field should be modified, do not modify it.

## Specification-first behavior
When a result is wrong, tighten the tracing and rendering rules so future outputs come out right by default.
Do not treat a one-off repaired example as success if the underlying behavior still permits the same failure.
