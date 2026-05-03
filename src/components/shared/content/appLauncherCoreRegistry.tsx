"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type {
  PortfolioAppRouteContract,
  PortfolioAppRouteKey,
} from "@/utils/portfolio/routeContracts";

export type AppLauncherCoreComponentId = "arcadeCanvas" | "arcadeIframe" | "blackjack";

export type AppLauncherCoreComponentProps = {
  routeKey: PortfolioAppRouteKey;
  routeContract: PortfolioAppRouteContract;
};

const APP_LAUNCHER_CORE_COMPONENT_REGISTRY: Record<
  AppLauncherCoreComponentId,
  ComponentType<AppLauncherCoreComponentProps>
> = {
  arcadeCanvas: dynamic(() => import("./ArcadeCanvasLauncherClient"), {
    ssr: false,
  }),
  arcadeIframe: dynamic(() => import("./ArcadeIframeLauncherClient"), {
    ssr: false,
  }),
  blackjack: dynamic(() => import("./BlackjackLauncherClient"), {
    ssr: false,
  }),
};

const isAppLauncherCoreComponentId = (value: string): value is AppLauncherCoreComponentId =>
  value in APP_LAUNCHER_CORE_COMPONENT_REGISTRY;

export const resolveAppLauncherCoreComponent = (
  componentId: string,
): ComponentType<AppLauncherCoreComponentProps> | null =>
  isAppLauncherCoreComponentId(componentId)
    ? APP_LAUNCHER_CORE_COMPONENT_REGISTRY[componentId]
    : null;
