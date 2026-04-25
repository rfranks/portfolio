import * as React from "react";
import Box from "@mui/material/Box";
import type { DiagramRendererProps } from "@/types/components/shared/media";
import { flattenMediaCyclerSxArray } from "@/utils/media/mediaCyclerSx";
import { createMediaActivateKeyDownHandler, safeImport } from "@/utils/components/shared/media";

const loadDiagramLightBoxModule = () => import("@/components/shared/media/DiagramLightBox");
const LazyDiagramLightBox = React.lazy(loadDiagramLightBoxModule);
let hasPrefetchedDiagramIntent = false;

export const prefetchDiagramRendererIntent = () => {
  if (hasPrefetchedDiagramIntent) {
    return;
  }

  hasPrefetchedDiagramIntent = true;
  safeImport(loadDiagramLightBoxModule());
  safeImport(import("mermaid"));
};

export default function DiagramRenderer({
  item,
  mediaUrl,
  canActivate,
  showExpandIcon,
  expandControlSx,
  diagramSxArray,
  onMediaAction,
  onFirstRenderReady,
}: DiagramRendererProps) {
  const resolvedDiagramSxArray = flattenMediaCyclerSxArray(diagramSxArray);
  const hasReportedFirstRenderRef = React.useRef(false);

  React.useEffect(() => {
    hasReportedFirstRenderRef.current = false;
    let frameOne = 0;
    let frameTwo = 0;
    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        if (hasReportedFirstRenderRef.current) {
          return;
        }
        hasReportedFirstRenderRef.current = true;
        item.onMediaLoaded?.();
        onFirstRenderReady?.("diagram-mounted");
      });
    });

    return () => {
      if (frameOne) {
        window.cancelAnimationFrame(frameOne);
      }
      if (frameTwo) {
        window.cancelAnimationFrame(frameTwo);
      }
    };
  }, [item, mediaUrl, onFirstRenderReady]);

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
        minHeight: 0,
        cursor: canActivate ? "pointer" : "default",
      }}
    >
      <React.Suspense fallback={<Box sx={{ width: "100%", height: "100%" }} />}>
        <LazyDiagramLightBox
          diagram={mediaUrl}
          title={item.diagramProps?.title ?? item.title}
          subtitle={item.lightboxSubtitle}
          caption={item.lightboxCaption || item.mediaCaption || item.mediaSource}
          onOpen={(trigger, control) => {
            onMediaAction?.({
              kind: "open",
              trigger,
              control,
            });
          }}
          showExpandButton={showExpandIcon}
          expandButtonSx={expandControlSx}
          stopEventPropagation={canActivate}
          containerSx={[
            {
              width: "100%",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
              "& [id$='-container']": {
                width: "100% !important",
                height: "100% !important",
                minHeight: 0,
              },
              "& .diagram-mermaid svg": {
                maxWidth: "100%",
                height: "auto",
              },
            },
            ...resolvedDiagramSxArray,
          ]}
          diagramProps={{
            ...item.diagramProps,
            title: item.diagramProps?.title ?? item.title,
            height: item.diagramProps?.height ?? "100%",
            width: item.diagramProps?.width ?? "100%",
            showToolbar: item.diagramProps?.showToolbar ?? true,
            showGridDots: item.diagramProps?.showGridDots ?? item.diagramProps?.showDots ?? false,
            showDots: item.diagramProps?.showDots ?? false,
          }}
        />
      </React.Suspense>
    </Box>
  );
}
