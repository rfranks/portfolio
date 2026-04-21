import * as React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { ImageLightbox } from "@/components/shared";
import { MarkdownContent } from "@/components/shared";
import { summary, recognition as recognitionData } from "@/consts/resumeData";
import { withBasePath } from "@/utils/basePath";
import IconButton from "@mui/material/IconButton";
import { AlternateEmail, GitHub, LinkedIn } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import Hero from "@/components/fabric/Hero";

export default function ResumeOverview() {
  const githubAchievements = React.useMemo(
    () => recognitionData.githubAchievements || [],
    [],
  );

  return (
    <Hero
      className="mb-6 overflow-hidden transition-transform duration-300 md:mb-8 hover:-translate-y-0.5"
      sx={{
        py: { xs: 2.5, md: 3.5 },
        px: { xs: 2, md: 3.5 },
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        className="mx-auto"
        sx={{
          width: "100%",
          maxWidth: "1200px",
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: { xs: 1.5, md: 2 },
        }}
      >
        <Box className="flex flex-col items-center gap-2.5 text-center">
          <Typography
            component="p"
            variant="overline"
            color="primary"
            className="rounded-full border border-current/20 px-4 py-1 tracking-[0.24em]"
          >
            {summary.title}
          </Typography>
          <Typography component="h1" variant="h4" className="max-w-3xl text-balance">
            {summary.name}
          </Typography>
          <Typography
            color="text.secondary"
            className="rounded-full bg-white/10 px-4 py-1 dark:bg-white/5"
          >
            {summary.location}
          </Typography>
        </Box>

        <Stack
          spacing={2}
          direction={{ xs: "column", md: "row" }}
          sx={{
            minHeight: 0,
            flex: "1 1 auto",
            alignItems: { xs: "stretch", md: "flex-start" },
          }}
        >
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

          <Stack
            spacing={1.5}
            sx={{
              minWidth: 0,
              minHeight: 0,
              flex: "1 1 auto",
              overflowY: "auto",
              pr: { xs: 0, md: 0.5 },
            }}
          >
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
        </Stack>

        {githubAchievements.length > 0 ? (
          <Box sx={{ flexShrink: 0 }}>
            <Stack
              direction="row"
              spacing={1.2}
              sx={{
                overflowX: "auto",
                overflowY: "hidden",
                pb: 0.5,
                px: 0.25,
                justifyContent: { xs: "flex-start", md: "center" },
              }}
            >
              {githubAchievements.map((achievement) => (
                <Box
                  key={achievement.slug}
                  component="a"
                  href={achievement.achievementUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    px: 1,
                    py: 0.6,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <ImageLightbox
                    src={withBasePath(achievement.imageSrcUrl)}
                    alt={achievement.name}
                    title={achievement.name}
                    caption={achievement.source}
                    triggerSx={{ display: "inline-flex", borderRadius: "999px" }}
                  >
                    <Box
                      component="img"
                      src={withBasePath(achievement.imageSrcUrl)}
                      alt={achievement.name}
                      width={34}
                      height={34}
                      style={{ borderRadius: 999 }}
                    />
                  </ImageLightbox>
                  <Typography
                    variant="caption"
                    sx={{ whiteSpace: "nowrap", fontWeight: 700 }}
                  >
                    {achievement.name}
                    {achievement.tier ? ` ${achievement.tier}` : ""}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : null}

        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          useFlexGap
          flexWrap="wrap"
          className="w-full"
          sx={{ flexShrink: 0 }}
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
      </Box>
    </Hero>
  );
}
