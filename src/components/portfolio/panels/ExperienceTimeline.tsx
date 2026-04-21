"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { experience } from "@/consts/resumeData";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import { ImageLightbox, MarkdownContent, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";

type ExperienceEntry = (typeof experience)[number];

function renderExperienceContent(exp: ExperienceEntry) {
  const dateRange = [exp.start, exp.end].filter(Boolean).join(" - ");

  return (
    <Box
      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 md:p-5"
      sx={{
        width: "100%",
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
        {exp.image ? (
          <ImageLightbox
            src={withBasePath(exp.image)}
            alt={exp.company}
            title={exp.company}
            caption={`${exp.position}${exp.location ? ` • ${exp.location}` : ""}`}
            triggerSx={{ borderRadius: "12px", lineHeight: 0, flexShrink: 0 }}
          >
            <Image
              src={withBasePath(exp.image)}
              alt={exp.company}
              width={48}
              height={48}
              style={{ borderRadius: 10 }}
            />
          </ImageLightbox>
        ) : null}
        <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {exp.company}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {exp.position}
            {exp.location ? ` • ${exp.location}` : ""}
          </Typography>
          {dateRange ? (
            <Typography variant="body2" color="text.secondary">
              {dateRange}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      <Box sx={{ minHeight: 0, flex: "1 1 auto", overflowY: "auto", pr: 0.5 }}>
        {exp.details && exp.details.length > 0 ? (
          <Box sx={{ mb: exp.achievements?.length ? 1.2 : 0 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.6 }}>
              Highlights
            </Typography>
            <ul className="m-0 list-disc pl-5">
              {exp.details.map((detail, detailIndex) => (
                <li key={`${exp.company}-detail-${detailIndex}`}>
                  <MarkdownContent content={detail} sx={{ "& p": { mb: 0.15 } }} />
                </li>
              ))}
            </ul>
          </Box>
        ) : null}

        {exp.achievements && exp.achievements.length > 0 ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.6 }}>
              Achievements
            </Typography>
            <ul className="m-0 list-disc pl-5">
              {exp.achievements.map((achievement, achievementIndex) => (
                <li key={`${exp.company}-achievement-${achievementIndex}`}>
                  <MarkdownContent
                    content={achievement}
                    sx={{ "& p": { mb: 0.15 } }}
                  />
                </li>
              ))}
            </ul>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export default function ExperienceTimeline() {
  const [activeExperienceKey, setActiveExperienceKey] = React.useState<
    string | undefined
  >(experience[0] ? `experience-${experience[0].company}-0` : undefined);

  React.useEffect(() => {
    setActiveExperienceKey(
      experience[0] ? `experience-${experience[0].company}-0` : undefined,
    );
  }, []);

  const experienceItems = React.useMemo<MediaCyclerItem[]>(
    () =>
      experience.map((exp, index) => ({
        key: `experience-${exp.company}-${index}`,
        title: "",
        mediaType: "custom",
        mediaUrl: "",
        onSelect: () => setActiveExperienceKey(`experience-${exp.company}-${index}`),
        customContent: renderExperienceContent(exp),
        panelSx: {
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          height: "100%",
        },
        assetFrameSx: {
          width: "100%",
          minHeight: 0,
          height: "100%",
          px: { xs: 7, md: 8 },
          py: 1,
        },
        customContentSx: {
          width: "100%",
          minHeight: 0,
          height: "100%",
        },
      })),
    [],
  );

  return (
    <PortfolioPanel>
      <Typography variant="h6" gutterBottom className="mb-4">
        Experience
      </Typography>
      <MediaCycler
        items={experienceItems}
        singlePanel
        singlePanelActiveKey={activeExperienceKey}
        showChevronNavigation={experienceItems.length > 1}
        loopNavigation={experienceItems.length > 1}
        loopNavigationIcon="leftChevron"
        loopFromBeginning
        loopNavigationLabel="Loop experience entries"
        navigationControlSx={{
          top: 12,
          transform: "none",
        }}
      />
    </PortfolioPanel>
  );
}
