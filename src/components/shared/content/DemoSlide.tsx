"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type DemoSlideProps = Omit<React.ComponentPropsWithoutRef<"section">, "title" | "children"> & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  caption?: React.ReactNode;
  children: React.ReactNode;
  rootSx?: SxProps<Theme>;
  titleClassName?: string;
  subtitleClassName?: string;
  titleSx?: SxProps<Theme>;
  subtitleSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  captionSlotSx?: SxProps<Theme>;
  captionTextSx?: SxProps<Theme>;
};

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
        {children}
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
