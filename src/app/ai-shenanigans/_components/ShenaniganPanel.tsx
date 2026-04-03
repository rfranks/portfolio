import { styled } from "@mui/material/styles";
import Panel from "@/components/fabric/Panel";

const ShenaniganPanel = styled(Panel)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  borderRadius: "var(--fabric-radius-xl)",
}));

export default ShenaniganPanel;
