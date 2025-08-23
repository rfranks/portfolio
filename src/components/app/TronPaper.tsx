import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

const TronPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
}));

export default TronPaper;
