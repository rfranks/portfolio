import type * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import type { DiagramProps } from "@/types/components/shared";
import type { MediaActionKind } from "@/types/media/mediaActionContract";
import type {
  MediaCyclerDiagramItem,
  MediaCyclerImageItem,
  MediaCyclerItem,
  MediaCyclerSxArray,
  MediaCyclerVideoItem,
  MediaCyclerPdfItem,
} from "@/types/media";
import type { PortfolioTelemetryTrigger } from "@/types/observability/telemetryEvents";

export type MediaCyclerProps = {
  items: MediaCyclerItem[];
  spacing?: number;
  stackSx?: SxProps<Theme>;
  singlePanel?: boolean;
  singlePanelActiveKey?: string;
  transitionMs?: number;
  disableTransition?: boolean;
  showChevronNavigation?: boolean;
  loopNavigation?: boolean;
  loopNavigationLabel?: string;
  loopNavigationIcon?: "loop" | "leftChevron" | "rightChevron";
  disableLoopNavigation?: boolean;
  loopFromBeginning?: boolean;
  compactMetadataOnSmallScreens?: boolean;
  showExpandIcon?: boolean;
  disableChevronPrevious?: boolean;
  disableChevronNext?: boolean;
  hideDisabledNextChevron?: boolean;
  onChevronPrevious?: () => void;
  onChevronNext?: () => void;
  onLoopNavigation?: () => void;
  smallScreenInfoBlurb?: string;
  navigationControlSx?: SxProps<Theme>;
  expandControlSx?: SxProps<Theme>;
  showCompactInfoButton?: boolean;
  allowSwipe?: boolean;
};

export type DiagramLightBoxProps = {
  diagram: string;
  title: string;
  subtitle?: string;
  caption?: string;
  diagramProps?: Omit<DiagramProps, "diagram">;
  showExpandButton?: boolean;
  expandButtonSx?: SxProps<Theme>;
  stopEventPropagation?: boolean;
  containerSx?: SxProps<Theme>;
  onOpen?: (trigger: PortfolioTelemetryTrigger, control?: string) => void;
};

export type ImageLightboxProps = {
  src: string;
  alt: string;
  title?: string;
  caption?: string;
  children?: React.ReactNode;
  triggerSx?: SxProps<Theme>;
  previewImageSx?: SxProps<Theme>;
  previewContainerSx?: SxProps<Theme>;
  kenBurnsImageSx?: SxProps<Theme>;
  stopEventPropagation?: boolean;
  onOpen?: (trigger: PortfolioTelemetryTrigger, control?: string) => void;
};

export type VideoLightboxProps = Omit<
  React.ComponentPropsWithoutRef<"video">,
  "children" | "src"
> & {
  src: string;
  title: string;
  caption?: string;
  triggerSx?: SxProps<Theme>;
  previewVideoSx?: SxProps<Theme>;
  previewVideoClassName?: string;
  lightboxVideoSx?: SxProps<Theme>;
  stopEventPropagation?: boolean;
  openAriaLabel?: string;
  showExpandButton?: boolean;
  expandButtonSx?: SxProps<Theme>;
  onOpen?: (trigger: PortfolioTelemetryTrigger, control?: string) => void;
};

export type MediaRendererActionHandler = (params: {
  kind: MediaActionKind;
  trigger: PortfolioTelemetryTrigger;
  control?: string;
  metaAction?: string;
}) => void;

export type DiagramRendererProps = {
  item: MediaCyclerDiagramItem;
  mediaUrl: string;
  canActivate: boolean;
  showExpandIcon: boolean;
  expandControlSx?: SxProps<Theme>;
  diagramSxArray: MediaCyclerSxArray;
  onMediaAction?: MediaRendererActionHandler;
};

export type ImageRendererProps = {
  item: MediaCyclerImageItem;
  mediaUrl: string;
  imageAlt: string;
  lightboxTitle: string;
  showExpandIcon: boolean;
  expandControlSxArray: MediaCyclerSxArray;
  onMediaAction?: MediaRendererActionHandler;
};

export type VideoRendererProps = {
  item: MediaCyclerVideoItem;
  mediaUrl: string;
  lightboxTitle: string;
  canActivate: boolean;
  showExpandIcon: boolean;
  expandControlSx?: SxProps<Theme>;
  previewVideoSxArray: MediaCyclerSxArray;
  onMediaAction?: MediaRendererActionHandler;
};

export type PdfRendererProps = {
  item: MediaCyclerPdfItem;
  pdfUrl: string;
  lightboxTitle: string;
  canActivate: boolean;
  showExpandIcon: boolean;
  expandControlSxArray: MediaCyclerSxArray;
  pdfPreviewSxArray: MediaCyclerSxArray;
  pdfContainerSxArray: MediaCyclerSxArray;
  pdfFrameSxArray: MediaCyclerSxArray;
  pdfObjectSxArray: MediaCyclerSxArray;
  pdfIframeSxArray: MediaCyclerSxArray;
  onMediaAction?: MediaRendererActionHandler;
};
