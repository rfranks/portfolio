import type {
  InteractiveViewportInputType,
  InteractiveViewportPreset,
  PanZoomTransformState,
  PanZoomViewportPreferences,
} from "@/types/hooks/panZoomViewport";

export type UsePanZoomViewportOptions = {
  preset?: InteractiveViewportPreset;
  calibrationMediaType?: string;
  calibrationSection?: string;
  calibrationProfileNamespace?: string;
  interactionInputTypeOverride?: InteractiveViewportInputType;
  initialState?: PanZoomTransformState;
  preferencesStorageKey?: string;
  initialPreferences?: PanZoomViewportPreferences;
  minScale?: number;
  maxScale?: number;
  panStep?: number;
  clickZoomFactor?: number;
  iconZoomFactor?: number;
  doubleClickZoomFactor?: number;
  panCalibrationAlpha?: number;
  panReferenceDelta?: number;
  minPanEma?: number;
  minPanDeltaMultiplier?: number;
  maxPanDeltaMultiplier?: number;
  wheelCalibrationAlpha?: number;
  wheelNormalizedGain?: number;
  pinchCalibrationAlpha?: number;
  pinchNormalizedGain?: number;
  minWheelEma?: number;
  minPinchLogEma?: number;
  shouldIgnorePointerTarget?: (target: HTMLElement) => boolean;
};
