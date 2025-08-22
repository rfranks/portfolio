"use client";

import * as React from "react";
import { PaletteMode } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import AppAppBar from "@/components/bookworm/AppAppBar";
import Hero from "@/components/bookworm/Hero";
import Highlights from "@/components/bookworm/Highlights";
// import LogoCollection from "./components/LogoCollection";
// import Pricing from "./components/Pricing";
// import Features from "./components/Features";
// import Testimonials from "./components/Testimonials";
import FAQ from "@/components/bookworm/FAQ";
import Footer from "@/components/bookworm/Footer";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./page.module.css"; // Ensure global styles are applied

export default function BookwormPage() {
  const [mode, setMode] = React.useState<PaletteMode>("light");
  const defaultTheme = createTheme({ palette: { mode } });

  const toggleColorMode = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
