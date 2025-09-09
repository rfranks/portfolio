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
import { ThemeProvider, createTheme } from "@mui/material/styles";
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
  const [mode, setMode] = useState<PaletteMode>("light");
  const defaultTheme = createTheme({ palette: { mode } });
  const toggleColorMode = () =>
    setMode((prev) => (prev === "dark" ? "light" : "dark"));

  const [settings, setSettings] = useState<TalentForgeSettings>({
    roles: "",
    industries: "",
    locations: "",
    salaryMin: "",
    salaryMax: "",
  });

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
        } catch {
          // ignore malformed data
        }
      }
    }
  }, []);

  const handleChange = (field: keyof TalentForgeSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({ ...settings, [field]: event.target.value });
    };

  const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "talentforge-settings",
          JSON.stringify(settings)
        );
      }
      // Placeholder for future backend persistence
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
            <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
              Save
            </Button>
          </Stack>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

