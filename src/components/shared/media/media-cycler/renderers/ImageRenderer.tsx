import * as React from "react";
import Box from "@mui/material/Box";
import OpenInFull from "@mui/icons-material/OpenInFull";
import { alpha } from "@mui/material/styles";
import ImageContent from "@/components/shared/content/ImageContent";
import ImageLightbox from "@/components/shared/media/ImageLightbox";
import type { ImageRendererProps } from "@/types/components/shared/media";
import { flattenMediaCyclerSxArray } from "@/utils/media/mediaCyclerSx";

export default function ImageRenderer({
  item,
  mediaUrl,
  imageAlt,
  lightboxTitle,
  showExpandIcon,
  expandControlSxArray,
  onMediaAction,
  onFirstRenderReady,
}: ImageRendererProps) {
  const resolvedExpandControlSxArray = flattenMediaCyclerSxArray(expandControlSxArray);
  const hasReportedFirstRenderRef = React.useRef(false);

  const handleImageLoaded = React.useCallback(() => {
    item.onMediaLoaded?.();
    if (!hasReportedFirstRenderRef.current) {
      hasReportedFirstRenderRef.current = true;
      onFirstRenderReady?.("image-onload");
    }
  }, [item, onFirstRenderReady]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <ImageContent
        src={mediaUrl}
        alt={imageAlt}
        width={item.imageWidth}
        height={item.imageHeight}
        onLoad={handleImageLoaded}
        className={item.imageClassName}
        style={item.imageStyle}
        onMediaActivate={item.onMediaActivate}
      />
      {showExpandIcon ? (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 2,
          }}
        >
          <ImageLightbox
            src={mediaUrl}
            alt={imageAlt}
            title={lightboxTitle}
            caption={item.lightboxCaption || item.mediaCaption || item.mediaSource}
            onOpen={(trigger, control) => {
              onMediaAction?.({
                kind: "open",
                trigger,
                control,
              });
            }}
            stopEventPropagation
            triggerSx={{
              all: "unset",
              display: "inline-flex",
              cursor: "zoom-in",
            }}
          >
            <Box
              component="span"
              sx={[
                (theme) => ({
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "1px solid",
                  borderColor: alpha(theme.palette.common.white, 0.32),
                  color: theme.palette.common.white,
                  bgcolor: alpha(theme.palette.grey[900], 0.58),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.grey[900], 0.76),
                  },
                }),
                ...resolvedExpandControlSxArray,
              ]}
            >
              <OpenInFull fontSize="small" />
            </Box>
          </ImageLightbox>
        </Box>
      ) : null}
    </Box>
  );
}
