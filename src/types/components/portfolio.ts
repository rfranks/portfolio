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
  mediaType: "video" | "image";
  mediaUrl: string;
  caption: string;
  title?: string;
  subtitle?: string;
  mediaAlt?: string;
}

export type ProjectPresentationSectionKey =
  | "overview"
  | "why"
  | "demo"
  | "technologies"
  | "specifications"
  | "diagrams";

export type ProjectSectionPagerSfxValue = "random" | `/${string}`;
export type ProjectSectionPagerSfxConfig = Partial<
  Record<ProjectPresentationSectionKey, ProjectSectionPagerSfxValue>
>;

export interface ProjectData {
  project: string;
  type?: "personal" | "work" | "presentation";
  showcaseHeading?: string;
  showcaseSubtitle?: string;
  href?: string;
  description: string;
  interestsMeWhy?: string;
  wowFactor?: string;
  demoCaption?: string;
  demoGifUrl?: string;
  demoVideoUrl?: string;
  specifications: Record<string, unknown>;
  technologiesUsed: Technology[];
  blockDiagram: string;
  componentDiagram: string;
  sequenceDiagram: string;
  diagrams?: ProjectDiagramConfig[];
  terminalDemo?: ProjectTerminalDemoConfig;
  sectionPagerSfx?: ProjectSectionPagerSfxConfig;
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

export interface CommandPaletteAction {
  id: string;
  label: string;
  subtitle?: string;
  group?: string;
  keywords?: string[];
  href?: string;
  onSelect?: () => void;
}

export interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerWidth?: number;
  mode?: PaletteMode;
  toggleColorMode?: () => void;
  commandPaletteActions?: CommandPaletteAction[];
  commandPaletteTitle?: string;
  commandPalettePlaceholder?: string;
}
