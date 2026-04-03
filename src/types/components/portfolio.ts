import type { PaletteMode } from "@mui/material";
import type { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import type { DrawerProps as MuiDrawerProps } from "@mui/material/Drawer";

export interface Technology {
  name: string;
  url?: string;
}

export interface ProjectData {
  project: string;
  description: string;
  wowFactor?: string;
  demoGifUrl?: string;
  demoVideoUrl?: string;
  specifications: Record<string, unknown>;
  technologiesUsed: Technology[];
  blockDiagram: string;
  componentDiagram: string;
  sequenceDiagram: string;
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
