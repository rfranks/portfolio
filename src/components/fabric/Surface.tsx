import * as React from "react";
import Paper, { PaperProps } from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

export interface SurfaceProps extends PaperProps {
  layer?: 1 | 2 | 3;
  interactive?: boolean;
  glow?: boolean;
}

const layerToVariable: Record<1 | 2 | 3, string> = {
  1: "var(--fabric-surface-1)",
  2: "var(--fabric-surface-2)",
  3: "var(--fabric-surface-3)",
};

const SurfaceRoot = styled(Paper, {
  shouldForwardProp: (prop) =>
    prop !== "layer" && prop !== "interactive" && prop !== "glow",
})<Pick<SurfaceProps, "layer" | "interactive" | "glow">>(
  ({ theme, layer = 1, interactive = false, glow = true }) => ({
    borderRadius: "var(--fabric-radius-lg)",
    border: "1px solid var(--fabric-surface-border)",
    backgroundColor: layerToVariable[layer],
    backgroundImage: glow
      ? "linear-gradient(180deg, var(--fabric-inner-glow), transparent 36%)"
      : undefined,
    boxShadow: "var(--fabric-shadow-soft)",
    backdropFilter: "blur(var(--fabric-blur-sm))",
    transition: theme.transitions.create(
      ["transform", "box-shadow", "background-color", "border-color"],
      { duration: theme.transitions.duration.shorter },
    ),
    ...(interactive && {
      cursor: "pointer",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "var(--fabric-shadow-tight)",
        borderColor: "var(--fabric-surface-border-strong)",
      },
      "@media (prefers-reduced-motion: reduce)": {
        "&:hover": {
          transform: "none",
        },
      },
    }),
  }),
);

export default function Surface({
  layer = 1,
  interactive = false,
  glow = true,
  elevation = 0,
  ...props
}: SurfaceProps) {
  return (
    <SurfaceRoot
      layer={layer}
      interactive={interactive}
      glow={glow}
      elevation={elevation}
      {...props}
    />
  );
}
