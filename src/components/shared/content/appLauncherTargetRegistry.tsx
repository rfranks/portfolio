"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type { AppLauncherCoreComponentId } from "./appLauncherCoreRegistry";

export type AppLauncherTargetId = "warbirds" | "zombiefish" | "blasteroids" | "blackjack";

type AppLauncherTargetDefinition = {
  supportedCoreComponents: readonly AppLauncherCoreComponentId[];
  component: ComponentType;
};

const APP_LAUNCHER_TARGET_REGISTRY: Record<AppLauncherTargetId, AppLauncherTargetDefinition> = {
  warbirds: {
    supportedCoreComponents: ["arcadeCanvas"],
    component: dynamic(() => import("@/app/warbirds/WarbirdsPageClient"), {
      ssr: false,
    }),
  },
  zombiefish: {
    supportedCoreComponents: ["arcadeCanvas"],
    component: dynamic(() => import("@/app/zombiefish/ZombieFishPageClient"), {
      ssr: false,
    }),
  },
  blasteroids: {
    supportedCoreComponents: ["arcadeIframe"],
    component: dynamic(() => import("@/app/blasteroids/BlasteroidsPageClient"), {
      ssr: false,
    }),
  },
  blackjack: {
    supportedCoreComponents: ["blackjack"],
    component: dynamic(() => import("@/app/blackjack/BlackjackPageClient"), {
      ssr: false,
    }),
  },
};

const isAppLauncherTargetId = (value: string): value is AppLauncherTargetId =>
  value in APP_LAUNCHER_TARGET_REGISTRY;

export const resolveAppLauncherTargetComponent = ({
  coreComponentId,
  targetId,
}: {
  coreComponentId: AppLauncherCoreComponentId;
  targetId: string;
}): ComponentType | null => {
  if (!isAppLauncherTargetId(targetId)) {
    return null;
  }

  const targetDefinition = APP_LAUNCHER_TARGET_REGISTRY[targetId];
  return targetDefinition.supportedCoreComponents.includes(coreComponentId)
    ? targetDefinition.component
    : null;
};
