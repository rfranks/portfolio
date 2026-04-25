import type {
  InteractiveViewportInputType,
  InteractiveViewportSensitivityProfile,
} from "@/types/hooks/panZoomViewport";
export type InteractionSensitivityProfile = InteractiveViewportSensitivityProfile;

type InteractionProfileOverrides = Partial<InteractionSensitivityProfile>;

const BASE_INTERACTION_SENSITIVITY_PROFILE: InteractionSensitivityProfile = {
  panDeltaMultiplier: 1,
  panStepMultiplier: 1,
  pinchGainMultiplier: 1,
  wheelGainMultiplier: 1,
  gestureStepCapMultiplier: 1,
  panMinDeltaMultiplierScale: 1,
  panMaxDeltaMultiplierScale: 1,
};

const INPUT_INTERACTION_SENSITIVITY_PROFILES: Record<
  InteractiveViewportInputType,
  InteractionSensitivityProfile
> = {
  mouse: {
    panDeltaMultiplier: 1,
    panStepMultiplier: 1,
    pinchGainMultiplier: 1,
    wheelGainMultiplier: 1,
    gestureStepCapMultiplier: 1,
    panMinDeltaMultiplierScale: 1,
    panMaxDeltaMultiplierScale: 1,
  },
  trackpad: {
    panDeltaMultiplier: 1,
    panStepMultiplier: 1,
    pinchGainMultiplier: 1.06,
    wheelGainMultiplier: 1.1,
    gestureStepCapMultiplier: 1.1,
    panMinDeltaMultiplierScale: 1,
    panMaxDeltaMultiplierScale: 1.08,
  },
  touch: {
    panDeltaMultiplier: 0.82,
    panStepMultiplier: 0.84,
    pinchGainMultiplier: 0.62,
    wheelGainMultiplier: 0.78,
    gestureStepCapMultiplier: 0.72,
    panMinDeltaMultiplierScale: 0.92,
    panMaxDeltaMultiplierScale: 0.82,
  },
};

const SECTION_INTERACTION_OVERRIDES: Record<
  string,
  Partial<Record<InteractiveViewportInputType, InteractionProfileOverrides>>
> = {
  diagrams: {
    touch: {
      panDeltaMultiplier: 0.76,
      pinchGainMultiplier: 0.56,
      wheelGainMultiplier: 0.72,
      gestureStepCapMultiplier: 0.7,
    },
    trackpad: {
      wheelGainMultiplier: 1.12,
    },
  },
  architecture: {
    touch: {
      pinchGainMultiplier: 0.58,
      gestureStepCapMultiplier: 0.74,
    },
  },
  blackjack: {
    touch: {
      panStepMultiplier: 0.92,
      pinchGainMultiplier: 0.6,
    },
  },
};

const APP_INTERACTION_OVERRIDES: Record<
  string,
  Partial<Record<InteractiveViewportInputType, InteractionProfileOverrides>>
> = {
  blackjack: {
    touch: {
      panStepMultiplier: 0.9,
      gestureStepCapMultiplier: 0.72,
    },
  },
  dna: {
    touch: {
      pinchGainMultiplier: 0.66,
      wheelGainMultiplier: 0.84,
    },
  },
  patientlistpodcasts: {
    touch: {
      gestureStepCapMultiplier: 0.68,
    },
  },
  aisummary: {
    touch: {
      gestureStepCapMultiplier: 0.68,
    },
  },
};

function normalizeScopeToken(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

export function resolveInteractionSensitivityProfile(args: {
  inputType: InteractiveViewportInputType;
  appKey?: string | null;
  section?: string | null;
  mediaType?: string | null;
}): InteractionSensitivityProfile {
  const appKey = normalizeScopeToken(args.appKey);
  const sectionKey = normalizeScopeToken(args.section);
  const mediaType = normalizeScopeToken(args.mediaType);
  const sectionOverrides = SECTION_INTERACTION_OVERRIDES[sectionKey]?.[args.inputType];
  const appOverrides = APP_INTERACTION_OVERRIDES[appKey]?.[args.inputType];
  const mediaTypeOverrides =
    mediaType && sectionKey !== mediaType
      ? SECTION_INTERACTION_OVERRIDES[mediaType]?.[args.inputType]
      : undefined;

  return {
    ...BASE_INTERACTION_SENSITIVITY_PROFILE,
    ...INPUT_INTERACTION_SENSITIVITY_PROFILES[args.inputType],
    ...(sectionOverrides ?? {}),
    ...(mediaTypeOverrides ?? {}),
    ...(appOverrides ?? {}),
  };
}
