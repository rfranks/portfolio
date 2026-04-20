import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

const AIShenaniganPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: 0,
  borderRadius: 0,
  backgroundColor: "transparent",
  backgroundImage: "none",
  boxShadow: "none",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  maxWidth: "100%",
  display: "flex",
  flexDirection: "column",
  "& > *": {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    maxWidth: "100%",
  },
}));

export default AIShenaniganPanel;
