import type * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";

export type DiagramToolbarProps = {
  showToolbar: boolean;
  alwaysShowToolbar: boolean;
  canUndo: boolean;
  canRedo: boolean;
  copySucceeded: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPanUp: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onPanDown: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
  onCopyCode: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onExportViewportJson: () => void;
  deepLinkCopySucceeded: boolean;
  onCopyDeepLinkWithViewport: () => void;
  onShowSource: () => void;
  toolbarActions?: React.ReactNode;
};

export type DiagramCanvasProps = {
  width?: string | number;
  height?: string | number;
  visible: boolean;
  containerId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  diagramRef: React.RefObject<HTMLElement | null>;
  shouldShowGridDots: boolean;
  scale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  isHydrated: boolean;
  diagramCode: string;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUpOrLeave: (event: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  toolbar?: React.ReactNode;
};

export type DiagramCodePanelProps = {
  visible: boolean;
  width?: string | number;
  height?: string | number;
  showToolbar: boolean;
  diagramCode: string;
  copySucceeded: boolean;
  deepLinkCopySucceeded: boolean;
  onToggleCodeMode: () => void;
  onCopyDiagramCode: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onExportViewportJson: () => void;
  onCopyDeepLinkWithViewport: () => void;
};

export type WaveformProps = {
  active: boolean;
  barsCount?: number;
};

export type InteractiveViewportShellProps = {
  containerId?: string;
  width?: string | number;
  height?: string | number;
  visible?: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  topContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  containerSx?: SxProps<Theme>;
  viewportSx?: SxProps<Theme>;
  role?: React.AriaRole;
  tabIndex?: number;
  ariaLabel?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove?: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp?: React.PointerEventHandler<HTMLDivElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLDivElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  shouldShowGridDots?: boolean;
  gridBackgroundColor?: string;
  gridDotColor?: string;
  gridDotSizePx?: number;
  gridSpacingPx?: number;
  children: React.ReactNode;
};
