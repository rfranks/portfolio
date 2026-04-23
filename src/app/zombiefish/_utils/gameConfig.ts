// Initial timer value (in seconds)
export const GAME_TIME = 99;
const FPS = 60; // assumed frame rate for requestAnimationFrame
export const FRAME_MS = 1000 / FPS;

export const FISH_SIZE = 128;
export const FISH_FRAME_DELAY = 6;
export const FISH_FRAME_DURATION = FISH_FRAME_DELAY * FRAME_MS;
export const MAX_SCHOOL_SIZE = 4;

// NES-style jingle sequence for background music
// Build a rising and falling "wave" pattern to feel bubbly and underwater.
// We step up in thirds, crest, then wash back down and repeat.
export const NES_BGM_SEQUENCE = (() => {
  const rise = [0, 3, 6, 9].map((n) => `jingles_NES${n.toString().padStart(2, "0")}`);
  const fall = [...rise].reverse();
  const loop: string[] = [];
  for (let i = 0; i < 2; i++) {
    loop.push(...rise, "jingles_NES12", ...fall, "jingles_NES14");
  }
  return loop;
})();

// limit for how steep fish swim (cross-velocity relative to main)
const MAX_FISH_INCLINE = 0.5;
export const SKELETON_CONVERT_DISTANCE = FISH_SIZE / 2;
export const SKELETON_REPEL_DISTANCE = FISH_SIZE;
export const SKELETON_REPEL_FORCE = 0.05;
export const SKELETON_DETECTION_RADIUS = FISH_SIZE * 8;
const BUBBLE_BASE_SIZE = 64;
export const BUBBLE_MIN = BUBBLE_BASE_SIZE * 0.5;
export const BUBBLE_MAX = BUBBLE_BASE_SIZE * 1.5;
export const BUBBLE_VX_MAX = 0.5;
export const BUBBLE_VY_MIN = -1.5;
export const BUBBLE_VY_MAX = -0.5;
export const MAX_BUBBLES = 20;
export const HURT_FRAMES = 10;
export const CONVERT_FLASH_FRAMES = 5;
export const MISS_GROWTH = 4;
export const MISS_FADE = 0.05;

export const WANDER_TIMER_MIN_MS = 1000;
export const WANDER_TIMER_MAX_MS = 2000;
export const HURT_DURATION_MS = HURT_FRAMES * FRAME_MS;
export const CONVERT_FLASH_DURATION_MS = CONVERT_FLASH_FRAMES * FRAME_MS;

export const STAT_LABEL_PY = 8;

export const clampIncline = (vx: number, vy: number) => {
  if (Math.abs(vx) >= Math.abs(vy)) {
    const limit = Math.abs(vx) * MAX_FISH_INCLINE;
    return { vx, vy: Math.max(Math.min(vy, limit), -limit) };
  }
  const limit = Math.abs(vy) * MAX_FISH_INCLINE;
  return { vx: Math.max(Math.min(vx, limit), -limit), vy };
};

export const orientFish = (vx: number, vy: number) => {
  let angle = Math.atan2(vy, vx);
  let flipped = false;
  if (angle > Math.PI / 2) {
    angle = Math.PI - angle;
    flipped = true;
  } else if (angle < -Math.PI / 2) {
    angle = -Math.PI - angle;
    flipped = true;
  }
  return { angle, flipped };
};
