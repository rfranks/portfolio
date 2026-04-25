import * as React from "react";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import MarkdownContent from "../../content/MarkdownContent";
import { MEDIA_RENDERER_FALLBACK_SX } from "@/consts/components/shared/mediaCycler";
import { useMediaCyclerItemRenderer } from "@/hooks/media/useMediaCyclerItemRenderer";
import type {
  MediaCyclerItemRendererProps,
  MediaRendererActionHandler,
} from "@/types/components/shared/media";
import { withBasePath } from "@/utils/basePath";
import { createMediaActivateKeyDownHandler } from "@/utils/components/shared/media";
import { assertNever } from "@/utils/components/shared/mediaCycler";
import {
  LazyDiagramRenderer,
  LazyImageRenderer,
  LazyPdfRenderer,
  LazyVideoRenderer,
} from "./rendererRegistry";

const renderSource = (label?: string, href?: string) => {
  if (!label) {
    return null;
  }

  return (
    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
      Source:{" "}
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary.main"
        >
          {label}
        </Link>
      ) : (
        label
      )}
    </Typography>
  );
};

export default function MediaCyclerItemRenderer({
  item,
  items,
  loopNavigation,
  markdownByKey,
  smallScreenInfoBlurb,
  compactMetadataOnSmallScreens,
  showCompactInfoButton,
  showExpandIcon,
  expandControlSx,
  expandControlSxArray,
  navigationOverlay,
  prefetchItemMediaByIntent,
  openMetadataDialog,
  handleRendererFirstRenderReady,
  emitRendererMediaAction,
}: MediaCyclerItemRendererProps) {
  const {
    isDiagramItem,
    canActivate,
    hasTitle,
    imageAlt,
    lightboxTitle,
    compactMetadata,
    inlineMetadataDisplay,
    resolvedMarkdownContent,
    panelFlatSxArray,
    titleIconFlatSxArray,
    titleFlatSxArray,
    assetFrameFlatSxArray,
    previewVideoSxArray,
    markdownFlatSxArray,
    diagramSxArray,
    customContentFlatSxArray,
    pdfContainerSxArray,
    pdfFrameSxArray,
    pdfPreviewSxArray,
    pdfObjectSxArray,
    pdfIframeSxArray,
    previousDiagramItem,
    nextDiagramItem,
    canGoBackToPreviousDiagram,
    canAdvanceToNextDiagram,
  } = useMediaCyclerItemRenderer({
    item,
    items,
    loopNavigation,
    markdownByKey,
    smallScreenInfoBlurb,
    compactMetadataOnSmallScreens,
  });

  const sourceNode = renderSource(item.mediaSource, item.mediaSourceHref);

  const emitAllowedRendererAction: MediaRendererActionHandler = (params) => {
    if (
      params.kind === "open" ||
      params.kind === "copy" ||
      params.kind === "export" ||
      params.kind === "zoom"
    ) {
      emitRendererMediaAction(item, params);
    }
  };

  const renderCustom = () => (
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
      <Box
        sx={[
          {
            width: "100%",
            height: "100%",
            minHeight: 0,
          },
          ...customContentFlatSxArray,
        ]}
      >
        {item.customContent}
      </Box>
    </Box>
  );

  const renderMarkdown = () => (
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
      <Box
        sx={(theme) => ({
          width: "100%",
          height: "100%",
          minHeight: 0,
          overflow: "auto",
          borderRadius: { xs: 0, sm: 0, md: "18px" },
          border: { xs: 0, sm: 0, md: "1px solid" },
          borderColor: "var(--fabric-surface-border)",
          bgcolor:
            theme.palette.mode === "light"
              ? alpha(theme.palette.common.white, 0.7)
              : "rgba(15,23,42,0.35)",
          p: 2,
        })}
      >
        <MarkdownContent
          content={resolvedMarkdownContent}
          variant="body2"
          sx={[{ "& p": { mb: 1.1 } }, ...markdownFlatSxArray]}
        />
      </Box>
    </Box>
  );

  const renderMedia = () => {
    const resolvedMediaUrl = item.mediaUrl ? withBasePath(item.mediaUrl) : "";

    switch (item.mediaType) {
      case "image":
        return (
          <LazyImageRenderer
            item={item}
            mediaUrl={resolvedMediaUrl}
            imageAlt={imageAlt}
            lightboxTitle={lightboxTitle}
            showExpandIcon={showExpandIcon}
            expandControlSxArray={expandControlSxArray}
            onFirstRenderReady={(control) => {
              handleRendererFirstRenderReady(item, control);
            }}
            onMediaAction={emitAllowedRendererAction}
          />
        );
      case "video":
        return (
          <LazyVideoRenderer
            item={item}
            mediaUrl={resolvedMediaUrl}
            lightboxTitle={lightboxTitle}
            canActivate={canActivate}
            showExpandIcon={showExpandIcon}
            expandControlSx={expandControlSx}
            previewVideoSxArray={previewVideoSxArray}
            onFirstRenderReady={(control) => {
              handleRendererFirstRenderReady(item, control);
            }}
            onMediaAction={emitAllowedRendererAction}
          />
        );
      case "pdf":
        return (
          <LazyPdfRenderer
            item={item}
            pdfUrl={resolvedMediaUrl}
            lightboxTitle={lightboxTitle}
            canActivate={canActivate}
            showExpandIcon={showExpandIcon}
            expandControlSxArray={expandControlSxArray}
            pdfPreviewSxArray={pdfPreviewSxArray}
            pdfContainerSxArray={pdfContainerSxArray}
            pdfFrameSxArray={pdfFrameSxArray}
            pdfObjectSxArray={pdfObjectSxArray}
            pdfIframeSxArray={pdfIframeSxArray}
            onFirstRenderReady={(control) => {
              handleRendererFirstRenderReady(item, control);
            }}
            onMediaAction={emitAllowedRendererAction}
          />
        );
      case "diagram":
        return (
          <LazyDiagramRenderer
            item={item}
            mediaUrl={item.mediaUrl}
            canActivate={canActivate}
            showExpandIcon={showExpandIcon}
            expandControlSx={expandControlSx}
            diagramSxArray={diagramSxArray}
            onFirstRenderReady={(control) => {
              handleRendererFirstRenderReady(item, control);
            }}
            onMediaAction={emitAllowedRendererAction}
          />
        );
      case "markdown":
        return renderMarkdown();
      case "custom":
      case "project":
      case "projectPresentation":
      case "recognition":
      case "recommendation":
        return renderCustom();
      default:
        return assertNever(item);
    }
  };

  return (
    <Box
      key={item.key}
      ref={item.panelRef}
      onPointerEnter={() => prefetchItemMediaByIntent(item)}
      onFocusCapture={() => prefetchItemMediaByIntent(item)}
      onTouchStart={() => prefetchItemMediaByIntent(item)}
      sx={[
        {
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
        },
        ...panelFlatSxArray,
      ]}
    >
      {hasTitle || item.description || compactMetadata ? (
        <Box sx={{ mb: 1.25 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: hasTitle ? "space-between" : "flex-end",
              gap: 1,
            }}
          >
            {hasTitle ? (
              <Box
                sx={{
                  minWidth: 0,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {item.titleIcon ? (
                  <Box
                    aria-label={item.titleIconAriaLabel}
                    sx={[
                      (theme) => ({
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "1px solid",
                        borderColor:
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.common.white, 0.28)
                            : alpha(theme.palette.common.black, 0.26),
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.background.paper, 0.54)
                            : alpha(theme.palette.background.paper, 0.9),
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.grey[100]
                            : theme.palette.grey[900],
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }),
                      ...titleIconFlatSxArray,
                    ]}
                  >
                    {item.titleIcon}
                  </Box>
                ) : null}
                <Typography
                  variant={item.titleVariant ?? "subtitle2"}
                  sx={[{ minWidth: 0, flex: 1 }, ...titleFlatSxArray]}
                >
                  {item.title}
                </Typography>
              </Box>
            ) : null}
            {compactMetadata && showCompactInfoButton ? (
              <IconButton
                size="small"
                aria-label={`Open media details: ${lightboxTitle}`}
                onClick={() => openMetadataDialog(item, "pointer", "open-media-details")}
                sx={(theme) => ({
                  display: { xs: "inline-flex", md: "none" },
                  flexShrink: 0,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.common.white, 0.22),
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[100]
                      : theme.palette.grey[900],
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(2,6,23,0.65)"
                      : alpha(theme.palette.background.paper, 0.82),
                })}
              >
                <InfoOutlined fontSize="small" />
              </IconButton>
            ) : null}
          </Box>
          {item.description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
              {item.description}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      <Box
        sx={[
          {
            width: "100%",
            maxWidth: "100%",
            position: "relative",
          },
          ...assetFrameFlatSxArray,
        ]}
      >
        <React.Suspense fallback={<Box sx={MEDIA_RENDERER_FALLBACK_SX} />}>
          {renderMedia()}
        </React.Suspense>
        {navigationOverlay}
      </Box>

      {sourceNode ? <Box sx={{ display: inlineMetadataDisplay }}>{sourceNode}</Box> : null}
      {item.mediaCaption ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: item.mediaSource ? 0.75 : 1.5,
            display: inlineMetadataDisplay,
          }}
        >
          {item.mediaCaption}
        </Typography>
      ) : null}
      {item.extraContent}

      {isDiagramItem ? (
        <Box
          sx={{
            mt: 0.85,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <Link
            component="button"
            type="button"
            underline="hover"
            color={canGoBackToPreviousDiagram ? "primary.main" : "text.disabled"}
            aria-disabled={!canGoBackToPreviousDiagram}
            tabIndex={canGoBackToPreviousDiagram ? 0 : -1}
            onClick={() => {
              if (!canGoBackToPreviousDiagram) {
                return;
              }
              previousDiagramItem?.onSelect?.();
            }}
            sx={{
              p: 0,
              border: 0,
              background: "none",
              fontSize: "0.84rem",
              lineHeight: 1.2,
              fontWeight: 700,
              cursor: canGoBackToPreviousDiagram ? "pointer" : "default",
              pointerEvents: canGoBackToPreviousDiagram ? "auto" : "none",
            }}
          >
            {"<"} Back
          </Link>
          <Link
            component="button"
            type="button"
            underline="hover"
            color={canAdvanceToNextDiagram ? "primary.main" : "text.disabled"}
            aria-disabled={!canAdvanceToNextDiagram}
            tabIndex={canAdvanceToNextDiagram ? 0 : -1}
            onClick={() => {
              if (!canAdvanceToNextDiagram) {
                return;
              }
              nextDiagramItem?.onSelect?.();
            }}
            sx={{
              p: 0,
              border: 0,
              background: "none",
              fontSize: "0.84rem",
              lineHeight: 1.2,
              fontWeight: 700,
              cursor: canAdvanceToNextDiagram ? "pointer" : "default",
              pointerEvents: canAdvanceToNextDiagram ? "auto" : "none",
            }}
          >
            Next {">"}
          </Link>
        </Box>
      ) : null}
    </Box>
  );
}
