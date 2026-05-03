import * as React from "react";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { DragIndicator, UnfoldLess, UnfoldMore } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { ApplicationStatus } from "@/types";
import Surface from "@/components/fabric/Surface";
import Chip from "@/components/fabric/Chip";

export interface BoardColumnProps {
  id: ApplicationStatus;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
  assistiveText?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  count: number;
}

export default function BoardColumn({
  id,
  title,
  children,
  highlight = false,
  assistiveText,
  collapsed,
  onToggleCollapse,
  count,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: { type: "status", status: id },
  });
  const {
    attributes,
    listeners,
    setNodeRef: setHandleRef,
    isDragging,
  } = useDraggable({
    id: `column-${id}`,
    data: { type: "column", status: id },
  });

  const accessibleLabelParts = [title];
  if (assistiveText) {
    accessibleLabelParts.push(assistiveText);
  }
  if (collapsed) {
    accessibleLabelParts.push("Column collapsed");
  }
  const ariaLabel = accessibleLabelParts.join(". ");
  const toggleLabel = collapsed ? `Expand ${title}` : `Collapse ${title}`;

  return (
    <Surface
      ref={setNodeRef}
      role="list"
      aria-label={ariaLabel}
      data-status={id}
      layer={highlight ? 3 : 2}
      sx={{
        p: 2,
        width: { xs: "100%", sm: 280, lg: 300 },
        minHeight: collapsed ? "auto" : 400,
        bgcolor: (theme) =>
          highlight ? alpha(theme.palette.error.main, 0.08) : theme.palette.background.paper,
        flexShrink: 0,
        opacity: isDragging ? 0.8 : 1,
        ...(highlight
          ? {
              outline: "2px solid",
              outlineColor: "error.main",
            }
          : {}),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
          <Tooltip title="Drag to reorder column">
            <IconButton
              ref={setHandleRef}
              {...listeners}
              {...attributes}
              size="small"
              aria-label={`Reorder ${title} column`}
              sx={{ cursor: "grab" }}
            >
              <DragIndicator fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          <Chip label={count} size="small" variant="outlined" sx={{ ml: 1 }} />
        </Stack>
        <Tooltip title={toggleLabel}>
          <IconButton
            size="small"
            onClick={onToggleCollapse}
            aria-label={toggleLabel}
            aria-pressed={collapsed}
          >
            {collapsed ? <UnfoldMore fontSize="small" /> : <UnfoldLess fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
      {collapsed ? (
        <Typography variant="body2" color="text.secondary">
          Column collapsed. Expand to view applications.
        </Typography>
      ) : (
        <Stack spacing={1}>{children}</Stack>
      )}
    </Surface>
  );
}
