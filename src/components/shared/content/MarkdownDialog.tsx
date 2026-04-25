import type * as React from "react";
import Markdown from "react-markdown";
import { Close } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
} from "@mui/material";

export interface MarkdownDialogProps extends Omit<DialogProps, "open" | "onClose"> {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  content: string;
  actionLabel?: string;
}

export default function MarkdownDialog({
  open = false,
  onClose,
  title = "Details",
  content,
  actionLabel = "OK",
  ...dialogProps
}: MarkdownDialogProps) {
  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} {...dialogProps}>
      <DialogTitle>{title}</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <Close />
      </IconButton>
      <DialogContent>
        <Markdown>{content}</Markdown>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{actionLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
