import * as React from "react";
import OpenInFull from "@mui/icons-material/OpenInFull";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import type { PdfRendererProps } from "@/types/components/shared/media";
import { flattenMediaCyclerSxArray } from "@/utils/media/mediaCyclerSx";
import { createMediaActivateKeyDownHandler } from "@/utils/components/shared/media";

const LazyPDFContent = React.lazy(() => import("@/components/shared/content/PDFContent"));

export default function PdfRenderer({
  item,
  pdfUrl,
  lightboxTitle,
  canActivate,
  showExpandIcon,
  expandControlSxArray,
  pdfPreviewSxArray,
  pdfContainerSxArray,
  pdfFrameSxArray,
  pdfObjectSxArray,
  pdfIframeSxArray,
  onMediaAction,
}: PdfRendererProps) {
  const resolvedExpandControlSxArray = flattenMediaCyclerSxArray(expandControlSxArray);
  const resolvedPdfPreviewSxArray = flattenMediaCyclerSxArray(pdfPreviewSxArray);
  const resolvedPdfContainerSxArray = flattenMediaCyclerSxArray(pdfContainerSxArray);
  const resolvedPdfFrameSxArray = flattenMediaCyclerSxArray(pdfFrameSxArray);
  const resolvedPdfObjectSxArray = flattenMediaCyclerSxArray(pdfObjectSxArray);
  const resolvedPdfIframeSxArray = flattenMediaCyclerSxArray(pdfIframeSxArray);

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
        alignItems: "stretch",
        justifyContent: "center",
        cursor: canActivate ? "pointer" : "default",
      }}
    >
      <React.Suspense fallback={<Box sx={{ width: "100%", height: "100%" }} />}>
        <LazyPDFContent
          src={pdfUrl}
          title={lightboxTitle}
          onLoad={item.onMediaLoaded}
          previewSx={[{ height: "100%" }, ...resolvedPdfPreviewSxArray]}
          containerSx={resolvedPdfContainerSxArray}
          frameSx={resolvedPdfFrameSxArray}
          objectSx={resolvedPdfObjectSxArray}
          iframeSx={resolvedPdfIframeSxArray}
          showOpenLink={item.pdfShowOpenLink ?? false}
          openLinkLabel={item.pdfOpenLinkLabel}
          openLinkHref={item.pdfOpenLinkHref}
          openLinkDescription={item.pdfOpenLinkDescription}
        />
      </React.Suspense>
      {showExpandIcon ? (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 2,
          }}
        >
          <Box
            component="a"
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open full document: ${lightboxTitle}`}
            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
              event.stopPropagation();
              const trigger = event.detail === 0 ? "keyboard" : "pointer";
              onMediaAction?.({
                kind: "open",
                trigger,
                control: "pdf-open-new-tab",
              });
            }}
            sx={[
              {
                all: "unset",
                display: "inline-flex",
                cursor: "pointer",
              },
            ]}
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
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
