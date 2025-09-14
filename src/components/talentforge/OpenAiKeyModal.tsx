import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  DialogProps,
} from "@mui/material";

import { setOpenAIKey } from "@/utils/talentforge/utils";
import { getOpenAIKey } from "@/utils/talentforge/dataStore";

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

  React.useEffect(() => {
    if (open) {
      setKey(getOpenAIKey() || "");
    }
  }, [open]);

  const handleClose = () => {
    setKey("");
    onClose?.();
  };

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setOpenAIKey(trimmed);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Enter OpenAI API Key</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Your key is stored locally under <code>talentforge-openai-key</code> and
          never sent to our servers.
        </DialogContentText>
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
