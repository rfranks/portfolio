import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4fb4ff",
    },
    secondary: {
      main: "#f97316",
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export const kenBurnsImageSx = {
  transformOrigin: "center center",
  willChange: "transform",
  animation: "pathforgerKenBurns 10s ease-in-out infinite alternate",
  "@keyframes pathforgerKenBurns": {
    "0%": {
      transform: "scale(1.02) translate3d(-0.8%, -0.6%, 0) rotate(-0.35deg)",
    },
    "50%": {
      transform: "scale(1.14) translate3d(-3.8%, -3.2%, 0) rotate(0deg)",
    },
    "100%": {
      transform: "scale(1.22) translate3d(3.9%, 3.4%, 0) rotate(0.45deg)",
    },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
    transform: "none",
  },
} as const;
