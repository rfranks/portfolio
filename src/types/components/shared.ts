import type * as React from "react";
import type { CircularProgressProps } from "@mui/material/CircularProgress";
import type { PaletteMode } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";

export interface DiagramProps {
  id?: string;
  diagram?: string;
  steps?: string[];
  orientation?: "TB" | "TD" | "BT" | "RL" | "LR";
  title?: string;
  type?:
    | "classDiagram"
    | "erDiagram"
    | "flowchart"
    | "graph"
    | "gantt"
    | "gitGraph"
    | "journey"
    | "mindmap"
    | "sequenceDiagram"
    | "stateDiagram-v2"
    | "timeline";
  syntax?: "mermaid" | "text";
  height?: string | number;
  width?: string | number;
  showDots?: boolean;
  showToolbar?: boolean;
  alwaysShowToolbar?: boolean;
  toolbarActions?: React.ReactNode;
  autoFitOnRender?: boolean;
  autoFitPadding?: number;
  autoFitScaleMultiplier?: number;
  autoFitOffsetX?: number;
  autoFitOffsetY?: number;
}

export interface TimelineEvent {
  label: string;
  title: string;
  isPending?: boolean;
  content: React.ReactNode;
  onClick?: () => void;
  category?: string;
  itemId?: string;
}

export interface TimelineProps {
  events?: TimelineEvent[];
  mermaid?: string;
  loading?: boolean;
  alignment?: "left" | "right" | "alternate";
  reverseOrder?: boolean;
  className?: string;
  children?: React.ReactNode;
  icon?: (category: string, event: TimelineEvent) => React.ReactNode;
}

export interface ThinkingProps {
  text?: string;
  showIndicator?: boolean;
  indicatorProps?: CircularProgressProps;
}

export interface OpenAIKeyInterstitialContentProps {
  appName: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  buttonLabel?: string;
  logoSrc?: string;
  logoAlt?: string;
  textFieldName?: string;
  isSubmitting?: boolean;
  errorText?: string;
  logoFrameSx?: SxProps<Theme>;
}

export interface ToggleColorModeProps {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

export interface TitleProps {
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export interface MarkdownContentProps {
  content: string;
  className?: string;
  color?: TypographyProps["color"];
  sx?: SxProps<Theme>;
  variant?: TypographyProps["variant"];
  riskHudColorize?: boolean;
}
