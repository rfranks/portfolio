import type {
  InteractiveViewportPreset,
  PanZoomTransformState,
} from "@/types/hooks/panZoomViewport";
import { VISUALIZATION_INTERACTION_TOKENS } from "@/consts/visualization/tokens";

type InteractiveViewportPresetDefaults = {
  minScale: number;
  maxScale: number;
  panStep: number;
  clickZoomFactor: number;
  iconZoomFactor: number;
  doubleClickZoomFactor: number;
  panCalibrationAlpha: number;
  panReferenceDeltaMultiplier: number;
  minPanEma: number;
  minPanDeltaMultiplier: number;
  maxPanDeltaMultiplier: number;
  wheelCalibrationAlpha: number;
  wheelNormalizedGain: number;
  pinchCalibrationAlpha: number;
  pinchNormalizedGain: number;
  minWheelEma: number;
  minPinchLogEma: number;
};

export const DEFAULT_INITIAL_STATE: PanZoomTransformState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

export const INTERACTIVE_VIEWPORT_PRESET_DEFAULTS: Record<
  InteractiveViewportPreset,
  InteractiveViewportPresetDefaults
> = {
  media: {
    ...VISUALIZATION_INTERACTION_TOKENS,
  },
  diagram: {
    ...VISUALIZATION_INTERACTION_TOKENS,
  },
};
