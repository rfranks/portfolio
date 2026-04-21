import * as React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { ImageLightbox } from "@/components/shared";
import { MarkdownContent } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { withBasePath } from "@/utils/basePath";
import IconButton from "@mui/material/IconButton";
import { AlternateEmail, GitHub, LinkedIn } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import Hero from "@/components/fabric/Hero";

type ResumeOverviewProps = {
  topRail?: React.ReactNode;
};

export default function ResumeOverview({ topRail }: ResumeOverviewProps) {
  const { summary, recognition } = useResumeData();
  const githubAchievements = React.useMemo(
    () => recognition.githubAchievements || [],
    [recognition.githubAchievements],
  );

  return (
    <Hero
      className="mb-6 transition-transform duration-300 md:mb-8 hover:-translate-y-0.5"
      sx={{
        p: 0,
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      <Box
        className="mx-auto"
        sx={{
          width: "100%",
          maxWidth: "1200px",
          minHeight: 0,
          height: "100%",
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          mx: "auto",
          overflow: "hidden",
        }}
      >
        {topRail ? (
          <Box
            sx={{
              flexShrink: 0,
              position: "relative",
              zIndex: 6,
              bgcolor: "background.paper",
              borderBottom: "1px solid",
              borderColor: "divider",
              backdropFilter: "blur(8px)",
              borderTopLeftRadius: "var(--fabric-radius-xl)",
              borderTopRightRadius: "var(--fabric-radius-xl)",
            }}
          >
            {topRail}
          </Box>
        ) : null}
        <Box
          sx={{
            minHeight: 0,
            flex: "1 1 auto",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            pt: 0,
            pb: { xs: 8, md: 9 },
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              pt: { xs: 1.25, md: 1.5 },
              display: "flex",
              flexDirection: "column",
              gap: { xs: 1.5, md: 2 },
            }}
          >
            <Box
              className="flex flex-col items-center gap-2.5 text-center"
              sx={{ mt: { xs: 0.25, md: 0.5 } }}
            >
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
                  pb: { xs: 1.25, md: 1.5 },
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
                {githubAchievements.length > 0 ? (
                  <Box sx={{ pt: { xs: 1, md: 1.25 }, flexShrink: 0 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      sx={{
                        width: "100%",
                        pb: 0.25,
                        alignItems: "stretch",
                        justifyContent: { xs: "flex-start", md: "space-evenly" },
                        flexWrap: "nowrap",
                        gap: { xs: 1, md: 1.25 },
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
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            width: "100%",
                            minWidth: 0,
                            flex: { xs: "1 1 auto", md: "1 1 0" },
                            borderRadius: "14px",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            px: 1.1,
                            py: 0.75,
                            textDecoration: "none",
                            color: "inherit",
                            transition:
                              "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease",
                            "&:hover": {
                              transform: "translateY(-1px)",
                              boxShadow: 2,
                              borderColor: "primary.main",
                              bgcolor: "action.hover",
                            },
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
                          sx={{ fontWeight: 700, minWidth: 0 }}
                        >
                          {achievement.name}
                          {achievement.tier ? ` ${achievement.tier}` : ""}
                        </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            </Stack>
          </Box>
        </Box>
        <Box
          component="footer"
          sx={{
            flexShrink: 0,
            zIndex: 5,
            mt: "auto",
            px: { xs: 2, md: 3.5 },
            pb: { xs: 2.5, md: 3.5 },
            py: 1,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(8px)",
          }}
        >
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
      </Box>
    </Hero>
  );
}
