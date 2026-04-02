"use client";

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
  FormControlLabel,
  Switch,
  IconButton,
  Link,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";
import { validateOpenAIKey } from "@/app/talentforge/_utils/utils";

export interface OpenAIKeyModalProps
  extends Omit<DialogProps, "open" | "onClose"> {
  open?: boolean;
  onClose?: () => void;
}

export default function OpenAIKeyModal({
  open = false,
  onClose,
  ...props
}: OpenAIKeyModalProps) {
  const { key: storedKey, persist, setKey, setPersist, setValidity } =
    useOpenAIKey();
  const [draftKey, setDraftKey] = React.useState(storedKey);

  React.useEffect(() => {
    if (open) {
      setDraftKey(storedKey);
    }
  }, [open, storedKey]);

  const handleClose = () => {
    setDraftKey(storedKey);
    onClose?.();
  };

  const handleSave = () => {
    const trimmed = draftKey.trim();
    if (!trimmed) return;

    setKey(trimmed);
    setDraftKey(trimmed);
    handleClose();
  };

  const handlePersistChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.checked;
    setPersist(value);
  };

  const handleTest = async () => {
    const trimmed = draftKey.trim();
    if (!trimmed) return;
    const normalizedStored = storedKey.trim();
    const isCurrentKey = trimmed === normalizedStored;
    if (isCurrentKey) {
      setValidity("checking");
    }
    const result = await validateOpenAIKey(trimmed);
    if (result.ok) {
      alert("Key is valid!");
      if (isCurrentKey) {
        setValidity("valid");
      }
    } else {
      alert(`Key test failed. ${result.error ?? ""}`.trim());
      if (isCurrentKey) {
        setValidity("invalid");
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} {...props}>
      <DialogTitle>
        Enter OpenAI API Key
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
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Your key is stored only in your browser and never sent to our servers.
          By default it is kept for this session and cleared when you close the
          tab. Enable persistence to save it across sessions. See our
          <Link
            href="https://docs.talentforge.dev/openai-key"
            target="_blank"
            rel="noopener"
            sx={{ ml: 0.5 }}
          >
            docs
          </Link>
          for more details.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="OpenAI API Key"
          type="password"
          fullWidth
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
        />
        <FormControlLabel
          control={<Switch checked={persist} onChange={handlePersistChange} />}
          label="Persist across sessions"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleTest} disabled={!draftKey.trim()}>
          Test Key
        </Button>
        <Button onClick={handleSave} disabled={!draftKey.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
