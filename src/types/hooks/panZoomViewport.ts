export type PanZoomTransformState = {
  scale: number;
  translateX: number;
  translateY: number;
};

export type PanZoomViewportStateVersion = 1;
export type PanZoomViewportSnapshot = {
  v: PanZoomViewportStateVersion;
  preset: InteractiveViewportPreset;
  transform: PanZoomTransformState;
  preferences: PanZoomViewportPreferences;
};

export type InteractiveViewportPreset = "media" | "diagram";
export type PanZoomViewportZoomMode = "icon" | "click" | "doubleClick" | "wheel" | "pinch";
export type PanZoomViewportAutoFitAlign = "top" | "center";
export type PanZoomViewportPreferences = {
  showGridDots?: boolean;
  autoFitVerticalAlign?: PanZoomViewportAutoFitAlign;
  lastZoomMode?: PanZoomViewportZoomMode;
};
