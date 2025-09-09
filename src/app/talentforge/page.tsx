"use client";

import * as React from "react";
import { PaletteMode } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AppAppBar from "@/components/talentforge/AppAppBar";
import Hero from "@/components/talentforge/Hero";
import Highlights from "@/components/talentforge/Highlights";
// import LogoCollection from "./components/LogoCollection";
// import Pricing from "./components/Pricing";
// import Features from "./components/Features";
// import Testimonials from "./components/Testimonials";
import FAQ from "@/components/talentforge/FAQ";
import Footer from "@/components/talentforge/Footer";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./page.css"; // Ensure global styles are applied
import { hasOpenAIKey, setOpenAIKey } from "@/utils/talentforge/utils";
import Image from "next/image";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function BookwormPage() {
  const [mode, setMode] = React.useState<PaletteMode>("light");
  const defaultTheme = createTheme({ palette: { mode } });
  const [apiKeyReady, setApiKeyReady] = React.useState(hasOpenAIKey());
  const { setDocumentTitle } = useDocumentTitle();

  React.useEffect(() => {
    setDocumentTitle("Bookworm");
  }, [setDocumentTitle]);

  const toggleColorMode = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const key = String(formData.get("apiKey"))?.trim();
    if (key) {
      setOpenAIKey(key);
      setApiKeyReady(true);
    }
  };

  if (!apiKeyReady) {
    return (
      <ThemeProvider theme={defaultTheme}>
        <CssBaseline />
        <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
          <Image
            src="/logo192.png"
            style={{ width: "192px", height: "auto" }}
            alt="bookworm logo"
            width={192}
            height={194}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to Bookworm
          </Typography>
          <Typography variant="body1" paragraph>
            Bookworm needs an OpenAI API key to talk with OpenAI. The key you
            type here goes straight from your browser to OpenAI and stays
            between you and OpenAI. Bookworm does not store your key anywhere
            and does not send it anywhere else. If you do not fully trust
            Bookworm, do not enter your key.
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="OpenAI API Key"
              name="apiKey"
              type="password"
              fullWidth
              required
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Continue
            </Button>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <AppAppBar mode={mode} toggleColorMode={toggleColorMode} />
      <Hero />
      <Box sx={{ bgcolor: "background.default" }}>
        {/* <LogoCollection /> */}
        {/* <Features />
        <Divider />
        <Testimonials />
        <Divider /> */}
        <Highlights />
        <Divider />
        {/* <Pricing />
        <Divider /> */}
        <FAQ />
        <Divider />
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
