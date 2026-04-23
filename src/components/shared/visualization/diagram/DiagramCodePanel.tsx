import * as React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import Check from "@mui/icons-material/Check";
import CodeOff from "@mui/icons-material/CodeOff";
import ContentCopy from "@mui/icons-material/ContentCopy";
import DataObject from "@mui/icons-material/DataObject";
import ImageIcon from "@mui/icons-material/Image";
import Link from "@mui/icons-material/Link";
import Polyline from "@mui/icons-material/Polyline";
import type { DiagramCodePanelProps } from "@/types/components/shared/visualization";

export default function DiagramCodePanel({
  visible,
  width,
  height,
  showToolbar,
  diagramCode,
  copySucceeded,
  deepLinkCopySucceeded,
  onToggleCodeMode,
  onCopyDiagramCode,
  onExportSvg,
  onExportPng,
  onExportViewportJson,
  onCopyDeepLinkWithViewport,
}: DiagramCodePanelProps) {
  return (
    <Box
      sx={{
        width: width || "100%",
        height: height || "auto",
        minHeight: 0,
        border: 0,
        display: visible ? "flex" : "none",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {showToolbar && (
        <Toolbar variant="dense" sx={{ minHeight: 40, flexShrink: 0 }}>
          <Tooltip title="Show Diagram">
            <IconButton onClick={onToggleCodeMode}>
              <CodeOff />
            </IconButton>
          </Tooltip>
          <Tooltip title={copySucceeded ? "Copied" : "Copy Mermaid Code"}>
            <IconButton onClick={onCopyDiagramCode} aria-label="Copy Mermaid source code">
              {copySucceeded ? <Check /> : <ContentCopy />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Export SVG">
            <IconButton onClick={onExportSvg} aria-label="Export diagram as SVG">
              <Polyline />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export PNG">
            <IconButton onClick={onExportPng} aria-label="Export diagram as PNG">
              <ImageIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Viewport JSON">
            <IconButton
              onClick={onExportViewportJson}
              aria-label="Export diagram viewport state as JSON"
            >
              <DataObject />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={deepLinkCopySucceeded ? "Deep Link Copied" : "Copy Deep Link with Viewport"}
          >
            <IconButton
              onClick={onCopyDeepLinkWithViewport}
              aria-label="Copy deep link with viewport state"
            >
              {deepLinkCopySucceeded ? <Check /> : <Link />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      )}
      <Box
        sx={(theme) => ({
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "auto",
          px: 1.25,
          py: 1,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.black, 0.42)
              : alpha(theme.palette.grey[100], 0.86),
        })}
      >
        <Box
          component="pre"
          sx={(theme) => ({
            m: 0,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: "0.88rem",
            lineHeight: 1.45,
            whiteSpace: "pre",
            color:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.common.white, 0.9)
                : alpha(theme.palette.text.primary, 0.9),
          })}
        >
          {diagramCode}
        </Box>
      </Box>
    </Box>
  );
}
