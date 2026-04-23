import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";

export type GridCloudNavigationSlideViewMode = "cloud" | "list";

export interface GridCloudNavigationSlideProps {
  viewMode: GridCloudNavigationSlideViewMode;
  onViewModeChange: (nextCloudView: boolean) => void;
  listContent: ReactNode;
  cloudContent: ReactNode;
  isMdUp?: boolean;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  showFooterOnMobile?: boolean;
  showViewToggle?: boolean;
  rootSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
  listViewAriaLabel?: string;
  cloudViewAriaLabel?: string;
  enableStaggeredReveal?: boolean;
  staggerRevealKey?: string | number;
}

export interface VirtualizedPanelListProps<TItem> {
  items: TItem[];
  renderItem: (item: TItem, index: number) => ReactNode;
  itemKey?: (item: TItem, index: number) => string;
  estimateItemHeight?: number;
  overscan?: number;
  virtualizationEnabled?: boolean;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}
