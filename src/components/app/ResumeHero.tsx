import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { summary } from "@/consts/resumeData";

export default function ResumeHero() {
    return (
      <Box
        sx={(theme) => ({
          textAlign: "center",
          py: 8,
          mb: 4,
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: theme.shape.borderRadius * 2,
          boxShadow: `0 0 20px ${theme.palette.primary.main}`,
          background: "rgba(0,0,0,0.6)",
        })}
      >
        <Typography component="h1" variant="h3" gutterBottom color="primary">
          {summary.name}
        </Typography>
        <Typography component="h2" variant="h5" color="secondary" gutterBottom>
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
            sx={{ boxShadow: (theme) => `0 0 10px ${theme.palette.primary.main}` }}
          >
            Email
          </Button>
          <Button
            variant="outlined"
            href={summary.contact.linkedin}
            target="_blank"
            rel="noopener"
            sx={{ borderColor: "primary.main" }}
          >
            LinkedIn
          </Button>
        </Stack>
      </Box>
    );
  }
