import type { PaletteMode } from "@mui/material";
import type { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import type { DrawerProps as MuiDrawerProps } from "@mui/material/Drawer";
import type { DiagramProps } from "@/types/components/shared";

export interface Technology {
  name: string;
  url?: string;
  emoji?: string;
}

export type ProjectDiagramVisualType = "material" | "emoji" | "image";

export interface ProjectDiagramVisualConfig {
  type: ProjectDiagramVisualType;
  icon?: string;
  src?: string;
  alt?: string;
}

export interface ProjectDiagramConfig extends Pick<
  DiagramProps,
  | "diagram"
  | "height"
  | "title"
  | "type"
  | "autoFitPadding"
  | "autoFitScaleMultiplier"
  | "autoFitOffsetX"
  | "autoFitOffsetY"
> {
  shortText?: string;
  description?: string;
  selectorOptionVisual?: ProjectDiagramVisualConfig;
  selectorSelectedVisual?: ProjectDiagramVisualConfig;
}

export interface ProjectTerminalDemoConfig {
  title?: string;
  subtitle?: string;
  caption?: string;
  videoUrl?: string;
}

export interface ProjectData {
  project: string;
  showcaseHeading?: string;
  showcaseSubtitle?: string;
  href?: string;
  description: string;
  interestsMeWhy?: string;
  wowFactor?: string;
  demoGifUrl?: string;
  demoVideoUrl?: string;
  specifications: Record<string, unknown>;
  technologiesUsed: Technology[];
  blockDiagram: string;
  componentDiagram: string;
  sequenceDiagram: string;
  diagrams?: ProjectDiagramConfig[];
  terminalDemo?: ProjectTerminalDemoConfig;
}

export interface Accolade {
  name: string;
  source: string;
  sourceUrl: string;
  description?: string;
  comment?: string;
  launchUrl?: string;
  githubUrl?: string;
  imageSrcUrl?: string;
  date?: string;
}

export type DrawerProps = MuiDrawerProps & {
  drawerWidth?: number | string;
};

export interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerWidth?: number;
  mode?: PaletteMode;
  toggleColorMode?: () => void;
}
