import * as React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ImageLightbox from "@/components/shared/ImageLightbox";
import MarkdownContent from "@/components/shared/MarkdownContent";
import { summary } from "@/consts/resumeData";
import { withBasePath } from "@/utils/basePath";
import IconButton from "@mui/material/IconButton";
import { AlternateEmail, GitHub, LinkedIn } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import Hero from "@/components/fabric/Hero";

export default function ResumeOverview() {
  return (
    
      <Hero
        className="mb-6 overflow-hidden transition-transform duration-300 md:mb-8 hover:-translate-y-0.5"
        sx={{ py: 8 }}
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Typography
              component="p"
              variant="overline"
              color="primary"
              className="rounded-full border border-current/20 px-4 py-1 tracking-[0.24em]"
            >
              {summary.title}
            </Typography>
            <Typography
              component="h1"
              variant="h3"
              gutterBottom
              className="max-w-3xl text-balance"
            >
              {summary.name}
            </Typography>
            <Typography
              color="text.secondary"
              gutterBottom
              className="rounded-full bg-white/10 px-4 py-1 dark:bg-white/5"
            >
              {summary.location}
            </Typography>
          </div>
          <Stack
            spacing={2.5}
            direction={{ xs: "column", md: "row" }}
            sx={{
              mt: 2,
              alignItems: { xs: "stretch", md: "flex-start" },
              justifyContent: { xs: "flex-start", md: "space-between" },
            }}
          >
            <Stack spacing={2} sx={{ minWidth: 0, flex: "1 1 auto" }}>
              {summary.gutter.map((paragraph, index) => (
                <MarkdownContent
                  key={paragraph}
                  content={paragraph}
                  variant="body1"
                  color={index === 0 ? "text.primary" : "text.secondary"}
                  className="leading-7"
                />
              ))}
            </Stack>
            <Box
              className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-2 shadow-lg md:mx-0"
              sx={{
                width: { xs: "100%", md: 220 },
                minWidth: { xs: 0, md: 220 },
                flexShrink: 0,
              }}
            >
              <ImageLightbox
                src={withBasePath(summary.headshotImage)}
                alt={`${summary.name} headshot`}
                title={summary.name}
                caption={summary.title}
                triggerSx={{ width: "100%" }}
              >
                <Image
                  src={withBasePath(summary.headshotImage)}
                  alt={`${summary.name} headshot`}
                  width={480}
                  height={640}
                  className="h-auto w-full rounded-[22px] object-cover"
                />
              </ImageLightbox>
            </Box>
          </Stack>
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
              href={withBasePath(summary.resumeUrl)}
              download
              className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              Resume
            </Button>
          </Stack>
        </div>
      </Hero>
    
  );
}
