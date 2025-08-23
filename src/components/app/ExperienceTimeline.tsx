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

export default function ExperienceTimeline() {
  return (
    <FadeInSection>
      <TronPaper>
        <Typography variant="h6" gutterBottom>
          Experience
        </Typography>
        <Timeline>
          {experience.map((exp, index) => (
            <TimelineItem key={`${exp.company}-${index}`}>
              <TimelineOppositeContent color="text.secondary">
                {exp.start}
                {exp.end ? ` - ${exp.end}` : ""}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary" />
                {index < experience.length - 1 && (
                  <TimelineConnector sx={{ bgcolor: "divider" }} />
                )}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle1">{exp.company}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {exp.position}
                  {exp.location ? `, ${exp.location}` : ""}
                </Typography>
                {exp.details && (
                  <ul style={{ margin: 0 }}>
                    {exp.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
                {exp.achievements && (
                  <ul style={{ margin: 0 }}>
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

