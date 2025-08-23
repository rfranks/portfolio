import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { summary } from "@/consts/resumeData";

export default function ResumeHero() {
  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Typography component="h1" variant="h3" gutterBottom>
        {summary.name}
      </Typography>
      <Typography component="h2" variant="h5" color="text.secondary" gutterBottom>
        {summary.title}
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        {summary.location}
      </Typography>
      <Typography sx={{ mb: 4 }}>{summary.blurb}</Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          href={`mailto:${summary.contact.email}`}
        >
          Email
        </Button>
        <Button
          variant="outlined"
          href={summary.contact.linkedin}
          target="_blank"
          rel="noopener"
        >
          LinkedIn
        </Button>
      </Stack>
    </Box>
  );
}
