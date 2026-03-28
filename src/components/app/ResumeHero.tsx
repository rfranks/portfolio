import * as React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import FadeInSection from "@/components/app/FadeInSection";
import { summary } from "@/personal/data/resumeData";
import { withBasePath } from "@/utils/basePath";
import IconButton from "@mui/material/IconButton";
import { AlternateEmail, GitHub, LinkedIn } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import Hero from "@/components/fabric/Hero";

export default function ResumeHero() {
  return (
    <FadeInSection>
      <Hero className="mb-6 overflow-hidden text-center transition-transform duration-300 md:mb-8 hover:-translate-y-0.5" sx={{ py: 8 }}>
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4">
          <Typography
            component="p"
            variant="overline"
            color="primary"
            className="rounded-full border border-current/20 px-4 py-1 tracking-[0.24em]"
          >
            {summary.heroOverline}
          </Typography>
        <Typography component="h1" variant="h3" gutterBottom className="max-w-3xl text-balance">
          {summary.name}
        </Typography>
        <Typography
          component="h2"
          variant="h5"
          gutterBottom
          color="text.secondary"
          className="max-w-3xl text-balance"
        >
          {summary.title}
        </Typography>
        <Typography color="text.secondary" gutterBottom className="rounded-full bg-white/10 px-4 py-1 dark:bg-white/5">
          {summary.location}
        </Typography>
        <Typography className="max-w-3xl text-base leading-7 md:text-lg" sx={{ mb: 4 }}>
          {summary.gutter[0]}
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          useFlexGap
          flexWrap="wrap"
          className="w-full"
        >
          <IconButton
            color="primary"
            href={`mailto:${summary.contact.email}`}
            className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            <AlternateEmail />
          </IconButton>
          <IconButton
            color="primary"
            href={summary.contact.linkedin}
            target="_blank"
            rel="noopener"
            className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
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
                className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
              >
                <GitHub />
              </IconButton>
            </Tooltip>
          ))}
          <Button
            variant="text"
            href={withBasePath("/resume.pdf")}
            download
            className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            Resume
          </Button>
        </Stack>
        </div>
      </Hero>
    </FadeInSection>
  );
}
