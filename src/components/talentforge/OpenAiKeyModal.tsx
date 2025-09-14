import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  DialogProps,
} from "@mui/material";

import { setOpenAIKey } from "@/utils/talentforge/utils";

export interface OpenAiKeyModalProps
  extends Omit<DialogProps, "open" | "onClose"> {
  open?: boolean;
  onClose?: () => void;
}

export default function OpenAiKeyModal({
  open = false,
  onClose,
}: OpenAiKeyModalProps) {
  const [key, setKey] = React.useState("");

  const handleClose = () => {
    onClose?.();
  };

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setOpenAIKey(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("talentforge-openai-key", trimmed);
    }
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Enter OpenAI API Key</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="OpenAI API Key"
          type="password"
          fullWidth
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!key.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
