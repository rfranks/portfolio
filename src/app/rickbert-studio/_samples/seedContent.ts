import type { ReferenceDocConfig } from "@/app/rickbert-studio/_models";

export const seededMasterPrompt = `You are the RICKBERT production comic engine.
Generate or render one landscape office comic strip from structured requirements.
Respect user overrides, preserve locked dialogue in production mode, and enforce checklist compliance before render.
House style: clean flat syndicated newspaper office comic, thin black outlines, muted office palette, minimal shading, sparse office backgrounds, high-legibility lettering, deadpan tone.
Forbidden fallback styles: stick figures, diagrams, wireframes, storyboard thumbnails, vector-icon minimalism, photorealism, cinematic framing, painterly rendering, rough sketch output.`;

export const seededArtStyleDoc = `
# ART_STYLE — Flat Newspaper Office Comic

Use this as the **house visual style** for generating comic-strip panels.

## Style Summary
A **clean, flat, syndicated newspaper workplace comic** look: simple shapes, thin black outlines, muted pastel colors, minimal backgrounds, and deadpan character acting. Prioritize **readability** and **dialogue clarity** over detail.

---

## Linework
- **Thin, clean black outlines**
- **Consistent line weight**
- Slight hand-drawn feel, but **tidy and controlled**
- No sketch lines, crosshatching, rough pencils, or painterly edges

## Character Design
- **Geometric construction** (ovals/rectangles/cylinders)
- **Simplified faces**: minimal nose/mouth/ears, dot/oval eyes, simple hair shapes
- Characters should be **recognizable by silhouette**
- **Subtle expressions**: mild annoyance, blank stare, quiet smugness, understated exasperation
- Keep character designs **consistent across panels** (same proportions, hair, glasses, clothing)

## Color Palette
- **Muted, low-saturation office palette**
- Favor: pale greens, beige/tan, dusty blues, muted reds, soft grays
- Backgrounds should be subdued so characters and dialogue dominate
- Avoid neon colors and heavy contrast

## Shading & Rendering
- **Little to no shading**
- If needed, use extremely minimal flat shading only
- Avoid gradients (unless extremely subtle), textures, and realistic materials
- No dramatic lighting

## Backgrounds & Props
- **Sparse office environments** only (desk edge, chair, conference table, cubicle wall)
- Include **just enough** to establish the setting
- Avoid clutter; no busy textures or dense props

## Panel Composition
- Clear **rectangular panels**
- Straightforward camera angles: mostly medium shots / waist-up
- Avoid dramatic perspective, fisheye distortion, cinematic framing
- Each panel must read **instantly at a glance**

## Dialogue & Lettering
- **Short, crisp dialogue**
- Simple speech bubbles with comfortable padding
- **High legibility** all-caps comic lettering
- Never overcrowd speech bubbles

## Tone & Acting
- Dry, corporate, slightly absurd
- Humor lands via **understatement**, awkward pauses, blunt corporate phrasing, and reaction shots
- The art supports sarcasm and workplace satire rather than slapstick or action

---

## Hard “Do Not” List (Negative Constraints)
Do **not** generate in these styles:
- photorealistic
- painterly / oil / watercolor
- anime / manga
- superhero comic
- cinematic concept art
- 3D-rendered / glossy game art
- heavy editorial cartoon shading

Do **not** include:
- extreme facial distortion
- action lines and explosive motion effects (unless explicitly required)
- elaborate environments
- dense textures, complex lighting, or heavy rendering

---

## Output Goal
A professional, dialogue-forward office strip that is:
**flat • clean • muted • readable • consistent • deadpan**.
`;

export const seededCharacterBibleDoc = `# CHARACTER_BIBLE — Rickbert Comic Universe

## Purpose
This document defines the **canonical character designs, personalities, and headshot-identification rules** for the Rickbert comic universe.

**You will receive headshots.** Use the identification traits below to correctly match each photo to the correct character and keep designs consistent across all panels and strips.

**Consistency rules**
- Treat these descriptions as **ground truth**.
- Once a character is identified from a headshot, preserve their **signature features** (hair silhouette, glasses, facial hair, posture, wardrobe shorthand).
- Keep each character’s **speaking style** consistent (short, readable dialogue).

---

## 1) Rickbert (Main character)

**Who he is:** A frustrated AI health-tech genius. He knows he’s the genius. That is his flaw.  
**Personality:** brilliant, cynical, fast-thinking, dryly sarcastic, exasperated, ego-forward.  
**Comic function:** truth-teller / engineer reality.

### Headshot identification (photo traits)
- Middle-aged man
- Short dark brown hair (neatly combed)
- Light-colored eyes
- Distinct short goatee + mustache (salt-and-pepper hints)
- Friendly/smug grin
- Usually wearing a collared shirt in the headshot
- Looks like the “main character” photo you supplied first

### How to cartoon him
- Convert hair into a **spiky office-comic silhouette**
- Add **round glasses** (signature)
- Simplify goatee and expression into clean cartoon shapes
- Office-casual: **white shirt or polo**, sometimes tie for classic office shorthand

### Speaking style
Concise, deadpan, confident, slightly superior.

---

## 2) Mr. Barrel (Boss / rival genius)

**Who he is:** Rickbert’s boss. Also a genius. Friction comes from being smart enough to meddle.  
**Personality:** calm, sharp, controlled, dry, managerial.  
**Comic function:** compresses hard problems into simple demands.

### Headshot identification (photo traits)
- Younger adult man
- Very light blond/platinum hair
- Short trimmed beard
- Soft smile, composed
- Often a light/cream zip-up or clean casual in the headshot

### How to cartoon him
- Clean, calm facial expression
- “Manager silhouette” posture (arms folded, relaxed authority)
- Less spiky hair; more neat and modern than Rickbert

### Speaking style
Polished, understated, weaponized calm.

---

## 3) Claire (Product PM, Australian, Registered Nurse)

**Who she is:** Product PM with clinical credibility. Cheerfully relentless. Devastatingly correct.  
**Personality:** warm, practical, user-centered, incisive, calm.  
**Comic function:** product truth-bomb; politely dismantles bad ideas.

### Headshot identification (photo traits)
- Adult woman
- Blonde hair (light golden)
- Bright, wide smile
- Blue/green eyes
- Professional look; simple earrings
- Headshot is close-up, friendly, energetic

### How to cartoon her
- Friendly but formidable expression
- Calm open-hand gesture while delivering uncomfortable truth
- Product props: tablet, notepad, sticky-note board
- She should look pleasant even when landing a knockout

### Speaking style
Upbeat, polite, sharply practical.

---

## 4) Blair (Head of Sales, refined with Wyoming edge)

**Who she is:** Head of Sales. Ultra refined. Elegant closer. Wyoming edge underneath (Beth-from-Yellowstone energy translated to enterprise sales).  
**Personality:** poised, persuasive, fearless, ruthlessly optimistic, charming.  
**Comic function:** sells future tense as present tense; turns prototypes into “ready” with confidence.

### Headshot identification (photo traits)
- Adult woman
- Long brunette hair (dark brown)
- Bright smile
- Notable patterned scarf in the headshot
- Polished look, executive vibe

### How to cartoon her
- Confident posture; “boardroom-ready” silhouette
- Sales props: phone, pipeline chart, contract folder
- Expression: charming + dangerous optimism

### Speaking style
Polished, elegant, persuasive, calmly forceful.

---

## 5) Mr. Bossman (CEO)

**Who he is:** CEO visionary. Steve Jobs meets office absurdity. Loves Rickbert’s work too much.  
**Personality:** charismatic, bold, visionary, keynote-energy, myth-making.  
**Comic function:** executive amplifier; turns prototypes into destiny.

### Headshot identification (photo traits)
- Young adult man
- Short brown hair, clean-cut
- Bright smile
- Screenshot-style profile image that includes the label “CEO”
- Looks like a “profile card / app screenshot” rather than a studio headshot

### How to cartoon him
- Founder posture: standing, gesturing, excited
- Props: slide deck, vision board, keynote clicker
- Big “vision” energy

### Speaking style
Big-picture, inspirational, grand, earnest.

---

## 6) Alvin (Compliance officer, friend/nemesis, remote from Bali)

**Who he is:** Compliance officer. Rickbert’s friend but always undermining him professionally. French. Lives in Bali post-COVID. Always remote.  
**Personality:** serene, warm, meticulous, devastatingly thorough.  
**Comic function:** cheerful kill-switch; ruins momentum calmly from paradise.

### Headshot identification (photo traits)
- Adult man
- Modern haircut (sides close, top styled up)
- Big friendly grin
- Trim facial hair
- Wearing a dark zip-up jacket/hoodie with a logo in the headshot
- Looks energetic and mischievous

### How to cartoon him
- Usually appears on a monitor/video-call tile
- Tropical background: palms/ocean/sunlight
- Headset optional
- Calm smile while delivering fatal compliance reality

### Speaking style
Gentle, slightly elegant, calm—then devastating.
`;

export const seededSeriesBehaviorDoc = `
# SERIES_BEHAVIOR — Rickbert Strip Rules

- Default to 3 panels unless explicitly asked for 6.
- 3-panel rhythm: setup / escalation / punchline.
- Rotate comedic engines to avoid repetition.
- Keep dialogue short (roughly 1-12 words) and one beat per panel.
- Choose 2-3 characters unless user locks panel content.
- If user provides full panel script, switch to production rendering mode with zero paraphrasing.
`;

export const seededChecklistDoc = `
# CHECKLIST — Production Compliance and Validation

Hard requirements:
- Explicit user instructions override defaults.
- In production mode: no paraphrasing, no panel merges, no line reassignment, no omitted named props/labels/windows.
- Layout lock: 3 panels => 1x3. 6 panels => 2x3 in one landscape strip.
- Preflight lock must include title, layout, panel breakdown, verbatim dialogue, required props/labels/nameplates/windows, house style constraints, and anti-fallback negatives.

Validation categories:
- format compliance
- script compliance
- character compliance
- visual detail compliance
- readability compliance
- style compliance

Hard style gate:
- Not stick figures
- Not infographic/diagram/wireframe
- Not storyboard thumbnails
- Not vector-icon minimalism
- Not photoreal/3D/cinematic
`;

export const ambientScribeSampleRequest = `
Additional Character design rules for this strip:
- Keep everyone in office-casual wardrobe.
- Preserve canonical silhouettes and speaking styles from the character bible.
- **Harold / Hanz**: The "In-Person Ambient Scribe" device/robot with a name tag reading **HAROLD**. Make it a strange in-room AI scribe device with an astral-plane, semi-transparent, see-through vibe. It should feel office-safe and slightly absurd, realistic enough for a product demo, but weird enough to justify confusion.

Comic premise:
Claire and Mr. Bossman originally asked Rickbert to build an **"In-Person Ambient Scribe."** Three months later, Rickbert and Alvin present the completed product. The joke is that nobody seems to understand what an "In-Person Ambient Scribe" actually is - including the people who requested it.

Panel-by-panel script:

### Panel 1
Scene: Claire at Rickbert's desk in the office. Rickbert seated with laptop.
Dialogue:
- **Claire:** Rickbert, we need an in-person ambient scribe.
- **Rickbert:** A what now? What is that?

### Panel 2
Scene: Mr. Bossman joins Rickbert with excited founder energy, waving his hands like a magician.
Dialogue:
- **Mr. Bossman:** It captures the room. Like magic!
- **Rickbert:** That is not a requirement.

### Panel 3
Scene: Claire and Mr. Bossman stand together, confidently handing off the vague idea. Rickbert already regrets everything.
Dialogue:
- **Claire:** We'll define it later.
- **Mr. Bossman:** Build the future.
- **Rickbert:** That usually means "guess."

### Panel 4
Scene: Three months later. Product demo setup. Rickbert presents the new device proudly but flatly. Alvin appears in a remote video window from Bali. Harold is visible in the room.
Dialogue:
- **Rickbert:** Introducing our new In-Person Ambient Scribe, Harold!
- **Alvin (in his remote window from Bali):** Bonjour! I know it's late in the game. But can we rename him Hanz?

### Panel 5
Scene: Mr. Bossman and Claire react to the demo. Harold is visible. Alvin is still on the remote screen.
Dialogue:
- **Mr. Bossman:** Cool, what does it do?
- **Claire:** ?!?! What is an in-person ambient scribe?

### Panel 6
Scene: Mr. Barrel sits at his desk with a visible desk nameplate reading **MR. BARREL**. Alvin remains in his remote window. Harold the AI-scribe is in the office. Rickbert stands nearby doing a full palm-to-face. Minimal office background.
Dialogue:
- **Mr. Barrel:** Why did we build this? And what is it?
- **Alvin (in his remote window from Bali):** His name is Hanz! I like Hanz.
- **Harold:** "scribe...scribe...scribe..."
- **Rickbert:** [silent]
`;

export const seededReferenceDocs: ReferenceDocConfig[] = [
  { id: "art-style", name: "ART_STYLE.md", content: seededArtStyleDoc },
  {
    id: "character-bible",
    name: "CHARACTER_BIBLE.md",
    content: seededCharacterBibleDoc,
  },
  {
    id: "series-behavior",
    name: "SERIES_BEHAVIOR.md",
    content: seededSeriesBehaviorDoc,
  },
  { id: "checklist", name: "CHECKLIST.md", content: seededChecklistDoc },
];
