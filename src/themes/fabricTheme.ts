import { PaletteMode } from "@mui/material";
import { alpha, createTheme } from "@mui/material/styles";
import type { Theme, ThemeOptions } from "@mui/material/styles";

export interface FabricTokens {
  background: {
    base: string;
    layer: string;
    radialPrimary: string;
    radialSecondary: string;
    texture: string;
  };
  surface: {
    level1: string;
    level2: string;
    level3: string;
    border: string;
    borderStrong: string;
    shadowSoft: string;
    shadowTight: string;
    innerGlow: string;
  };
  blur: {
    sm: string;
    md: string;
    lg: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    hero: number;
    capsule: number;
  };
  spacing: {
    compact: number;
    regular: number;
    roomy: number;
  };
}

export interface FabricThemeConfig {
  breakpoints?: ThemeOptions["breakpoints"];
}

declare module "@mui/material/styles" {
  interface Theme {
    fabric: FabricTokens;
  }

  interface ThemeOptions {
    fabric?: FabricTokens;
  }
}

const getFabricTokens = (mode: PaletteMode): FabricTokens => {
  if (mode === "dark") {
    return {
      background: {
        base: "#08101B",
        layer: "#0D1A2A",
        radialPrimary: "rgba(95, 150, 255, 0.18)",
        radialSecondary: "rgba(78, 224, 202, 0.14)",
        texture: "rgba(198, 218, 255, 0.05)",
      },
      surface: {
        level1: "rgba(20, 34, 52, 0.74)",
        level2: "rgba(27, 42, 63, 0.8)",
        level3: "rgba(34, 52, 77, 0.88)",
        border: "rgba(176, 204, 255, 0.2)",
        borderStrong: "rgba(189, 217, 255, 0.34)",
        shadowSoft: "0 14px 48px rgba(3, 7, 15, 0.42)",
        shadowTight: "0 8px 24px rgba(3, 9, 18, 0.34)",
        innerGlow: "rgba(221, 235, 255, 0.2)",
      },
      blur: {
        sm: "6px",
        md: "12px",
        lg: "18px",
      },
      radius: {
        sm: 12,
        md: 18,
        lg: 24,
        xl: 30,
        hero: 40,
        capsule: 999,
      },
      spacing: {
        compact: 8,
        regular: 16,
        roomy: 24,
      },
    };
  }

  return {
    background: {
      base: "#EEF3FF",
      layer: "#F5F8FF",
      radialPrimary: "rgba(99, 139, 255, 0.2)",
      radialSecondary: "rgba(94, 206, 188, 0.16)",
      texture: "rgba(37, 64, 109, 0.06)",
    },
    surface: {
      level1: "rgba(255, 255, 255, 0.66)",
      level2: "rgba(255, 255, 255, 0.8)",
      level3: "rgba(255, 255, 255, 0.9)",
      border: "rgba(60, 88, 134, 0.17)",
      borderStrong: "rgba(55, 86, 136, 0.28)",
      shadowSoft: "0 14px 40px rgba(35, 58, 99, 0.14)",
      shadowTight: "0 8px 22px rgba(33, 55, 95, 0.12)",
      innerGlow: "rgba(255, 255, 255, 0.82)",
    },
    blur: {
      sm: "5px",
      md: "10px",
      lg: "16px",
    },
    radius: {
      sm: 12,
      md: 18,
      lg: 24,
      xl: 30,
      hero: 40,
      capsule: 999,
    },
    spacing: {
      compact: 8,
      regular: 16,
      roomy: 24,
    },
  };
};

export const fabricNestedSurfaceSx = (theme: Theme) => ({
  borderRadius: `${theme.fabric.radius.md}px`,
  border: "1px solid var(--fabric-surface-border)",
  backgroundColor: "var(--fabric-surface-2)",
  boxShadow: `inset 0 1px 0 var(--fabric-inner-glow), ${theme.fabric.surface.shadowTight}`,
  backdropFilter: "blur(var(--fabric-blur-sm))",
});

const createComponentOverrides = (mode: PaletteMode): ThemeOptions["components"] => {
  const tokens = getFabricTokens(mode);

  return {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        "--fabric-bg-base": tokens.background.base,
        "--fabric-bg-layer": tokens.background.layer,
        "--fabric-bg-radial-primary": tokens.background.radialPrimary,
        "--fabric-bg-radial-secondary": tokens.background.radialSecondary,
        "--fabric-surface-1": tokens.surface.level1,
        "--fabric-surface-2": tokens.surface.level2,
        "--fabric-surface-3": tokens.surface.level3,
        "--fabric-surface-border": tokens.surface.border,
        "--fabric-surface-border-strong": tokens.surface.borderStrong,
        "--fabric-shadow-soft": tokens.surface.shadowSoft,
        "--fabric-shadow-tight": tokens.surface.shadowTight,
        "--fabric-inner-glow": tokens.surface.innerGlow,
        "--fabric-blur-sm": tokens.blur.sm,
        "--fabric-blur-md": tokens.blur.md,
        "--fabric-blur-lg": tokens.blur.lg,
        "--fabric-radius-sm": "12px",
        "--fabric-radius-md": "18px",
        "--fabric-radius-lg": "24px",
        "--fabric-radius-xl": "30px",
        "--fabric-radius-hero": "40px",
        "--fabric-radius-capsule": "999px",
        backgroundColor: "var(--fabric-bg-base)",
        backgroundImage: [
          "radial-gradient(55rem 32rem at 4% -8%, var(--fabric-bg-radial-primary), transparent 66%)",
          "radial-gradient(46rem 28rem at 94% -12%, var(--fabric-bg-radial-secondary), transparent 70%)",
          `linear-gradient(120deg, transparent 0, transparent 34%, ${mode === "dark" ? "rgba(198, 218, 255, 0.05)" : "rgba(37, 64, 109, 0.06)"} 35%, transparent 36%, transparent 64%, ${mode === "dark" ? "rgba(198, 218, 255, 0.05)" : "rgba(37, 64, 109, 0.06)"} 65%, transparent 66%, transparent 100%)`,
          "linear-gradient(180deg, var(--fabric-bg-layer), var(--fabric-bg-base))",
        ].join(","),
        backgroundAttachment: "fixed",
      },
      "@media (prefers-reduced-motion: reduce)": {
        "*": {
          animationDuration: "0.01ms !important",
          animationIterationCount: "1 !important",
          transitionDuration: "0.01ms !important",
          scrollBehavior: "auto !important",
        },
      },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: ({ ownerState }) => ({
        position: "relative",
        borderRadius: "var(--fabric-radius-lg)",
        border: "1px solid var(--fabric-surface-border)",
        backgroundColor: "var(--fabric-surface-1)",
        backgroundImage:
          "linear-gradient(180deg, var(--fabric-inner-glow), transparent 34%)",
        backdropFilter: "blur(var(--fabric-blur-sm))",
        boxShadow: "var(--fabric-shadow-soft)",
        ...(ownerState.variant === "outlined" && {
          borderColor: "var(--fabric-surface-border-strong)",
          backgroundColor: "var(--fabric-surface-2)",
        }),
      }),
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: "var(--fabric-radius-xl)",
        border: "1px solid var(--fabric-surface-border)",
        backgroundColor: "var(--fabric-surface-1)",
        boxShadow: "var(--fabric-shadow-soft)",
        overflow: "clip",
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: {
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(var(--fabric-blur-md))",
          backgroundColor: mode === "dark" ? "rgba(3, 9, 18, 0.48)" : "rgba(12, 18, 34, 0.32)",
        },
      },
      paper: {
        borderRadius: "var(--fabric-radius-xl)",
        border: "1px solid var(--fabric-surface-border-strong)",
        backgroundColor: "var(--fabric-surface-2)",
        backgroundImage:
          "linear-gradient(180deg, var(--fabric-inner-glow), transparent 30%)",
        backdropFilter: "blur(var(--fabric-blur-lg))",
        boxShadow: "var(--fabric-shadow-soft)",
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        border: "1px solid var(--fabric-surface-border)",
        borderRightColor: "var(--fabric-surface-border-strong)",
        backgroundColor: "var(--fabric-surface-2)",
        backgroundImage:
          "linear-gradient(180deg, var(--fabric-inner-glow), transparent 22%)",
        backdropFilter: "blur(var(--fabric-blur-md))",
        boxShadow: "var(--fabric-shadow-tight)",
      },
    },
  },
  MuiAppBar: {
    defaultProps: {
      elevation: 0,
      color: "transparent",
    },
    styleOverrides: {
      root: {
        borderRadius: "var(--fabric-radius-xl)",
        border: "1px solid var(--fabric-surface-border)",
        backgroundColor: "var(--fabric-surface-2)",
        backgroundImage:
          "linear-gradient(180deg, var(--fabric-inner-glow), transparent 44%)",
        backdropFilter: "blur(var(--fabric-blur-md))",
        boxShadow: "var(--fabric-shadow-tight)",
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: 68,
      },
    },
  },
  MuiButtonBase: {
    styleOverrides: {
      root: ({ theme }) => ({
        transition: theme.transitions.create(["background-color", "box-shadow", "transform", "border-color"], {
          duration: theme.transitions.duration.shorter,
        }),
        "&:focus-visible": {
          outline: `3px solid ${alpha(theme.palette.primary.main, 0.36)}`,
          outlineOffset: 2,
        },
      }),
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: ({ ownerState, theme }) => ({
        borderRadius: "var(--fabric-radius-capsule)",
        textTransform: "none",
        fontWeight: 600,
        letterSpacing: 0.1,
        paddingInline: theme.spacing(2),
        ...(ownerState.size === "small" && {
          minHeight: 32,
        }),
        ...(ownerState.size !== "small" && {
          minHeight: 40,
        }),
        ...(ownerState.variant === "contained" && {
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.95)}, ${theme.palette.primary.main})`,
          border: `1px solid ${alpha(theme.palette.primary.dark, 0.4)}`,
          boxShadow: `inset 0 1px 0 ${alpha("#fff", 0.38)}, var(--fabric-shadow-tight)`,
          "&:hover": {
            transform: "translateY(-1px)",
            backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 1)}, ${alpha(theme.palette.primary.main, 0.94)})`,
            boxShadow: `inset 0 1px 0 ${alpha("#fff", 0.42)}, 0 10px 20px ${alpha(theme.palette.primary.dark, 0.24)}`,
          },
        }),
        ...(ownerState.variant === "outlined" && {
          borderColor: "var(--fabric-surface-border-strong)",
          backgroundColor: "var(--fabric-surface-2)",
          "&:hover": {
            borderColor: "var(--fabric-surface-border-strong)",
            backgroundColor: "var(--fabric-surface-3)",
            transform: "translateY(-1px)",
          },
        }),
        ...(ownerState.variant === "text" && {
          color: theme.palette.primary.main,
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
        }),
        "@media (prefers-reduced-motion: reduce)": {
          "&:hover": {
            transform: "none",
          },
        },
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: "var(--fabric-radius-capsule)",
        border: "1px solid var(--fabric-surface-border)",
        backgroundColor: "var(--fabric-surface-2)",
        boxShadow: `inset 0 1px 0 var(--fabric-inner-glow), ${theme.fabric.surface.shadowTight}`,
        backdropFilter: "blur(var(--fabric-blur-sm))",
        fontWeight: 500,
      }),
      filled: ({ theme }) => ({
        backgroundColor: alpha(theme.palette.primary.main, mode === "dark" ? 0.34 : 0.2),
        borderColor: alpha(theme.palette.primary.main, 0.32),
      }),
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: "outlined",
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        borderRadius: "var(--fabric-radius-md)",
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: "var(--fabric-radius-md)",
        backgroundColor: "var(--fabric-surface-2)",
        boxShadow: `inset 0 1px 0 var(--fabric-inner-glow), 0 1px 0 ${alpha(theme.palette.common.white, mode === "dark" ? 0.04 : 0.46)}`,
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--fabric-surface-border)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--fabric-surface-border-strong)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: alpha(theme.palette.primary.main, 0.75),
        },
        "&.Mui-focused": {
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 var(--fabric-inner-glow)`,
        },
      }),
      input: ({ theme }) => ({
        paddingBlock: theme.spacing(1.25),
      }),
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        borderRadius: "var(--fabric-radius-capsule)",
        border: "1px solid var(--fabric-surface-border)",
        backgroundColor: "var(--fabric-surface-2)",
        minHeight: 40,
        padding: 4,
      },
      indicator: ({ theme }) => ({
        borderRadius: "var(--fabric-radius-capsule)",
        height: "calc(100% - 8px)",
        margin: 4,
        backgroundColor: alpha(theme.palette.primary.main, mode === "dark" ? 0.34 : 0.2),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.36)}`,
      }),
    },
  },
  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: "none",
        minHeight: 36,
        borderRadius: "var(--fabric-radius-capsule)",
        zIndex: 1,
        fontWeight: 600,
        color: theme.palette.text.secondary,
        "&.Mui-selected": {
          color: theme.palette.text.primary,
        },
      }),
    },
  },
  MuiList: {
    styleOverrides: {
      root: {
        paddingTop: 4,
        paddingBottom: 4,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: "var(--fabric-radius-md)",
        border: "1px solid transparent",
        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, mode === "dark" ? 0.16 : 0.1),
          borderColor: "var(--fabric-surface-border)",
        },
        "&.Mui-selected": {
          backgroundColor: alpha(theme.palette.primary.main, mode === "dark" ? 0.22 : 0.14),
          borderColor: "var(--fabric-surface-border-strong)",
        },
        "&.Mui-selected:hover": {
          backgroundColor: alpha(theme.palette.primary.main, mode === "dark" ? 0.26 : 0.18),
        },
      }),
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: "var(--fabric-radius-lg)",
        border: "1px solid var(--fabric-surface-border)",
        backgroundColor: "var(--fabric-surface-2)",
        backdropFilter: "blur(var(--fabric-blur-md))",
        boxShadow: "var(--fabric-shadow-tight)",
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        borderRadius: "var(--fabric-radius-lg)",
        border: "1px solid var(--fabric-surface-border)",
        backgroundColor: "var(--fabric-surface-2)",
        backdropFilter: "blur(var(--fabric-blur-md))",
      },
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        borderRadius: "var(--fabric-radius-lg)",
        border: "1px solid var(--fabric-surface-border)",
        backgroundColor: "var(--fabric-surface-2)",
        backdropFilter: "blur(var(--fabric-blur-sm))",
      },
    },
  },
};
};

export default function getFabricTheme(
  mode: PaletteMode,
  config: FabricThemeConfig = {},
) {
  const fabric = getFabricTokens(mode);

  return createTheme({
    breakpoints: config.breakpoints,
    palette: {
      mode,
      primary: {
        light: mode === "dark" ? "#85ACFF" : "#5D87E8",
        main: mode === "dark" ? "#7DA6FF" : "#3D70DD",
        dark: mode === "dark" ? "#4F75C8" : "#2B56B2",
        contrastText: mode === "dark" ? "#061326" : "#F8FBFF",
      },
      secondary: {
        light: mode === "dark" ? "#8CD9CB" : "#6DBDB0",
        main: mode === "dark" ? "#5FC8B7" : "#4CA596",
        dark: mode === "dark" ? "#3A8F81" : "#36796E",
      },
      background: {
        default: fabric.background.base,
        paper: fabric.background.layer,
      },
      divider: fabric.surface.border,
      text: {
        primary: mode === "dark" ? "#EAF1FF" : "#14274A",
        secondary: mode === "dark" ? "#B6C6E2" : "#4B6289",
      },
      action: {
        selected: alpha(mode === "dark" ? "#8CB3FF" : "#4C79DE", mode === "dark" ? 0.2 : 0.12),
      },
    },
    fabric,
    shape: {
      borderRadius: fabric.radius.md,
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: -0.6,
      },
      h2: {
        fontWeight: 700,
        letterSpacing: -0.4,
      },
      h3: {
        fontWeight: 650,
      },
      h4: {
        fontWeight: 650,
      },
      h5: {
        fontWeight: 620,
      },
      h6: {
        fontWeight: 620,
      },
      button: {
        fontWeight: 600,
      },
    },
    components: createComponentOverrides(mode),
  });
}
