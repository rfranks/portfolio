import { PaletteMode, createTheme } from "@mui/material";

// Create a theme for TalentForge with custom breakpoints
// and dynamic light/dark palette mode.
const talentforgeTheme = (mode: PaletteMode) =>
  createTheme({
    palette: { mode },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
  });

export default talentforgeTheme;
