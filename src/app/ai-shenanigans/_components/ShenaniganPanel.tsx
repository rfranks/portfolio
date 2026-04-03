import { alpha, styled } from "@mui/material/styles";
import Panel from "@/components/fabric/Panel";

const ShenaniganPanel = styled(Panel)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  borderRadius: "var(--fabric-radius-xl)",
  ...(theme.palette.mode === "light" && {
    backgroundColor: alpha(theme.palette.background.paper, 0.62),
    backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.82)}, ${alpha(theme.palette.primary.light, 0.08)} 32%, transparent 100%)`,
    borderColor: alpha(theme.palette.primary.main, 0.12),
    boxShadow: "0 18px 40px rgba(35, 58, 99, 0.1)",
  }),
  ...(theme.palette.mode === "dark" && {
    backgroundColor: alpha(theme.palette.background.paper, 0.38),
    backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.08)}, transparent 30%)`,
    borderColor: alpha(theme.palette.common.white, 0.1),
    boxShadow: "0 18px 44px rgba(2, 8, 18, 0.28)",
  }),
}));

export default ShenaniganPanel;
