export type CharacterConfig = {
  name: string;
  hairStyle: "spiky" | "neat" | "long" | "short" | "styled";
  facialHair: "none" | "goatee" | "shortBeard";
  glasses: boolean;
  shirtStyle: "white" | "blazer" | "zip" | "polo" | "executive";
  silhouette: string;
  speakingStyle: string;
  defaultPose: "armsFolded" | "openPalm" | "point" | "palmFace" | "neutral";
  defaultExpression: "calm" | "smug" | "pleasant" | "focused" | "deadpan";
  remotePreferred?: boolean;
};

export const CANONICAL_CHARACTER_ORDER = [
  "Rickbert",
  "Mr. Barrel",
  "Claire",
  "Blair",
  "Mr. Bossman",
  "Alvin",
] as const;

export const CHARACTER_CONFIGS: Record<string, CharacterConfig> = {
  Rickbert: {
    name: "Rickbert",
    hairStyle: "spiky",
    facialHair: "goatee",
    glasses: true,
    shirtStyle: "white",
    silhouette: "spiky hair + round glasses + goatee",
    speakingStyle: "concise, deadpan, confident, slightly superior",
    defaultPose: "neutral",
    defaultExpression: "smug",
  },
  "Mr. Barrel": {
    name: "Mr. Barrel",
    hairStyle: "neat",
    facialHair: "shortBeard",
    glasses: false,
    shirtStyle: "executive",
    silhouette: "neat manager posture with trimmed beard",
    speakingStyle: "polished, understated, controlled",
    defaultPose: "armsFolded",
    defaultExpression: "calm",
  },
  Claire: {
    name: "Claire",
    hairStyle: "long",
    facialHair: "none",
    glasses: false,
    shirtStyle: "blazer",
    silhouette: "friendly PM posture with open hand gestures",
    speakingStyle: "upbeat, polite, sharply practical",
    defaultPose: "openPalm",
    defaultExpression: "pleasant",
  },
  Blair: {
    name: "Blair",
    hairStyle: "long",
    facialHair: "none",
    glasses: false,
    shirtStyle: "executive",
    silhouette: "confident sales executive silhouette",
    speakingStyle: "persuasive, elegant, calmly forceful",
    defaultPose: "point",
    defaultExpression: "focused",
  },
  "Mr. Bossman": {
    name: "Mr. Bossman",
    hairStyle: "short",
    facialHair: "none",
    glasses: false,
    shirtStyle: "executive",
    silhouette: "founder keynote posture",
    speakingStyle: "big-picture, visionary, earnest",
    defaultPose: "point",
    defaultExpression: "pleasant",
  },
  Alvin: {
    name: "Alvin",
    hairStyle: "styled",
    facialHair: "shortBeard",
    glasses: false,
    shirtStyle: "zip",
    silhouette: "remote compliance avatar with calm smile",
    speakingStyle: "gentle, calm, devastatingly thorough",
    defaultPose: "neutral",
    defaultExpression: "calm",
    remotePreferred: true,
  },
};

export function normalizeCharacterName(name: string): string {
  const lowered = name.trim().toLowerCase();
  const entry = Object.keys(CHARACTER_CONFIGS).find((key) => key.toLowerCase() === lowered);
  return entry ?? name.trim();
}
