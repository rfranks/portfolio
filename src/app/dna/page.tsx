"use client";

import * as React from "react";
import Dashboard from "@/components/app/Dashboard";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./page.css"; // Ensure global styles are applied
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const defaultTheme = createTheme();

export default function DnaPage() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Dashboard />
    </ThemeProvider>
  );
}
