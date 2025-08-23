import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function ResumeHero() {
  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Typography component="h1" variant="h3" gutterBottom>
        R. Franks
      </Typography>
      <Typography component="h2" variant="h5" color="text.secondary" gutterBottom>
        Software Engineer
      </Typography>
      <Typography sx={{ mb: 4 }}>
        Looking for my next opportunity
      </Typography>
      <Button variant="contained" color="primary">
        Contact Me
      </Button>
    </Box>
  );
}
