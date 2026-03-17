import MuiChip, { ChipProps } from "@mui/material/Chip";
import { styled } from "@mui/material/styles";

const Chip = styled(MuiChip)<ChipProps>(() => ({
  borderRadius: "var(--fabric-radius-capsule)",
  border: "1px solid var(--fabric-surface-border)",
  backgroundColor: "var(--fabric-surface-2)",
  backdropFilter: "blur(var(--fabric-blur-sm))",
}));

export default Chip;
