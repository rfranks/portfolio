export const VIRTUALIZED_LIST_DEFAULT_OVERSCAN = 4;

export const GRID_CLOUD_STAGGER_REVEAL = {
  BASE_DELAY_MS: 130,
  STEP_MS: 105,
  MAX_INDEX: 16,
  SFX_PATH: "/audio/click_004.ogg",
  SFX_VOLUME: 0.22,
  SFX_POOL_SIZE: 4,
  DURATION_MS: 980,
  EASING: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
