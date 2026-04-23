import type * as React from "react";
import type { SxProps, Theme } from "@mui/material/styles";

export type DemoSlideMediaBase = {
  src: string;
  title?: string;
  caption?: string;
  triggerSx?: SxProps<Theme>;
  previewSx?: SxProps<Theme>;
  expandButtonSx?: SxProps<Theme>;
};

export type DemoSlideVideoMedia = DemoSlideMediaBase & {
  type: "video";
  controls?: boolean;
  playsInline?: boolean;
  preload?: React.ComponentPropsWithoutRef<"video">["preload"];
};

export type DemoSlideImageMedia = DemoSlideMediaBase & {
  type: "image";
  alt: string;
};

export type DemoSlideMediaConfig = DemoSlideVideoMedia | DemoSlideImageMedia;

export type DemoSlideProps = Omit<
  React.ComponentPropsWithoutRef<"section">,
  "title" | "children"
> & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  caption?: React.ReactNode;
  children?: React.ReactNode;
  media?: DemoSlideMediaConfig;
  rootSx?: SxProps<Theme>;
  titleClassName?: string;
  subtitleClassName?: string;
  titleSx?: SxProps<Theme>;
  subtitleSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  captionSlotSx?: SxProps<Theme>;
  captionTextSx?: SxProps<Theme>;
};
