"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import OpenAIKeyModal from "@/components/talentforge/OpenAiKeyModal";
import { hasOpenAIKey, setOpenAIKey } from "@/utils/talentforge/utils";
import { exportSnapshot, importSnapshot } from "@/utils/talentforge/snapshot";
import { loadDemoData, clearDemoData } from "@/utils/talentforge/demoData";

export default function Settings() {
  const [openKeyModal, setOpenKeyModal] = React.useState(false);
  const [openAiKeySet, setOpenAiKeySet] = React.useState(false);

  React.useEffect(() => {
    setOpenAiKeySet(hasOpenAIKey());
  }, []);

  const handleRemoveKey = () => {
    setOpenAIKey("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("talentforge-openai-key");
    }
    setOpenAiKeySet(false);
  };

  const handleExport = () => {
    const data = exportSnapshot();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talentforge-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === "string") {
        importSnapshot(text);
        setOpenAiKeySet(hasOpenAIKey());
      }
    };
    reader.readAsText(file);
  };

  const handleCloseModal = () => {
    setOpenKeyModal(false);
    setOpenAiKeySet(hasOpenAIKey());
  };

  const handleLoadDemo = () => {
    loadDemoData();
  };

  const handleClearDemo = () => {
    clearDemoData();
  };

  return (
    <ErrorBoundary>
      <Stack spacing={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              OpenAI API Key
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {openAiKeySet ? "A key is currently stored." : "No key has been set."}
            </Typography>
          </CardContent>
          <CardActions>
            <Button variant="contained" onClick={() => setOpenKeyModal(true)}>
              {openAiKeySet ? "Update Key" : "Set Key"}
            </Button>
            {openAiKeySet && <Button onClick={handleRemoveKey}>Remove Key</Button>}
          </CardActions>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Connectors
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="LinkedIn" secondary="Configuration coming soon" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Indeed" secondary="Configuration coming soon" />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export or import your stored TalentForge data.
            </Typography>
          </CardContent>
          <CardActions>
            <Button onClick={handleExport} variant="contained">
              Export Data
            </Button>
            <Button component="label">
              Import Data
              <input type="file" accept="application/json" hidden onChange={handleImport} />
            </Button>
          </CardActions>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Demo Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Load sample resumes and job applications for exploration.
            </Typography>
          </CardContent>
          <CardActions>
            <Button variant="contained" onClick={handleLoadDemo}>
              Load Demo Data
            </Button>
            <Button onClick={handleClearDemo}>Clear Demo Data</Button>
          </CardActions>
        </Card>

        <OpenAIKeyModal open={openKeyModal} onClose={handleCloseModal} />
      </Stack>
    </ErrorBoundary>
  );
}

