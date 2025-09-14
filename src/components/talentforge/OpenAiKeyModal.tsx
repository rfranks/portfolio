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
} from "@mui/material";

import { setOpenAIKey } from "@/utils/talentforge/utils";
import {
  getOpenAIKey,
  deleteOpenAIKey,
} from "@/utils/talentforge/dataStore";

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
  const [persist, setPersist] = React.useState(true);

  const loadStoredKey = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const storedPersist = window.localStorage.getItem(
      "talentforge-openai-key-persist",
    );
    const shouldPersist = storedPersist !== "false";
    setPersist(shouldPersist);

    const storedKey = shouldPersist
      ? getOpenAIKey() || ""
      : window.sessionStorage.getItem("talentforge-openai-key") || "";

    if (storedKey) {
      setOpenAIKey(storedKey);
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
    setOpenAIKey(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "talentforge-openai-key-persist",
        persist ? "true" : "false",
      );
      if (persist) {
        // setOpenAIKey already stores to localStorage
      } else {
        window.sessionStorage.setItem("talentforge-openai-key", trimmed);
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
        <FormControlLabel
          control={
            <Switch checked={persist} onChange={handlePersistChange} />
          }
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
