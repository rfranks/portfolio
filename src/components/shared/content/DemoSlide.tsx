"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { ImageLightbox, VideoLightbox } from "@/components/shared/media";

type DemoSlideProps = Omit<React.ComponentPropsWithoutRef<"section">, "title" | "children"> & {
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

type DemoSlideMediaBase = {
  src: string;
  title?: string;
  caption?: string;
  triggerSx?: SxProps<Theme>;
  previewSx?: SxProps<Theme>;
  expandButtonSx?: SxProps<Theme>;
};

type DemoSlideVideoMedia = DemoSlideMediaBase & {
  type: "video";
  controls?: boolean;
  playsInline?: boolean;
  preload?: React.ComponentPropsWithoutRef<"video">["preload"];
};

type DemoSlideImageMedia = DemoSlideMediaBase & {
  type: "image";
  alt: string;
};

type DemoSlideMediaConfig = DemoSlideVideoMedia | DemoSlideImageMedia;

const toSxArray = (value?: SxProps<Theme>) => {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const hasRenderableNode = (value: React.ReactNode) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== false;
};

const DemoSlide = React.forwardRef<HTMLElement, DemoSlideProps>(function DemoSlide(
  {
    title,
    subtitle,
    caption,
    children,
    media,
    rootSx,
    titleClassName,
    subtitleClassName,
    titleSx,
    subtitleSx,
    contentSx,
    captionSlotSx,
    captionTextSx,
    ...sectionProps
  },
  forwardedRef,
) {
  const rootSxArray = React.useMemo(() => toSxArray(rootSx), [rootSx]);
  const contentSxArray = React.useMemo(() => toSxArray(contentSx), [contentSx]);
  const titleSxArray = React.useMemo(() => toSxArray(titleSx), [titleSx]);
  const subtitleSxArray = React.useMemo(() => toSxArray(subtitleSx), [subtitleSx]);
  const captionSlotSxArray = React.useMemo(() => toSxArray(captionSlotSx), [captionSlotSx]);
  const captionTextSxArray = React.useMemo(() => toSxArray(captionTextSx), [captionTextSx]);
  const showTitle = hasRenderableNode(title);
  const showSubtitle = hasRenderableNode(subtitle);
  const showCaption = hasRenderableNode(caption);
  const mediaNode = React.useMemo(() => {
    if (!media?.src?.trim()) {
      return null;
    }

    if (media.type === "video") {
      return (
        <VideoLightbox
          src={media.src}
          title={media.title?.trim() || "Demo video"}
          caption={media.caption}
          controls={media.controls ?? true}
          playsInline={media.playsInline ?? true}
          preload={media.preload ?? "metadata"}
          triggerSx={media.triggerSx}
          previewVideoSx={media.previewSx}
          expandButtonSx={media.expandButtonSx}
        />
      );
    }

    return (
      <ImageLightbox
        src={media.src}
        alt={media.alt}
        title={media.title}
        caption={media.caption}
        triggerSx={media.triggerSx}
      >
        <Box
          component="img"
          src={media.src}
          alt={media.alt}
          sx={[
            {
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
            },
            ...toSxArray(media.previewSx),
          ]}
        />
      </ImageLightbox>
    );
  }, [media]);
  const renderedContent = hasRenderableNode(children) ? children : mediaNode;

  return (
    <Box
      component="section"
      ref={forwardedRef}
      {...sectionProps}
      sx={[
        {
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        ...rootSxArray,
      ]}
    >
      {showTitle ? (
        <Box component="h2" className={titleClassName} sx={[{ flexShrink: 0 }, ...titleSxArray]}>
          {title}
        </Box>
      ) : null}
      {showSubtitle ? (
        <Box
          component="p"
          className={subtitleClassName}
          sx={[{ flexShrink: 0 }, ...subtitleSxArray]}
        >
          {subtitle}
        </Box>
      ) : null}
      <Box
        sx={[
          {
            minHeight: 0,
            flex: "1 1 auto",
            overflowY: "auto",
            overflowX: "hidden",
          },
          ...contentSxArray,
        ]}
      >
        {renderedContent}
      </Box>
      {showCaption ? (
        <Box
          sx={[
            {
              flexShrink: 0,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
            },
            ...captionSlotSxArray,
          ]}
        >
          <Typography
            component="div"
            variant="body2"
            sx={[
              {
                m: 0,
                width: "100%",
                textAlign: "left",
                alignSelf: "flex-start",
              },
              ...captionTextSxArray,
            ]}
          >
            {caption}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
});

export default DemoSlide;
export type { DemoSlideProps };
