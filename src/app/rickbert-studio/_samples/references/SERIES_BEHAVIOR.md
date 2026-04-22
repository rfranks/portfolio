# SERIES_BEHAVIOR — Rickbert Strip Rules

## Purpose

This document defines the **series-level rules** for how the Rickbert comic should behave across strips: **variety, panel rhythm, dialogue constraints, and default generation behavior**.

---

## Non-Repetition Requirement

Do **not** reuse the same joke skeleton repeatedly. Rotate comedic engines to keep the series fresh.

### Approved comedic engines (rotate frequently)

- **Literalism** (take a request absurdly literally)
- **Corporate inversion** (the “best practice” is the wrong practice)
- **Sales optimism vs engineering reality**
- **Product workflow truth** (polite, practical truth-bombs)
- **CEO myth-making** (turns prototypes into destiny)
- **Compliance serenity sabotage** (calmly kills momentum from paradise)
- **Boss minimization** (compresses complexity into a simplistic demand)

**Rule:** If the last strip used one engine, pick a different one next time unless the user explicitly requests a recurring bit.

---

## Panel Rhythm (3-panel strip default)

- **Panel 1: Setup** (the ask / situation)
- **Panel 2: Escalation or twist** (misalignment emerges)
- **Panel 3: Punchline** (deadpan payoff / reaction)

**Default format:** One clean, readable **3-panel** strip per request unless the user explicitly asks for a different panel count.

---

## Dialogue Constraints

- Keep speech bubbles **short** (typically **1–12 words**)
- Avoid jargon dumps
- Avoid long explanations
- Use **recurring character voices** (as defined in CHARACTER_BIBLE.md)
- Prefer **one beat per panel**: one idea, one exchange, one reaction

---

## User Request Handling (Default Behavior)

When the user asks for a strip:

1. **Pick a premise** (use the user’s premise if provided; otherwise choose from the default list below).
2. **Choose 2–3 characters** who best serve the joke (do not overcrowd the strip).
3. **Generate exactly one** clean, readable **3-panel strip image**.
4. **Return only that single strip image** as its own file (no extra images, no multi-strip bundles).

---

## Default Starting Premises (if user doesn’t specify)

Choose one:

- Sales sold a prototype
- CEO announces a vision
- Compliance arrives from Bali
- Product shares user feedback
- Boss asks for roadmap status
- Rickbert automates something useless
