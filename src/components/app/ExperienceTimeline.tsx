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
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";
import Image from "next/image";
import { withBasePath } from "@/utils/basePath";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

export default function ExperienceTimeline() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <FadeInSection>
      <TronPaper>
        <Typography variant="h6" gutterBottom>
          Experience
        </Typography>
        <Timeline
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
                <TimelineOppositeContent color="text.secondary">
                  <Typography variant="body2">
                    {exp.start}
                    {exp.end ? ` - ${exp.end}` : ""}
                  </Typography>
                  {exp.image && (
                    <Image
                      src={withBasePath(exp.image)}
                      alt={exp.company}
                      height={48}
                      width={48}
                    />
                  )}
                </TimelineOppositeContent>
              )}
              <TimelineSeparator sx={isMobile ? { minWidth: 40 } : undefined}>
                <TimelineDot color="primary" />
                {index < experience.length - 1 && (
                  <TimelineConnector sx={{ bgcolor: "divider" }} />
                )}
              </TimelineSeparator>
              <TimelineContent sx={{ py: 0.5, px: isMobile ? 1.5 : 2, minWidth: 0 }}>
                {isMobile && (
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: 1, color: "text.secondary" }}
                  >
                    {exp.image && (
                      <Image
                        src={withBasePath(exp.image)}
                        alt={exp.company}
                        height={40}
                        width={40}
                      />
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
                  <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                    {exp.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
                {exp.achievements && (
                  <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                    {exp.achievements.map((ach) => (
                      <li key={ach}>{ach}</li>
                    ))}
                  </ul>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </TronPaper>
    </FadeInSection>
  );
}
