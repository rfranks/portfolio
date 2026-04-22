"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import ViewModuleOutlined from "@mui/icons-material/ViewModuleOutlined";
import TimelineOutlined from "@mui/icons-material/TimelineOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ResumeData } from "@/consts/resumeData";
import {
  ImageLightbox,
  MarkdownContent,
  MediaCycler,
  PortfolioPanelShell,
} from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import SubsectionPager from "@/components/portfolio/layout/SubsectionPager";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";

type ExperienceEntry = ResumeData["experience"][number];

const getExperienceKey = (entry: ExperienceEntry, index: number) =>
  `experience-${entry.company}-${index}`;

const getExperienceRangeLabel = (entry: ExperienceEntry): string | null => {
  const start = entry.start?.trim();
  const end = entry.end?.trim();
  const parts = [start, end].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(" • ") : null;
};

function renderExperienceLogo(exp: ExperienceEntry, size = 48) {
  if (exp.image) {
    return (
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
          width={size}
          height={size}
          style={{ borderRadius: 10 }}
        />
      </ImageLightbox>
    );
  }

  return (
    <Avatar
      aria-label={`${exp.company} placeholder logo`}
      sx={{
        width: size,
        height: size,
        bgcolor: "background.paper",
        color: "text.secondary",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <BusinessOutlined fontSize="small" />
    </Avatar>
  );
}

function renderExperienceContent(exp: ExperienceEntry) {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: 0,
        height: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        px: { xs: 1, md: 1.25 },
        py: { xs: 0.5, md: 0.75 },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
        {renderExperienceLogo(exp)}
        <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
          {exp.position ? (
            <Typography variant="subtitle1" fontWeight={700}>
              {exp.position}
            </Typography>
          ) : null}
          {exp.location ? (
            <Typography variant="body2" color="text.secondary">
              {exp.location}
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
                  <MarkdownContent content={achievement} sx={{ "& p": { mb: 0.15 } }} />
                </li>
              ))}
            </ul>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

function renderExperienceTimelineEntry(exp: ExperienceEntry, index: number, total: number) {
  const rangeLabel = getExperienceRangeLabel(exp);
  const isRightAligned = index % 2 === 1;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "22px minmax(0, 1fr)",
          md: "minmax(0, 1fr) 22px minmax(0, 1fr)",
        },
        columnGap: { xs: 1.25, md: 2 },
        alignItems: "stretch",
        py: 0.35,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          gridColumn: { xs: 1, md: 2 },
        }}
      >
        {index < total - 1 ? (
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: 12,
              bottom: -16,
              width: "1px",
              bgcolor: "divider",
            }}
          />
        ) : null}
        <Box
          aria-hidden="true"
          sx={{
            mt: 0.35,
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: "primary.main",
            border: "2px solid",
            borderColor: "background.paper",
            zIndex: 1,
          }}
        />
      </Box>
      <Box
        className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 md:p-5"
        sx={{
          minWidth: 0,
          gridColumn: { xs: 2, md: isRightAligned ? 3 : 1 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          {renderExperienceLogo(exp)}
          <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {exp.company}
            </Typography>
            {exp.position ? (
              <Typography variant="subtitle2" color="text.secondary">
                {exp.position}
              </Typography>
            ) : null}
            {rangeLabel ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {rangeLabel}
              </Typography>
            ) : null}
            {exp.location ? (
              <Typography variant="body2" color="text.secondary">
                {exp.location}
              </Typography>
            ) : null}
          </Box>
        </Stack>
        {exp.details && exp.details.length > 0 ? (
          <Box sx={{ mt: 1.1, mb: exp.achievements?.length ? 1 : 0 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.55 }}>
              Highlights
            </Typography>
            <ul className="m-0 list-disc pl-5">
              {exp.details.map((detail, detailIndex) => (
                <li key={`${exp.company}-timeline-detail-${detailIndex}`}>
                  <MarkdownContent content={detail} sx={{ "& p": { mb: 0.15 } }} />
                </li>
              ))}
            </ul>
          </Box>
        ) : null}
        {exp.achievements && exp.achievements.length > 0 ? (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.55 }}>
              Achievements
            </Typography>
            <ul className="m-0 list-disc pl-5">
              {exp.achievements.map((achievement, achievementIndex) => (
                <li key={`${exp.company}-timeline-achievement-${achievementIndex}`}>
                  <MarkdownContent content={achievement} sx={{ "& p": { mb: 0.15 } }} />
                </li>
              ))}
            </ul>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

type ExperienceTimelineProps = {
  topRail?: React.ReactNode;
};

export default function ExperienceTimeline({ topRail }: ExperienceTimelineProps) {
  const { experience } = useResumeData();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [viewMode, setViewMode] = React.useState<"grid" | "timeline">("grid");
  const [activeExperienceKey, setActiveExperienceKey] = React.useState<string | undefined>(
    experience[0] ? getExperienceKey(experience[0], 0) : undefined,
  );

  React.useEffect(() => {
    setActiveExperienceKey(experience[0] ? getExperienceKey(experience[0], 0) : undefined);
  }, [experience]);

  React.useEffect(() => {
    if (!isMdUp && viewMode === "timeline") {
      setViewMode("grid");
    }
  }, [isMdUp, viewMode]);

  const isTimelineView = viewMode === "timeline";
  const activeExperienceIndex = React.useMemo(
    () =>
      experience.findIndex(
        (entry, index) => getExperienceKey(entry, index) === activeExperienceKey,
      ),
    [activeExperienceKey, experience],
  );

  const experienceItems = React.useMemo<MediaCyclerItem[]>(
    () =>
      experience.map((exp, index) => ({
        key: getExperienceKey(exp, index),
        title: "",
        mediaType: "custom",
        mediaUrl: "",
        onSelect: () => setActiveExperienceKey(getExperienceKey(exp, index)),
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
          px: { xs: 0.75, md: 1 },
          py: 0.5,
        },
        customContentSx: {
          width: "100%",
          minHeight: 0,
          height: "100%",
        },
      })),
    [experience],
  );
  const experiencePickerItems = React.useMemo(
    () =>
      experience.map((entry, index) => ({
        key: getExperienceKey(entry, index),
        title: entry.company,
        optionTitle: entry.company,
        optionSubtitle: [entry.position?.trim(), getExperienceRangeLabel(entry)].filter(
          Boolean,
        ) as string[],
        optionImageSrc: entry.image ? withBasePath(entry.image) : undefined,
        optionImageAlt: `${entry.company} logo`,
        optionIcon: entry.image ? undefined : <BusinessOutlined fontSize="small" />,
      })),
    [experience],
  );
  const hasMultipleExperienceItems = experienceItems.length > 1;

  const handlePreviousExperience = React.useCallback(() => {
    if (!hasMultipleExperienceItems) {
      return;
    }

    if (activeExperienceIndex <= 0) {
      setActiveExperienceKey(experienceItems[experienceItems.length - 1]?.key);
      return;
    }

    setActiveExperienceKey(experienceItems[activeExperienceIndex - 1]?.key);
  }, [activeExperienceIndex, experienceItems, hasMultipleExperienceItems]);

  const handleNextExperience = React.useCallback(() => {
    if (!hasMultipleExperienceItems) {
      return;
    }

    if (activeExperienceIndex >= experienceItems.length - 1) {
      setActiveExperienceKey(experienceItems[0]?.key);
      return;
    }

    setActiveExperienceKey(experienceItems[activeExperienceIndex + 1]?.key);
  }, [activeExperienceIndex, experienceItems, hasMultipleExperienceItems]);

  const handleViewModeChange = React.useCallback(
    (nextTimelineView: boolean) => {
      if (!isMdUp && nextTimelineView) {
        return;
      }

      setViewMode(nextTimelineView ? "timeline" : "grid");
    },
    [isMdUp],
  );
  const handleSwitchViewModeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleViewModeChange(event.target.checked);
    },
    [handleViewModeChange],
  );

  return (
    <PortfolioPanelShell
      topRail={topRail}
      useNegativeTopRailMargins
      useNegativeFooterMargins
      panelSx={{ overflow: "hidden" }}
      footer={
        isMdUp ? (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              View
            </Typography>
            <IconButton
              size="small"
              aria-label="Show grid view"
              onClick={() => handleViewModeChange(false)}
              sx={{ p: 0.35 }}
            >
              <ViewModuleOutlined
                fontSize="small"
                color={isTimelineView ? "disabled" : "primary"}
              />
            </IconButton>
            <Switch
              checked={isTimelineView}
              onChange={handleSwitchViewModeChange}
              inputProps={{ "aria-label": "Toggle experience view mode" }}
              color="primary"
              size="small"
            />
            <IconButton
              size="small"
              aria-label="Show timeline view"
              onClick={() => handleViewModeChange(true)}
              sx={{ p: 0.35 }}
            >
              <TimelineOutlined fontSize="small" color={isTimelineView ? "primary" : "disabled"} />
            </IconButton>
          </Stack>
        ) : null
      }
    >
      {!isTimelineView && hasMultipleExperienceItems ? (
        <SubsectionPager
          menuId="experience-item-selector-menu"
          items={experiencePickerItems}
          currentKey={activeExperienceKey}
          selectedValueAsTitle
          previousAriaLabel="Previous experience"
          nextAriaLabel="Next experience"
          selectorAriaLabel="Open experience selector"
          onSelect={setActiveExperienceKey}
          onPrevious={handlePreviousExperience}
          onNext={handleNextExperience}
        />
      ) : null}
      <Box sx={{ minHeight: 0, flex: "1 1 auto", overflow: "hidden" }}>
        {isTimelineView ? (
          <Box
            sx={{
              minHeight: 0,
              height: "100%",
              overflowY: "auto",
              pt: 1.25,
              pb: 1,
              px: { xs: 1, md: 1.25 },
            }}
          >
            <Stack spacing={1.5}>
              {experience.map((exp, index) =>
                renderExperienceTimelineEntry(exp, index, experience.length),
              )}
            </Stack>
          </Box>
        ) : (
          <MediaCycler
            items={experienceItems}
            singlePanel
            singlePanelActiveKey={activeExperienceKey}
            showChevronNavigation={false}
            stackSx={{
              minHeight: 0,
              height: "100%",
            }}
          />
        )}
      </Box>
    </PortfolioPanelShell>
  );
}
