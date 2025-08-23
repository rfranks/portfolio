import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import { experience } from "@/consts/resumeData";

export default function ExperienceTimeline() {
  return (
    <Paper sx={{ p: 2, mb: 4 }}>
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
              <TimelineDot />
              {index < experience.length - 1 && <TimelineConnector />}
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
    </Paper>
  );
}

