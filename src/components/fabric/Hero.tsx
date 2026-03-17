import Box, { BoxProps } from "@mui/material/Box";
import { styled } from "@mui/material/styles";

const Hero = styled(Box)<BoxProps>(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: "var(--fabric-radius-hero)",
  border: "1px solid var(--fabric-surface-border)",
  background: [
    "radial-gradient(110% 120% at 8% -12%, var(--fabric-bg-radial-primary), transparent 65%)",
    "radial-gradient(90% 110% at 100% 0%, var(--fabric-bg-radial-secondary), transparent 70%)",
    "linear-gradient(160deg, var(--fabric-surface-2), var(--fabric-surface-1))",
  ].join(","),
  boxShadow: "var(--fabric-shadow-soft)",
  backdropFilter: "blur(var(--fabric-blur-md))",
  padding: theme.spacing(4),
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background:
      "linear-gradient(180deg, var(--fabric-inner-glow), transparent 36%)",
    pointerEvents: "none",
  },
}));

export default Hero;
