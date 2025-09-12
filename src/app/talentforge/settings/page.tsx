"use client";

import { useState, useEffect, FormEvent } from "react";
import { PaletteMode } from "@mui/material";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  responseTemplates as defaultTemplates,
  ResponseTemplate,
} from "@/consts/talentforge/responseTemplates";
import AppAppBar from "@/components/talentforge/AppAppBar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface TalentForgeSettings {
  roles: string;
  industries: string;
  locations: string;
  salaryMin: string;
  salaryMax: string;
}

export default function TalentForgeSettingsPage() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem("talentforge-mode") as PaletteMode) || "light";
    }
    return "light";
  });
  const defaultTheme = createTheme({ palette: { mode } });
  const toggleColorMode = () =>
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("talentforge-mode", next);
      }
      return next;
    });

  const [settings, setSettings] = useState<TalentForgeSettings>({
    roles: "",
    industries: "",
    locations: "",
    salaryMin: "",
    salaryMax: "",
  });
  const [quickReplies, setQuickReplies] = useState<ResponseTemplate[]>([]);

  const { setDocumentTitle } = useDocumentTitle();

  useEffect(() => {
    setDocumentTitle("TalentForge Settings");
  }, [setDocumentTitle]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("talentforge-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings((prev) => ({ ...prev, ...parsed }));
          if (Array.isArray(parsed.quickReplies)) {
            setQuickReplies(parsed.quickReplies);
          } else {
            setQuickReplies(defaultTemplates);
          }
        } catch {
          setQuickReplies(defaultTemplates);
        }
      } else {
        setQuickReplies(defaultTemplates);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "talentforge-settings",
        JSON.stringify({ ...settings, quickReplies })
      );
    }
  }, [settings, quickReplies]);

  const handleChange = (field: keyof TalentForgeSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({ ...settings, [field]: event.target.value });
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Placeholder for future backend persistence
  };

  const handleQuickReplyChange = (
    id: string,
    field: keyof Omit<ResponseTemplate, "id">
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuickReplies((prev) =>
      prev.map((qr) =>
        qr.id === id ? { ...qr, [field]: event.target.value } : qr
      )
    );
  };

  const handleAddQuickReply = () => {
    setQuickReplies((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", template: "" },
    ]);
  };

  const handleDeleteQuickReply = (id: string) => {
    setQuickReplies((prev) => prev.filter((qr) => qr.id !== id));
  };

  const handleReset = () => {
    const defaultSettings: TalentForgeSettings = {
      roles: "",
      industries: "",
      locations: "",
      salaryMin: "",
      salaryMax: "",
    };
    setSettings(defaultSettings);
    setQuickReplies(defaultTemplates);
    setMode("light");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("talentforge-settings");
      window.localStorage.setItem("talentforge-mode", "light");
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <AppAppBar mode={mode} toggleColorMode={toggleColorMode} />
      <Container component="main" maxWidth="sm" sx={{ mt: 10 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Desired Roles"
              value={settings.roles}
              onChange={handleChange("roles")}
              fullWidth
            />
            <TextField
              label="Industries"
              value={settings.industries}
              onChange={handleChange("industries")}
              fullWidth
            />
            <TextField
              label="Locations"
              value={settings.locations}
              onChange={handleChange("locations")}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Salary Min"
                type="number"
                value={settings.salaryMin}
                onChange={handleChange("salaryMin")}
                fullWidth
              />
              <TextField
                label="Salary Max"
                type="number"
                value={settings.salaryMax}
                onChange={handleChange("salaryMax")}
                fullWidth
              />
            </Stack>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Quick Replies
              </Typography>
              <Stack spacing={1}>
                {quickReplies.map((qr) => (
                  <Stack
                    key={qr.id}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                  >
                    <TextField
                      label="Label"
                      value={qr.label}
                      onChange={handleQuickReplyChange(qr.id, "label")}
                      sx={{ width: 200 }}
                    />
                    <TextField
                      label="Template"
                      value={qr.template}
                      onChange={handleQuickReplyChange(qr.id, "template")}
                      multiline
                      minRows={2}
                      fullWidth
                    />
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleDeleteQuickReply(qr.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  variant="outlined"
                  onClick={handleAddQuickReply}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Add Quick Reply
                </Button>
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained">
                Save
              </Button>
              <Button variant="outlined" onClick={handleReset}>
                Reset to defaults
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

