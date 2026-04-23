export const VISUALIZATION_ANIMATION_TOKENS = {
  diagramAutoFitSettleFrames: 2,
  diagramAutoFitMaxFrames: 60,
  mediaTransitionTranslatePx: 24,
} as const;

export const VISUALIZATION_TOOLBAR_TOKENS = {
  panelButtonBorderOpacity: 0.22,
} as const;

export const VISUALIZATION_INTERACTION_TOKENS = {
  minScale: 0.1,
  maxScale: 8,
  panStep: 50,
  clickZoomFactor: 2.5,
  iconZoomFactor: 2.5,
  doubleClickZoomFactor: 2.5,
  panCalibrationAlpha: 0.2,
  panReferenceDeltaMultiplier: 0.18,
  minPanEma: 0.5,
  minPanDeltaMultiplier: 0.35,
  maxPanDeltaMultiplier: 1.85,
  wheelCalibrationAlpha: 0.18,
  wheelNormalizedGain: 0.24,
  pinchCalibrationAlpha: 0.22,
  pinchNormalizedGain: 0.52,
  minWheelEma: 1,
  minPinchLogEma: 0.0015,
} as const;
