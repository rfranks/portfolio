"use client";

import Typography from "@mui/material/Typography";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import { experience } from "@/consts/resumeData";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import ImageLightbox from "@/components/shared/ImageLightbox";
import MarkdownContent from "@/components/shared/MarkdownContent";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

export default function ExperienceTimeline() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    
      <PortfolioPanel>
        <Typography variant="h6" gutterBottom>
          Experience
        </Typography>
        <Timeline
          position={isMobile ? "right" : "alternate"}
          sx={{
            m: 0,
            p: 0,
            ...(isMobile && {
              [`& .MuiTimelineItem-root:before`]: {
                flex: 0,
                padding: 0,
              },
            }),
          }}
        >
          {experience.map((exp, index) => (
            <TimelineItem key={`${exp.company}-${index}`}>
              {!isMobile && (
                <TimelineOppositeContent
                  color="text.secondary"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: index % 2 === 0 ? "flex-end" : "flex-start",
                    textAlign: index % 2 === 0 ? "right" : "left",
                    gap: 1,
                  }}
                >
                  <Typography variant="body2">
                    {exp.start}
                    {exp.end ? ` - ${exp.end}` : ""}
                  </Typography>
                  {exp.image && (
                    <ImageLightbox
                      src={withBasePath(exp.image)}
                      alt={exp.company}
                      title={exp.company}
                      caption={`${exp.position}${exp.location ? ` • ${exp.location}` : ""}`}
                      triggerSx={{ display: "inline-flex", borderRadius: 1 }}
                    >
                      <Image
                        src={withBasePath(exp.image)}
                        alt={exp.company}
                        height={48}
                        width={48}
                      />
                    </ImageLightbox>
                  )}
                </TimelineOppositeContent>
              )}
              <TimelineSeparator sx={isMobile ? { minWidth: 40 } : undefined}>
                <TimelineDot color="primary" />
                {index < experience.length - 1 && (
                  <TimelineConnector sx={{ bgcolor: "divider" }} />
                )}
              </TimelineSeparator>
              <TimelineContent
                sx={{ py: 0.5, px: isMobile ? 1.5 : 2, minWidth: 0 }}
              >
                {isMobile && (
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: 1, color: "text.secondary" }}
                  >
                    {exp.image && (
                      <ImageLightbox
                        src={withBasePath(exp.image)}
                        alt={exp.company}
                        title={exp.company}
                        caption={`${exp.position}${exp.location ? ` • ${exp.location}` : ""}`}
                        triggerSx={{ display: "inline-flex", borderRadius: 1 }}
                      >
                        <Image
                          src={withBasePath(exp.image)}
                          alt={exp.company}
                          height={40}
                          width={40}
                        />
                      </ImageLightbox>
                    )}
                    <Typography variant="body2">
                      {exp.start}
                      {exp.end ? ` - ${exp.end}` : ""}
                    </Typography>
                  </Stack>
                )}
                <Typography variant="subtitle1">{exp.company}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {exp.position}
                  {exp.location ? `, ${exp.location}` : ""}
                </Typography>
                {exp.details && (
                  <ul className="m-0 list-disc pl-5">
                    {exp.details.map((detail) => (
                      <li key={detail}>
                        <MarkdownContent
                          content={detail}
                          sx={{ "& p": { mb: 0 } }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
                {exp.achievements && (
                  <ul className="m-0 list-disc pl-5">
                    {exp.achievements.map((ach) => (
                      <li key={ach}>
                        <MarkdownContent
                          content={ach}
                          sx={{ "& p": { mb: 0 } }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </PortfolioPanel>
    
  );
}
