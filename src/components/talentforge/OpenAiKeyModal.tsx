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

import { setOpenAIKey as setInMemoryKey } from "@/utils/talentforge/utils";
import {
  getOpenAIKey,
  setOpenAIKey as persistOpenAIKey,
  deleteOpenAIKey,
} from "@/utils/talentforge/dataStore";

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
  const [key, setKey] = React.useState("");
  const [persist, setPersist] = React.useState(false);

  const loadStoredKey = React.useCallback(() => {
    if (typeof window === "undefined") return;

    const storedPersist = window.localStorage.getItem(
      "talentforge-openai-key-persist",
    );
    const shouldPersist = storedPersist === "true";
    setPersist(shouldPersist);

    const storedKey = shouldPersist
      ? getOpenAIKey() || ""
      : window.sessionStorage.getItem("talentforge-openai-key") || "";

    if (storedKey) {
      setInMemoryKey(storedKey);
      if (!shouldPersist) {
        deleteOpenAIKey();
      }
      setKey(storedKey);
    }
  }, []);

  React.useEffect(() => {
    loadStoredKey();
  }, [loadStoredKey]);

  React.useEffect(() => {
    if (open) {
      loadStoredKey();
    }
  }, [open, loadStoredKey]);

  const handleClose = () => {
    setKey("");
    onClose?.();
  };

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) return;

    setInMemoryKey(trimmed);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("talentforge-openai-key", trimmed);
      window.localStorage.setItem(
        "talentforge-openai-key-persist",
        persist ? "true" : "false",
      );

      if (persist) {
        persistOpenAIKey(trimmed);
      } else {
        deleteOpenAIKey();
      }
    }

    handleClose();
  };

  const handlePersistChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.checked;
    setPersist(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "talentforge-openai-key-persist",
        value ? "true" : "false",
      );
      if (!value) {
        deleteOpenAIKey();
      }
    }
  };

  const handleTest = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    try {
      const res = await fetch("/api/test-openai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed }),
      });
      if (res.ok) {
        alert("Key is valid!");
      } else {
        alert("Key test failed.");
      }
    } catch {
      alert("Key test failed.");
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
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <FormControlLabel
          control={<Switch checked={persist} onChange={handlePersistChange} />}
          label="Persist across sessions"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleTest} disabled={!key.trim()}>
          Test Key
        </Button>
        <Button onClick={handleSave} disabled={!key.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

