import { PaletteMode } from "@mui/material";
import getFabricTheme from "@/themes/fabricTheme";

const talentforgeTheme = (mode: PaletteMode) =>
  getFabricTheme(mode, {
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
