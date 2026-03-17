import * as React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import FadeInSection from "@/components/app/FadeInSection";
import { summary } from "@/consts/resumeData";
import { withBasePath } from "@/utils/basePath";
import IconButton from "@mui/material/IconButton";
import { AlternateEmail, GitHub, LinkedIn } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import Hero from "@/components/fabric/Hero";

export default function ResumeHero() {
  return (
    <FadeInSection>
      <Hero sx={{ textAlign: "center", py: 8, mb: 4 }}>
        <Typography component="h1" variant="h3" gutterBottom>
          {summary.name}
        </Typography>
        <Typography
          component="h2"
          variant="h5"
          gutterBottom
          color="text.secondary"
        >
          {summary.title}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {summary.location}
        </Typography>
        <Typography sx={{ mb: 4 }}>{summary.blurb}</Typography>
        <Stack direction="row" spacing={2} justifyContent="center" useFlexGap flexWrap="wrap">
          <IconButton color="primary" href={`mailto:${summary.contact.email}`}>
            <AlternateEmail />
          </IconButton>
          <IconButton
            color="primary"
            href={summary.contact.linkedin}
            target="_blank"
            rel="noopener"
          >
            <LinkedIn />
          </IconButton>
          {summary.contact.github.map((url) => (
            <Tooltip
              title={url.substring(url.lastIndexOf("/") + 1)}
              key={url}
              arrow
            >
              <IconButton
                key={url}
                color="default"
                href={url}
                target="_blank"
                rel="noopener"
              >
                <GitHub />
              </IconButton>
            </Tooltip>
          ))}
          <Button variant="text" href={withBasePath("/resume.pdf")} download>
            Resume
          </Button>
        </Stack>
      </Hero>
    </FadeInSection>
  );
}
