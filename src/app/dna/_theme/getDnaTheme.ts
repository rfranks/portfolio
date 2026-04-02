import { PaletteMode } from "@mui/material";
import { alpha, createTheme } from "@mui/material/styles";

export default function getDnaTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  const primary = {
    light: isDark ? "#60a5fa" : "#1e88e5",
    main: isDark ? "#3b82f6" : "#1565c0",
    dark: isDark ? "#1d4ed8" : "#0d47a1",
    contrastText: "#f8fbff",
  };

  const secondary = {
    light: isDark ? "#5eead4" : "#4db6ac",
    main: isDark ? "#2dd4bf" : "#26a69a",
    dark: isDark ? "#0f766e" : "#00796b",
  };

  const background = {
    default: isDark ? "#0b1220" : "#edf4ff",
    paper: isDark ? "#111827" : "#ffffff",
  };

  const text = {
    primary: isDark ? "#e5eefc" : "#0f172a",
    secondary: isDark ? "#9fb2d1" : "#475569",
  };

  const theme = createTheme({
    palette: {
      mode,
      primary,
      secondary,
      background,
      text,
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily:
        '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  return createTheme(theme, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            "--dna-surface-1": isDark
              ? alpha("#0f172a", 0.88)
              : alpha("#ffffff", 0.88),
            "--dna-surface-2": isDark
              ? alpha("#1f2937", 0.86)
              : alpha("#ffffff", 0.96),
            "--dna-surface-3": isDark
              ? alpha("#334155", 0.92)
              : "#ffffff",
            "--dna-surface-border": alpha(
              theme.palette.divider,
              isDark ? 0.82 : 0.72
            ),
            "--dna-surface-border-strong": alpha(
              theme.palette.primary.main,
              isDark ? 0.42 : 0.22
            ),
            "--dna-shadow-soft": isDark
              ? "0 16px 40px rgba(2, 8, 23, 0.42)"
              : "0 12px 32px rgba(21, 101, 192, 0.12)",
            "--dna-shadow-tight": isDark
              ? "0 8px 24px rgba(2, 8, 23, 0.34)"
              : "0 8px 20px rgba(21, 101, 192, 0.1)",
            "--dna-inner-glow": alpha(
              theme.palette.common.white,
              isDark ? 0.06 : 0.78
            ),
            backgroundColor: background.default,
          },
        },
      },
    },
  });
}
