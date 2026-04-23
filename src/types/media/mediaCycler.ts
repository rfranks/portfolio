import type * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import type { DiagramProps } from "@/components/shared/visualization";

export type MediaCyclerMediaType =
  | "image"
  | "video"
  | "pdf"
  | "markdown"
  | "diagram"
  | "custom"
  | "project"
  | "projectPresentation"
  | "recognition"
  | "recommendation";

type MediaCyclerDiscriminator<TType extends MediaCyclerMediaType> = {
  mediaType: TType;
};

type MediaCyclerCommonItem = {
  key: string;
  title: string;
  titleIcon?: React.ReactNode;
  titleIconAriaLabel?: string;
  titleIconSx?: SxProps<Theme>;
  titleVariant?: TypographyProps["variant"];
  titleSx?: SxProps<Theme>;
  description?: string;
  mediaAlt?: string;
  mediaLightboxTitle?: string;
  lightboxSubtitle?: string;
  lightboxCaption?: string;
  mediaCaption?: string;
  mediaSource?: string;
  mediaSourceHref?: string;
  customContent?: React.ReactNode;
  customContentSx?: SxProps<Theme>;
  markdownContent?: string;
  markdownPath?: string;
  markdownSx?: SxProps<Theme>;
  diagramProps?: Omit<DiagramProps, "diagram" | "id">;
  diagramSx?: SxProps<Theme>;
  pdfContainerSx?: SxProps<Theme>;
  pdfFrameSx?: SxProps<Theme>;
  pdfPreviewSx?: SxProps<Theme>;
  pdfObjectSx?: SxProps<Theme>;
  pdfIframeSx?: SxProps<Theme>;
  pdfShowOpenLink?: boolean;
  pdfOpenLinkLabel?: string;
  pdfOpenLinkHref?: string;
  pdfOpenLinkDescription?: React.ReactNode;
  onSelect?: () => void;
  onMediaActivate?: () => void;
  onMediaLoaded?: () => void;
  panelRef?: React.Ref<HTMLDivElement>;
  panelSx?: SxProps<Theme>;
  assetFrameSx?: SxProps<Theme>;
  imageWidth?: number;
  imageHeight?: number;
  imageClassName?: string;
  imageStyle?: React.CSSProperties;
  previewVideoClassName?: string;
  previewVideoSx?: SxProps<Theme>;
  videoRef?: React.Ref<HTMLVideoElement>;
  controls?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  loop?: boolean;
  muted?: boolean;
  videoProps?: Omit<React.ComponentPropsWithoutRef<"video">, "src" | "children">;
  extraContent?: React.ReactNode;
};

export type MediaCyclerImageItem = MediaCyclerCommonItem &
  MediaCyclerDiscriminator<"image"> & {
    mediaUrl: string;
  };

export type MediaCyclerVideoItem = MediaCyclerCommonItem &
  MediaCyclerDiscriminator<"video"> & {
    mediaUrl: string;
  };

export type MediaCyclerPdfItem = MediaCyclerCommonItem &
  MediaCyclerDiscriminator<"pdf"> & {
    mediaUrl: string;
  };

export type MediaCyclerDiagramItem = MediaCyclerCommonItem &
  MediaCyclerDiscriminator<"diagram"> & {
    mediaUrl: string;
  };

export type MediaCyclerMarkdownItem = MediaCyclerCommonItem &
  MediaCyclerDiscriminator<"markdown"> & {
    mediaUrl?: string;
  };

type MediaCyclerCustomMediaType =
  | "custom"
  | "project"
  | "projectPresentation"
  | "recognition"
  | "recommendation";

export type MediaCyclerCustomItem = MediaCyclerCommonItem &
  MediaCyclerDiscriminator<MediaCyclerCustomMediaType> & {
    mediaUrl?: string;
  };

export type MediaCyclerItem =
  | MediaCyclerImageItem
  | MediaCyclerVideoItem
  | MediaCyclerPdfItem
  | MediaCyclerDiagramItem
  | MediaCyclerMarkdownItem
  | MediaCyclerCustomItem;
