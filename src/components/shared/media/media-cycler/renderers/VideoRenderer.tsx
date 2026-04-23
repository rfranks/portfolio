import * as React from "react";
import Box from "@mui/material/Box";
import VideoLightbox from "@/components/shared/media/VideoLightbox";
import type { VideoRendererProps } from "@/types/components/shared/media";
import { flattenMediaCyclerSxArray } from "@/utils/media/mediaCyclerSx";
import { createMediaActivateKeyDownHandler } from "@/utils/components/shared/media";

export default function VideoRenderer({
  item,
  mediaUrl,
  lightboxTitle,
  canActivate,
  showExpandIcon,
  expandControlSx,
  previewVideoSxArray,
  onMediaAction,
}: VideoRendererProps) {
  const resolvedPreviewVideoSxArray = flattenMediaCyclerSxArray(previewVideoSxArray);

  return (
    <Box
      role={canActivate ? "button" : undefined}
      tabIndex={canActivate ? 0 : -1}
      aria-label={canActivate ? `Activate ${item.title}` : undefined}
      onClick={item.onMediaActivate}
      onKeyDown={createMediaActivateKeyDownHandler(item.onMediaActivate)}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: canActivate ? "pointer" : "default",
      }}
    >
      <VideoLightbox
        ref={item.videoRef}
        src={mediaUrl}
        title={lightboxTitle}
        caption={item.lightboxCaption || item.mediaCaption}
        controls={item.controls}
        autoPlay={item.autoPlay}
        playsInline={item.playsInline}
        loop={item.loop}
        muted={item.muted}
        stopEventPropagation={canActivate}
        showExpandButton={showExpandIcon}
        expandButtonSx={expandControlSx}
        onOpen={(trigger, control) => {
          onMediaAction?.({
            kind: "open",
            trigger,
            control,
          });
        }}
        previewVideoClassName={item.previewVideoClassName}
        previewVideoSx={resolvedPreviewVideoSxArray}
        onLoadedData={item.onMediaLoaded}
        {...item.videoProps}
      />
    </Box>
  );
}
