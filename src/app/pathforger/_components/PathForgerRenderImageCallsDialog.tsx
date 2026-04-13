import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { MoreVertOutlined } from "@mui/icons-material";
import type { PathForgerImageType } from "@/app/pathforger/_types/pipeline";

type PathForgerRenderImageCallsDialogProps = {
  open: boolean;
  onClose: () => void;
  imageTypeOrder: PathForgerImageType[];
  imageTypeLabels: Record<PathForgerImageType, string>;
  renderImages: Record<PathForgerImageType, boolean>;
  onSetAll: (enabled: boolean) => void;
  onToggleType: (type: PathForgerImageType) => void;
  onEditPrompt: (type: PathForgerImageType) => void;
};

export default function PathForgerRenderImageCallsDialog(
  props: PathForgerRenderImageCallsDialogProps,
) {
  const {
    open,
    onClose,
    imageTypeOrder,
    imageTypeLabels,
    renderImages,
    onSetAll,
    onToggleType,
    onEditPrompt,
  } = props;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Render image calls</DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 0.75,
          }}
        >
          <Typography variant="subtitle2">Select image call types</Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Link
              component="button"
              type="button"
              variant="caption"
              underline="hover"
              onClick={() => onSetAll(true)}
            >
              All
            </Link>
            <Typography variant="caption" color="text.secondary">
              /
            </Typography>
            <Link
              component="button"
              type="button"
              variant="caption"
              underline="hover"
              onClick={() => onSetAll(false)}
            >
              None
            </Link>
          </Stack>
        </Box>
        <Stack spacing={0.25}>
          {imageTypeOrder.map((type) => (
            <Box
              key={type}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 0.5,
              }}
            >
              <FormControlLabel
                sx={{ m: 0, flexGrow: 1 }}
                control={
                  <Checkbox
                    size="small"
                    checked={renderImages[type]}
                    onChange={() => onToggleType(type)}
                  />
                }
                label={imageTypeLabels[type]}
              />
              <IconButton
                size="small"
                aria-label={`Edit image prompt for ${imageTypeLabels[type]}`}
                onClick={() => onEditPrompt(type)}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 0.75,
                  p: "2px",
                }}
              >
                <MoreVertOutlined fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
