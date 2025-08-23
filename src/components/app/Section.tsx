import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

const Section = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  background: "rgba(0, 0, 0, 0.6)",
  border: `1px solid ${theme.palette.primary.main}`,
  boxShadow: `0 0 15px ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius * 2,
}));

export default Section;
