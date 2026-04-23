import * as React from "react";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import CenterFocusStrong from "@mui/icons-material/CenterFocusStrong";
import Check from "@mui/icons-material/Check";
import Code from "@mui/icons-material/Code";
import ContentCopy from "@mui/icons-material/ContentCopy";
import DataObject from "@mui/icons-material/DataObject";
import ImageIcon from "@mui/icons-material/Image";
import Link from "@mui/icons-material/Link";
import Polyline from "@mui/icons-material/Polyline";
import Redo from "@mui/icons-material/Redo";
import Undo from "@mui/icons-material/Undo";
import ZoomIn from "@mui/icons-material/ZoomIn";
import ZoomOut from "@mui/icons-material/ZoomOut";
import type { DiagramToolbarProps } from "@/types/components/shared/visualization";

export default function DiagramToolbar({
  showToolbar,
  alwaysShowToolbar,
  canUndo,
  canRedo,
  copySucceeded,
  onUndo,
  onRedo,
  onPanUp,
  onPanLeft,
  onPanRight,
  onPanDown,
  onZoomOut,
  onZoomIn,
  onReset,
  onCopyCode,
  onExportSvg,
  onExportPng,
  onExportViewportJson,
  deepLinkCopySucceeded,
  onCopyDeepLinkWithViewport,
  onShowSource,
  toolbarActions,
}: DiagramToolbarProps) {
  if (!showToolbar) {
    return null;
  }

  return (
    <Toolbar
      variant="dense"
      sx={{
        minHeight: "40px",
        py: 1,
        ...(alwaysShowToolbar ? null : { "@media (max-width: 600px)": { display: "none" } }),
      }}
    >
      <Tooltip title="Undo">
        <span>
          <IconButton onClick={onUndo} disabled={!canUndo}>
            <Undo />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Redo">
        <span>
          <IconButton onClick={onRedo} disabled={!canRedo}>
            <Redo />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title="Pan Up">
        <IconButton onClick={onPanUp}>
          <ArrowUpward />
        </IconButton>
      </Tooltip>
      <Tooltip title="Pan Left">
        <IconButton onClick={onPanLeft}>
          <ArrowBack />
        </IconButton>
      </Tooltip>
      <Tooltip title="Pan Right">
        <IconButton onClick={onPanRight}>
          <ArrowForward />
        </IconButton>
      </Tooltip>
      <Tooltip title="Pan Down">
        <IconButton onClick={onPanDown}>
          <ArrowDownward />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title="Zoom Out (shift+click)">
        <IconButton onClick={onZoomOut}>
          <ZoomOut />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom In (ctrl+click)">
        <IconButton onClick={onZoomIn}>
          <ZoomIn />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title="Reset Transform">
        <IconButton onClick={onReset}>
          <CenterFocusStrong />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title={copySucceeded ? "Copied" : "Copy Mermaid Code"}>
        <IconButton onClick={onCopyCode} aria-label="Copy Mermaid source code">
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
      <Tooltip title={deepLinkCopySucceeded ? "Deep Link Copied" : "Copy Deep Link with Viewport"}>
        <IconButton
          onClick={onCopyDeepLinkWithViewport}
          aria-label="Copy deep link with viewport state"
        >
          {deepLinkCopySucceeded ? <Check /> : <Link />}
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title="Show Source">
        <IconButton onClick={onShowSource}>
          <Code />
        </IconButton>
      </Tooltip>
      {toolbarActions}
    </Toolbar>
  );
}
